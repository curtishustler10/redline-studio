/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Type errors now fail the build: `tsc --noEmit` is clean, keep it that way.
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    // The old JSON-file dashboard (password in the query string) is gone.
    return [{ source: "/dashboard", destination: "/admin/leads", permanent: true }];
  },
}

export default nextConfig
