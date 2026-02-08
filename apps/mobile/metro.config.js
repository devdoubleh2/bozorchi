// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

const makeUniqueList = (items) => Array.from(new Set(items));

config.resolver.unstable_conditionNames = makeUniqueList([
  ...(config.resolver.unstable_conditionNames ?? []),
  "react-native",
]);

// Configure transformer
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      inlineRequires: true,
    },
  }),
  // Retain if using require.context
  unstable_allowRequireContext: true,
};

module.exports = config;
