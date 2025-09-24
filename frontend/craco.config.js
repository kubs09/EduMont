// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  babel: {
    plugins: [
      process.env.NODE_ENV === 'development' && require.resolve('react-refresh/babel'),
    ].filter(Boolean),
  },
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
      webpackConfig.resolve.modules = [path.resolve(__dirname, 'src'), 'node_modules'];

      if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (plugin) => !plugin.constructor.name.includes('ReactRefreshPlugin')
        );

        // Remove React Refresh from babel-loader options
        webpackConfig.module.rules.forEach((rule) => {
          if (rule.oneOf) {
            rule.oneOf.forEach((oneOfRule) => {
              if (oneOfRule.test && oneOfRule.test.toString().includes('tsx?')) {
                if (oneOfRule.use && Array.isArray(oneOfRule.use)) {
                  oneOfRule.use.forEach((use) => {
                    if (
                      use.loader &&
                      use.loader.includes('babel-loader') &&
                      use.options &&
                      use.options.plugins
                    ) {
                      use.options.plugins = use.options.plugins.filter(
                        (plugin) => !plugin.toString().includes('react-refresh')
                      );
                    }
                  });
                }
              }
            });
          }
        });
      }

      return webpackConfig;
    },
  },
};
