// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@frontend': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@core': path.resolve(__dirname, '..', 'core'),
      '@shared': path.resolve(__dirname, '..', 'shared'),
    },
    configure: (webpackConfig, { env = process.env.NODE_ENV } = {}) => {
      webpackConfig.resolve.modules = [path.resolve(__dirname, 'src'), 'node_modules'];

      const isProd = env === 'production';

      if (isProd) {
        process.env.FAST_REFRESH = 'false';

        webpackConfig.plugins = webpackConfig.plugins.filter((plugin) => {
          const name = plugin.constructor?.name || '';
          return (
            !name.includes('ReactRefreshWebpackPlugin') &&
            !name.includes('ReactRefreshPlugin') &&
            !name.includes('ReactRefresh')
          );
        });

        webpackConfig.plugins.forEach((plugin) => {
          if (plugin.constructor?.name === 'DefinePlugin') {
            plugin.definitions = plugin.definitions || {};
            plugin.definitions['process.env.FAST_REFRESH'] = 'false';
          }
        });
      }

      const sanitizeBabelPlugins = (plugins) => {
        if (!Array.isArray(plugins)) return plugins;
        return plugins
          .filter((plugin) => {
            if (!plugin) return false;
            const name = Array.isArray(plugin) ? plugin[0] : plugin;
            const nameStr = name ? name.toString() : '';
            if (isProd && (nameStr.includes('react-refresh') || nameStr.includes('ReactRefresh'))) {
              return false;
            }
            return true;
          })
          .map((plugin) => {
            if (!isProd) {
              const name = Array.isArray(plugin) ? plugin[0] : plugin;
              const nameStr = name ? name.toString() : '';
              if (nameStr.includes('react-refresh')) {
                if (Array.isArray(plugin)) {
                  return [plugin[0], { skipEnvCheck: true, ...(plugin[1] || {}) }];
                }
                return [name, { skipEnvCheck: true }];
              }
            }
            return plugin;
          });
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

      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;

    devServerConfig.setupMiddlewares = (middlewares) => {
      return middlewares;
    };

    return devServerConfig;
  },
  babel: {
    loaderOptions: (babelLoaderOptions, { env = process.env.NODE_ENV } = {}) => {
      const isProd = env === 'production';

      if (isProd) {
        if (babelLoaderOptions.plugins && Array.isArray(babelLoaderOptions.plugins)) {
          babelLoaderOptions.plugins = babelLoaderOptions.plugins.filter((plugin) => {
            const name = Array.isArray(plugin) ? plugin[0] : plugin;
            const nameStr = name ? name.toString() : '';
            return !nameStr.includes('react-refresh') && !nameStr.includes('ReactRefresh');
          });
        }
      }

      return babelLoaderOptions;
    },
  },
  jest: {
    configure: {
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@frontend/(.*)$': '<rootDir>/src/$1',
        '^@components/(.*)$': '<rootDir>/src/components/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
        '^@assets/(.*)$': '<rootDir>/src/assets/$1',
        '^@styles/(.*)$': '<rootDir>/src/styles/$1',
        '^@services/(.*)$': '<rootDir>/src/services/$1',
      },
    },
  },
};
