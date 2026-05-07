const express = require('express')
const router = express.Router()
const pool = require('../db')

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, image, title FROM banners')
    res.json({ code: 200, data: rows })
  } catch (err) {
    res.json({ code: 500, message: err.message })
  }
})

module.exports = router
