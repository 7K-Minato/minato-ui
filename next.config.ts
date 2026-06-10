import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["7k-design-system"],
  output: "standalone",
};

export default nextConfig;
