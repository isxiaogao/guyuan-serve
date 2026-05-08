function adminAuth(req, res, next) {
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'guyuan-admin-token'
  const token = req.headers['x-admin-token'] || (req.query && req.query.token)
  if (!token || token !== ADMIN_TOKEN) {
    return res.json({ code: 403, message: '无操作权限' })
  }
  next()
}

module.exports = adminAuth
