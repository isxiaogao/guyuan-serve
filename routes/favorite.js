const express = require('express')
const router = express.Router()
const pool = require('../db')

// 字段映射
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
    fabric: row.fabric,
    favorite_id: row.favorite_id
  }
}

// 获取用户收藏列表
router.get('/', async (req, res) => {
  try {
    const openid = req.headers['x-user-openid']
    if (!openid) {
      return res.json({ code: 401, message: '请先登录' })
    }

    const [rows] = await pool.query(
      'SELECT p.*, f.id AS favorite_id FROM favorites f JOIN products p ON f.product_id = p.id WHERE f.user_openid = ? ORDER BY f.created_at DESC',
      [openid]
    )
    res.json({ code: 200, data: rows.map(mapProduct) })
  } catch (err) {
    console.error('[favorites GET]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

// 添加收藏
router.post('/', async (req, res) => {
  try {
    const openid = req.headers['x-user-openid']
    if (!openid) {
      return res.json({ code: 401, message: '请先登录' })
    }

    const { product_id } = req.body
    if (!product_id) {
      return res.json({ code: 400, message: '商品ID不能为空' })
    }

    // 验证商品是否存在
    const [products] = await pool.query('SELECT id FROM products WHERE id = ?', [Number(product_id)])
    if (products.length === 0) {
      return res.json({ code: 404, message: '商品不存在' })
    }

    // 插入（重复时忽略）
    const [result] = await pool.query(
      'INSERT IGNORE INTO favorites (user_openid, product_id) VALUES (?, ?)',
      [openid, Number(product_id)]
    )
    res.json({ code: 200, data: { affected: result.affectedRows } })
  } catch (err) {
    console.error('[favorites POST]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

// 取消收藏
router.delete('/', async (req, res) => {
  try {
    const openid = req.headers['x-user-openid']
    if (!openid) {
      return res.json({ code: 401, message: '请先登录' })
    }

    const { product_id } = req.body
    if (!product_id) {
      return res.json({ code: 400, message: '商品ID不能为空' })
    }

    const [result] = await pool.query(
      'DELETE FROM favorites WHERE user_openid = ? AND product_id = ?',
      [openid, Number(product_id)]
    )
    if (result.affectedRows === 0) {
      return res.json({ code: 404, message: '收藏不存在' })
    }
    res.json({ code: 200, message: '取消收藏成功' })
  } catch (err) {
    console.error('[favorites DELETE]', err.message)
    res.json({ code: 500, message: '服务器内部错误' })
  }
})

module.exports = router
