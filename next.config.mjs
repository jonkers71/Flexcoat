import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empty turbopack config silences the Next.js 16 webpack/turbopack warning
  turbopack: {},
};

export default withPWA(nextConfig);
