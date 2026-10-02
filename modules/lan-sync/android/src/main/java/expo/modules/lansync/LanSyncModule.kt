package expo.modules.lansync

import android.content.Context
import android.content.Intent
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.net.wifi.WifiManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.BufferedInputStream
import java.io.ByteArrayOutputStream
import java.net.Inet4Address
import java.net.InetSocketAddress
import java.net.NetworkInterface
import java.net.ServerSocket
import java.net.Socket
import java.util.UUID
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

private const val SERVICE_TYPE = "_familychores._tcp."
private const val MAX_BODY_BYTES = 256 * 1024
private const val JS_REPLY_TIMEOUT_S = 15L

/**
 * Lets the family's main device answer sync requests from other devices on the home Wi-Fi.
 * The HTTP handling here is deliberately tiny: each request is handed to JavaScript as an
 * event and the JS reply is written back. All family rules live in JS.
 */
class LanSyncModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var server: ServerSocket? = null
  private var pool: ExecutorService? = null
  private val pending = ConcurrentHashMap<String, CompletableFuture<Pair<Int, String>>>()
  private var registration: NsdManager.RegistrationListener? = null
  private var multicastLock: WifiManager.MulticastLock? = null

  private val nsd: NsdManager
    get() = context.getSystemService(Context.NSD_SERVICE) as NsdManager

  override fun definition() = ModuleDefinition {
    Name("LanSync")
    Events("onRequest")

    /** Starts listening; returns the port actually bound (preferred port, or any free one). */
    AsyncFunction("startServer") { preferredPort: Int ->
      server?.let { return@AsyncFunction it.localPort }
      val socket = ServerSocket()
      socket.reuseAddress = true
      try {
        socket.bind(InetSocketAddress(preferredPort))
      } catch (e: Exception) {
        socket.bind(InetSocketAddress(0))
      }
      server = socket
      val workers = Executors.newFixedThreadPool(4)
      pool = workers
      Thread({ acceptLoop(socket, workers) }, "lan-sync-accept").start()
      socket.localPort
    }

    AsyncFunction("stopServer") { stopServer() }

    /** JS answers a request it received through onRequest. */
    Function("respond") { id: String, status: Int, body: String ->
      pending.remove(id)?.complete(status to body)
    }

    /** Announces the hub on the home network so devices can find it without typing an address. */
    AsyncFunction("advertise") { name: String, port: Int, promise: Promise ->
      stopAdvertising()
      val info = NsdServiceInfo().apply {
        serviceName = name
        serviceType = SERVICE_TYPE
        setPort(port)
      }
      val listener = object : NsdManager.RegistrationListener {
        override fun onServiceRegistered(info: NsdServiceInfo) = promise.resolve(info.serviceName)
        override fun onRegistrationFailed(info: NsdServiceInfo, code: Int) =
          promise.reject("ERR_ADVERTISE", "Network announcement failed ($code)", null)
        override fun onServiceUnregistered(info: NsdServiceInfo) {}
        override fun onUnregistrationFailed(info: NsdServiceInfo, code: Int) {}
      }
      registration = listener
      nsd.registerService(info, NsdManager.PROTOCOL_DNS_SD, listener)
    }

    AsyncFunction("stopAdvertising") { stopAdvertising() }

    /** Looks for hubs on the home network for up to `timeoutMs`. */
    AsyncFunction("discover") { timeoutMs: Int, promise: Promise -> discover(timeoutMs.toLong(), promise) }

    /** This device's Wi-Fi addresses, shown on the hub for manual pairing. */
    AsyncFunction("localAddresses") {
      NetworkInterface.getNetworkInterfaces().toList()
        .filter { it.isUp && !it.isLoopback }
        .flatMap { it.inetAddresses.toList() }
        .filter { it is Inet4Address && it.isSiteLocalAddress }
        .map { it.hostAddress }
    }

    /** Keeps the hub reachable for a while after the app is closed (Android shows a notification). */
    AsyncFunction("startKeepAlive") { title: String, text: String ->
      val intent = Intent(context, HubKeepAliveService::class.java)
        .putExtra("title", title)
        .putExtra("text", text)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
      else context.startService(intent)
    }

    AsyncFunction("stopKeepAlive") {
      context.stopService(Intent(context, HubKeepAliveService::class.java))
    }

    OnDestroy {
      stopAdvertising()
      stopServer()
    }
  }

  private fun acceptLoop(socket: ServerSocket, workers: ExecutorService) {
    while (!socket.isClosed) {
      val client = try { socket.accept() } catch (e: Exception) { break }
      workers.execute { handle(client) }
    }
  }

  private fun handle(client: Socket) {
    client.use { sock ->
      try {
        sock.soTimeout = 10_000
        val input = BufferedInputStream(sock.getInputStream())
        val requestLine = readLine(input) ?: return
        val parts = requestLine.split(" ")
        if (parts.size < 2) return write(sock, 400, """{"error":"bad request"}""")
        val path = parts[1].substringBefore("?")

        var length = 0
        while (true) {
          val line = readLine(input) ?: break
          if (line.isEmpty()) break
          val idx = line.indexOf(':')
          if (idx > 0 && line.substring(0, idx).trim().equals("Content-Length", ignoreCase = true)) {
            length = line.substring(idx + 1).trim().toIntOrNull() ?: 0
          }
        }
        if (length > MAX_BODY_BYTES) return write(sock, 413, """{"error":"too large"}""")
        val body = ByteArray(length)
        var read = 0
        while (read < length) {
          val n = input.read(body, read, length - read)
          if (n < 0) break
          read += n
        }

        val id = UUID.randomUUID().toString()
        val reply = CompletableFuture<Pair<Int, String>>()
        pending[id] = reply
        sendEvent("onRequest", mapOf("id" to id, "path" to path, "body" to String(body, 0, read, Charsets.UTF_8)))
        val (status, json) = try {
          reply.get(JS_REPLY_TIMEOUT_S, TimeUnit.SECONDS)
        } catch (e: Exception) {
          503 to """{"error":"hub busy"}"""
        } finally {
          pending.remove(id)
        }
        write(sock, status, json)
      } catch (_: Exception) {
        // Client went away; nothing to do.
      }
    }
  }

  private fun readLine(input: BufferedInputStream): String? {
    val out = ByteArrayOutputStream()
    while (true) {
      val b = input.read()
      if (b < 0) return if (out.size() == 0) null else out.toString(Charsets.UTF_8.name())
      if (b == '\n'.code) return out.toString(Charsets.UTF_8.name()).trimEnd('\r')
      if (out.size() > 8192) return null
      out.write(b)
    }
  }

  private fun write(sock: Socket, status: Int, json: String) {
    val bytes = json.toByteArray(Charsets.UTF_8)
    val head = "HTTP/1.1 $status ${if (status == 200) "OK" else "Error"}\r\n" +
      "Content-Type: application/json; charset=utf-8\r\n" +
      "Content-Length: ${bytes.size}\r\n" +
      "Connection: close\r\n\r\n"
    sock.getOutputStream().apply {
      write(head.toByteArray(Charsets.US_ASCII))
      write(bytes)
      flush()
    }
  }

  private fun stopServer() {
    try { server?.close() } catch (_: Exception) {}
    server = null
    pool?.shutdownNow()
    pool = null
    pending.values.forEach { it.complete(503 to """{"error":"stopped"}""") }
    pending.clear()
  }

  private fun stopAdvertising() {
    registration?.let { try { nsd.unregisterService(it) } catch (_: Exception) {} }
    registration = null
  }

  private fun discover(timeoutMs: Long, promise: Promise) {
    val wifi = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
    multicastLock = wifi.createMulticastLock("lan-sync").apply { setReferenceCounted(false); acquire() }
    val found = ConcurrentHashMap<String, Map<String, Any>>()
    val toResolve = java.util.concurrent.LinkedBlockingQueue<NsdServiceInfo>()
    var resolving = false
    val main = Handler(Looper.getMainLooper())

    fun resolveNext() {
      if (resolving) return
      val next = toResolve.poll() ?: return
      resolving = true
      @Suppress("DEPRECATION")
      nsd.resolveService(next, object : NsdManager.ResolveListener {
        override fun onResolveFailed(info: NsdServiceInfo, code: Int) {
          main.post { resolving = false; resolveNext() }
        }
        override fun onServiceResolved(info: NsdServiceInfo) {
          @Suppress("DEPRECATION")
          val host = info.host
          if (host is Inet4Address) {
            found[info.serviceName] = mapOf("name" to info.serviceName, "host" to host.hostAddress!!, "port" to info.port)
          }
          main.post { resolving = false; resolveNext() }
        }
      })
    }

    val listener = object : NsdManager.DiscoveryListener {
      override fun onDiscoveryStarted(type: String) {}
      override fun onDiscoveryStopped(type: String) {}
      override fun onStartDiscoveryFailed(type: String, code: Int) {}
      override fun onStopDiscoveryFailed(type: String, code: Int) {}
      override fun onServiceLost(info: NsdServiceInfo) {}
      override fun onServiceFound(info: NsdServiceInfo) {
        main.post { toResolve.add(info); resolveNext() }
      }
    }
    nsd.discoverServices(SERVICE_TYPE, NsdManager.PROTOCOL_DNS_SD, listener)
    main.postDelayed({
      try { nsd.stopServiceDiscovery(listener) } catch (_: Exception) {}
      multicastLock?.release()
      multicastLock = null
      promise.resolve(found.values.toList())
    }, timeoutMs)
  }
}
