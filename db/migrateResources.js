const pool = require('../db')
const path = require('path')

/**
 * 从 /uploads/xxx 格式路径提取文件名
 */
function extractFilename(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/\/uploads\/(.+)$/)
  return match ? match[1] : null
}

/**
 * 首次部署时补录已有文件到 resources 表
 */
async function migrateExistingResources() {
  try {
    // 检查是否已经执行过迁移
    const [countRows] = await pool.query('SELECT COUNT(*) as count FROM resources')
    if (countRows[0].count > 0) {
      console.log('[资源迁移] resources 表已有数据，跳过迁移')
      return
    }

    console.log('[资源迁移] 开始补录已有文件...')
    let migrated = 0

    // 1. 补录 banner 的图片
    const [banners] = await pool.query('SELECT id, image FROM banners')
    for (const banner of banners) {
      const fn = extractFilename(banner.image)
      if (fn) {
        const filePath = path.join(__dirname, '..', 'uploads', fn)
        let fileSize = null
        try {
          const fs = require('fs')
          if (fs.existsSync(filePath)) {
            fileSize = fs.statSync(filePath).size
          }
        } catch {}
        await pool.query(
          'INSERT IGNORE INTO resources (filename, file_type, mime_type, file_size, ref_count) VALUES (?, ?, ?, ?, 1)',
          [fn, 'image', 'image/jpeg', fileSize]
        )
        migrated++
      }
    }

    // 2. 补录 product 的图片和 images 数组
    const [products] = await pool.query('SELECT id, image, images FROM products')
    for (const product of products) {
      // 主图
      const fn = extractFilename(product.image)
      if (fn) {
        const filePath = path.join(__dirname, '..', 'uploads', fn)
        let fileSize = null
        try {
          const fs = require('fs')
          if (fs.existsSync(filePath)) {
            fileSize = fs.statSync(filePath).size
          }
        } catch {}
        await pool.query(
          'INSERT IGNORE INTO resources (filename, file_type, mime_type, file_size, ref_count) VALUES (?, ?, ?, ?, 1)',
          [fn, 'image', 'image/jpeg', fileSize]
        )
        migrated++
      }

      // 多图
      let imgs = product.images
      if (typeof imgs === 'string') {
        try { imgs = JSON.parse(imgs) } catch { imgs = [] }
      }
      if (Array.isArray(imgs)) {
        for (const img of imgs) {
          const imgFn = extractFilename(img)
          if (imgFn) {
            const filePath = path.join(__dirname, '..', 'uploads', imgFn)
            let fileSize = null
            try {
              const fs = require('fs')
              if (fs.existsSync(filePath)) {
                fileSize = fs.statSync(filePath).size
              }
            } catch {}
            await pool.query(
              'INSERT IGNORE INTO resources (filename, file_type, mime_type, file_size, ref_count) VALUES (?, ?, ?, ?, 1)',
              [imgFn, 'image', 'image/jpeg', fileSize]
            )
            migrated++
          }
        }
      }
    }

    console.log(`[资源迁移] 完成，共补录 ${migrated} 个文件`)
  } catch (err) {
    console.error('[资源迁移失败]', err.message)
  }
}

module.exports = { migrateExistingResources }
