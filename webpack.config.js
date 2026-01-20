const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    bundle: './src/index.ts',
    CancelableAbortController: './src/CancelableAbortController.ts',
    CancelablePromise: './src/CancelablePromise.ts',
    defer: './src/defer.ts',
    groupAsCancelablePromise: './src/groupAsCancelablePromise.ts',
    isCancelableAbortSignal: './src/isCancelableAbortSignal.ts',
    isCancelablePromise: './src/isCancelablePromise.ts',
    isPromise: './src/isPromise.ts',
    toCancelablePromise: './src/toCancelablePromise.ts',
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
        use: 'ts-loader',
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
          compress: {
            passes: 5,
            drop_debugger: true,
            keep_fargs: false,
            keep_infinity: true,
            reduce_funcs: true,
            reduce_vars: true,
            keep_fnames: false,
            toplevel: true,
          },
          mangle: {
            toplevel: true,
            properties: false,
          },
          format: {
            comments: false,
          },
        },
      }),
    ],
  },
};
