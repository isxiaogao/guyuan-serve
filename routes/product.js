const express = require('express')
const router = express.Router()
const pool = require('../db')

// 字段映射：数据库字段 -> 小程序字段
function mapProduct(row) {
  if (!row) return null
  return {
    ...row,
    category: row.category_id,
    originalPrice: row.original_price,
    images: typeof row.images === 'string' ? JSON.parse(row.images) : row.images
  }
}

function mapList(rows) {
  return rows.map(mapProduct)
}

router.get('/', async (req, res) => {
  try {
    const { category, tag, page = 1, pageSize = 20 } = req.query
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

    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total')
    const [{ total }] = await pool.query(countSql, params)

    sql += ' ORDER BY id LIMIT ? OFFSET ?'
    params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize))

    const [rows] = await pool.query(sql, params)
    res.json({ code: 200, data: { list: mapList(rows), total, page: Number(page), pageSize: Number(pageSize) } })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

router.get('/hot', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE tag = '热卖'")
    res.json({ code: 200, data: mapList(rows) })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

router.get('/new', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products WHERE tag IN ('新品', '上新')")
    res.json({ code: 200, data: mapList(rows) })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.json({ code: 404, message: '商品不存在' })
    }
    res.json({ code: 200, data: mapProduct(rows[0]) })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, price, originalPrice, image, tag, category, description, detail, images, size, color, fabric } = req.body
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : null
    const [result] = await pool.query(
      'INSERT INTO products (name, price, original_price, image, tag, category_id, description, detail, images, size, color, fabric) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, price, originalPrice || null, image, tag || '', category, description, detail, imagesJson, size || null, color || null, fabric || null]
    )
    res.json({ code: 200, data: { id: result.insertId } })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

module.exports = router
