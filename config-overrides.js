module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    util: require.resolve("util/"),
    stream: require.resolve("stream-browserify"),
    assert: require.resolve("assert/"),
    buffer: require.resolve("buffer/"),
    process: require.resolve("process/browser.js"),
    path: require.resolve("path-browserify"),
    fs: false,
    crypto: false,
    http: false,
    https: false,
    os: false,
    net: false,
  };

  const webpack = require("webpack");
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: "process/browser.js",
      Buffer: ["buffer", "Buffer"],
    }),
  );

  return config;
};
