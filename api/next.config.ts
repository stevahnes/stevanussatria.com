import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/app/chat": ["./src/context.ts"],
  },
  async headers() {
    const frontendUrl =
      process.env.NEXT_PUBLIC_ALLOWED_ORIGIN ||
      "https://www.stevanussatria.com";
    return [
      {
        source: "/chat/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: frontendUrl,
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, lb-thread-id",
          },
          {
            key: "Access-Control-Expose-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, lb-thread-id",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
