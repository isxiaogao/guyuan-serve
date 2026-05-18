const express = require('express')
const router = express.Router()
const pool = require('../db')

// 获取所有标签（公开接口，前端下拉使用）
router.get('/', async (req, res) => {
  try {
    const { enabled } = req.query
    let sql = 'SELECT id, name, code, sort, enabled, created_at FROM tags'
    const params = []
    if (enabled !== undefined) {
      sql += ' WHERE enabled = ?'
      params.push(Number(enabled))
    }
    sql += ' ORDER BY sort ASC, id ASC'
    const [rows] = await pool.query(sql, params)
    res.json({ code: 200, data: rows })
  } catch (err) {
    console.error('[tags GET]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

// 新增标签
router.post('/', async (req, res) => {
  try {
    const { name, code, sort = 0, enabled = 1 } = req.body
    if (!name || !name.trim()) {
      return res.json({ code: 400, message: '标签名称不能为空' })
    }
    if (name.length > 50) {
      return res.json({ code: 400, message: '标签名称不能超过50个字符' })
    }
    if (!code || !code.trim()) {
      return res.json({ code: 400, message: '标签代码不能为空' })
    }
    const [result] = await pool.query(
      'INSERT INTO tags (name, code, sort, enabled) VALUES (?, ?, ?, ?)',
      [name.trim(), code.trim(), Number(sort), Number(enabled)]
    )
    res.json({ code: 200, data: { id: result.insertId } })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json({ code: 400, message: '标签名称已存在' })
    }
    console.error('[tags POST]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

// 更新标签
router.put('/:id', async (req, res) => {
  try {
    const { name, code, sort, enabled } = req.body
    if (name !== undefined) {
      if (!name.trim()) return res.json({ code: 400, message: '标签名称不能为空' })
      if (name.length > 50) return res.json({ code: 400, message: '标签名称不能超过50个字符' })
    }
    if (code !== undefined && (!code.trim())) {
      return res.json({ code: 400, message: '标签代码不能为空' })
    }

    const fields = []
    const params = []
    if (name !== undefined) { fields.push('name = ?'); params.push(name.trim()) }
    if (code !== undefined) { fields.push('code = ?'); params.push(code.trim()) }
    if (sort !== undefined) { fields.push('sort = ?'); params.push(Number(sort)) }
    if (enabled !== undefined) { fields.push('enabled = ?'); params.push(Number(enabled)) }

    if (fields.length === 0) {
      return res.json({ code: 400, message: '无更新字段' })
    }

    params.push(Number(req.params.id))
    const [result] = await pool.query(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`, params)
    if (result.affectedRows === 0) {
      return res.json({ code: 404, message: '标签不存在' })
    }
    res.json({ code: 200, message: '更新成功' })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json({ code: 400, message: '标签名称已存在' })
    }
    console.error('[tags PUT]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

// 删除标签
router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM tags WHERE id = ?', [Number(req.params.id)])
    if (result.affectedRows === 0) {
      return res.json({ code: 404, message: '标签不存在' })
    }
    res.json({ code: 200, message: '删除成功' })
  } catch (err) {
    console.error('[tags DELETE]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

module.exports = router
