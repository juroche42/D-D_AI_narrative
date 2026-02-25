import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["swagger-jsdoc", "@prisma/client", "pg"],
};

export default nextConfig;
