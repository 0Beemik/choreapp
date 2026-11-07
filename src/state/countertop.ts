import type { Services } from '../services';

// Per device, never synced: a kitchen tablet keeps its screen on; phones don't.
const KEY = 'countertop_mode';
const listeners = new Set<(on: boolean) => void>();

export async function countertopMode(services: Services): Promise<boolean> {
  return (await services.deps.repos.appState.get(KEY)) === 'on';
}

export async function setCountertopMode(services: Services, on: boolean): Promise<void> {
  await services.deps.repos.appState.set(KEY, on ? 'on' : 'off');
  listeners.forEach((fn) => fn(on));
}

export function onCountertopChange(fn: (on: boolean) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
