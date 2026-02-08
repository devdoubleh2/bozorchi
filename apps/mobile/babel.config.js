module.exports = function (api) {
  const isWeb = api.caller
    ? api.caller((caller) => caller?.platform === "web")
    : false;

  const plugins = [];

  if (isWeb) {
    plugins.push("@babel/plugin-proposal-export-namespace-from");
  }

  if (!isWeb) {
    plugins.push(["react-native-reanimated/plugin", {}, "reanimated"]);
  }

  plugins.push(["react-native-worklets/plugin", {}, "worklets"]);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "react",
        },
      ],
    ],
    overrides: [
      {
        test: /\.tsx?$/,
        plugins: [
          [
            "@babel/plugin-transform-typescript",
            {
              allowDeclareFields: true,
              onlyRemoveTypeImports: true,
            },
          ],
        ],
      },
    ],
    // Provide explicit plugin list with unique names to avoid duplicate detection.
    plugins,
  };
};
