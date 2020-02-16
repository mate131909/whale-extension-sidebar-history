/* eslint-disable lines-around-directive */
// eslint-disable-next-line strict
"use strict";

// eslint-disable-next-line no-unused-vars
const webpack = require("webpack");

const path = require("path");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const WebpackExtensionReloader = require("webpack-extension-reloader");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const rootDir = path.join(__dirname, "./");

module.exports = (env, options) => {
  const config = {
    // 혹여나 entry 이름을 수정할 경우, WebpackExtensionReloader 의 entry 값도 수정해야 reloader 가 정상적으로 작동합니다.
    entry: {
      sidebarPage: path.join(rootDir, "src", "sidebarPage", "index.tsx"),
    },
    output: {
      path: path.join(rootDir, "dist"),
      filename: "[name].bundle.js",
    },
    resolve: {
      extensions: [".js", ".ts", ".tsx"],
    },
    module: {
      rules: [
        {
          test: /\.(ts|tsx)?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
            },
          ],
        },
        {
          test: /\.scss$/,
          loader: "style-loader!css-loader!sass-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          loader: "style-loader!css-loader",
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin([
        // static 파일들의 경로는 `dist/static/[filename]` 이 아닌, `dist/[filename]` 입니다.
        {
          from: path.join(rootDir, "static"),
          to: "./", // `dist/static/[filename]` 방식을 선호하신다면 './' 부분을 './static' 으로 변경하시면 됩니다.
        },

        // i18n(다국어 지원용) 데이터 폴더 복사
        {
          from: path.join(rootDir, "src", "_locales"),
          to: "./_locales/",
        },

        // package.json 의 version 정보를 manifest 에 추가해서 manifest 파일 생성
        {
          from: path.join(rootDir, "src/manifest.json"),
          transform(content) {
            // 개발 빌드 시에는 보다 편하게 확인할 수 있도록 space 옵션 추가
            let space = 0;
            if (options.mode === "development") {
              space = 2;
            }
            return Buffer.from(
              JSON.stringify(
                {
                  version: process.env.npm_package_version,
                  ...JSON.parse(content.toString()),
                },
                null,
                space,
              ),
            );
          },
          to: "./manifest.json",
        },
      ]),
    ],
  };

  // 개발 빌드 시 설정 (Reloader 추가)
  if (options.mode === "development") {
    if (!env) {
      return config;
    }

    if (env.reloader) {
      config.plugins.push(
        // webpack-extension-reloader 설정
        // 자세한 내용은 https://github.com/rubenspgcavalcante/webpack-extension-reloader 를 참고해주세요
        new WebpackExtensionReloader({
          port: 9091,
          reloadPage: true,
          entries: {
            // 'sidebarPage', 'background' 처럼 값으로 들어가는 문자열은 Webpack 의 entry 키 값과 동일해야 합니다.
            // contentScript 가 여러 개라면, contentScript 배열에 또다른 contentScript entry 를 추가하시면 됩니다.
            // 확장앱 페이지가 여러 개라면, extensionPage 배열에 또다른 확장앱 페이지 entry 를 추가하시면 됩니다.
            extensionPage: ["sidebarPage"],
          },
        }),
      );
    } else if (env.hotreload) {
      const portNumber = 9000;

      config.devServer = {
        contentBase: "./dist",
        port: portNumber,
        hot: true,
      };
      config.entry = Object.keys(config.entry).reduce((prev, entryName) => {
        return {
          ...prev,
          [entryName]: [
            `webpack-dev-server/client?http://localhost:${portNumber}`,
            "webpack/hot/dev-server",
          ].concat(config.entry[entryName]),
        };
      }, {});
      config.resolve.alias = {
        "react-dom": "@hot-loader/react-dom",
      };
      config.plugins = [
        new webpack.HotModuleReplacementPlugin(),
        ...config.plugins,
      ];
    }
  }

  // 배포용 빌드 시 설정 (빌드 디렉터리 정리)
  if (options.mode === "production") {
    config.plugins.push(
      // 배포용 빌드 시에는 빌드 디렉터리를 정리합니다.
      new CleanWebpackPlugin(),
    );
  }

  return config;
};
