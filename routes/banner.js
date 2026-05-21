const express = require('express')
const router = express.Router()
const pool = require('../db')
const path = require('path')
const fs = require('fs')
const { asyncHandler } = require('../middleware/errorHandler')
const openidAuth = require('../middleware/openidAuth')

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, image, title FROM banners ORDER BY id DESC')
  res.json({ code: 200, data: rows })
}))

router.post('/', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const { image, title } = req.body
  if (!image || !image.trim()) {
    return res.json({ code: 400, message: '图片不能为空' })
  }
  if (!title || !title.trim()) {
    return res.json({ code: 400, message: '标题不能为空' })
  }
  if (title.length > 100) {
    return res.json({ code: 400, message: '标题不能超过100个字符' })
  }
  const [result] = await pool.query(
    'INSERT INTO banners (image, title) VALUES (?, ?)',
    [image.trim(), title.trim()]
  )
  res.json({ code: 200, data: { id: result.insertId } })
}))

router.delete('/:id', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT image FROM banners WHERE id = ?', [Number(req.params.id)])
  if (rows.length === 0) {
    return res.json({ code: 404, message: '轮播图不存在' })
  }
  const imagePath = rows[0].image
  if (imagePath) {
    const match = imagePath.match(/\/uploads\/(.+)$/)
    if (match) {
      const filePath = path.join(__dirname, '..', 'uploads', match[1])
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }
  }
  await pool.query('DELETE FROM banners WHERE id = ?', [Number(req.params.id)])
  res.json({ code: 200, message: '删除成功' })
}))

module.exports = router
