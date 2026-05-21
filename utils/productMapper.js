function parseImages(row) {
  if (row.images === undefined || row.images === null) return row
  if (typeof row.images === 'string') {
    try {
      row.images = JSON.parse(row.images)
    } catch {
      row.images = []
    }
  }
  return row
}

function mapProduct(row) {
  if (!row) return null
  parseImages(row)
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

module.exports = { mapProduct, mapList }
