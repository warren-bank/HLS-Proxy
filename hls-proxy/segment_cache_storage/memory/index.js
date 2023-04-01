module.exports = function() {

  // async
  const set = async (state, blob) => {
    state.databuffer = blob
  }

  // async
  const get = async (state) => state.databuffer

  // async
  const remove = async (state) => {
    delete state.databuffer
  }

  return {set, get, remove}
}
