const isProduction = process.env.NODE_ENV === "production";

/**
 * Next.js ships inline bootstrap scripts and inline styles, so script-src and
 * style-src need 'unsafe-inline'. The remaining directives still remove the
 * most valuable XSS primitives (object/base/frame injection) and pin every
 * other resource type to this origin.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  // Only in production: on a LAN IP over http (used for mobile testing) this
  // would upgrade subresource requests to https and break the dev server.
  ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide the framework version from responses.
  poweredByHeader: false,

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The admin area must never be indexed; it is linked from every voucher QR code.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },

  webpack: (config) => {
    config.watchOptions = {
      poll: 1000, // Her 1 saniyede bir değişiklik var mı diye kontrol et
      aggregateTimeout: 300,
    };
    return config;
  },
  turbopack: {},
};

export default nextConfig;
