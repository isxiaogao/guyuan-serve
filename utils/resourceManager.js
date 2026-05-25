const pool = require('../db')
const path = require('path')
const fs = require('fs')

const UPLOAD_DIR = path.join(__dirname, '../uploads')

/**
 * 上传成功后登记文件
 */
async function registerFile(filename, fileType, mimeType, fileSize) {
  await pool.query(
    'INSERT INTO resources (filename, file_type, mime_type, file_size) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE ref_count = ref_count',
    [filename, fileType, mimeType, fileSize]
  )
}

/**
 * 增加单个文件的引用计数
 */
async function incrementRef(filename) {
  if (!filename) return
  await pool.query(
    'UPDATE resources SET ref_count = ref_count + 1 WHERE filename = ?',
    [filename]
  )
}

/**
 * 减少单个文件的引用计数（不低于 0）
 */
async function decrementRef(filename) {
  if (!filename) return
  await pool.query(
    'UPDATE resources SET ref_count = GREATEST(ref_count - 1, 0) WHERE filename = ?',
    [filename]
  )
}

/**
 * 批量增加引用（如 product.images 数组）
 */
async function incrementRefs(filenames) {
  if (!Array.isArray(filenames)) return
  for (const f of filenames) {
    await incrementRef(f)
  }
}

/**
 * 批量减少引用
 */
async function decrementRefs(filenames) {
  if (!Array.isArray(filenames)) return
  for (const f of filenames) {
    await decrementRef(f)
  }
}

/**
 * 提取 /uploads/xxx.jpg 中的文件名
 */
function extractFilename(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/\/uploads\/(.+)$/)
  return match ? match[1] : null
}

/**
 * 清理孤儿文件：删除 ref_count <= 0 的记录及对应文件
 * 返回 { deletedFiles: string[], count: number }
 */
async function cleanupOrphans() {
  const [orphans] = await pool.query(
    'SELECT filename FROM resources WHERE ref_count <= 0'
  )

  const deletedFiles = []
  for (const { filename } of orphans) {
    const filePath = path.join(UPLOAD_DIR, filename)
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (err) {
      console.error(`[清理文件失败] ${filename}:`, err.message)
    }
    await pool.query('DELETE FROM resources WHERE filename = ?', [filename])
    deletedFiles.push(filename)
  }

  return { deletedFiles, count: deletedFiles.length }
}

module.exports = {
  registerFile,
  incrementRef,
  decrementRef,
  incrementRefs,
  decrementRefs,
  extractFilename,
  cleanupOrphans
}
