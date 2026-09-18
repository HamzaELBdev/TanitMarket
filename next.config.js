/** @type {import('next').NextConfig} */
const isExport = process.env.NODE_ENV === 'production' || process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  ...(isExport ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
