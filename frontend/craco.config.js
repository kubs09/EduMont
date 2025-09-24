// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  babel: {
    plugins: [
      process.env.NODE_ENV === 'development' && [
        require.resolve('react-refresh/babel'),
        { skipEnvCheck: false },
      ],
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

      // Disable React Refresh in production
      if (process.env.NODE_ENV === 'production') {
        // Remove React Refresh plugin
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (plugin) => !plugin.constructor.name.includes('ReactRefreshPlugin')
        );

        // Remove React Refresh from babel-loader completely
        const oneOfRule = webpackConfig.module.rules.find((rule) => rule.oneOf);
        if (oneOfRule) {
          oneOfRule.oneOf.forEach((rule) => {
            if (rule.test && rule.test.toString().includes('tsx?') && rule.use) {
              const babelLoader = Array.isArray(rule.use)
                ? rule.use.find((use) => use.loader && use.loader.includes('babel-loader'))
                : rule.use.loader && rule.use.loader.includes('babel-loader')
                  ? rule.use
                  : null;

              if (babelLoader && babelLoader.options) {
                // Completely remove plugins array if it exists to avoid conflicts
                if (babelLoader.options.plugins) {
                  babelLoader.options.plugins = [];
                }
                // Also check presets for react-refresh
                if (babelLoader.options.presets) {
                  babelLoader.options.presets = babelLoader.options.presets.map((preset) => {
                    if (Array.isArray(preset) && preset[1] && preset[1].plugins) {
                      preset[1].plugins = preset[1].plugins.filter(
                        (plugin) => !plugin.toString().includes('react-refresh')
                      );
                    }
                    return preset;
                  });
                }
              }
            }
          });
        }
      }

      return webpackConfig;
    },
  },
};
