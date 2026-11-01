/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['http://localhost:3000'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude pdf-parse and pdfjs-dist from webpack bundling
      // These packages don't work well with webpack bundling
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("pdf-parse", "pdfjs-dist", "canvas", "jsdom");
      } else {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          "pdf-parse",
          "pdfjs-dist",
          "canvas",
          "jsdom",
        ];
      }
    }
    return config;
  },
};

export default nextConfig;
