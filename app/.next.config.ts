// Configuration Next.js pour build autonome dashboard Vision AI + SIG Cadastre Algérien v1.0
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Pour packaging autonome en production
};

export default nextConfig;
