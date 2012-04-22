var birdBounds;
var marker_tracker = {};
var birdGroup;

function setupWax() {
  var map = new L.Map('map');
  var url = 'http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets.jsonp';

  wax.tilejson(url, function(tilejson) {
    map.addLayer(new wax.leaf.connector(tilejson));
    wax.leaf
    .interaction()
    .map(map)
    .on('on', function(o) {
      // TODO: Need to handle interactions?
    });

    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);

    map.locateAndSetView(2);
    //map.locate();
    window.setInterval(function() {
      //map.locateAndSetView(10);
      map.locate();
    }, 5000);

    birdGroup = new L.FeatureGroup();
    map.addLayer(birdGroup);

    function onLocationFound(e) {
      var locations = postLocation(e.latlng, map);
    }


    function onLocationError(e) {
      //alert(e.message);
    }
  });
}

function postLocation(latlng, map) {
  var url = 'http://' + window.location.host + '/api/locations';
  var postData = {location: {latlong: [latlng.lat, latlng.lng], id: getID()}};
  $.post(url, postData, function(data) {
    markLocations(map, data.locations);
  }, 'json');
}

function markLocations(map, locations) {
  console.log('Got ' + locations.length + ' locations.');
  var new_marker_tracker = {};
  for (var i = 0; i < locations.length; i++) {
    var cid = locations[i].id
    var loc = locations[i].latlong;
    var latlng = {lat: loc[0], lng: loc[1]};

    if (cid in marker_tracker) {
      // We're already tracking this birdmap. Just update it.
      console.log('Updating marker for client ' + cid);
      marker_tracker[cid].setLatLng(latlng);
      new_marker_tracker[cid] = marker;
    } else {
      // This is a new birdmap.
      if (cid == getID()) {
        // Our birdmap
        marker = new L.Marker(latlng, {icon: myBirdIcon});
      } else {
        // Someone else's birdmap
        marker = new L.Marker(latlng, {icon: birdIcon});
      }
      // Add it to the tracker
      new_marker_tracker[cid] = marker;
      marker_tracker[cid] = marker;
      // Add it to the map
      birdGroup.addLayer(marker);
      console.log('Adding new marker for client ' + cid);
    }
  }
  // Clean up the stale markers.
  for (cid in marker_tracker) {
    if (!(cid in new_marker_tracker)) {
      birdGroup.removeLayer(marker_tracker[cid]);
      console.log('Removing stale marker for client ' + cid);
      delete marker_tracker[cid];
    }
  }
  //marker_tracker = new_marker_tracker;
}

var BirdIcon = L.Icon.extend({
  iconUrl: 'img/bird.png',
  shadowUrl: 'img/bird.png',
  iconSize: new L.Point(67, 67),
  shadowSize: new L.Point(67, 67),
  iconAnchor: new L.Point(67, 67),
  popupAnchor: new L.Point(0,0)
});

var birdIcon = new BirdIcon();
var myBirdIcon = new BirdIcon('img/mybird.png');

var id = undefined;
function getID() {
  if (id == undefined) {
    id = guid();
  }
  return id;
}
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

$(document).ready(function() {
  $('#birdItBtn').click(function(e) {
    $('#splash').addClass('hidden');
    $('#legend').removeClass('hidden');
    setupWax();
  });
});
