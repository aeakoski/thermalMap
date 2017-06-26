mapboxgl.accessToken = 'pk.eyJ1IjoiYWVha29za2kiLCJhIjoiY2o0YWZranltMTJtZzMzcGc3NjUyOWU0ZyJ9.cer7yU4vRlk1FeHEQPH0Pg';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/aeakoski/cj4bd0ycx4cgx2sptdzigrgtl',
    center: [17.211814, 59.101584],
    zoom: 11
});

map.dragRotate.disable(); //Disables rotation

var makeColor = function(num){
  return "rgba("+num+",0,0,1)"
}

ll = [
    [0, 0],
    [1, 15],
    [2, 40],
    [3, 61]
]

map.on('moveend', function(e){
  lonlat = map.getBounds();
  upperLat = lonlat._ne.lat;
  lowerLat = lonlat._sw.lat;

  lowerLon = lonlat._sw.lon;
  upperLat = lonlat._ne.lon;
  console.log(lonlat);
});

var addPointsToMap = function(jsonThermals){
  map.on('load', function(e) {

      console.log("Tooleloo");
      map.addSource("thermals", {
          type: "geojson",
          data: jsonThermals,
          cluster: true,
          clusterMaxZoom: 9, // Max zoom to cluster points on
          clusterRadius: 19 // Use small cluster radius for the heatmap look
      });


      map.addLayer({
          "id": "cluster-1",
          "type": "circle",
          "source": "thermals",

          "paint": {
              "circle-color": 'rgba(100,0,0,0.1)',
              "circle-radius": {
                property: "velocity",
                type: "exponential",
                stops: ll
              },
              "circle-blur": 1 // blur the circles to get a heatmap look
          },
          "filter": ["<","velocity", 1]
          //"filter": ["all",["==", "cluster", true],]
      }, 'waterway-label');


      map.addLayer({
          "id": "cluster-2",
          "type": "circle",
          "source": "thermals",

          "paint": {
              "circle-color": 'rgba(200,0,0,0.5)',
              "circle-radius": {
                property: "velocity",
                type: "exponential",
                stops: ll
              },
              "circle-blur": 1 // blur the circles to get a heatmap look
          },
          "filter": [">","velocity", 1]
          //"filter": ["all",["==", "cluster", true],]
      }, 'waterway-label');

  });
}

var data = JSON.stringify({
"size": 1000,
  "query": {
    "match_all": {}
  }
});

var xhr = new XMLHttpRequest();
xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    //console.log(this.responseText);
    JSON.parse(this.responseText).hits.hits.forEach(function(element){
      geojson.features.push(element._source);
    });
    addPointsToMap(geojson);
    map.on("ready", function(e){
      console.log("Ready");
    });
    ////gör ett geojson object av svaret
    //måla upp detta geojson på kartan med funktionen ovan
  }
});

xhr.open("POST", "http://192.168.1.6:9200/thermals/ground/_search");
xhr.send(data);


var geojson = { "features": [] }
