'use strict'

const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const NODE_ENV = process.env['NODE_ENV'] || 'local'
const IS_PRODUCTION = NODE_ENV === 'production'
const TARGET_PATH = 'bundles'

module.exports = {
  entry: path.join(__dirname, 'src/app.js'),
  devtool: IS_PRODUCTION ? 'source-map' : '#inline-source-map',
  output: {
    path: path.join(__dirname, 'www/'),
    filename: TARGET_PATH + '/js/[name]' + (IS_PRODUCTION ? '.[hash:6]' : '') + '.bundle.js',
    sourceMapFilename: TARGET_PATH + '/js/[name]' + (IS_PRODUCTION ? '.[hash:6]' : '') + '.bundle.map',
    chunkFilename: TARGET_PATH + '/js/[id].bundle.js',
    publicPath: ''
  },
  resolve: {
    modules: [
      'node_modules',
      'src'
    ]
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
    new webpack.ProvidePlugin({
      '$': 'jquery',
      'jQuery': 'jquery',
      'window.jQuery': 'jquery'
    }),
    // new ExtractTextPlugin('css/[name]-[local]-[hash:6].css'),
    new ExtractTextPlugin(TARGET_PATH + '/styles/[name]' + (IS_PRODUCTION ? '.[hash:6]' : '') + '.css'),
    new HtmlWebpackPlugin({
      template: 'src/templates/index.html',
      inject: 'body',
      filename: 'index.html'
    }),
    new webpack.DefinePlugin({
      'process.env': { 'NODE_ENV': JSON.stringify(NODE_ENV) }
    }),
    (function () {
      if (IS_PRODUCTION) {
        // console.log('uglifying')
        // return new webpack.optimize.UglifyJsPlugin({
        //   compress: { warnings: false },
        //   output: { comments: false }
        // })
        return function () {
          console.log('uglify desactivated')
        }
      } else {
        return function () {
          console.log('uglify desactivated')
        }
      }
    })(),
    new webpack.optimize.CommonsChunkPlugin({
      filename: TARGET_PATH + '/js/common' + (IS_PRODUCTION ? '.[hash:6]' : '') + '.bundle.js',
      name: 'common'
    })
    // will generate common.js for shared code
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [
            'react',
            [ 'es2015', { modules: false } ],
            'stage-0',
            'env'
          ]
        }
      },
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader'
      },
      {
        test: /\.less$/,
        loader: ExtractTextPlugin.extract({
          use: [{
            loader: 'css-loader', // translates CSS into CommonJS
            options: {
              minimize: IS_PRODUCTION
            //  root: '/'
            }
          }, {
            loader: 'less-loader' // compiles Less to CSS
          }],
          fallback: 'style-loader'
        })
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          use: [{
            loader: 'css-loader', // translates CSS into CommonJS
            options: {
              minimize: IS_PRODUCTION
            //  root: '/'
            }
          }],
          fallback: 'style-loader'
        })
        // loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.(svg|png|jpg|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: TARGET_PATH + '/images/'
            }
          }
        ]
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: TARGET_PATH + '/fonts/'
            }
          }
        ]
      }
      // {
      //   test: /\.(svg|jpg|png|gif)$/,
      //   loader: 'url-loader?limit=4000&name=images/[name].[ext]'
      // },
      // {
      //   test: /\.(eot|ttf|woff|woff2)$/,
      //   loader: 'file-loader?name=fonts/[name].[ext]'
      // }
    ]
  }
}
