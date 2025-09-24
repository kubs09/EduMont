// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

// Disable React Fast Refresh explicitly in production to prevent react-refresh babel plugin execution.
if (process.env.NODE_ENV === 'production') {
  process.env.FAST_REFRESH = 'false';
}

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, '../'),
      '@frontend': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@core': path.resolve(__dirname, '../core'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
    configure: (webpackConfig) => {
      if (process.env.NODE_ENV === 'production') {
        // Remove any lingering ReactRefreshPlugin
        webpackConfig.plugins = (webpackConfig.plugins || []).filter(
          (p) => p?.constructor?.name !== 'ReactRefreshPlugin'
        );
        // Scrub babel-loader plugin list of react-refresh entries
        const scrub = (use) => {
          if (
            use &&
            use.loader &&
            use.loader.includes('babel-loader') &&
            use.options &&
            use.options.plugins
          ) {
            use.options.plugins = use.options.plugins.filter((pl) => {
              const name = Array.isArray(pl) ? pl[0] : pl;
              return !name.toString().includes('react-refresh');
            });
          }
        };
        (webpackConfig.module.rules || []).forEach((rule) => {
          if (rule.oneOf) {
            rule.oneOf.forEach((r) => {
              if (Array.isArray(r.use)) r.use.forEach(scrub);
              else scrub(r);
            });
          }
        });
      }
      return webpackConfig;
    },
  },
};
