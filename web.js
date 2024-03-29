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
 * birdmaps = {
 *   CLIENT_ID1: {latlong: [10.01, 12.02], timestamp: SECONDS, id: CLIENT_ID},
 *   CLIENT_ID2: {...}
 * }
 * response_data = {
 *   locations: [ {id: CLIENT_ID, latlong: [10.01, 12.02]}, ... ]
 *   ]
 * }
 */


var birdmaps = {};
var mapcount = 0;

// Remove stale entries.
var EXPIRATION = 10000;
function sweep() {
  var time = (new Date()).getTime();
  for (var cid in birdmaps) {
    if (birdmaps[cid].timestamp + EXPIRATION < time) {
      // The entry is stale, so we remove it.
      console.log('Removing location for client ' + cid);
      delete birdmaps[cid];
      mapcount--;
    }
  }
}

function getLocations() {
  var locations = [];

  for (cid in birdmaps) {
    var entry = {id: cid, latlong: birdmaps[cid].latlong}
    locations.push(entry);
  }

  return {locations: locations};
}

function addLocation(loc) {
  sweep();
  var date = new Date();
  var cid = loc.id;
  var location = {latlong: loc.latlong, timestamp: date.getTime(), id: cid};
  //
  console.log('Recording location for client ' + loc.id + ': (' + loc.latlong[0] + ', ' + loc.latlong[1] + ')');
  //
  // Track the number of birdmaps.
  if (!(cid in birdmaps)) mapcount++;
  birdmaps[cid] = location;
  console.log('We have ' + mapcount + ' birds.');
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
