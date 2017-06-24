mapboxgl.accessToken = 'pk.eyJ1IjoiYWVha29za2kiLCJhIjoiY2o0YWZranltMTJtZzMzcGc3NjUyOWU0ZyJ9.cer7yU4vRlk1FeHEQPH0Pg';
var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/aeakoski/cj4bd0ycx4cgx2sptdzigrgtl',
    center: [17.211814, 59.101584],
    zoom: 11
});

map.on('load', function() {

    // Add a new source from our GeoJSON data and set the
    // 'cluster' option to true.
    map.addSource("thermals", {
        type: "geojson",
        // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
        // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
        data: geojson,
        cluster: true,
        clusterMaxZoom: 15, // Max zoom to cluster points on
        clusterRadius: 20 // Use small cluster radius for the heatmap look
    });

    // Use the earthquakes source to create four layers:
    // three for each cluster category, and one for unclustered points

    // Each point range gets a different fill color.
    var layers = [
        [1, 'green'],
        [2, 'orange'],
        [3, 'red']
    ];

    layers.forEach(function (layer, i) {
        map.addLayer({
            "id": "cluster-" + i,
            "type": "circle",
            "source": "thermals",
            "paint": {
                "circle-color": layer[1],
                "circle-radius": 20,
                "circle-blur": 1 // blur the circles to get a heatmap look
            },
            "filter": i === layers.length - 1 ? //Filter the datapoints
                [">=", "velocity", layer[0]] :
                [
                  "all",
                  [">=", "velocity", layer[0]],
                  ["<", "velocity", layers[i + 1][0]]
                ]
        }, 'waterway-label');
    });

    map.addLayer({
        "id": "unclustered-points",
        "type": "circle",
        "source": "thermals",
        "paint": {
            "circle-color": 'rgba(0,255,0,0.5)',
            "circle-radius": 20,
            "circle-blur": 1
        },
        "filter": ["<", "velocity", 1]
    }, 'waterway-label');
});

var geojson = {
    "type": "FeatureCollection",
    "crs": {
      "type": "name",
      "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" }
      },
    "features": [
      {
        "type":"Feature",
        "properties":{"velocity":1.001},
        "geometry":{"type":"Point", "coordinates": [17.238713661202187, 59.079036612021866]}

      },
      {
        "type":"Feature",
        "properties":{"velocity":2.001},
        "geometry":{"type":"Point", "coordinates": [17.22938333333333, 59.07901666666667]}

      },
      {
        "type":"Feature",
        "properties":{"velocity":3.001},
        "geometry":{"type":"Point", "coordinates": [17.12874166666667, 59.05651666666667]}

      }
    ]
}
