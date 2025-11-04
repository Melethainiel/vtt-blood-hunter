const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: {
      'blood-hunter': './scripts/blood-hunter.js',
      'blood-curse': './scripts/blood-curse.js',
      'crimson-rite': './scripts/crimson-rite.js',
      'order-lycan': './scripts/order-lycan.js',
      'integrations': './scripts/integrations.js',
      'utils': './scripts/utils.js'
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'scripts/[name].js',
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction
            }
          }
        })
      ]
    },
    devtool: isProduction ? false : 'source-map',
    watchOptions: {
      ignored: /node_modules/
    }
  };
};