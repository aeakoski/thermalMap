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

var getThermalcount = function(){
  console.log("Sending countinbox request");
  data = generateRequest();
  console.log(JSON.parse(data));
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/thermals/countinbox",
    data: data,
    success: countinboxHandeler(data),
    dataType: "json"
  });
  /*
  xhr.open("POST", "/thermals/countinbox");
  xhr.setRequestHeader("content-type", "application/json");
  xhr.send(data);
  */
}

var sendRequest = function(){
  console.log("Sending fetch request");
  data = generateRequest();
  console.log(data);
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/thermals/fetch",
    data: data,
    success: fetchHandeler,
    dataType: "json"
  });

  /*xhr.open("POST", "/thermals/fetch");
  xhr.setRequestHeader("content-type", "application/json");
  xhr.send(data);*/
}

var sendCountRequest = function(){
  xhr.open("GET", "/thermals/count");
  xhr.send();
}

var fetchHandeler = function(data){
  let geolist = JSON.parse(data);
  console.log(geolist);
  var first = true;
  addPointsToMap({"features": geolist});
}

var countHandeler = function(data){
  //console.log("En vanlig count kom tillbaka");
  document.getElementById('tot-nrt').innerHTML = JSON.parse(this.responseText).count;
}

var countinboxHandeler = function(data){
  console.log("Fick svar av count!!!!");
  let numberOfThermals = JSON.parse(this.responseText).count;
  if (numberOfThermals == 10000) {
    document.getElementById('nrt').innerHTML = "10000 (max)";
  }else{
    document.getElementById('nrt').innerHTML = numberOfThermals;
  }
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
    moves_since_last_fetch++;
    console.log("Vill ha thermal count");
    getThermalcount();
    if ((moves_since_last_fetch < 6) && (max_fetched_upperLat >= lonlat._ne.lat) && (max_fetched_lowerLat <= lonlat._sw.lat) && (max_fetched_lowerLon <= lonlat._sw.lng) && (max_fetched_upperLon >= lonlat._ne.lng)) {
      //We have zoomed in, no new fetch is neccesary
    }else {
        sendRequest()
    }
    prev_upperLat = lonlat._ne.lat;
    prev_lowerLat = lonlat._sw.lat;
    prev_lowerLon = lonlat._sw.lng;
    prev_upperLon = lonlat._ne.lng;

});
map.on('load', sendRequest)
map.dragRotate.disable(); //Disables rotation

var addPointsToMap = function(jsonThermals){
      moves_since_last_fetch = 0;
      if (map.getSource("thermals")) {
        map.removeLayer("cluster-1");
        map.removeLayer("cluster-2");
        map.removeSource("thermals");
      }

      /*
      let numberOfThermals = jsonThermals.features.length;

      if (numberOfThermals == 10000) {
        document.getElementById('nrt').innerHTML = "10000 (max)";
      }else{
        document.getElementById('nrt').innerHTML = numberOfThermals;
      }
      */
      // Display the number of thermals on the screen

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

var xhr = new XMLHttpRequest();
xhr.addEventListener("readystatechange", function (e) {

  if (this.readyState == 4 && this.status == 200) {

    if (this.responseURL.indexOf("thermals/fetch") !=- 1) {
      let geolist = JSON.parse(this.responseText).list;
      var first = true;
      addPointsToMap({"features": geolist});

    } else if (this.responseURL.indexOf("thermals/count") !=- 1) {
      console.log("En vanlig count kom tillbaka");
      document.getElementById('tot-nrt').innerHTML = JSON.parse(this.responseText).count;

    }else if(this.responseURL.indexOf("thermals/countinbox") !=- 1){
      console.log("Fick svar av count!!!!");
      let numberOfThermals = JSON.parse(this.responseText).count;
      if (numberOfThermals == 10000) {
        document.getElementById('nrt').innerHTML = "10000 (max)";
      }else{
        document.getElementById('nrt').innerHTML = numberOfThermals;
      }
      //document.getElementById('nrt').innerHTML = JSON.parse(this.responseText).count;
    } else {
      console.log(this.status + " - Error in making request to: " + this.responseURL);
      console.log(this);
    }
  }
});

var prev_focus = 0;

var changeFocus = function(type){
  //Changes focus between the different meny tabs

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
