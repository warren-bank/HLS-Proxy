module.exports = function(params) {
  const {cache_storage, cache_storage_fs_dirpath} = params

  if (cache_storage) {
    if (cache_storage === 'memory')
      return require('./memory')()

    if ((cache_storage === 'filesystem') && cache_storage_fs_dirpath)
      return require('./filesystem')(cache_storage_fs_dirpath)
  }

  // default
  return require('./memory')()
}
