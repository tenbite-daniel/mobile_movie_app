module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Strip dynamic import(variable) calls that Hermes can't handle
      function removeDynamicImports() {
        return {
          visitor: {
            CallExpression(path) {
              if (
                path.node.callee.type === "Import" &&
                path.node.arguments.length > 0 &&
                path.node.arguments[0].type !== "StringLiteral"
              ) {
                path.replaceWith(
                  require("@babel/types").callExpression(
                    require("@babel/types").memberExpression(
                      require("@babel/types").identifier("Promise"),
                      require("@babel/types").identifier("resolve")
                    ),
                    [require("@babel/types").objectExpression([])]
                  )
                );
              }
            },
          },
        };
      },
    ],
  };
};
