module.exports = {
    mode: 'production',
    devtool: 'source-map',
    entry: "./src/bundle.js",
    output: {
        filename: "./dist/block-build.js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-transform-react-jsx',
                            [
                                // JSをスキャンして、potを作成/アップデート
                                '@wordpress/babel-plugin-makepot',
                                {
                                    'output': `./dist/languages/vk-blocks.pot`
                                }
                            ]
                        ]
                    }
                }
            }
        ]
    }
}