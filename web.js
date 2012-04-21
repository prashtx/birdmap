var express = require('express');
var fs = require('fs');


var app = express.createServer(express.logger());
app.configure(function() {
  app.use(express.methodOverride());
  app.use(express.bodyParser());
});


// Static files
function sendFile(response, filename, type) {
  fs.readFile('site/' + filename, function(err, data) {
    if (err) {
      console.log(err.message);
      response.send(500);
      return;
    }
    response.header('Content-Type', type);
    response.send(data);
  });
}

app.get('/', function(req, response) {
  sendFile(response, 'index.html', 'text/html');
});

// Site
//app.get(/\/static\/(.*)/, function(req, response) {
app.get(/^\/(?!api\/)(.*)/, function(req, response) {
  var path = req.params[0];
  var index = path.lastIndexOf('.');
  var format = '';
  if (index > -1) {
    format = path.substring(index);
  }

  var type;
  switch (format) {
  case '.html':
    type = 'text/html';
    break;
  case '.css':
    type = 'text/css';
    break;
  case '.js':
    type = 'application/javascript';
    break;
  case '.gif':
    type = 'image/gif';
    break;
  case '.png':
    type = 'image/png';
    break;
  case '.jpg':
  case '.jpeg':
    type = 'image/jpeg';
    break;
  default:
    type = 'text/html';
  }

  sendFile(response, path, type);
});


//
// API
//
/*
 * API
 * input_data = {
 *   location:
 *    {latlong: [10.01, 12.02], id: CLIENT_ID}
 * }
 * stored_locations = [
 *    {latlong: [10.01, 12.02], timestamp: SECONDS}
 *   ]
 * clients = {CLIENT_ID1: index1, CLIENT_ID2: index2}
 * response_data = {
 *   locations: [ [10.01, 12.02],[10.01, 12.02],[10.01, 12.02] ]
 *   ]
 * }
 */

var stored_locations = [];
//var stored_locations = [{latlong: [10.01, 12.02], timestamp: 100}, {latlong: [10.01, 12.02], timestamp: 100}, {latlong: [10.01, 12.02], timestamp: 100}];

var clients = {};

// TODO: when the stored_locations array is much larger than the clients dictionary, compact the stored_locations array.
var EXPIRATION = 10000;
function sweep() {
  var time = (new Date()).getTime();
  for (var client in clients) {
    var index = clients[client];
    if (stored_locations[index].timestamp + EXPIRATION < time) {
      // The entry is stale, so we remove it.
      console.log('Removing location for client ' + client);
      delete clients[client];
      stored_locations[index] = undefined;
    }
  }
}

function getLocations() {
  var locations = [];
  len = stored_locations.length;
  //locations.length = len;
  for (var i = 0; i < len; i++) {
    if (stored_locations[i] != undefined) {
      locations.push(stored_locations[i].latlong);
    }
  }
  return {locations: locations};
}

function addLocation(loc) {
  sweep();
  var date = new Date();
  var index = clients[loc.id];
  var location = {latlong: loc.latlong, timestamp: date.getTime()};
  //
  console.log('Adding location for client ' + loc.id + ': (' + loc.latlong[0] + ', ' + loc.latlong[1] + ')');
  //
  if (index != null) {
    stored_locations[index] = location;
  } else {
    stored_locations.push(location);
    clients[loc.id] = stored_locations.length - 1;
  }
  console.log('We have ' + stored_locations.length + ' birds.');
}

app.get('/api/locations', function(req, response) {
  console.log('Request for locations');
  response.send(getLocations());
});

app.post('/api/locations', function(req, response) {
  console.log('Adding a new location');
  data = req.body;
  addLocation(data.location);
  response.send(getLocations());
  console.log();
});


var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Listening on ' + port);
});
