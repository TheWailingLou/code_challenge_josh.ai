var http = require('http');

var bridgeport = 'http://10.0.0.144:8080'

getLightStates(true)

setInterval(getLightStates, 500);

var storedData;

function checkIfLightSwitched(id, storedData, newData)
{
  if (storedData[id].on != newData[id].on)
  {
    var dataUpdate = {
      id: id,
      on: newData[id].on
    }
    console.log(dataUpdate)
  }
}

function checkBrightness(id, storedData, newData)
{
  if (storedData[id].brightness != newData[id].brightness)
  {
    var dataUpdate = {
      id: id,
      brightness: newData[id].brightness
    }
    console.log(dataUpdate)
  }
}

function compareData(storedData, newData)
{
  var ids = Object.keys(storedData);
  ids.forEach(function(id) {
    checkIfLightSwitched(id, storedData, newData)
    checkBrightness(id, storedData, newData)
  })
}

function getLightStates(initialCheck=false) {
  var req = http.get(`${bridgeport}/api/newdeveloper/lights`, function(res) {
    var bodyChunks = [];
    res.on('data', function(chunk) {
      bodyChunks.push(chunk);
    }).on('end', function() {
      var body = JSON.parse(Buffer.concat(bodyChunks));
      var ids = Object.keys(body)
      var promiseData = ids.map(function(id) {
        return getSingularLightState(id)
      })
      var formattedData = Promise.all(promiseData)
      formattedData.then(function(data) {
        if (initialCheck)
        {
          console.log(data)
        } else {
          compareData(storedData, data)
        }
        storedData = data;
      })
    })
  })

  req.on('error', function(e) {
    console.log('ERROR: ' + e.message);
  });
}

function getSingularLightState(id) {
  var dataPromise = new Promise(function(resolve, reject) {
    var request = http.get(`${bridgeport}/api/newdeveloper/lights/${id}`, function(res) {
      var bodyChunks = [];
      res.on('data', function(chunk) {
        bodyChunks.push(chunk);
      }).on('end', function() {
        var body = JSON.parse(Buffer.concat(bodyChunks));
        var unscaledBrightness = parseInt(body.state.bri)
        var scaledBrightness = Math.floor((unscaledBrightness/254)*100)
        var formattedData = {
          name: body.name,
          id: id,
          on: (body.state.on).toString(),
          brightness: scaledBrightness
        }
        resolve(formattedData)
      })
    })
    request.on('error', function(e) {
      console.log('ERROR: ' + e.message);
      reject()
    });
  })
  return dataPromise
}
