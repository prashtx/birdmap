var birdBounds;

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

//markers = [];
var birdGroup;

function markLocations(map, locations) {
  console.log('Got ' + locations.length + ' locations.');
  //for (var i = 0; i < markers.length; i ++) {
  //  map.removeLayer(markers[i]);
  //}
  if (birdGroup) {
    map.removeLayer(birdGroup);
  }
  var markers = [];
  var birdIcon = new BirdIcon();
  for (var i = 0; i < locations.length; i++) {
    var loc = locations[i];
    var latlng = {lat: loc[0], lng: loc[1]};
    marker = new L.Marker(latlng, {icon: birdIcon});
    markers.push(marker);
    birdGroup = new L.FeatureGroup(markers);
    map.addLayer(birdGroup);

    // If this is the first set of locations, set the bounds.
    //if (birdBounds == undefined) {
    //  birdBounds = birdGroup.getBounds();
    //  map.fitBounds(birdBounds);
    //}
  }
}

var BirdIcon = L.Icon.extend({
  iconUrl: 'img/bird.png',
  shadowUrl: 'img/bird.png',
  iconSize: new L.Point(67, 67),
  shadowSize: new L.Point(67, 67),
  iconAnchor: new L.Point(67, 67),
  popupAnchor: new L.Point(0,0)
});

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
    setupWax();
  });
});
