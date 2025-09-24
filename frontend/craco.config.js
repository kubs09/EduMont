// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

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
      webpackConfig.resolve.modules = [path.resolve(__dirname, 'src'), 'node_modules'];

      // Disable React Refresh in production
      if (process.env.NODE_ENV === 'production') {
        // Remove React Refresh plugin
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (plugin) => !plugin.constructor.name.includes('ReactRefreshPlugin')
        );

        // Remove React Refresh from all babel-loader configurations
        webpackConfig.module.rules.forEach((rule) => {
          if (rule.oneOf) {
            rule.oneOf.forEach((oneOfRule) => {
              if (oneOfRule.use && Array.isArray(oneOfRule.use)) {
                oneOfRule.use.forEach((use) => {
                  if (use.loader && use.loader.includes('babel-loader') && use.options) {
                    if (use.options.plugins) {
                      use.options.plugins = use.options.plugins.filter((plugin) => {
                        const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
                        return !pluginName.toString().includes('react-refresh');
                      });
                    }
                  }
                });
              } else if (
                oneOfRule.loader &&
                oneOfRule.loader.includes('babel-loader') &&
                oneOfRule.options
              ) {
                if (oneOfRule.options.plugins) {
                  oneOfRule.options.plugins = oneOfRule.options.plugins.filter((plugin) => {
                    const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
                    return !pluginName.toString().includes('react-refresh');
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
  babel: {
    loaderOptions: (options, { env }) => {
      if (env === 'production') {
        options.plugins = (options.plugins || []).filter((p) => {
          if (Array.isArray(p)) return p[0] !== require.resolve('react-refresh/babel');
          return p !== require.resolve('react-refresh/babel');
        });
      }
      return options;
    },
  },
};
