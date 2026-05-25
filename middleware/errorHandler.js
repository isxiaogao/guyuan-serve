class AppError extends Error {
  constructor(code, message) {
    super(message)
    this.code = code
    this.name = 'AppError'
  }
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

function errorHandler(err, req, res, next) {
  const method = req.method
  const url = req.originalUrl || req.url
  console.error(`[ERROR] ${method} ${url}`, err.message, err.code || '', err.stack || '')

  if (err instanceof AppError) {
    return res.json({ code: err.code, message: err.message })
  }

  if (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.json({ code: 400, message: '该数据被其他数据引用，无法删除' })
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.json({ code: 400, message: '数据已存在' })
  }

  if (err.type === 'field' || (err.message && (err.message.includes('仅支持') || err.message.includes('请选择')))) {
    return res.json({ code: 400, message: err.message })
  }

  res.json({ code: 500, message: '服务器内部错误' })
}

module.exports = { AppError, asyncHandler, errorHandler }
