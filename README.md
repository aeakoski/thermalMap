# thermalMap a.k.a Termikkartan.se

Live build at [termikkartan.se](http://termikkartan.se)

## Pipeline of the program

1. Install and set up an Elastic search Database

2. Get html files from RST-Online.se containing the all-year-list of submitted flights.

3. Feed one file at a time into the python script `extr.py` running python2 by changing the hardcoded string in the code (Yeah,sorry bout that). If there is an error this will be printed in the error-log.txt file. The download will take a while since it is done in sync in one thread, but you are in no hurry right? ;)

4. `cd web` and start `node server`

5. Point browser to port 8080 to see the thermals painted on a map centered at Vängsö airfield

## IGC analysis
I found a library to analyse igc files that return the info i would like to store in the db, such as position of the thermal and its vertical velocity. Credit to: XXX

`extr.py` keeps track of the latest downloaded file by saving its current id to the file `where.txt`. So if python crashes, the program can start downloading files again where it left off

`extr.py` uses linear algebra in 3 dimensions to figure out where the thermal has originated on the ground to account for the pilots drifting due to wind. It is theese coordinates that are stored in the db

## Database & Storage
Elasticsearch database can only be accessed by server an only accepts connections from localhost.

Below are a few quick queries to reset, set-up and get started accessing data from an elasticsearch db filled with thermals

#### Reset the server
DELETE http://127.0.0.1:9200/map/

##### Indexing
PUT http://127.0.0.1:9200/map/
```
{   
}
```
##### Mapping
PUT http://127.0.0.1:9200/map/_mapping/thermals/

```{
  "thermals":{
    "properties":{
      "properties":{
    	"properties":{
	        "pilot":{
            	"type":"string",
            	"index": "not_analyzed"
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
```

##### Basic search
Search for thermals inside an area defined by coordinates

POST http://127.0.0.1:9200/map/thermals/_search
```
{
  "geometry.coordinates":{
    "top_left":{
      "lat":59.15466575426794,
      "lon":16.672617458471905
      },
      "bottom_right":{
        "lat":58.99445751132444,
        "lon":17.99097683347611
      }
    },
    "pilots":[],
    "clubs":[]
}
```

##### Advanced search
Search for thermals in a defined area, where pilots are stefan or koski, together with the flights made by any flightclub containing the two liters fk or gk in their name.

POST http://127.0.0.1:9200/map/thermals/_search
```
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
						        	"query" : "stefan",
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
				},
				{
					"bool":{
						"should":[
							{
								"match": {
						        	"properties.club" : {
						        	"query" : "gk",
						        	"operator" : "and"
						        	}
								}
							},
							{
								"match": {
						        	"properties.club" : {
						        	"query" : "fk",
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

```

### Confidentiality
The .gitignore reveals there exists a hashfile which is used  to hash all pilots names (with a secret hash) before they are associated to a thermal and stored in the database. This ensures confidentiality of pilots flightpatterns for those who does not what their information easily retrievable. The information is still retrievable by manually hashing the pilots name with the same hashing algorithm together with the secret salt and then qurrying the database with that hash.
