const express = require('express')
const router = express.Router()
const pool = require('../db')
const adminAuth = require('../middleware/auth')

// 获取所有分类
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, icon FROM categories ORDER BY id')
    res.json({ code: 200, data: rows })
  } catch (err) {
    console.error('[categories GET]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

// 新增分类
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name } = req.body
    if (!name || !name.trim()) {
      return res.json({ code: 400, message: '分类名称不能为空' })
    }
    if (name.length > 50) {
      return res.json({ code: 400, message: '分类名称不能超过50个字符' })
    }
    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name.trim()])
    res.json({ code: 200, data: { id: result.insertId } })
  } catch (err) {
    console.error('[categories POST]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

// 更新分类
router.put('/:id', adminAuth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[categories PUT]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

// 删除分类
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [Number(req.params.id)])
    if (result.affectedRows === 0) {
      return res.json({ code: 404, message: '分类不存在' })
    }
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED' || err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.json({ code: 400, message: '该分类下有商品，无法删除' })
    }
    console.error('[categories DELETE]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

module.exports = router
