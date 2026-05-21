const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Block OpenTelemetry packages from being bundled
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Block all OpenTelemetry packages
  if (
    moduleName === "@opentelemetry/api" ||
    moduleName.startsWith("@opentelemetry/") ||
    moduleName.includes("opentelemetry")
  ) {
    console.log(`[Metro] Blocking OpenTelemetry module: ${moduleName}`);
    return { type: "empty" };
  }
  
  // Handle the specific OTEL_PKG pattern
  if (moduleName.includes("OTEL_PKG") || moduleName === "OTEL_PKG") {
    console.log(`[Metro] Blocking OTEL_PKG: ${moduleName}`);
    return { type: "empty" };
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

// Add transformer configuration to handle dynamic imports
config.transformer.minifierConfig = {
  compress: {
    drop_console: false,
    keep_infinity: true,
    passes: 2,
  },
};

// Ensure proper cache behavior
config.cacheStores = [];

module.exports = withNativeWind(config, {
  input: "./app/globals.css",
});