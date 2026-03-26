const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const CopyPlugin = require('copy-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDev ? 'development' : 'production',

  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isDev ? 'js/[name].js' : 'js/[name].[contenthash:8].js',
    assetModuleFilename: 'assets/[hash:8][ext]',
    clean: true,
    publicPath: '/'
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      vue: 'vue/dist/vue.esm-bundler.js'
    },
    extensions: ['.js', '.vue', '.json']
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { targets: 'defaults' }]]
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/,
        type: 'asset/resource'
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/,
        type: 'asset/resource'
      }
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.VUE_APP_API_BASE': JSON.stringify(
        process.env.VUE_APP_API_BASE || ''
      )
    }),

    new VueLoaderPlugin(),

    new HtmlWebpackPlugin({
      template: './public/index.html',
      title: 'OneYear 泡泡论坛'
    }),

    new CopyPlugin({
      patterns: [
        {
          from: 'public',
          to: '.',
          globOptions: { ignore: ['**/index.html'] }
        }
      ]
    }),

    ...(isDev
      ? []
      : [
          new MiniCssExtractPlugin({
            filename: 'css/[name].[contenthash:8].css'
          })
        ])
  ],

  devServer: {
    port: 5173,
    hot: true,
    open: true,
    historyApiFallback: true,
    proxy: [
      {
        context: ['/api'],
        target: 'http://127.0.0.1:3000',
        changeOrigin: true
      }
    ]
  },

  devtool: isDev ? 'eval-cheap-module-source-map' : false,

  performance: {
    hints: isDev ? false : 'warning',
    maxEntrypointSize: 512 * 1024,
    maxAssetSize: 512 * 1024
  }
};
