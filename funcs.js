var fs = require('fs')
var path = require('path')

function encode (data) {
  return (new Buffer(data)).toString('base64')
}

function decode (data) {
  return (new Buffer('' + data, 'base64')).toString()
}

module.exports.encodeName = function (name) {
  return encode('@' + name)
}

module.exports.loadDb = function (dbFile, cb) {
  fs.readFile(dbFile, function (err, res) {
    if (err) { return cb(err) }

    var messages
    try {
      messages = JSON.parse(res)
    } catch (e) {
      return cb(err)
    }

    return cb(null, { file: dbFile, messages: messages })
  })
}

module.exports.findInbox = function (db, encodedName) {
  var messages = db.messages
  return {
    dir: path.dirname(db.file),
    messages: Object.keys(messages).reduce(function (acc, key) {
      if (messages[key].to === encodedName) {
        return acc.concat({
          hash: key,
          lastHash: messages[key].last,
          from: messages[key].from
        })
      } else { return acc }
    }, [])
  }
}

module.exports.findNextMessage = function (inbox, lastHash) {
  // find the message which comes after lastHash
  var found
  for (var i = 0; i < inbox.messages.length; i += 1) {
    if (inbox.messages[i].lastHash === lastHash) {
      found = i
      break
    }
  }

  // read and decode the message
  return 'from: ' + decode(inbox.messages[found].from) + '\n---\n' +
    decode(fs.readFileSync(path.join(inbox.dir, inbox.messages[found].hash), 'utf8'))
}
