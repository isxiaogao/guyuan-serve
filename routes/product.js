const express = require('express')
const router = express.Router()
const pool = require('../db')
const { asyncHandler } = require('../middleware/errorHandler')
const openidAuth = require('../middleware/openidAuth')
const { mapProduct, mapList } = require('../utils/productMapper')

router.get('/', asyncHandler(async (req, res) => {
  const { category, tag, keyword, page = 1, pageSize = 20 } = req.query
  let sql = 'SELECT * FROM products WHERE 1=1'
  const params = []

  if (category !== undefined && category !== '0') {
    sql += ' AND category_id = ?'
    params.push(Number(category))
  }
  if (tag) {
    sql += ' AND tag = ?'
    params.push(tag)
  }
  if (keyword && typeof keyword === 'string' && keyword.length <= 50) {
    sql += ' AND name LIKE ?'
    params.push(`%${keyword}%`)
  }

  const pageNum = Math.max(1, Math.min(Number(page), 100))
  const sizeNum = Math.max(1, Math.min(Number(pageSize), 50))

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
  const [{ total }] = await pool.query(countSql, params)

  sql += ' ORDER BY id LIMIT ? OFFSET ?'
  params.push(sizeNum, (pageNum - 1) * sizeNum)

  const [rows] = await pool.query(sql, params)
  res.json({ code: 200, data: { list: mapList(rows), total, page: pageNum, pageSize: sizeNum } })
}))

function createTagProductsHandler(tagCode) {
  return asyncHandler(async (req, res) => {
    const [tags] = await pool.query('SELECT name FROM tags WHERE code = ? AND enabled = 1', [tagCode])
    if (tags.length === 0) {
      return res.json({ code: 200, data: [] })
    }
    const names = tags.map(t => t.name)
    const placeholders = names.map(() => '?').join(',')
    const [rows] = await pool.query(`SELECT * FROM products WHERE tag IN (${placeholders})`, names)
    res.json({ code: 200, data: mapList(rows) })
  })
}

router.get('/hot', createTagProductsHandler('hot'))
router.get('/new', createTagProductsHandler('new'))

router.get('/:id', asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [Number(req.params.id)])
  if (rows.length === 0) {
    return res.json({ code: 404, message: '商品不存在' })
  }
  res.json({ code: 200, data: mapProduct(rows[0]) })
}))

router.post('/', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const [{ count }] = await pool.query('SELECT COUNT(*) as count FROM products')
  if (count >= 500) {
    return res.json({ code: 400, message: '商品数量已达上限(500条)' })
  }

  const { name, price, originalPrice, image, tag, category, description, detail, images, size, color, fabric } = req.body

  if (!name || !name.trim()) {
    return res.json({ code: 400, message: '商品名称不能为空' })
  }
  if (name.length > 200) {
    return res.json({ code: 400, message: '商品名称不能超过200个字符' })
  }
  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return res.json({ code: 400, message: '价格无效' })
  }
  if (description && description.length > 2000) {
    return res.json({ code: 400, message: '描述不能超过2000个字符' })
  }

  const imagesJson = Array.isArray(images) ? JSON.stringify(images) : null
  const [result] = await pool.query(
    'INSERT INTO products (name, price, original_price, image, tag, category_id, description, detail, images, size, color, fabric) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name.trim(), Number(price), originalPrice ? Number(originalPrice) : null, image, tag || '', category, description, detail, imagesJson, size || null, color || null, fabric || null]
  )
  res.json({ code: 200, data: { id: result.insertId } })
}))

router.put('/:id', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const { name, price, originalPrice, image, tag, category, description, detail, images, size, color, fabric } = req.body

  if (!name || !name.trim()) {
    return res.json({ code: 400, message: '商品名称不能为空' })
  }
  if (name.length > 200) {
    return res.json({ code: 400, message: '商品名称不能超过200个字符' })
  }
  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) < 0) {
    return res.json({ code: 400, message: '价格无效' })
  }
  if (description && description.length > 2000) {
    return res.json({ code: 400, message: '描述不能超过2000个字符' })
  }

  const imagesJson = Array.isArray(images) ? JSON.stringify(images) : null
  const [result] = await pool.query(
    'UPDATE products SET name=?, price=?, original_price=?, image=?, tag=?, category_id=?, description=?, detail=?, images=?, size=?, color=?, fabric=? WHERE id=?',
    [name.trim(), Number(price), originalPrice ? Number(originalPrice) : null, image, tag || '', category, description, detail, imagesJson, size || null, color || null, fabric || null, Number(req.params.id)]
  )
  if (result.affectedRows === 0) {
    return res.json({ code: 404, message: '商品不存在' })
  }
  res.json({ code: 200, message: '更新成功' })
}))

module.exports = router
