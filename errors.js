module.exports.NameTakenError = {
  error: 'NameTakenError',
  message: 'That name already exists. If this is your name, make sure you entered the correct \'secret\'.'
}

module.exports.NoSortError = {
  error: 'NoSortError',
  message: 'No sort specified on the request. Sort can be \'new\' or \'top\'.'
}

module.exports.MissingDataError = {
  error: 'MissingDataError',
  message: 'The request is either missing a \'name\' or \'score\'.'
}