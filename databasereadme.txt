Elasticsearch set up database:

Create an index for all map data called "map"
PUT - http://127.0.0.1:9200/map/

{
   "settings":{
	"number_of_shards": 1,
	"number_of_replicas": 0
   }
}

------


Create a template for a thermal to make it searchable by rane and other stuff

PUT - http://127.0.0.1:9200/map/_mapping/thermals

{
  "thermal":{
    "properties":{
      "properties":{
    	"properties":{
	        "pilot":{"type":"string"},
	        "velocity":{"type":"float"}
    	}
      },
      "geometry":{
      	"properties":{
      		"coordinates":{"type":"geo_point"}
      	}
      }
    }
  }
}


geometry:
  coordinates[16.9276178019, 59.1125291022]
properties:
  lat : 59.1125291022
  lon : 16.9276178019
  pilot : "stefan björnstam"
  velocity : 2.40151515152


------


GET - http://127.0.0.1:9200/map/thermal

{
"size": 1000,
  "query": {
    "range" : {
            "properties.lat" : {
                "gte" : 59,
                "lte" : 60,
            },
            "properties.lon" : {
                "gte" : 16,
                "lte" : 17,
            }

      },
    "match_all": {}
  }
}

{
  "size":1000,
  "query": {
    "geo_bounding_box": {
      "geometry.coordinates": {
        "top_left": {
          "lat": 60,
          "lon": 16
        },
        "bottom_right": {
          "lat": 59,
          "lon": 17
        }
      }
    }
  }
}
