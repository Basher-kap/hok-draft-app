/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hokstats.gg",
      },
    ],
  },
};

module.exports = nextConfig;
