/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 15 moved this out of `experimental`
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
