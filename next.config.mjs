/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["res.cloudinary.com"], // Allow Cloudinary images
    unoptimized: true, // 👈 needed for static export
  },

};

export default nextConfig;
