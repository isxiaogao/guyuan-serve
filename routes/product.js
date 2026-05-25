const express = require('express')
const router = express.Router()
const pool = require('../db')
const { asyncHandler } = require('../middleware/errorHandler')
const openidAuth = require('../middleware/openidAuth')
const { mapProduct, mapList } = require('../utils/productMapper')
const { extractFilename, incrementRefs, decrementRefs, deleteUnreferencedFiles } = require('../utils/resourceManager')

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

// 收集一条产品记录中所有引用了资源的文件名
function collectProductFiles(row) {
  const files = []
  if (row.image) {
    const fn = extractFilename(row.image)
    if (fn) files.push(fn)
  }
  if (row.images) {
    let imgs = row.images
    if (typeof imgs === 'string') {
      try { imgs = JSON.parse(imgs) } catch { imgs = [] }
    }
    if (Array.isArray(imgs)) {
      for (const img of imgs) {
        const fn = extractFilename(img)
        if (fn) files.push(fn)
      }
    }
  }
  if (row.video) {
    const fn = extractFilename(row.video)
    if (fn) files.push(fn)
  }
  return files
}

router.post('/', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const [{ count }] = await pool.query('SELECT COUNT(*) as count FROM products')
  if (count >= 500) {
    return res.json({ code: 400, message: '商品数量已达上限(500条)' })
  }

  const { name, price, originalPrice, image, tag, category, description, detail, images, video, size, color, fabric } = req.body

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

  // 增加引用计数
  const files = []
  if (image) {
    const fn = extractFilename(image)
    if (fn) files.push(fn)
  }
  if (Array.isArray(images)) {
    for (const img of images) {
      const fn = extractFilename(img)
      if (fn) files.push(fn)
    }
  }
  if (video) {
    const fn = extractFilename(video)
    if (fn) files.push(fn)
  }
  await incrementRefs(files)

  const [result] = await pool.query(
    'INSERT INTO products (name, price, original_price, image, tag, category_id, description, detail, images, video, size, color, fabric) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name.trim(), Number(price), originalPrice ? Number(originalPrice) : null, image, tag || '', category, description, detail, imagesJson, video || null, size || null, color || null, fabric || null]
  )
  res.json({ code: 200, data: { id: result.insertId } })
}))

router.put('/:id', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const { name, price, originalPrice, image, tag, category, description, detail, images, video, size, color, fabric } = req.body

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

  // 查出旧记录，递减旧文件引用
  const [oldRows] = await pool.query('SELECT image, images, video FROM products WHERE id = ?', [Number(req.params.id)])
  if (oldRows.length === 0) {
    return res.json({ code: 404, message: '商品不存在' })
  }
  const oldFiles = collectProductFiles(oldRows[0])
  await decrementRefs(oldFiles)

  const imagesJson = Array.isArray(images) ? JSON.stringify(images) : null

  // 增加新文件引用
  const newFiles = []
  if (image) {
    const fn = extractFilename(image)
    if (fn) newFiles.push(fn)
  }
  if (Array.isArray(images)) {
    for (const img of images) {
      const fn = extractFilename(img)
      if (fn) newFiles.push(fn)
    }
  }
  if (video) {
    const fn = extractFilename(video)
    if (fn) newFiles.push(fn)
  }
  await incrementRefs(newFiles)

  const [result] = await pool.query(
    'UPDATE products SET name=?, price=?, original_price=?, image=?, tag=?, category_id=?, description=?, detail=?, images=?, video=?, size=?, color=?, fabric=? WHERE id=?',
    [name.trim(), Number(price), originalPrice ? Number(originalPrice) : null, image, tag || '', category, description, detail, imagesJson, video || null, size || null, color || null, fabric || null, Number(req.params.id)]
  )
  res.json({ code: 200, message: '更新成功' })
}))

router.delete('/:id', openidAuth({ adminOnly: true }), asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT image, images, video FROM products WHERE id = ?', [Number(req.params.id)])
  if (rows.length === 0) {
    return res.json({ code: 404, message: '商品不存在' })
  }

  // 递减引用并删除无引用的文件
  const files = collectProductFiles(rows[0])
  await deleteUnreferencedFiles(files)

  await pool.query('DELETE FROM products WHERE id = ?', [Number(req.params.id)])
  res.json({ code: 200, message: '删除成功' })
}))

module.exports = router
