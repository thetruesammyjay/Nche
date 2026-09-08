/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@nche/types", "@nche/ui"],
  outputFileTracingRoot: require('path').join(__dirname, '../../'),
};

module.exports = nextConfig;
