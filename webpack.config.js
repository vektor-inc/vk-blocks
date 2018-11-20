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
            },
            // Sassファイルの読み込みとコンパイル
            {
                test: /\.scss/, // 対象となるファイルの拡張子
                use: [
                    // linkタグに出力する機能
                    'style-loader',
                    // CSSをバンドルするための機能
                    {
                        loader: 'css-loader',
                        options: {
                            // オプションでCSS内のurl()メソッドの取り込みを禁止する
                            url: false,
                            // ソースマップの利用有無
                            sourceMap: true,

                            // 0 => no loaders (default);
                            // 1 => postcss-loader;
                            // 2 => postcss-loader, sass-loader
                            importLoaders: 2
                        },
                    },
                    // PostCSSのための設定
                    {
                        loader: 'postcss-loader',
                        options: {
                            // PostCSS側でもソースマップを有効にする
                            sourceMap: true,
                            plugins: [
                                // Autoprefixerを有効化
                                // ベンダープレフィックスを自動付与する
                                require('autoprefixer')({grid: true})
                            ]
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            // ソースマップの利用有無
                            sourceMap: true,
                        }
                    }
                ],
            }
        ]
    }
}