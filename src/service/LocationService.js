var Promise = require('promise');

var neo4j;
var locationsList;
var locationPorts;
var transactionId;
var transactionStatements = [];

var LocationService = {

    initLocationService : function (config) {

        neo4j           = config.neo4j;
        transactionId   = config.transactionId;
        locationsList   = config.locations.locationsList;
        locationPorts   = config.locations.locationPorts;

        return new Promise(function (resolve) {

            LocationService.deleteLocationNodes();
            LocationService.createLocationNodes();
            LocationService.deleteLocationPorts();
            LocationService.createLocationPorts();
            LocationService.createRoomConnection();
            LocationService.createLocationSwitchConnection();
            LocationService.addStatementsToTransaction()
                           .then(resolve);
        });
    },


    deleteLocationNodes : function () {

        var query = 'MATCH (location:Location) ' +
                    'DETACH DELETE location;';

        transactionStatements.push({
            statement: query
        });
    },


    createLocationNodes : function () {

        var query = 'MERGE (location:Location {name: "{LOCATION_NAME}"}) ' +
                    'RETURN location';

        locationsList.forEach(function (location) {

            var _query = query;
                _query = _query.replace('{LOCATION_NAME}', location);

            transactionStatements.push({
                statement: _query
            });
        });
    },


    deleteLocationPorts : function () {

        var query = 'MATCH (locationPort:LocationPort) ' +
                    'DETACH DELETE locationPort;';

        transactionStatements.push({
            statement: query
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

        locationPorts.forEach(function (locationPort) {

            var _query = query;
                _query = _query.replace('{LOCATIONPORT_NAME}',locationPort.name);
                _query = _query.replace('{LOCATIONPORT_ROOM}',locationPort.room);
                _query = _query.replace('{LOCATIONPORT_SWITCH}',locationPort.switch);
                _query = _query.replace('{LOCATIONPORT_PORT}',locationPort.port);

            transactionStatements.push({
                statement: _query
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

        locationsList.forEach(function (location) {

            var _query = query;
                _query = _query.replace('{LOCATIONPORT_ROOM_NAME}', location);
                _query = _query.replace('{LOCATION_NAME}', location);

            transactionStatements.push({
                statement: _query
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

        transactionStatements.push({
            statement: query
        });
    },


    addStatementsToTransaction : function () {
        return new Promise(function (resolve) {
            var _statements = {
                statements: transactionStatements
            };
            neo4j.addStatementsToTransaction(transactionId, _statements, function (err) {
                if(err) throw err;
                console.log('[LocationService.js] Added all statements to transaction');
                resolve();
            });
        });
    }
};

module.exports = LocationService;