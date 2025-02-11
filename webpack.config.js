const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    bundle: './src/index.ts',
    allSettledCancelable: './src/allSettledCancelable.ts',
    CancelableAbortController: './src/CancelableAbortController.ts',
    CancelablePromise: './src/CancelablePromise.ts',
    createDecoupledPromise: './src/createDecoupledPromise.ts',
    groupAsCancelablePromise: './src/groupAsCancelablePromise.ts',
    isCancelableAbortSignal: './src/isCancelableAbortSignal.ts',
    isCancelablePromise: './src/isCancelablePromise.ts',
    isPromise: './src/isPromise.ts',
    toCancelablePromise: './src/toCancelablePromise.ts',
    tryCatch: './src/tryCatch.ts',
    tryCatchPromise: './src/tryCatchPromise.ts',
    types: './src/types.ts',
  },
  output: {
    path: path.resolve(__dirname),
    filename: ({ chunk: { name } }) => {
      return `${name}.js`;
    },
    libraryTarget: 'umd',
    library: 'easy-cancelable-promise',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      'easy-cancelable-promise': path.resolve(
        __dirname,
        'node_modules/easy-cancelable-promise/package.json',
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-typescript'],
              plugins: [
                '@babel/plugin-transform-modules-commonjs',
                '@babel/plugin-proposal-class-properties',
                '@babel/plugin-proposal-export-namespace-from',
              ],
            },
          },
          {
            loader: 'ts-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
};
