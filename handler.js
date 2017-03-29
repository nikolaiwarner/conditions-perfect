'use strict'

let http = require('http')
let https = require('https')
require('dotenv').config()

const perfect = {
  zipCode: process.env.zipCode,
  minTemperature: process.env.minTemperature,
  maxTemperature: process.env.maxTemperature,
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

let postToWebhook = () => {
  var req = https.request({
    host: process.env.successWebhookHost,
    path: process.env.successWebhookPath,
    method: 'POST'
  })
  req.write(JSON.stringify(perfect))
  req.end()
}

module.exports.checkConditions = (event, context, callback) => {
  getCurrentWeather(perfect.zipCode, (currentWeather) => {
    let conditionsPerfect = true
    let excuses = []

    let temperature = parseFloat(currentWeather.current_observation.feelslike_f)
    if ((temperature < perfect.minTemperature) || (temperature > perfect.maxTemperature)) {
      conditionsPerfect = false
      excuses.push({temperature})
    }

    let precipitationInTheNextHour = parseFloat(currentWeather.current_observation.precip_1hr_in)
    if (precipitationInTheNextHour > perfect.maxPrecipitation) {
      conditionsPerfect = false
      excuses.push({precipitationInTheNextHour})
    }

    if (conditionsPerfect) {
      postToWebhook()
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        conditionsPerfect,
        excuses
      })
    }
    callback(null, response)
  })
}
