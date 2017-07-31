var Promise = require('promise');

var neo4j;
var locationsList;
var locationPorts;

var LocationService = {

    initLocationService : function (config) {

        neo4j           = config.neo4j;
        locationsList   = config.locations.locationsList;
        locationPorts   = config.locations.locationPorts;

        return new Promise(function (resolve) {
            LocationService.deleteLocationNodes()
                .then(LocationService.createLocationNodes)
                .then(LocationService.deleteLocationPorts)
                .then(LocationService.createLocationPorts)
                .then(LocationService.createRoomConnection)
                .then(LocationService.createLocationSwitchConnection)
                .then(resolve);
        });
    },


    deleteLocationNodes : function () {

        var query = 'MATCH (location:Location) ' +
                    'DETACH DELETE location;';

        return new Promise(function (resolve) {
            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Deleted all locations');
                resolve();
            });
        });
    },


    createLocationNodes : function () {

        var query = 'MERGE (location:Location {name: "{LOCATION_NAME}"}) ' +
                    'RETURN location';
        var queryCounter = 0;

        return new Promise(function (resolve) {

            locationsList.forEach(function (location) {

                var _query = query;
                    _query = _query.replace('{LOCATION_NAME}', location);

                neo4j.cypherQuery(_query, function (err) {
                    if(err) throw err;
                    queryCounter++;
                    if (queryCounter == locationsList.length) {
                        console.log('Created all locations');
                        resolve();
                    }
                })
            });
        });
    },


    deleteLocationPorts : function () {

        var query = 'MATCH (locationPort:LocationPort) ' +
                    'DETACH DELETE locationPort;';

        return new Promise(function (resolve) {

            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Deleted all location ports');
                resolve();
            });
        });
    },


    createLocationPorts : function () {

        var query = 'MERGE (locationPort:LocationPort {' +
                        'name: "{LOCATIONPORT_NAME}", ' +
                        'room: "{LOCATIONPORT_ROOM}", ' +
                        'switch: "{LOCATIONPORT_SWITCH}", ' +
                        'port: "{LOCATIONPORT_PORT}" ' +
                    '}) ' +
                    'RETURN locationPort;';

        var queryCounter = 0;

        return new Promise(function (resolve) {

            locationPorts.forEach(function (locationPort) {

                var _query = query;
                    _query = _query.replace('{LOCATIONPORT_NAME}',locationPort.name);
                    _query = _query.replace('{LOCATIONPORT_ROOM}',locationPort.room);
                    _query = _query.replace('{LOCATIONPORT_SWITCH}',locationPort.switch);
                    _query = _query.replace('{LOCATIONPORT_PORT}',locationPort.port);

                neo4j.cypherQuery(_query, function (err) {
                    if(err) throw err;
                    queryCounter++;
                    if(queryCounter == locationPorts.length) {
                        console.log('Created all location ports');
                        resolve();
                    }
                });
            });
        });
    },


    createRoomConnection : function () {

        var query = 'MATCH (locationPort:LocationPort {' +
                        'room: "{LOCATIONPORT_ROOM_NAME}"' +
                    '}) WITH locationPort ' +
                    'MATCH (location:Location {' +
                        'name: "{LOCATION_NAME}"' +
                    '}) ' +
                    'MERGE (locationPort)-[:ROOM]->(location) ' +
                    'RETURN locationPort;';
        var queryCounter = 0;


        return new Promise(function (resolve) {

            locationsList.forEach(function (location) {

                var _query = query;
                    _query = _query.replace('{LOCATIONPORT_ROOM_NAME}', location);
                    _query = _query.replace('{LOCATION_NAME}', location);

                neo4j.cypherQuery(_query, function (err) {
                    if (err) throw err;
                    queryCounter++;
                    if(queryCounter == locationsList.length) {
                        console.log('Created connection between location ports and locations');
                        resolve();
                    }
                });
            });
        });
    },


    createLocationSwitchConnection : function () {

        var query = 'MATCH (locationPort:LocationPort) ' +
                    'WITH locationPort ' +
                    'MATCH (switch:Switch)-[:SWITCHPORT]->(switchPort:SwitchPort)-[:CONNECTED]->(switchPortRoom:SwitchPortRoom) ' +
                    'WHERE switch.name = locationPort.switch ' +
                    'AND switchPort.name = locationPort.port ' +
                    'MERGE (switchPortRoom)-[:CONNECTED]->(locationPort) ' +
                    'RETURN switch, switchPort, switchPortRoom, locationPort;';

        return new Promise(function (resolve) {

            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Created location port to switch relation');
                resolve();
            });
        });

    }
};

module.exports = LocationService;