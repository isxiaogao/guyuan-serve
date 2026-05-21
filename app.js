const express = require('express')
const cors = require('cors')
const path = require('path')
const rateLimit = require('express-rate-limit')
const { errorHandler } = require('./middleware/errorHandler')
require('dotenv').config()

const productRouter = require('./routes/product')
const categoryRouter = require('./routes/category')
const bannerRouter = require('./routes/banner')
const uploadRouter = require('./routes/upload')
const tagRouter = require('./routes/tag')
const authRouter = require('./routes/auth')
const favoriteRouter = require('./routes/favorite')

const app = express()
const PORT = process.env.PORT || 8080

// 限制允许的来源（小程序域名 + 开发环境）
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost', 'http://127.0.0.1']

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    const allowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o))
    callback(null, allowed)
  }
}))

// 安全响应头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})

app.use(express.json({ limit: '2mb' }))

// 全局速率限制
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { code: 429, message: '请求过于频繁，请稍后再试' }
}))

// 上传接口单独限制
app.use('/api/upload', rateLimit({
  windowMs: 60 * 1000,
  max: 20
}))

// 静态文件：禁止列出目录
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  dotfiles: 'ignore',
  index: false
}))

app.use('/api/categories', categoryRouter)
app.use('/api/products', productRouter)
app.use('/api/banners', bannerRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/tags', tagRouter)
app.use('/api/auth', authRouter)
app.use('/api/favorites', favoriteRouter)

app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: '服务运行中', timestamp: Date.now() })
})

// 全局错误处理
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`故媛后端服务已启动: http://localhost:${PORT}`)
})
