'use strict'

let http = require('http')
let https = require('https')
require('dotenv').config()

const perfect = {
  zipCode: process.env.zipCode,
  temperature: process.env.temperature,
  maxPrecipitation: process.env.maxPrecipitation
}

let getCurrentWeather = (zipCode, callback) => {
  http.get(`http://api.wunderground.com/api/${process.env.wundergroundApiKey}/conditions/q/${zipCode}.json`, (res) => {
    res.setEncoding('utf8')
    let rawData = ''
    res.on('data', (chunk) => { rawData += chunk })
    res.on('end', () => {
      try {
        callback(JSON.parse(rawData))
      } catch (e) {
        console.log(e.message)
      }
    })
  })
}

let postToWebhook = (data) => {
  var req = https.request({
    host: process.env.successWebhookHost,
    path: process.env.successWebhookPath,
    method: 'POST'
  })
  req.write(JSON.stringify(data))
  req.end()
}

module.exports.checkConditions = (event, context, callback) => {
  getCurrentWeather(perfect.zipCode, (currentWeather) => {
    let conditionsPerfect = false
    let temperature = parseFloat(currentWeather.current_observation.feelslike_f)
    let precipitationInTheNextHour = parseFloat(currentWeather.current_observation.precip_1hr_in)
    if (temperature >= perfect.temperature) {
      if (precipitationInTheNextHour < perfect.maxPrecipitation) {
        conditionsPerfect = true
        postToWebhook({Value1: temperature})
      }
    }

    const response = {
      statusCode: 200,
      body: conditionsPerfect
    }
    callback(null, response)
  })
}
