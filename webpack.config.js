var webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
module.exports = {
    // 页面入口文件配置
    entry : {
        'client/view/main/index': './client/js/view/main/index.js'
    },
    // 入口文件输出配置
    output : {
        path : __dirname + '/output/js/',
        filename : '[name].bundle.js'
    },
    module: {
        // 加载器配置
        loaders: [
        {
            test: /\.js$/,
            loader: 'babel-loader!jsx-loader?harmony'
        },
        {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
        }
        ]        
    },
    // 其他解决方案配置
    resolve: {
        extensions: ['', '.js', '.jsx', '.css', '.json'],
    },
    optimization:{
        minimizer: [
            new UglifyJSPlugin({
                uglifyOptions: {
                    output: {
                        comments: false
                    },
                    compress: {
                        warnings: false,
                        drop_debugger: true,
                        drop_console: true
                    }
                }
            }),
        ]
    },
    // // 插件项
    // plugins : [
    //     new webpack.optimize.UglifyJsPlugin({
    //         compress: {
    //             warnings: false,
    //         },
    //         output: {
    //             comments: false,
    //         },
    //     }),
    // ]
}
