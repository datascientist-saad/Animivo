import { brand } from "@/lib/brand";
import { NATIVE_PRODUCTION_ORIGIN } from "@/lib/native/constants";
import { supabasePublicDefaults } from "@/lib/supabase/public-config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "http", hostname: "127.0.0.1" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: brand.name,
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || supabasePublicDefaults.url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabasePublicDefaults.anonKey,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || NATIVE_PRODUCTION_ORIGIN,
  },
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ];
  },
};

export default nextConfig;
