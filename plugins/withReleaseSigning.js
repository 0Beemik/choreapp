const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Signs release builds with the Play upload key instead of the debug key. The keystore path and
 * passwords come from ~/.gradle/gradle.properties (FAMILYCHORES_UPLOAD_*), never from the repo.
 * Without those properties the release build falls back to the debug key, so sideload test
 * builds keep working on machines that don't have the upload key.
 */
const SIGNING_CONFIG = `
        release {
            if (project.hasProperty('FAMILYCHORES_UPLOAD_STORE_FILE')) {
                storeFile file(FAMILYCHORES_UPLOAD_STORE_FILE)
                storePassword FAMILYCHORES_UPLOAD_STORE_PASSWORD
                keyAlias FAMILYCHORES_UPLOAD_KEY_ALIAS
                keyPassword FAMILYCHORES_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (!gradle.includes('FAMILYCHORES_UPLOAD_STORE_FILE')) {
      gradle = gradle.replace(/signingConfigs \{/, (m) => m + SIGNING_CONFIG);
      gradle = gradle.replace(
        /(release \{[^}]*?)signingConfig signingConfigs\.debug/,
        "$1signingConfig project.hasProperty('FAMILYCHORES_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
      );
    }
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
