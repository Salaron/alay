import { resolve as pathResolve } from "path"
import { CleanWebpackPlugin } from "clean-webpack-plugin"
import AssetsWebpackPlugin from "assets-webpack-plugin"
import * as webpack from "webpack"

const config: webpack.Configuration = {
  entry: "./webpack/ts/index.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.json"
        }
      }
    ]
  },
  output: {
    filename: "bundle-[hash].js",
    path: pathResolve(__dirname, "public/js"),
    publicPath: "/public/js"
  },
  resolve: {
    extensions: [".ts"]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new AssetsWebpackPlugin()
  ]
}

export default config
