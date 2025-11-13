const createNextIntlPlugin = (await import('next-intl/plugin')).default;

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // output: 'export',        // Disabled - using Firebase App Hosting which supports SSR
  trailingSlash: true,     // Add trailing slashes
  // Image configuration - all external images allowed without optimization
  images: {
    unoptimized: true,     // Disable Next.js image optimization to allow all external images
    loader: 'custom',      // Use custom loader to bypass Vercel optimization
    loaderFile: './imageLoader.js', // Path to custom loader
    remotePatterns: [
      { protocol: 'https', hostname: '**' }, // Allow all HTTPS domains
      { protocol: 'http', hostname: '**' },  // Allow all HTTP domains
    ],
  },
  webpack: (config, { isServer }) => {
    // Ignore problematic scraping files during build
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };

    // Exclude scraping files from webpack bundle
    config.externals.push({
      'src/lib/scraper.ts': 'src/lib/scraper.ts',
      'src/lib/scraper-example.ts': 'src/lib/scraper-example.ts',
      'src/lib/scraping-config.ts': 'src/lib/scraping-config.ts',
    });

    return config;
  },
};

export default withNextIntl(nextConfig);