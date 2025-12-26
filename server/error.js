// File: server/error.js
export const createError = (statusCode, message) => {
  const err = new Error(message)
  err.statusCode = statusCode
  err.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
  return err
}
