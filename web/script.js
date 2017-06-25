mapboxgl.accessToken = 'pk.eyJ1IjoiYWVha29za2kiLCJhIjoiY2o0YWZranltMTJtZzMzcGc3NjUyOWU0ZyJ9.cer7yU4vRlk1FeHEQPH0Pg';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/aeakoski/cj4bd0ycx4cgx2sptdzigrgtl',
    center: [17.211814, 59.101584],
    zoom: 11
});

var makeColor = function(num){
  return "rgba("+num+",0,0,1)"
}

ll = [
    [0, 0],
    [1, 15],
    [2, 40],
    [3, 61]
]

var addPointsToMap = function(jsonThermals){
  map.on('load', function(e) {
      // Add a new source from our GeoJSON data and set the
      // 'cluster' option to true.
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

    JSON.parse(this.responseText).hits.hits.forEach(function(element){
      geojson.features.push(element._source);
    });
    addPointsToMap(geojson);
    ////gör ett geojson object av svaret
    //måla upp detta geojson på kartan med funktionen ovan
  }
});

xhr.open("POST", "http://127.0.0.1:9200/thermals/ground/_search");
//Fix denna at prata med elastic genom att inte skicka med några headders alls! Nu skrivs svaret ut i konsollen!
//observera att denna skaköras med "http-server ."
xhr.send(data);


var geojson = { "features": [] }
