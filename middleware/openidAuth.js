const pool = require('../db')

// 缓存管理员 openid 列表，每 60 秒刷新一次
let adminOpenids = []
let cacheExpireAt = 0

async function loadAdminOpenids() {
  if (Date.now() < cacheExpireAt) return adminOpenids
  try {
    const [rows] = await pool.query('SELECT openid FROM users WHERE is_admin = 1')
    adminOpenids = rows.map(r => r.openid)
    cacheExpireAt = Date.now() + 60 * 1000
  } catch (err) {
    console.error('[加载管理员 openid 失败]', err.message)
  }
  return adminOpenids
}

function openidAuth({ adminOnly = false } = {}) {
  return async (req, res, next) => {
    const openid = req.headers['x-user-openid']
    if (!openid || typeof openid !== 'string' || openid.trim().length === 0) {
      return res.json({ code: 401, message: '请先登录' })
    }
    if (adminOnly) {
      const admins = await loadAdminOpenids()
      if (!admins.includes(openid)) {
        return res.json({ code: 403, message: '无操作权限' })
      }
    }
    req.openid = openid.trim()
    next()
  }
}

module.exports = openidAuth
