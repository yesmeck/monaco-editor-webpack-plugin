const webpack = require('webpack');

class AddWorkerEntryPointPlugin {
  constructor({
    id,
    entry,
    filename,
    chunkFilename = undefined,
    plugins = undefined,
  }) {
    this.options = { id, entry, filename, chunkFilename, plugins };
  }

  apply(compiler) {
    const { id, entry, filename, chunkFilename, plugins } = this.options;
    const addWorkerEntryPoint = (compilation, callback) => {
      const outputOptions = {
        filename,
        chunkFilename,
        publicPath: compilation.outputOptions.publicPath,
        // HACK: globalObject is necessary to fix https://github.com/webpack/webpack/issues/6642
        globalObject: 'this',
      };
      const childCompiler = compilation.createChildCompiler(id, outputOptions, [
        new webpack.webworker.WebWorkerTemplatePlugin(),
        new webpack.LoaderTargetPlugin('webworker'),
        new webpack.SingleEntryPlugin(compiler.context, entry, 'main'),
      ]);
      plugins.forEach((plugin) => plugin.apply(childCompiler));
      childCompiler.runAsChild(callback);
    }
    if ('hooks' in compiler) {
      compiler.hooks.make.tapAsync('AddWorkerEntryPointPlugin', addWorkerEntryPoint);
    } else {
      compiler.plugin('make', addAppendLoader);
    }
  }
}

module.exports = AddWorkerEntryPointPlugin;
