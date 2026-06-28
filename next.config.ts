import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

const config = async (): Promise<NextConfig> => {
  if (process.env.NODE_ENV === "development") {
    return nextConfig;
  }
  const withPWAInit = (await import("@ducanh2912/next-pwa")).default;
  const withPWA = withPWAInit({
    dest: "public",
  });
  return withPWA(nextConfig);
};

export default config;
