var Promise = require('promise');

var neo4j;
var switches;
var transactionId;
var transactionStatements = [];

var SwitchService = {

    initSwitchService : function (config) {

        neo4j           = config.neo4j;
        transactionId   = config.transactionId;
        switches        = config.switches;

        return new Promise(function (resolve) {

            SwitchService.createSwitchNodes();
            SwitchService.deleteSwitchPorts();
            SwitchService.createSwitchPorts();
            SwitchService.deleteTrunkPorts();
            SwitchService.createTrunkPorts();
            SwitchService.deleteSwitchRoomPorts();
            SwitchService.createSwitchRoomPorts();
            SwitchService.addStatementsToTransaction()
                         .then(resolve);
        });
    },


    createSwitchNodes : function () {

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

            transactionStatements.push({
                statement: _query
            });
        });
    },


    deleteSwitchPorts : function () {

        var query = 'MATCH (switchPort:SwitchPort) ' +
                    'DETACH DELETE switchPort;';

        transactionStatements.push({
            statement: query
        });
    },


    createSwitchPorts: function () {

        var query = 'MATCH (switch:Switch {name: "{SWITCH_NAME}"}) ' +
                        'MERGE (switchPort:SwitchPort {' +
                        'name : "{SWITCH_PORT_NAME}"' +
                    '})' +
                    '<-[:SWITCHPORT]-(switch) ' +
                    'RETURN switch, switchPort';

        switches.forEach(function (_switch) {

            for (var port = 0; port <= _switch.ports; port++) {

                var _query = query;
                    _query = _query.replace('{SWITCH_NAME}' , _switch.name);
                    _query = _query.replace('{SWITCH_PORT_NAME}'   , port.toString());

                transactionStatements.push({
                    statement: _query
                });
            }
        });
    },


    deleteTrunkPorts : function () {

        var query = 'MATCH (trunkPort:TrunkPort) ' +
                    'DETACH DELETE trunkPort;';

        transactionStatements.push({
            statement: query
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

        switches.forEach(function (_switch) {

            for (var port = _switch.ports + 1;
                     port <= _switch.trunkPorts + _switch.ports;
                     port++) {

                var _query = query;
                    _query = _query.replace('{SWITCH_NAME}' , _switch.name);
                    _query = _query.replace('{TRUNK_PORT_NAME}'   , port.toString());
                    _query = _query.replace('{TRUNK_PORT_SWITCH}' , _switch.name);

                transactionStatements.push({
                    statement: _query
                });
            }
        });
    },


    deleteSwitchRoomPorts : function () {

        var query = 'MATCH (switchPortRoom:SwitchPortRoom) ' +
                    'DETACH DELETE switchPortRoom;';

        transactionStatements.push({
            statement: query
        });
    },


    createSwitchRoomPorts : function () {

        var query = 'MATCH (switchPort:SwitchPort) ' +
                    'WHERE NOT (switchPort)-[:CONNECTED]->() ' +
                    'MERGE (switchPort)-[:CONNECTED]->(switchPortRoom:SwitchPortRoom {' +
                        'name: "Network"' +
                    '}) ' +
                    'RETURN switchPort, switchPortRoom;';

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
                console.log('[SwitchService.js] Added all statements to transaction');
                resolve();
            });
        });
    }
};


module.exports = SwitchService;
