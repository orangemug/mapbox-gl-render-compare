const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
// const WorkboxPlugin = require('workbox-webpack-plugin');

module.exports = {
  entry: [
    './index.js'
  ],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'docs'),
    publicPath: '/track-ip-timer/',
  },
  plugins: [
    new CopyPlugin([
      { from: 'public', to: 'public' },
      // { from: 'manifest.webmanifest', to: 'manifest.webmanifest' },
      // { from: 'service-worker.js', to: 'service-worker.js' },
      { from: 'index.html', to: 'index.html' },
    ]),
    // new WorkboxPlugin.InjectManifest({
    //   swSrc: './service-worker.js',
    // }),
  ],
  devServer: {
    publicPath: '/all-styles/',
    port: 5009,
    host: '0.0.0.0',
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ]
  }
};
