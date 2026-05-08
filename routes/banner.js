const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, image, title FROM banners')
    res.json({ code: 200, data: rows })
  } catch (err) {
    console.error('[banners GET]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

module.exports = router
