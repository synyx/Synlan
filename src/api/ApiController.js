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

        ApiController.location();
    },


    location: function () {

        var query = 'match path = shortestPath( (device:Device {name:"{DEVICE_NAME}"})-[*..]-(switch:Switch)) ' +
                    'WHERE switch.name = device.switch ' +
                    'WITH NODES(path) AS nodes ' +
                    'UNWIND nodes AS n ' +
                    'RETURN n AS nodes, labels(n) AS labels;';

        app.get('/location', function (req, res) {

            if(req.query.hostname) {
                var _query;
                _query = query.replace('{DEVICE_NAME}', req.query.hostname);

                db.cypherQuery(_query, function (err, result) {
                    if (err) {
                        res.send('Database Error');
                    } else {
                        result = mapResult(result);
                        res.send(result);
                    }
                });
            } else {
               res.send('Invalid request.');
            }
        });
    }
};


function mapResult (result) {
    var newResult = [];
    var nodes = result['data'];
    nodes.forEach(function (node) {
        var obj = node[0];
        obj.type = node[1][0];
        delete obj['_id'];
        newResult.push(obj);
    });
    return newResult;
}

module.exports = ApiController;