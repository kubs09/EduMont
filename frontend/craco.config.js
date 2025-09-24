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

      const sanitizeBabelPlugins = (plugins, isProd) => {
        if (!Array.isArray(plugins)) return plugins;
        return plugins
          .map((plugin) => {
            const name = Array.isArray(plugin) ? plugin[0] : plugin;
            if (!name) return plugin;
            const id = name.toString();
            if (id.includes('react-refresh')) {
              if (isProd) {
                return null; // drop in production
              }
              // development -> ensure options with skipEnvCheck
              if (Array.isArray(plugin)) {
                return [
                  plugin[0],
                  {
                    skipEnvCheck: true,
                    ...(typeof plugin[1] === 'object' ? plugin[1] : {}),
                  },
                ];
              }
              return [name, { skipEnvCheck: true }];
            }
            return plugin;
          })
          .filter(Boolean);
      };

      const processRule = (rule, isProd) => {
        if (!rule) return;
        if (rule.oneOf && Array.isArray(rule.oneOf)) {
            rule.oneOf.forEach(r => processRule(r, isProd));
        } else {
          const uses = rule.use;
          if (Array.isArray(uses)) {
            uses.forEach((u) => {
              if (u && u.loader && u.loader.includes('babel-loader') && u.options) {
                u.options.plugins = sanitizeBabelPlugins(u.options.plugins, isProd);
              }
            });
          } else if (rule.loader && rule.loader.includes('babel-loader') && rule.options) {
            rule.options.plugins = sanitizeBabelPlugins(rule.options.plugins, isProd);
          }
        }
      };

      const isProd = process.env.NODE_ENV === 'production';

      processRule(webpackConfig.module, isProd);

      if (isProd) {
        // Remove React Refresh plugin instances at webpack plugin level as safety
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (p) => !p.constructor?.name?.includes('ReactRefreshPlugin')
        );
      }

      return webpackConfig;
    },
  },
  babel: {
    loaderOptions: (options, { env }) => {
      const isProd = env === 'production';
      const sanitize = (plugins) => {
        if (!Array.isArray(plugins)) return plugins;
        return plugins
          .map((p) => {
            const name = Array.isArray(p) ? p[0] : p;
            if (name && name.toString().includes('react-refresh')) {
              if (isProd) return null;
              if (Array.isArray(p)) {
                return [
                  p[0],
                  { skipEnvCheck: true, ...(typeof p[1] === 'object' ? p[1] : {}) },
                ];
              }
              return [name, { skipEnvCheck: true }];
            }
            return p;
          })
          .filter(Boolean);
      };
      options.plugins = sanitize(options.plugins);
      return options;
    },
  },
};
