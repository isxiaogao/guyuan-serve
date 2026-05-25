const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const openidAuth = require('../middleware/openidAuth')
const { registerFile } = require('../utils/resourceManager')

const router = express.Router()
const uploadDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_一-龥]/g, '').slice(0, 30)
}

function buildFilename(type, ext) {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const random = Math.round(Math.random() * 1e6)
  return `${date}_${time}_${type}_${random}${ext}`
}

const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
const ALLOWED_VIDEO_EXT = ['.mp4', '.webm', '.mov']
const ALL_ALLOWED_EXT = [...ALLOWED_IMAGE_EXT, ...ALLOWED_VIDEO_EXT]

const IMAGE_MIME_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
}
const VIDEO_MIME_MAP = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime'
}

function getFileType(ext) {
  return ALLOWED_IMAGE_EXT.includes(ext) ? 'image' : 'video'
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!ALL_ALLOWED_EXT.includes(ext)) {
      return cb(new Error('仅支持 jpg/png/gif/webp 图片格式和 mp4/webm/mov 视频格式'))
    }
    const type = sanitizeName(req.query.type || 'upload')
    cb(null, buildFilename(type, ext))
  }
})

function getUploadLimit(req, res) {
  const fileType = req.query.type === 'video' ? 'video' : 'image'
  return fileType === 'video' ? 200 * 1024 * 1024 : 5 * 1024 * 1024
}

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }
})

router.post('/', openidAuth({ adminOnly: true }), (req, res) => {
  upload.single('file')(req, res, async function (err) {
    if (err) {
      return res.json({ code: 400, message: err.message })
    }
    if (!req.file) {
      return res.json({ code: 400, message: '请选择文件' })
    }

    const ext = path.extname(req.file.filename).toLowerCase()
    const fileType = getFileType(ext)
    const maxSize = fileType === 'video' ? 200 * 1024 * 1024 : 5 * 1024 * 1024
    if (req.file.size > maxSize) {
      fs.unlinkSync(req.file.path)
      const label = fileType === 'video' ? '视频' : '图片'
      return res.json({ code: 400, message: `${label}大小不能超过 ${maxSize / 1024 / 1024}MB` })
    }

    const mimeType = fileType === 'video' ? VIDEO_MIME_MAP[ext] : IMAGE_MIME_MAP[ext]

    // 登记到 resources 表
    try {
      await registerFile(req.file.filename, fileType, mimeType, req.file.size)
    } catch (dbErr) {
      console.error('[资源登记失败]', dbErr.message)
      // 不影响上传流程
    }

    const url = `/uploads/${req.file.filename}`
    res.json({ code: 200, data: { url, type: fileType } })
  })
})

module.exports = router
