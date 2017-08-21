var Promise = require('promise');

var devices_IPAM;
var devices_SNMP;
var switches;
var trunkPorts;
var neo4j;
var mappedDevices;

var DeviceService = {

    initDeviceService : function (config) {

        devices_IPAM    = config.devices_IPAM;
        devices_SNMP    = config.devices_SNMP;
        switches        = config.switches;
        trunkPorts      = config.trunkports;
        neo4j           = config.neo4j;

        mappedDevices = deviceFilter.IPAM_SNMP_Mapper           (devices_IPAM, devices_SNMP);
        mappedDevices = deviceFilter.unknownDeviceMapper        (devices_SNMP, mappedDevices);
        mappedDevices = deviceFilter.filterDuplicatedDevices    (switches, mappedDevices);
        mappedDevices = deviceFilter.filterHigherPorts          (switches, mappedDevices);

        return new Promise(function (resolve) {

            DeviceService.createDeviceNodes()
                .then(DeviceService.createDevicePorts)
                .then(DeviceService.createLocationConnection)
                .then(DeviceService.createUnknownLocationPort)
                .then(DeviceService.createDeviceSwitchConnection)
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
        var queryCounter = 0;
        var date = new Date();

        return new Promise(function (resolve) {

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

                neo4j.cypherQuery(_query, function (err) {
                    if(err) throw err;
                    queryCounter++;
                    if (queryCounter == mappedDevices.length) {
                        console.log('Created all device nodes');
                        resolve();
                    }
                })
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

        return new Promise(function (resolve) {

            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Created device port nodes');
                resolve();
            });
        });
    },


    createLocationConnection : function () {

        var query = 'MATCH (locationPort:LocationPort) ' +
                    'WITH locationPort ' +
                    'MATCH (devicePort:DevicePort)-[:CONNECTED]->(device:Device) ' +
                    'WHERE device.switch = locationPort.switch ' +
                    'AND device.port = locationPort.port ' +
                    'CREATE (locationPort)-[:CONNECTED]->(devicePort) ' +
                    'RETURN locationPort, device, devicePort;';

        return new Promise(function (resolve) {

            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Created location connection');
                resolve();
            });
        });
    },


    createUnknownLocationPort : function () {

        var query = 'MATCH (devicePort:DevicePort) ' +
                    'WHERE NOT ()-[:CONNECTED]->(devicePort) ' +
                    'MERGE (locationPort:LocationPort {' +
                    'name: "UNKNOWN"' +
                    '})-[:CONNECTED]->(devicePort) ' +
                    'RETURN devicePort, locationPort;';

        return new Promise(function (resolve) {

            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Created unknown location port nodes');
                resolve();
            });
        });
    },


    createDeviceSwitchConnection : function () {

        var query = 'MATCH (switch:Switch)-[:SWITCHPORT]->(switchPort:SwitchPort)-[:CONNECTED]->(switchPortRoom:SwitchPortRoom) ' +
                    'MATCH (locationPort:LocationPort)-[:CONNECTED]->(devicePort:DevicePort)-[:CONNECTED]->(device:Device) ' +
                    'WHERE locationPort.name = "UNKNOWN" ' +
                    'AND switch.name = device.switch ' +
                    'AND switchPort.name = device.port ' +
                    'CREATE (switchPortRoom)-[:CONNECTED]->(locationPort) ' +
                    'RETURN switch, switchPort, switchPortRoom, locationPort, devicePort, device;';

        return new Promise(function (resolve) {

            neo4j.cypherQuery(query, function (err) {
                if(err) throw err;
                console.log('Connected device part to switch part:');
                resolve();
            });
        });
    }
};


var deviceFilter = {

     IPAM_SNMP_Mapper : function (IPAM_Devices, SNMP_Devices) {

        var mappedData = [];
        var _IPAM_Devices = JSON.parse(IPAM_Devices);

         SNMP_Devices.forEach(function (snmp_device) {

             _IPAM_Devices.forEach(function (ipam_device) {

                if(ipam_device.mac === snmp_device.mac) {
                    mappedData.push({
                        'hostname' : ipam_device.hostname,
                        'ip'       : ipam_device.ip,
                        'mac'      : ipam_device.mac,
                        'type'     : ipam_device.type,
                        'port'     : snmp_device.port,
                        'switch'   : snmp_device.switch
                    });
                }
            });
        });

        return mappedData;
    },

    unknownDeviceMapper : function (SNMP_Devices, mappedDevices) {

        SNMP_Devices.forEach(function (snmp_device) {

            if(checkContainedMac(snmp_device, mappedDevices)) {

                mappedDevices.push({
                    'hostname' : 'UNKNOWN',
                    'ip'       : '-',
                    'mac'      : snmp_device.mac,
                    'type'     : snmp_device.type,
                    'port'     : snmp_device.port,
                    'switch'   : snmp_device.switch
                });
            }
        });
        return mappedDevices;
    },

    filterDuplicatedDevices : function (switches, mappedDevices) {

        var trunkPortObj = {};
        var filteredDevices;
        switches.forEach(function (_switch) {
            trunkPorts.forEach(function (trunkPort) {
                if(trunkPort.switch == _switch.name) {
                    trunkPortObj[_switch.name + '_' + trunkPort.port] =  true;
                }
            });
        });
        filteredDevices = mappedDevices.filter(function (mappedDevice) {
            return !trunkPortObj[mappedDevice.switch + '_' + mappedDevice.port];
        });
        return filteredDevices;
    },

    filterHigherPorts : function (switches, mappedDevices) {

        var trunkPortObj = {};
        var filteredDevices;

        switches.forEach(function (_switch) {
            trunkPortObj[_switch.name] = _switch.ports;
        });

        filteredDevices = mappedDevices.filter(function (device) {
            return trunkPortObj[device.switch] >= device.port;
        });
        return filteredDevices;
    }
};

function checkContainedMac (data, mappedData) {
    var check;
    check = mappedData.filter(function (_data) {
        return _data.mac === data.mac;
    });
    return check.length === 0;
}

module.exports = DeviceService;