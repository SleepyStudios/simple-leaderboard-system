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

  let entries = await getEntries()
  entries = sortEntries(entries, event.queryStringParameters.sort)

  return {
    statusCode: 200,
    body: JSON.stringify(stripSecrets(entries))
  }
}

exports.addEntry = async (event) => {
  const newEntry = JSON.parse(event.body)
  let entries = await getEntries()

  if (!newEntry.name || !newEntry.score) {
    return {
      statusCode: 400,
      body: JSON.stringify(errors.MissingDataError)
    }
  }

  const existingUser = findExistingUser(entries, newEntry)
  if (existingUser && !isSecretCorrect(existingUser, newEntry.secret)) {
    return {
      statusCode: 403,
      body: JSON.stringify(errors.NameTakenError)
    }
  }

  entries.push({
    name: newEntry.name,
    score: newEntry.score,
    secret: newEntry.secret || '',
    date: new Date()
  })

  if (event.queryStringParameters && event.queryStringParameters.sort) {
    entries = sortEntries(entries, event.queryStringParameters.sort)
  }

  await s3.putObject({
    Bucket: process.env.BUCKET_NAME,
    Key: process.env.DB_NAME,
    Body: Buffer.from(JSON.stringify(entries))
  }).promise()

  return {
    statusCode: 200,
    body: JSON.stringify(stripSecrets(entries))
  }
}

const getEntries = async () => {
  try {
    const leaderboard = await s3.getObject({
      Bucket: process.env.BUCKET_NAME,
      Key: process.env.DB_NAME
    }).promise()
  
    return JSON.parse(leaderboard.Body.toString())
  } catch (err) {
    // db doesn't exist yet
    console.log(err.message)
    return []
  }
}

const sortEntries = (entries, sort) => {
  switch (sort) {
    case 'top': return entries.sort((a, b) => b.score - a.score)
    case 'new': return entries.sort((a, b) => new Date(b.date) - new Date(a.date))
  }
}

const stripSecrets = (entries) => {
  return entries.map((entry) => {
    let strippedEntry = { ...entry }
    delete strippedEntry.secret
    return strippedEntry
  })
}

const findExistingUser = (entries, newEntry) => {
  return entries.find((e) => {
    return e.name.toLowerCase() === newEntry.name.toLowerCase()
  })
}

const isSecretCorrect = (entry, secret) => {
  if (!secret || secret.trim().length === 0) return true;
  return entry.secret === secret
}