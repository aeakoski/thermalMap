mapboxgl.accessToken = 'pk.eyJ1IjoiYWVha29za2kiLCJhIjoiY2o0YWZranltMTJtZzMzcGc3NjUyOWU0ZyJ9.cer7yU4vRlk1FeHEQPH0Pg';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/aeakoski/cj4bd0ycx4cgx2sptdzigrgtl',
    center: [17.211814, 59.101584], //Vängsö
    zoom: 10,
    maxZoom:12,
    minZoom:8
});

var prev_upperLat = 0;
var prev_lowerLat = 0;
var prev_lowerLon = 0;
var prev_upperLon = 0;

var max_fetched_upperLat = 0;
var max_fetched_lowerLat = 0;
var max_fetched_lowerLon = 0;
var max_fetched_upperLon = 0;

var moves_since_last_fetch = 0;

var generateRequest = function(){
  lonlat = map.getBounds();
  upperLat = lonlat._ne.lat;
  lowerLat = lonlat._sw.lat;
  lowerLon = lonlat._sw.lng;
  upperLon = lonlat._ne.lng;

  var request = {
          "geometry.coordinates":{
            "top_left":{
              "lat":upperLat,
              "lon":lowerLon
            },
            "bottom_right":{
              "lat":lowerLat,
              "lon":upperLon
            }
          }
          ,
          "pilots":[]
          ,
          "clubs":[]
  };

  pilotFilter.forEach(function(pilot){
    request.pilots.push(pilot);
  })
  clubFilter.forEach(function(club){
    request.clubs.push(club);
  })
  return JSON.stringify(request);
}


//--------------------------------------------//
//            Requests to webserver
//--------------------------------------------//

var getLocalThermalcount = function(){
  data = generateRequest();
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/thermals/countinbox",
    data: data,
    success: countinboxHandeler,
    contentType:"application/json"
  });
}

var getLocalThermals = function(){
  getLocalThermalcount();
  data = generateRequest();
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/thermals/fetch",
    data: data,
    success: getLocalThermalsHandeler,
    contentType:"application/json"
  });
}

var getGlobalThermalCount = function(){
  $.ajax({
    type: "GET",
    url: "http://localhost:8080/thermals/count",
    success: globalCountHandeler
  });
}


//--------------------------------------------//
//       Webserver response handelers
//--------------------------------------------//

var getLocalThermalsHandeler = function(data){
  let geolist = data.list;
  var first = true;
  addPointsToMap({"features": geolist});
}

var globalCountHandeler = function(data){
  document.getElementById('tot-nrt').innerHTML = data.count;
}

var countinboxHandeler = function(data){
  let numberOfThermals = data.count;
  if (numberOfThermals == 10000) {
    document.getElementById('nrt').innerHTML = "10000 (max)";
  }else{
    document.getElementById('nrt').innerHTML = numberOfThermals;
  }
}


//--------------------------------------------//
//               Map creation
//--------------------------------------------//

var velStop = [
    [0, 0],
    [1, 20],
    [2, 35],
    [3, 40]
]

map.on('moveend', function(){
  let lonlat = map.getBounds()
  let epsilon = 0.000001;
  //Check if map has actually moved
  if(Math.abs(prev_upperLat - lonlat._ne.lat)<epsilon && Math.abs(prev_lowerLat - lonlat._sw.lat)<epsilon && Math.abs(prev_lowerLon - lonlat._sw.lng)<epsilon && Math.abs(prev_upperLon - lonlat._ne.lng)<epsilon){ return; }
    moves_since_last_fetch++;
    if ((moves_since_last_fetch < 6) && (max_fetched_upperLat >= lonlat._ne.lat) && (max_fetched_lowerLat <= lonlat._sw.lat) && (max_fetched_lowerLon <= lonlat._sw.lng) && (max_fetched_upperLon >= lonlat._ne.lng)) {
      //We have zoomed in, no new fetch is neccesary, but recalc of thermals is
      getLocalThermalcount();
    }else {
      moves_since_last_fetch = 0;
      getLocalThermals()
    }
    prev_upperLat = lonlat._ne.lat;
    prev_lowerLat = lonlat._sw.lat;
    prev_lowerLon = lonlat._sw.lng;
    prev_upperLon = lonlat._ne.lng;
});

var addPointsToMap = function(jsonThermals){
      moves_since_last_fetch = 0;
      if (map.getSource("thermals")) {
        map.removeLayer("cluster-1");
        map.removeLayer("cluster-2");
        map.removeSource("thermals");
      }

      map.addSource("thermals", {
          type: "geojson",
          data: jsonThermals,
          cluster: true,
          clusterMaxZoom: 13, // Max zoom to cluster points on
          clusterRadius: 5 // Use small cluster radius for the heatmap look
      });

      map.addLayer({
          "id": "cluster-1",
          "type": "circle",
          "source": "thermals",

          "paint": {
              "circle-color": 'rgba(229,36,62, 0.1)',
              "circle-radius": {
                property: "velocity",
                type: "exponential",
                stops: velStop
              },
              "circle-blur": 1.5 // blur the circles to get a heatmap look
          },
          "filter": ["<","velocity", 1.2]
          //"filter": ["all",["==", "cluster", true],]
      }, 'waterway-label');

      map.addLayer({
        // Blåsor med medelhastighet större än 1
          "id": "cluster-2",
          "type": "circle",
          "source": "thermals",

          "paint": {
              "circle-color": 'rgba(229,36,62, 0.21)',
              "circle-radius": {
                property: "velocity",
                type: "exponential",
                stops: velStop
              },
              "circle-blur": 1 // blur the circles to get a heatmap look
          },
          "filter": [">","velocity", 1.2]
      }, 'waterway-label');

      map.addLayer({
        id: "c-thermals",
        type: "circle",
        source: "thermals",
        filter: ["has", "point_count"],
        paint: {
            "circle-blur": 7,
            "circle-color": {
                property: "point_count",
                type: "exponential",
                stops: [
                  [0, "rgba(229,36,62, 0.0)"],
                  [5, "rgba(229,36,62, 0.3)"],
                  [10, "rgba(229,36,62,0.4)"],
                  [20, "rgba(229,36,62,0.5)"],
                  [30, "rgba(229,27,49,0.6)"],
                  [40, "rgba(229,27,49,0.6)"],
                  [50, "rgba(229,27,49,0.6)"]
                ]
            },
            "circle-radius": {
                property: "point_count",
                type: "exponential",
                stops: [
                  [0, 0],
                 [5, 70],
                 [10, 80],
                 [20, 90],
                 [30, 100],
                 [40, 100],
                 [50, 100]
                ]
            }
        }
    });

    //Update map points max_fetch_boundaries
    let lonlat = map.getBounds();
    max_fetched_upperLat = lonlat._ne.lat;
    max_fetched_lowerLat = lonlat._sw.lat;
    max_fetched_lowerLon = lonlat._sw.lng;
    max_fetched_upperLon = lonlat._ne.lng;

}

map.on('load', getLocalThermals)
map.dragRotate.disable(); //Disables rotation
getGlobalThermalCount();
