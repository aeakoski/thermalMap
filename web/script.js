mapboxgl.accessToken = 'pk.eyJ1IjoiYWVha29za2kiLCJhIjoiY2o0YWZranltMTJtZzMzcGc3NjUyOWU0ZyJ9.cer7yU4vRlk1FeHEQPH0Pg';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/aeakoski/cj4bd0ycx4cgx2sptdzigrgtl',
    center: [17.211814, 59.101584], //Vängsö
    zoom: 11,
    maxZoom:12,
    minZoom:8
});

var prev_upperLat = 0;
var prev_lowerLat = 0;

var prev_lowerLon = 0;
var prev_upperLon = 0;


pilotFilter = [];
clubFilter = [];

var listToString = function(list){
  if (list.length ==0) {
    return "[]"
  }
  let string = "[ "
  list.forEach(function(e){
    string = string + "\"" + e +"\", "
  })
  return string.slice(0, -2)+"]";
}

var generateRequest = function(){
  lonlat = map.getBounds();
  upperLat = lonlat._ne.lat;
  lowerLat = lonlat._sw.lat;

  lowerLon = lonlat._sw.lng;
  upperLon = lonlat._ne.lng;

  var request = {
	"size":1000,
	"query":{
		"bool":{
			"must":[
				{
					"geo_bounding_box":{
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
					}
				},
				{
					"bool":{
						"should":[]
					}
				},
        {
					"bool":{
						"should":[]
					}
				}
			]
		}

	}

}

  pilotFilter.forEach(function(pilot){
    request.query.bool.must[1].bool.should.push({
      "match": {
            "properties.pilot" : {
            "query" : pilot,
            "operator" : "and"
            }
      }
    });
  })

  clubFilter.forEach(function(club){
    request.query.bool.must[2].bool.should.push({
      "match": {
            "properties.club" : {
            "query" : club,
            "operator" : "and"
            }
      }
    });
  })

  return JSON.stringify(request);

}

var sendRequest = function(){
  data = generateRequest();
  xhr.open("POST", "http://127.0.0.1:9200/map/thermals/_search");
  xhr.send(data);
}

ll = [
    [0, 0],
    [1, 15],
    [2, 40],
    [3, 61]
]

map.on('moveend', function(){
  let lonlat = map.getBounds()
  let epsilon = 0.000001
  if(Math.abs(prev_upperLat - lonlat._ne.lat)<epsilon && Math.abs(prev_lowerLat - lonlat._sw.lat)<epsilon && Math.abs(prev_lowerLon - lonlat._sw.lng)<epsilon && Math.abs(prev_upperLon - lonlat._ne.lng)<epsilon){ return; }
  prev_upperLat = lonlat._ne.lat;
  prev_lowerLat = lonlat._sw.lat;
  prev_lowerLon = lonlat._sw.lng;
  prev_upperLon = lonlat._ne.lng;
  sendRequest()
});
map.on('load', sendRequest)
map.dragRotate.disable(); //Disables rotation

var addPointsToMap = function(jsonThermals){
      if (map.getSource("thermals")) {
        map.removeLayer("cluster-1");
        map.removeLayer("cluster-2");
        map.removeSource("thermals");
      }

      document.getElementById('nrt').innerHTML = "<i class=\"fa fa-cloud\" aria-hidden=\"true\"></i>: "+jsonThermals.features.length;

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


}

var xhr = new XMLHttpRequest();
xhr.addEventListener("readystatechange", function () {
  //Add 404 error handeling
  if (this.readyState === 4) {

    let geolist = []

    var first = true;
    JSON.parse(this.responseText).hits.hits.forEach(function(element){
      if (first) {
        //console.log(element._source);
        first = false;
      }
      geolist.push(element._source);
    });

    addPointsToMap({"features": geolist});
  }
});

var checkUserInput = function(inp){
  if ((/^[a-zåäö\ ]+$/i.test(inp)) && (inp !== "") && (inp.length < 40)) { return true; }
  return false;
}

var addFilter = function(e, userInput, type){
  if (e.charCode != 13){ return; }
  if(!checkUserInput(userInput)){ return; }

  if (type === "pilot") {

    if (pilotFilter.indexOf(userInput) != -1) { return; }
    pilotFilter.push(userInput);
  }else if (type === "club"){
    if (clubFilter.indexOf(userInput) != -1) { return; }
    clubFilter.push(userInput);
  }else{ return; }
  sendRequest();
  displayFilters();
  event.currentTarget.value = "";

}

var removeFilter = function(filter, type){
  if (type === "pilot") {
    let index = pilotFilter.indexOf(filter);
    if (index > -1) {
        pilotFilter.splice(index, 1);
    }
  }else if(type === "club") {
    let index = clubFilter.indexOf(filter);
    if (index > -1) {
        clubFilter.splice(index, 1);
    }
  }

  sendRequest();
  displayFilters();

}


var displayFilters = function () {
    var filters = document.getElementById('filter-results');
    filters.innerHTML = "";
    pilotFilter.forEach(function(filter){
        filters.innerHTML = filters.innerHTML + "\n"+
        "<div class=\"filter-tag\">\
          <p>" + filter+ "</p><i class=\"fa fa-times\" aria-hidden=\"true\" type=\"pilot\" onclick=\"removeFilter('" + filter + "', 'pilot')\"></i>\
        </div>"

    });

    clubFilter.forEach(function(filter){
        filters.innerHTML = filters.innerHTML + "\n"+
        "<div class=\"filter-tag\">\
          <p>" + filter + "</p><i class=\"fa fa-times\" aria-hidden=\"true\" onclick=\"removeFilter('" + filter + "', 'club')\"></i>\
        </div>"

    })


}
