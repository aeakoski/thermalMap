const express = require('express');
const app = express();
const request = require("request");
var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(express.static('public'))

app.get('/', function (req, res) {
  res.sendFile('index.html')
  console.log("Send Index.html");
})

var checkUserInput = function(inp){
  if ((/^[a-z0-9åäöÅÄÖ\ ]+$/i.test(inp)) && (inp !== "") && (inp.length < 65)) { return true; }
  console.log("WRONG");
  return false;
}

//TODO add 404 handeling

var port = 8080

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// middleware to use for all requests
router.use(function(req, res) {
    console.log('Something is happening.');
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    console.log("vanlig sida");
    res.sendFile('index.html');
});

// POST method route
app.post('/thermals/fetch', bodyParser.json(), function (req, res) {

  var options = { method: 'POST',
    url: 'http://127.0.0.1:9200/map/thermals/_search',
    headers: { 'content-type': 'application/json' },
    body: {
    	"size":1000,
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

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    res.status(200);
    res.send(body);

  });
});

app.get('/thermals/count', function (req, res) {
  var options = { method: 'POST',
    url: 'http://127.0.0.1:9200/map/thermals/_count',
    headers: { 'content-type': 'application/json' },
    body: {query: { match_all: {} } },
    json: true };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    res.status(200);
    res.send(body);

  });
});



// more routes for our API will happen here

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
//TODO The above
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port, function () {
  console.log('Example app listening on port '+ port)
});
