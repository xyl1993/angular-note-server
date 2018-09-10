var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CompressionWebpackPlugin = require('compression-webpack-plugin');
var path = require('path')
//显示进度
const chalk = require('chalk');
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const safeParser = require('postcss-safe-parser');
//happypack多进程打包
const HappyPack = require('happypack')
const os = require('os') //获取电脑的处理器有几个核心，作为配置传入
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length })

//css压缩
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')

var path = require('path');
var ROOT_PATH = path.resolve(__dirname);
var utils = function (_path) {
  var assetsSubDirectory = 'static';
  return path.posix.join(assetsSubDirectory, _path)
};

var publicPath = './';
function resolve(dir) {
  return path.join(__dirname, '..', dir)
}
module.exports = {
  entry: {
    home: resolve(__dirname, "public/aejsStyles/index.js")
  },
  output: {
    path: path.resolve(ROOT_PATH, './dist'),
    // publicPath: publicPath,                        //用于单独打包放到第三方平台时用
    // filename: utils.assetsPath('js/[name]_[chunkhash].js')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader?sourceMap",
          {
            loader: 'postcss-loader',
            options: {
              plugins: (loader) => [
                require('autoprefixer')({
                  browsers: ['last 5 versions']
                })
              ]
            }
          }
        ]
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            "css-loader?minimize",
            "sass-loader?includePaths[]=" + path.resolve(__dirname, "./node_modules/compass-mixins/lib")
          ]
        })
      },
      {
        test: /\.jsx?$/,
        // use: 'babel-loader?cacheDirectory',
        loader: 'happypack/loader?id=happy-babel-js',
        exclude: path.resolve(__dirname, "node_modules"),
        include: path.resolve(__dirname, 'src')
      },
      {
        test: /\.(png|jpg|gif|cur)$/,
        use: ["url-loader?limit=8192&name=" + utils.assetsPath('images/[hash:8].[name].[ext]')]
      }, {
        test: /\.(woff|woff2|eot|ttf|otf|svg)(\?.*$|$)/,
        use: ["url-loader?importLoaders=1&limit=80000&name=" + utils.assetsPath('fonts/[name].[ext]')]
      },
      {
        test: /\.html$/,
        use: ["html-withimg-loader?minimize"]
      }
    ]
  },
  mode: 'production',
  // 开启source-map，webpack有多种source-map，在官网文档可以查到//cheap-module-source-map
  // devtool: 'inline-source-map',      
  externals: {
  },
  optimization: {
    minimize: true,
    splitChunks: {
      cacheGroups: {
        commons: {
          chunks: 'initial',
          minChunks: 2,
          maxInitialRequests: 5,
          minSize: 0
        },
        vendor: { // 将第三方模块提取出来
          test: /node_modules/,
          chunks: 'initial',
          name: 'vendor',
          priority: 10, // 优先
          enforce: true
        }
      }
    }
    // ,
    // runtimeChunk: {
    //   name: 'runtime',
    // }
  },
  plugins: [
    new ExtractTextPlugin('[name].[contenthash].css'),
    //在 plugins 中添加
    new MiniCssExtractPlugin({
      filename: utils.assetsPath("css/[name]_[chunkhash].css")
    }),
    //在 plugin 中添加
    new CompressionWebpackPlugin({ //gzip 压缩
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(js|css)$'    //压缩 js 与 css
      ),
      threshold: 10240,
      minRatio: 0.8
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(ROOT_PATH, './views/template.ejs'),
      filename: 'template.ejs',
      favicon: path.resolve(ROOT_PATH, './public/aejsStyles/images/logo.png'),
      inject: true, // 自动注入
      minify: {
        removeComments: true,        //去注释
        collapseWhitespace: true,    //压缩空格
        removeAttributeQuotes: true  //去除属性引用
      }
    }),
    // /*多进程压缩打包*/
    new HappyPack({ //开启多线程打包
      id: 'happy-babel-js',
      loaders: ['babel-loader?cacheDirectory=true'],
      threadPool: happyThreadPool
    }),
    //显示压缩进度
    new ProgressBarPlugin({
      format: 'build [:bar] ' + chalk.green.bold(':percent') + ' (:elapsed seconds)',
      clear: false
    }),
    /*用于生产环境压缩css的插件*/
    new OptimizeCSSPlugin({
      cssProcessorOptions: {
        parser: safeParser,
        discardComments: {
          removeAll: true
        }
      }
    })
  ]
}
