'use strict'

let http = require('http')

const apiKey = ''
const perfect = {
  temperature: 64
}

let getCurrentWeather = (zipCode, callback) => {
  http.get(`http://api.wunderground.com/api/${apiKey}/conditions/q/${zipCode}.json`, (res) => {
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

module.exports.checkConditions = (event, context, callback) => {
  getCurrentWeather(40505, (currentWeather) => {
    let conditionsPerfect = false
    let temperature = currentWeather.current_observation.temp_f
    if (temperature > perfect.temperature) {
      conditionsPerfect = true
      // Send notification....
    }

    const response = {
      statusCode: 200,
      body: conditionsPerfect
    }
    callback(null, response)
  })
}
