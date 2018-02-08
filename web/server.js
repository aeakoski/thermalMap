const express = require('express');
const app = express();
const request = require("request");
var path = require('path');
var bodyParser = require('body-parser');

var port = 8080
var elasticAddress = "http://127.0.0.1:9200" // http://37.139.3.211:9200

// bodyParser will let us get data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//Makes files in public dir accessable to the public
app.use(express.static('public'))

var checkUserInput = function(inp){
  if ((/^[a-z0-9åäöÅÄÖ\ ]+$/i.test(inp)) && (inp !== "") && (inp.length < 65)) { return true; }
  console.log("WRONG");
  return false;
}

app.get('/', function (req, res) {
  res.sendFile('./public/index.html')
})

app.post('/thermals/fetch', bodyParser.json(), function (req, res) {
  //Prepare a request to Elastic in order to get the thermals in the db
  //console.log(req.body);
  var options = { method: 'POST',
    url: elasticAddress + '/map/thermals/_search',
    headers: { 'content-type': 'application/json' },
    body: {
    	"size":10000,
    	"query":{
    		"bool":{
    			"must":[
    				{
    					"geo_bounding_box": {"geometry.coordinates": req.body['geometry.coordinates']}
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

    },
    json: true };


    req.body.pilots.forEach(function(pilot){
      if (checkUserInput(pilot)) {
        options.body.query.bool.must[1].bool.should.push({
          "match": {
                "properties.pilot" : {
                "query" : pilot,
                "operator" : "and"
                }
          }
      });
      }

  });

    req.body.clubs.forEach(function(club){
      if (checkUserInput(club)) {
        options.body.query.bool.must[2].bool.should.push({
          "match": {
                "properties.club" : {
                "query" : club,
                "operator" : "and"
                }
          }
        });
      }

    });

  //TODO Vad händer om elasticsearch är avstängt på servern?

  request(options, function (error, response, body) {
    if (error){
      res.status(400);
      res.json({ error: 'Not found' });
    };

    var responeJSON = {"list":[]}

    body.hits.hits.forEach(function(element){
      responeJSON.list.push({"properties": element._source.properties, "geometry":element._source.geometry});
    });


    res.status(200);
    res.send(responeJSON);
  });
});

app.post('/thermals/countinbox', bodyParser.json(), function (req, res) {
  // Prepare a request to Elastic in order to get the number of thermals in the
  // specified map box boundaries

  var options = { method: 'POST',
    url: elasticAddress + '/map/thermals/_count',
    headers: { 'content-type': 'application/json' },
    body: {
    	"size":10000,
    	"query":{
    		"bool":{
    			"must":[
    				{
    					"geo_bounding_box": {"geometry.coordinates": req.body['geometry.coordinates']}
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

    },
    json: true };

    req.body.pilots.forEach(function(pilot){
      if (checkUserInput(pilot)) {
        options.body.query.bool.must[1].bool.should.push({
          "match": {
                "properties.pilot" : {
                "query" : pilot,
                "operator" : "and"
                }
          }
      });
      }

  });

    req.body.clubs.forEach(function(club){
      if (checkUserInput(club)) {
        options.body.query.bool.must[2].bool.should.push({
          "match": {
                "properties.club" : {
                "query" : club,
                "operator" : "and"
                }
          }
        });
      }

    });

  //TODO Vad händer om elasticsearch är avstängt på servern?

  request(options, function (error, response, body) {
    if (error){
      res.status(400);
      res.json({ error: 'Not found' });
    };
    res.status(200);
    res.json(body);
  });
});


app.get('/thermals/count', function (req, res) {
  //Prepare a request to Elastic in order to get the number of thermals in tha db
  var options = { method: 'POST',
    url: elasticAddress+'/map/thermals/_count',
    headers: { 'content-type': 'application/json' },
    body: {query: { match_all: {} } },
    json: true };

  //TODO Vad händer om elasticsearch är avstängt på servern?
  request(options, function (error, response, body) {
    if (error){
      res.status(400);
      res.json({ error: 'Not found' });
    }
    res.status(200);
    res.send(body);
  });
});


// Error handlers
app.use(function(req, res){
  res.status(404);

  res.format({
    html: function () {
      res.sendFile(path.join(__dirname +'/public/error404.html'));
    },
    json: function () {
      res.json({ error: 'Not found' })
    },
    default: function () {
      res.type('txt').send('Not found')
    }
  })
});


// START THE SERVER
// =============================================================================
app.listen(port, function () {
  console.log('Server listening on port '+ port)
});
