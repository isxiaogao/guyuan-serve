const express = require('express')
const router = express.Router()
const pool = require('../db')

const WX_APPID = process.env.WX_APPID
const WX_APPSECRET = process.env.WX_APPSECRET

// 微信登录：用 code 换 openid，并记录用户访问
router.post('/login', async (req, res) => {
  const { code } = req.body
  if (!code) {
    return res.json({ code: 400, message: 'code 不能为空' })
  }

  try {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${WX_APPID}&secret=${WX_APPSECRET}&js_code=${code}&grant_type=authorization_code`
    const wxRes = await fetch(url)
    const data = await wxRes.json()

    if (data.errcode) {
      console.error('[微信登录失败]', data)
      return res.json({ code: 400, message: data.errmsg || '登录失败' })
    }

    const openid = data.openid
    // 记录用户访问（首次自动入库，非管理员也记录）
    await pool.query(
      'INSERT INTO users (openid) VALUES (?) ON DUPLICATE KEY UPDATE last_visit_at = CURRENT_TIMESTAMP',
      [openid]
    )
    // 查询是否为管理员
    const [users] = await pool.query('SELECT is_admin FROM users WHERE openid = ?', [openid])
    const isAdmin = users.length > 0 && users[0].is_admin === 1

    res.json({ code: 200, data: { openid, isAdmin } })
  } catch (err) {
    console.error('[auth/login]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

module.exports = router
