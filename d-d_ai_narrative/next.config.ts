import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  serverExternalPackages: ["swagger-jsdoc", "@prisma/client", "pg", "bcrypt"],
};

export default nextConfig;
