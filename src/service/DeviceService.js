var Promise = require('promise');

var neo4j;
var mappedDevices;
var transactionId;
var transactionStatements = [];

var DeviceService = {

    initDeviceService : function (config) {

        neo4j           = config.neo4j;
        transactionId   = config.transactionId;
        mappedDevices   = config.mapped_devices;

        return new Promise(function (resolve) {

            DeviceService.createDeviceNodes();
            DeviceService.createDevicePorts();
            DeviceService.createLocationConnection();
            DeviceService.createUnknownLocationPort();
            DeviceService.createDeviceSwitchConnection();
            DeviceService.addStatementsToTransaction()
                         .then(resolve);
        });
    },


    createDeviceNodes: function () {

        var query = 'MERGE (device:Device {' +
                        'name: "{DEVICE_NAME}", ' +
                        'mac: "{DEVICE_MAC}"' +
                    '}) ' +
                    'ON CREATE SET ' +
                        'device.port = "{CREATE_DEVICE_PORT}", ' +
                        'device.switch = "{CREATE_DEVICE_SWITCH}", ' +
                        'device.timestamp = "{CREATE_DEVICE_TIMESTAMP}" ' +
                    'ON MATCH SET ' +
                        'device.port = "{MATCH_DEVICE_PORT}", ' +
                        'device.switch = "{MATCH_DEVICE_SWITCH}", ' +
                        'device.timestamp = "{MATCH_DEVICE_TIMESTAMP}" ' +
                    'RETURN device;';
        var date = new Date();

        mappedDevices.forEach(function (device) {

            var timestamp = date.getTime().toString();
            var _query = query;
                _query = _query.replace('{DEVICE_NAME}', device.hostname);
                _query = _query.replace('{DEVICE_MAC}', device.mac);

                _query = _query.replace('{CREATE_DEVICE_PORT}', device.port);
                _query = _query.replace('{CREATE_DEVICE_SWITCH}', device.switch);
                _query = _query.replace('{CREATE_DEVICE_TIMESTAMP}', timestamp);

                _query = _query.replace('{MATCH_DEVICE_PORT}', device.port);
                _query = _query.replace('{MATCH_DEVICE_SWITCH}', device.switch);
                _query = _query.replace('{MATCH_DEVICE_TIMESTAMP}', timestamp);

            transactionStatements.push({
                statement: _query
            });
        });
    },


    createDevicePorts : function () {

        var query = 'MATCH (device:Device) ' +
                    'WHERE NOT (device)-[:CONNECTED]->() ' +
                    'MERGE (device)<-[:CONNECTED]-(devicePort:DevicePort {' +
                        'name: "LAN / WLAN"' +
                    '}) ' +
                    'RETURN device, devicePort;';

        transactionStatements.push({
            statement: query
        });
    },


    createLocationConnection : function () {

        var query = 'MATCH (locationPort:LocationPort) ' +
                    'WITH locationPort ' +
                    'MATCH (devicePort:DevicePort)-[:CONNECTED]->(device:Device) ' +
                    'WHERE device.switch = locationPort.switch ' +
                    'AND device.port = locationPort.port ' +
                    'MERGE (locationPort)-[:CONNECTED]->(devicePort) ' +
                    'RETURN locationPort, device, devicePort;';

        transactionStatements.push({
            statement: query
        });
    },


    createUnknownLocationPort : function () {

        var query = 'MATCH (devicePort:DevicePort) ' +
                    'WHERE NOT ()-[:CONNECTED]->(devicePort) ' +
                    'MERGE (locationPort:LocationPort {' +
                    'name: "UNKNOWN"' +
                    '})-[:CONNECTED]->(devicePort) ' +
                    'RETURN devicePort, locationPort;';

        transactionStatements.push({
            statement: query
        });
    },


    createDeviceSwitchConnection : function () {

        var query = 'MATCH (switch:Switch)-[:SWITCHPORT]->(switchPort:SwitchPort)-[:CONNECTED]->(switchPortRoom:SwitchPortRoom) ' +
                    'MATCH (locationPort:LocationPort)-[:CONNECTED]->(devicePort:DevicePort)-[:CONNECTED]->(device:Device) ' +
                    'WHERE locationPort.name = "UNKNOWN" ' +
                    'AND switch.name = device.switch ' +
                    'AND switchPort.name = device.port ' +
                    'MERGE (switchPortRoom)-[:CONNECTED]->(locationPort) ' +
                    'RETURN switch, switchPort, switchPortRoom, locationPort, devicePort, device;';

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
                console.log('[DeviceService.js] Added all statements to transaction');
                resolve();
            });
        });
    }
};

module.exports = DeviceService;