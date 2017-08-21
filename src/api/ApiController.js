var express = require('express');
var neo4j = require('node-neo4j');

var db;
var app = express();

var ApiController = {

    initApiController: function (config) {

        db = new neo4j(config.neo4j.url);

        app.listen(3000, function () {
            console.log('Example app listening on port 3000!');
        });

        ApiController.host();
    },

    
    host: function () {

        var query = 'match path = shortestPath( (device:Device {name:"{DEVICE_NAME}"})-[*..]-(switch:Switch)) ' +
                    'WHERE switch.name = device.switch ' +
                    'return path;';
        var query2 = 'MATCH (n) RETURN n;';

        app.get('/host', function (req, res) {

            if(req.query.hostname) {
                var _query;
                _query = query.replace('{DEVICE_NAME}', req.query.hostname);

                db.cypherQuery(_query, function (err, result) {
                    if (err) throw err;
                    result = mapResult(result);
                    res.send(result);
                });
            } else {
                db.cypherQuery(query2, function (err, result) {
                    if (err) throw err;
                    res.send(result);
                });
            }
        });
    }
};


function mapResult (result) {

    var data = result.data[0];
    var nodes = data.nodes;
    var output = '';

    nodes.forEach(function (node, i) {
        output += '(' + node + ')';
        if(data.directions[i] === '<-') {
            output += data.directions[i];
            output += '[' + data.relationships[i] + ']-';
        }
        if(data.directions[i] === '->') {
            output += '-[' + data.relationships[i] + ']';
            output += data.directions[i];
        }
    });
    return output;
}

module.exports = ApiController;