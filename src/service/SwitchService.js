var Promise = require('promise');

var neo4j;
var switches;

var SwitchService = {

    initSwitchService : function (config) {


        neo4j = config.neo4j;
        switches = config.switches;

        return new Promise(function (resolve) {
            SwitchService.createSwitchNodes()
                .then(SwitchService.deleteSwitchPorts)
                .then(SwitchService.createSwitchPorts)
                .then(SwitchService.deleteTrunkPorts)
                .then(SwitchService.createTrunkPorts)
                .then(SwitchService.deleteSwitchRoomPorts)
                .then(SwitchService.createSwitchRoomPorts)
                .then(resolve);
        });
    },


    createSwitchNodes : function () {

        var queryCounter = 0;
        var query = 'MERGE (switch:Switch { address: "{SWITCH_NAME}" }) ' +
                    'ON CREATE SET ' +
                        'switch.name = "{CREATE_SWITCH_NAME}", ' +
                        'switch.address = "{CREATE_SWITCH_URL}", ' +
                        'switch.ip = "{CREATE_SWITCH_IP}", ' +
                        'switch.timestamp = "{CREATE_SWITCH_TIMESTAMP}" ' +
                    'ON MATCH SET ' +
                        'switch.url = "{MATCH_SWITCH_URL}", ' +
                        'switch.ip = "{MATCH_SWITCH_IP}",' +
                        'switch.timestamp = "{MATCH_SWITCH_TIMESTAMP}"' +
                    'RETURN switch;';

        return new Promise(function (resolve) {

            switches.forEach(function (_switch) {

                var date = new Date();

                var _query = query;
                _query = _query.replace('{SWITCH_NAME}'             , _switch.url);
                _query = _query.replace('{CREATE_SWITCH_NAME}'      , _switch.name);
                _query = _query.replace('{CREATE_SWITCH_URL}'       , _switch.url);
                _query = _query.replace('{CREATE_SWITCH_IP}'        , _switch.ip);
                _query = _query.replace('{CREATE_SWITCH_TIMESTAMP}' , date.getTime().toString());
                _query = _query.replace('{MATCH_SWITCH_URL}'        , _switch.url);
                _query = _query.replace('{MATCH_SWITCH_IP}'         , _switch.ip);
                _query = _query.replace('{MATCH_SWITCH_TIMESTAMP}'   , date.getTime().toString());

                neo4j.cypherQuery(_query, function (err) {

                    if(err) throw err;
                    queryCounter++;
                    if (queryCounter == switches.length) {
                        console.log('Created switch nodes');
                        resolve();
                    }
                });
            });
        });
    },


    deleteSwitchPorts : function () {

        var query = 'MATCH (switchPort:SwitchPort) ' +
                    'DETACH DELETE switchPort;';

        return new Promise(function (resolve) {
            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Deleted all switch ports');
                resolve();
            });
        });
    },


    createSwitchPorts: function () {

        var queries = [];
        var queryCounter = 0;
        var query = 'MATCH (switch:Switch {name: "{SWITCH_NAME}"}) ' +
                        'MERGE (switchPort:SwitchPort {' +
                        'name : "{SWITCH_PORT_NAME}"' +
                    '})' +
                    '<-[:SWITCHPORT]-(switch) ' +
                    'RETURN switch, switchPort';


        return new Promise(function (resolve) {

            switches.forEach(function (_switch) {

                for (var port = 0; port <= _switch.ports; port++) {

                    var _query = query;

                    _query = _query.replace('{SWITCH_NAME}' , _switch.name);
                    _query = _query.replace('{SWITCH_PORT_NAME}'   , port.toString());

                    queries.push(_query);
                }
            });

            queries.forEach(function (query) {
                neo4j.cypherQuery(query, function (err) {
                    if(err) throw err;
                    queryCounter++;
                    if(queryCounter == switches.length){
                        console.log('Created all switch ports');
                        resolve();
                    }
                });
            });
        });
    },


    deleteTrunkPorts : function () {

        var query = 'MATCH (trunkPort:TrunkPort) ' +
                    'DETACH DELETE trunkPort;';

        return new Promise(function (resolve) {
            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('deleted all trunk ports');
                resolve();
            });
        });
    },


    createTrunkPorts : function () {

        var query = 'MATCH (switch:Switch {name: "{SWITCH_NAME}"}) ' +
                    'CREATE (trunkPort:TrunkPort {' +
                        'name : "{TRUNK_PORT_NAME}", ' +
                        'switchPort: "{TRUNK_PORT_SWITCH}"' +
                    '})' +
                    '<-[:SWITCHPORT]-(switch) ' +
                    'RETURN switch, trunkPort';
        var queries = [];
        var queryCounter = 0;

        return new Promise(function (resolve) {

            switches.forEach(function (_switch) {
                for (var port = _switch.ports + 1;
                     port <= _switch.trunkPorts + _switch.ports;
                     port++) {

                    var _query = query;
                    _query = _query.replace('{SWITCH_NAME}' , _switch.name);
                    _query = _query.replace('{TRUNK_PORT_NAME}'   , port.toString());
                    _query = _query.replace('{TRUNK_PORT_SWITCH}' , _switch.name);

                    queries.push(_query);
                }
            });

            queries.forEach(function (query) {

                neo4j.cypherQuery(query, function (err) {
                    if(err) throw err;
                    queryCounter ++;
                    if (queryCounter == switches.length) {
                        console.log('Created all trunk ports');
                        resolve();
                    }
                });
            });
        });
    },


    deleteSwitchRoomPorts : function () {

        var query = 'MATCH (switchPortRoom:SwitchPortRoom) ' +
                    'DETACH DELETE switchPortRoom;';

        return new Promise(function (resolve) {
            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('deleted all switch room ports');
                resolve();
            });
        });
    },


    createSwitchRoomPorts : function () {

        var query = 'MATCH (switchPort:SwitchPort) ' +
                    'WHERE NOT (switchPort)-[:CONNECTED]->() ' +
                    'MERGE (switchPort)-[:CONNECTED]->(switchPortRoom:SwitchPortRoom {' +
                        'name: "Network"' +
                    '}) ' +
                    'RETURN switchPort, switchPortRoom;';

        return new Promise(function (resolve) {

            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Created switch room port nodes');
                resolve();
            });
        });
    }
};


module.exports = SwitchService;
