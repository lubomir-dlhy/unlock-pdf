const { withDangerousMod } = require('expo/config-plugins');
const plist = require('@expo/plist').default;
const fs = require('fs');
const path = require('path');

// expo-sharing names its extension target "expo-sharing-extension" and uses that
// as the display name, which is what the Share Sheet shows. Must be listed before
// expo-sharing in app.json: dangerous mods run in reverse order, so this then runs
// after its Info.plist has been written.
module.exports = function withShareExtensionName(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const infoPlistPath = path.join(
        config.modRequest.platformProjectRoot,
        'expo-sharing-extension',
        'Info.plist',
      );
      const info = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
      info.CFBundleDisplayName = config.name;
      fs.writeFileSync(infoPlistPath, plist.build(info));
      return config;
    },
  ]);
};
