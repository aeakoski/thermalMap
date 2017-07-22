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
  }

  pilotFilter.forEach(function(pilot){
    request.pilots.push(pilot);
  })

  clubFilter.forEach(function(club){
    request.clubs.push(club);
  })

  return JSON.stringify(request);

}

var sendRequest = function(){
  data = generateRequest();
  xhr.open("POST", "/thermals/fetch");
  xhr.setRequestHeader("content-type", "application/json");
  xhr.send(data);
}

var sendCountRequest = function(){
  xhr.open("GET", "/thermals/count");
  xhr.send();
}

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

      document.getElementById('nrt').innerHTML = jsonThermals.features.length;

      map.addSource("thermals", {
          type: "geojson",
          data: jsonThermals,
          cluster: true,
          clusterMaxZoom: 9, // Max zoom to cluster points on
          clusterRadius: 15 // Use small cluster radius for the heatmap look
      });


      map.addLayer({
          "id": "cluster-1",
          "type": "circle",
          "source": "thermals",

          "paint": {
              "circle-color": 'rgba(229,36,62, 0.4)',
              "circle-radius": {
                property: "velocity",
                type: "exponential",
                stops: velStop
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
              "circle-color": 'rgba(229,36,62, 0.5)',
              "circle-radius": {
                property: "velocity",
                type: "exponential",
                stops: velStop
              },
              "circle-blur": 1 // blur the circles to get a heatmap look
          },
          "filter": [">","velocity", 1]
      }, 'waterway-label');

      map.addLayer({
        id: "c-thermals",
        type: "circle",
        source: "thermals",
        filter: ["has", "point_count"],
        paint: {
            "circle-blur": 1.2,
            "circle-color": {
                property: "point_count",
                type: "exponential",
                stops: [
                    [0, "rgba(229,36,62, 0.0)"],
                    [5, "rgba(229,36,62, 0.22)"],
                    [10, "rgba(198,27,49,0.24)"],
                    [20, "rgba(198,27,49,0.26)"],
                    [30, "rgba(198,27,49,0.28)"],
                    [40, "rgba(198,27,49,0.30)"],
                    [50, "rgba(198,27,49,0.30)"]
                ]
            },
            "circle-radius": {
                property: "point_count",
                type: "exponential",
                stops: [
                  [0, 0],
                  [5, 40],
                  [10, 45],
                  [20, 50],
                  [30, 55],
                  [40, 60],
                  [50, 65]
                ]
            }
        }
    });

}

var xhr = new XMLHttpRequest();
xhr.addEventListener("readystatechange", function (e) {

  if (this.readyState == 4 && this.status == 200) {

    if (this.responseURL.indexOf("thermals/fetch") !=- 1) {
      let geolist = []
      var first = true;
      JSON.parse(this.responseText).hits.hits.forEach(function(element){
        geolist.push(element._source);
      });

      addPointsToMap({"features": geolist});
    } else if (this.responseURL.indexOf("thermals/count") !=- 1) {
      console.log(JSON.parse(this.responseText));
      console.log(JSON.parse(this.responseText).count);
      document.getElementById('tot-nrt').innerHTML = JSON.parse(this.responseText).count;


    }else {
      console.log(this.status + " - Error in making request to: " + this.responseURL);
      console.log(this);
    }
  }
});

var prev_focus = 0;

var changeFocus = function(type){

  document.getElementsByClassName("navelement")[0].removeAttribute("id");
  document.getElementsByClassName("navelement")[1].removeAttribute("id");
  document.getElementsByClassName("navelement")[2].removeAttribute("id");


  if (prev_focus == type){
    if (type == 0){return}
    document.getElementsByClassName("navelement")[0].setAttribute("id", "active");
    document.getElementsByClassName("view")[type].classList.add("hide");
    prev_focus = 0;
    return

  }else{
      document.getElementsByClassName("navelement")[type].setAttribute("id", "active");
  }

  if (prev_focus != 0) {
      document.getElementsByClassName("view")[prev_focus].classList.add("hide");
  }
  document.getElementsByClassName("view")[type].classList.remove("hide");
  prev_focus = type;



}

var checkUserInput = function(inp){
  if ((/^[a-z0-9åäöÅÄÖ\ ]+$/i.test(inp)) && (inp !== "") && (inp.length < 65)) { return true; }
  console.log("WRONG");
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

displayFilters()
sendCountRequest()
