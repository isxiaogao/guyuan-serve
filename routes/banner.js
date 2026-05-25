const express = require('express')
const router = express.Router()
const pool = require('../db')
const { asyncHandler } = require('../middleware/errorHandler')
const openidAuth = require('../middleware/openidAuth')
const { extractFilename, incrementRef, deleteUnreferencedFiles } = require('../utils/resourceManager')

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

  // 增加引用计数
  const fn = extractFilename(image)
  if (fn) await incrementRef(fn)

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

  // 递减引用并删除无引用的文件
  const fn = extractFilename(rows[0].image)
  if (fn) await deleteUnreferencedFiles([fn])

  await pool.query('DELETE FROM banners WHERE id = ?', [Number(req.params.id)])
  res.json({ code: 200, message: '删除成功' })
}))

module.exports = router
