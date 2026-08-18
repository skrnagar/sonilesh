import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : "https://*.supabase.co";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      `connect-src 'self' ${supabaseHost} https://*.supabase.co wss://*.supabase.co`,
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/field/report/incident", destination: "/field/incident", permanent: false },
      { source: "/field/report/near-miss", destination: "/field/near-miss", permanent: false },
      { source: "/field/report/hazard", destination: "/field/lmra", permanent: false },
      { source: "/field/hazard", destination: "/field/lmra", permanent: false },
      { source: "/field/incidents", destination: "/field/incident", permanent: false },
      { source: "/field/hazards", destination: "/field/lmra", permanent: false },
      { source: "/field/inspections", destination: "/field/inspection", permanent: false },
      { source: "/app/risk", destination: "/app/risk-assessments", permanent: false },
      { source: "/request-demo", destination: "/book-a-demo", permanent: true },
      { source: "/modules", destination: "/product", permanent: true },
      { source: "/features", destination: "/product", permanent: true },
      { source: "/platform", destination: "/product", permanent: true },
      { source: "/enterprise", destination: "/self-hosting", permanent: true },
      { source: "/modules/incidents", destination: "/product/incident-management", permanent: true },
      { source: "/modules/permit-to-work", destination: "/product/permit-to-work", permanent: true },
      { source: "/modules/risk-management", destination: "/product/risk-assessment-jsa", permanent: true },
      { source: "/modules/inspections", destination: "/product/inspections-audits", permanent: true },
      { source: "/modules/audits", destination: "/product/inspections-audits", permanent: true },
      { source: "/modules/capa", destination: "/product/capa-tracking", permanent: true },
      { source: "/modules/training", destination: "/product/training-competency", permanent: true },
      { source: "/modules/contractor-management", destination: "/product/contractor-management", permanent: true },
      { source: "/modules/analytics", destination: "/product", permanent: true },
      { source: "/modules/ppe", destination: "/product", permanent: true },
      { source: "/modules/document-control", destination: "/product", permanent: true },
      { source: "/solutions/construction", destination: "/solutions/construction-epc", permanent: true },
      { source: "/solutions/epc", destination: "/solutions/construction-epc", permanent: true },
      { source: "/solutions/oil-gas", destination: "/solutions/oil-gas-chemicals", permanent: true },
      { source: "/solutions/logistics", destination: "/solutions/logistics-warehousing", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/admin/login", destination: "/platform-login" },
      { source: "/field/login", destination: "/field-login" },
      { source: "/contractor/login", destination: "/contractor-login" },
    ];
  },
};

export default nextConfig;
