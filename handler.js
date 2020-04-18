const AWS = require('aws-sdk')
const s3 = new AWS.S3()

exports.listEntries = async (event) => {
  let entries = []

  try {
    const db = await s3.getObject({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.DB_NAME
    }).promise()
    entries = JSON.parse(db.Body.toString())
  } catch (err) {
    // just catching any errors here, could be a 404 or a 500 who knows
    return {
      statusCode: 200,
      body: JSON.stringify([])
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify(entries)
  }
}

exports.addEntry = async (event) => {
  const entry = JSON.parse(event.body)
  const entries = this.listEntries()
  entries.push({
    name: entry.name,
    score: entry.score,
    date: new Date()
  })
  entries = db.entries.sort((a, b) => b.score - a.score)

  await s3.putObject({
    Bucket: process.env.BUCKET_NAME,
    Key: process.env.DB_NAME,
    Body: Buffer.from(entries)
  }).promise()

  return {
    statusCode: 200,
    body: JSON.stringify(entries)
  }
}