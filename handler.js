const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const errors = require('./errors')

exports.listEntries = async (event) => {
  if (!event.queryStringParameters || !event.queryStringParameters.sort) {
    return {
      statusCode: 400,
      body: JSON.stringify(errors.NoSortError)
    }
  }
  
  const sort = event.queryStringParameters.sort
  let entries = []

  try {
    const leaderboard = await s3.getObject({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.DB_NAME
    }).promise()
  
    entries = JSON.parse(leaderboard.Body.toString())
  
    if (sort === 'top') {
      entries = entries.sort((a, b) => b.score - a.score)
    } else if(sort === 'new') {
      entries = entries.sort((a, b) => a.dateTime - b.dateTime)
    }
  } catch (err) {
    // db doesn't exist yet
    console.log(err.message)
  }

  return {
    statusCode: 200,
    body: JSON.stringify(entries)
  }
}

exports.addEntry = async (event) => {
  const newEntry = JSON.parse(event.body)
  const res = await this.listEntries({
    queryStringParameters: { sort: 'top' }
  })
  let entries = JSON.parse(res.body)

  if (!newEntry.name || !newEntry.score) {
    return {
      statusCode: 400,
      body: JSON.stringify(errors.MissingDataError)
    }
  }

  if (entries.find((e) => e.name.toLowerCase() === newEntry.name.toLowerCase())) {
    return {
      statusCode: 400,
      body: JSON.stringify(errors.NameTakenError)
    }
  }

  entries.push({
    name: newEntry.name,
    score: newEntry.score,
    date: new Date()
  })

  await s3.putObject({
    Bucket: process.env.BUCKET_NAME,
    Key: process.env.DB_NAME,
    Body: Buffer.from(JSON.stringify(entries))
  }).promise()

  return {
    statusCode: 200,
    body: JSON.stringify(entries)
  }
}