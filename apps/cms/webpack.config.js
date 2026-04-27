const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = {
  // Optimize CSS output for the CMS build
  optimization: {
    minimizer: [
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              // Reduce CSS size by removing unused rules and optimizing
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              mergeLonghand: true,
              mergeRules: true,
              minifySelectors: true,
              // Split large CSS files at logical breakpoints
              splitLongSelectors: {
                maxLength: 4096, // Roughly 100 lines at average CSS line length
              },
            },
          ],
        },
      }),
    ],
    splitChunks: {
      cacheGroups: {
        // Split CSS into smaller chunks
        styles: {
          name: 'styles',
          type: 'css/mini-extract',
          chunks: 'all',
          // Split at ~30KB chunks (roughly 750 lines)
          maxSize: 30720,
          minSize: 10240,
        },
      },
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
      chunkFilename: '[name].[contenthash:8].chunk.css',
      // Enable chunk splitting for CSS files
      experimentalUseImportModule: true,
    }),
  ],
};
