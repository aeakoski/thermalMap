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
  "thermals":{
    "properties":{
      "properties":{
    	"properties":{
	        "pilot":{
            	"type":"string"
            },
        	"club":{
            	"type":"string"
            },
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
	"size":1000,
	"query":{
		"bool":{
			"must":[
				{
					"geo_bounding_box":{
						"geometry.coordinates":{
							"top_left":{
								"lat":59.17933313944678,
								"lon":17.055430485580473
							},
							"bottom_right":{
								"lat":59.023658164668234,
								"lon":17.36819751438449
							}
						}
					}
				},
				{
					"bool":{
						"should":[
							{
								"match": {
						        	"properties.pilot" : {
						        	"query" : "stefan björnstam",
						        	"operator" : "and"
						        	}
								}
							},
							{
								"match": {
						        	"properties.pilot" : {
						        	"query" : "koski",
						        	"operator" : "and"
						        	}
								}
							}
						]
					}
				}
			]
		}
	}
}
