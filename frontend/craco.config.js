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

      const isProd = process.env.NODE_ENV === 'production';

      const sanitizeBabelPlugins = (plugins) => {
        if (!Array.isArray(plugins)) return plugins;
        return plugins
          .map((plugin) => {
            const name = Array.isArray(plugin) ? plugin[0] : plugin;
            if (!name) return plugin;
            const id = name.toString();
            if (id.includes('react-refresh') || id.includes('ReactRefresh')) {
              return isProd ? null : plugin;
            }
            return plugin;
          })
          .filter(Boolean);
      };

      const processRule = (rule) => {
        if (!rule) return;

        if (rule.oneOf && Array.isArray(rule.oneOf)) {
          rule.oneOf.forEach((r) => processRule(r));
        }

        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach((use) => {
            if (
              use &&
              typeof use === 'object' &&
              use.loader &&
              use.loader.includes('babel-loader')
            ) {
              if (use.options && use.options.plugins) {
                use.options.plugins = sanitizeBabelPlugins(use.options.plugins);
              }
            }
          });
        } else if (
          rule.loader &&
          rule.loader.includes('babel-loader') &&
          rule.options &&
          rule.options.plugins
        ) {
          rule.options.plugins = sanitizeBabelPlugins(rule.options.plugins);
        }
      };

      if (webpackConfig.module && webpackConfig.module.rules) {
        webpackConfig.module.rules.forEach((rule) => processRule(rule));
      }

      // Remove React Refresh plugins in production
      if (isProd && webpackConfig.plugins) {
        webpackConfig.plugins = webpackConfig.plugins.filter((plugin) => {
          const name = plugin.constructor?.name || '';
          return !name.includes('ReactRefreshPlugin') && !name.includes('ReactRefresh');
        });
      }

      return webpackConfig;
    },
  },
  babel: {
    loaderOptions: (options, { env }) => {
      const isProd = env === 'production';

      if (options.plugins && Array.isArray(options.plugins)) {
        options.plugins = options.plugins
          .map((plugin) => {
            const name = Array.isArray(plugin) ? plugin[0] : plugin;
            if (name && name.toString().includes('react-refresh')) {
              return isProd ? null : plugin;
            }
            return plugin;
          })
          .filter(Boolean);
      }

      return options;
    },
  },
};
