const express = require('express')
const router = express.Router()
const pool = require('../db')

// 字段映射：数据库字段 -> 小程序字段
function mapProduct(row) {
  if (!row) return null
  try {
    row.images = typeof row.images === 'string' ? JSON.parse(row.images) : row.images
  } catch (e) {
    row.images = []
  }
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price,
    image: row.image,
    tag: row.tag,
    category: row.category_id,
    description: row.description,
    detail: row.detail,
    images: row.images,
    size: row.size,
    color: row.color,
    fabric: row.fabric
  }
}

function mapList(rows) {
  return rows.map(mapProduct)
}

router.get('/', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[products GET]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

router.get('/hot', async (req, res) => {
  try {
    const [tags] = await pool.query('SELECT name FROM tags WHERE code = ? AND enabled = 1', ['hot'])
    if (tags.length === 0) {
      return res.json({ code: 200, data: [] })
    }
    const names = tags.map(t => t.name)
    const placeholders = names.map(() => '?').join(',')
    const [rows] = await pool.query(`SELECT * FROM products WHERE tag IN (${placeholders})`, names)
    res.json({ code: 200, data: mapList(rows) })
  } catch (err) {
    console.error('[products/hot GET]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

router.get('/new', async (req, res) => {
  try {
    const [tags] = await pool.query('SELECT name FROM tags WHERE code = ? AND enabled = 1', ['new'])
    if (tags.length === 0) {
      return res.json({ code: 200, data: [] })
    }
    const names = tags.map(t => t.name)
    const placeholders = names.map(() => '?').join(',')
    const [rows] = await pool.query(`SELECT * FROM products WHERE tag IN (${placeholders})`, names)
    res.json({ code: 200, data: mapList(rows) })
  } catch (err) {
    console.error('[products/new GET]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [Number(req.params.id)])
    if (rows.length === 0) {
      return res.json({ code: 404, message: '商品不存在' })
    }
    res.json({ code: 200, data: mapProduct(rows[0]) })
  } catch (err) {
    console.error('[products/:id GET]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

router.post('/', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[products POST]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

router.put('/:id', async (req, res) => {
  try {
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
  } catch (err) {
    console.error('[products PUT]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

module.exports = router
