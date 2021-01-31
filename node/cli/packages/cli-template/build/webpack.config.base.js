const path = require('path')
const { VueLoaderPlugin, default: loader } = require('vue-loader')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  context: path.resolve(__dirname, '../'),
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: '[name].js',
    chunkFilename: '[name].js'
  },
  plugins: [new CleanWebpackPlugin(), new VueLoaderPlugin()],
  target: 'web', // webpack5热更新需设置
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src')
    },
    extensions: ['.js', '.vue', '.json']
  },
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: path.resolve(__dirname, '../src'),
        options: {
          formatter: require('eslint-friendly-formatter'),
          emitWarning: false
        }
      },
      {
        test: /\.vue$/,
        use: [
          'cache-loader',
          {
            loader: 'vue-loader',
            options: {
              compilerOptions: {
                preserveWhitespace: false // 去掉元素之间空格
              },
              babelParserPlugins: [
                'jsx',
                'classProperties',
                'decorators-legacy'
              ]
            }
          }
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        include: path.resolve(__dirname, '../src'),
        loader: 'url-loader',
        parser: {
          dataUrlCondition: {
            maxSize: 2 * 1024 * 1024 // 2M----小于2M表现形式为baser64 大于2M就是 模块文件会被生成到输出的目标目录
          }
        }
      }
    ]
  }
}
