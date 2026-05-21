const express = require('express')
const router = express.Router()
const pool = require('../db')
const { asyncHandler, AppError } = require('../middleware/errorHandler')

const WX_APPID = process.env.WX_APPID
const WX_APPSECRET = process.env.WX_APPSECRET

router.post('/login', asyncHandler(async (req, res) => {
  const { code } = req.body
  if (!code) {
    return res.json({ code: 400, message: 'code 不能为空' })
  }
  if (typeof code !== 'string' || !/^[a-zA-Z0-9]+$/.test(code) || code.length > 100) {
    return res.json({ code: 400, message: 'code 格式无效' })
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_APPSECRET}&js_code=${code}&grant_type=authorization_code`
  const wxRes = await fetch(url)
  const data = await wxRes.json()

  if (data.errcode) {
    console.error('[微信登录失败]', data)
    return res.json({ code: 400, message: data.errmsg || '登录失败' })
  }

  const openid = data.openid
  await pool.query(
    'INSERT INTO users (openid) VALUES (?) ON DUPLICATE KEY UPDATE last_visit_at = CURRENT_TIMESTAMP',
    [openid]
  )
  const [users] = await pool.query('SELECT is_admin FROM users WHERE openid = ?', [openid])
  const isAdmin = users.length > 0 && users[0].is_admin === 1

  res.json({ code: 200, data: { openid, isAdmin } })
}))

module.exports = router
