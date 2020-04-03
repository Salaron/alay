import AssetsWebpackPlugin from "assets-webpack-plugin"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import MiniCssExtractPlugin from "mini-css-extract-plugin"
import { resolve as pathResolve } from "path"
import * as webpack from "webpack"

const config: webpack.Configuration = {
  entry: {
    main: [
      "./webpack/ts/index.ts",
      "./webpack/styles/default.scss",
    ],
    webview: "./webpack/styles/webview.scss"
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.json"
        }
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader"
        ]
      }
    ]
  },
  output: {
    filename: "js/bundle-[hash].js",
    path: pathResolve(__dirname, "public"),
    publicPath: "/public"
  },
  resolve: {
    extensions: [".ts"]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new AssetsWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "styles/[name]-[hash].css"
    })
  ]
}

export default config
