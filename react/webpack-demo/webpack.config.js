const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
    // entry: './src/index.js',
    entry: {
        main: './src/index.js',
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: "var",
        library: "[name]",
    },
    // optimization: {
    //     // minimize: false,
    //     minimize: true,
    //     minimizer: [
    //         new TerserPlugin({
    //             terserOptions: {
    //                 keep_fnames: true,
    //             },
    //         })
    //     ],
    // },
};