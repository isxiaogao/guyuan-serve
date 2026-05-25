const express = require('express')
const router = express.Router()
const pool = require('../db')
const { asyncHandler } = require('../middleware/errorHandler')
const openidAuth = require('../middleware/openidAuth')

router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, icon FROM categories ORDER BY id')
  res.json({ code: 200, data: rows })
}))

router.post('/', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) {
    return res.json({ code: 400, message: '分类名称不能为空' })
  }
  if (name.length > 50) {
    return res.json({ code: 400, message: '分类名称不能超过50个字符' })
  }
  const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name.trim()])
  res.json({ code: 200, data: { id: result.insertId } })
}))

router.put('/:id', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const { name } = req.body
  if (!name || !name.trim()) {
    return res.json({ code: 400, message: '分类名称不能为空' })
  }
  if (name.length > 50) {
    return res.json({ code: 400, message: '分类名称不能超过50个字符' })
  }
  const [result] = await pool.query('UPDATE categories SET name = ? WHERE id = ?', [name.trim(), Number(req.params.id)])
  if (result.affectedRows === 0) {
    return res.json({ code: 404, message: '分类不存在' })
  }
  res.json({ code: 200, message: '更新成功' })
}))

router.delete('/:id', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [Number(req.params.id)])
  if (result.affectedRows === 0) {
    return res.json({ code: 404, message: '分类不存在' })
  }
  res.json({ code: 200, message: '删除成功' })
}))

module.exports = router
