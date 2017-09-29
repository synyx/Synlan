var Promise = require('promise');
var http    = require('http');
var snmp    = require('snmp-native');

var config;
var mappedDevices;
var data = [];

var DataService = {

    generateData : function (_config) {

        config = _config;

        return new Promise(function (resolve) {

            DataService.getIPAMData()
                .then(DataService.getSNMPData)
                .then(function () {
                    var switches = config.general.SNMP.switches;
                    mappedDevices = deviceFilter.map_snmp_ipam              (data['IPAM'], data['SNMP']);
                    mappedDevices = deviceFilter.unknownDeviceMapper        (data['SNMP'], mappedDevices);
                    mappedDevices = deviceFilter.filterDuplicatedDevices    (switches, mappedDevices, config.trunkports);
                    mappedDevices = deviceFilter.filterHigherPorts          (switches, mappedDevices);
                    data['MAPPED'] = mappedDevices;
                    resolve(data);
                });
        });
    },


    /**
     * Loading all devices from IP address management tool.
     * @returns {Array}
     */
    getIPAMData : function () {

        return new Promise (function (resolve) {

            var ipam_devices = [];

            http.get({
                "host" : config.general.IPAM,
                "port" : 80,
                "method" : "GET",
                "headers" : {
                    "Accept" : "application/json"
                }
            }, function (res) {

                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    ipam_devices += chunk;
                });
                res.on('end', function () {
                    console.log('[DataService.js] Finished loading from IPAM');
                    data['IPAM'] = ipam_devices;
                    resolve(data);
                });
            });

        });
    },

    /**
     * Loading all MAC-Addresses and Ports from Switch.
     * @returns {Array}
     */
    getSNMPData : function () {

        var snmp_devices = [];
        var counter = 0;
        var switches = config.general.SNMP.switches;

        return new Promise(function (resolve) {

            switches.forEach(function (_switch) {

                var session = new snmp.Session({ host: _switch.ip, community: _switch.community });

                session.getSubtree({ oid: [1,3,6,1,2,1,17,4,3,1,2] }, function (error, varbinds) {

                    if (error) {
                        console.log('[DataService.js] Failed to load SNMP informations from switch: ' + _switch.name);
                    } else {
                        varbinds.forEach(function (vb) {
                            var dezMac = '' + vb.oid;
                            var port   = vb.value;
                            dezMac     = dezMac.replace("1,3,6,1,2,1,17,4,3,1,2,", '');
                            snmp_devices.push({
                                'dezMac' : dezMac,
                                'mac'    : convertDezMacToHex(dezMac),
                                'port'   : port,
                                'type'   : vb.type,
                                'switch' : _switch.name
                            });
                        });
                        session.close();
                        counter++;
                        if(counter === switches.length){
                            console.log('[DataService.js] Finished loading all Macs and Ports from SNMP');
                            data['SNMP'] = snmp_devices;
                            resolve();
                        }
                    }
                });
            });
        });
    }
};


module.exports = DataService;


var deviceFilter = {

    map_snmp_ipam : function (IPAM_Devices, SNMP_Devices) {

        var mappedData = [];

        IPAM_Devices = JSON.parse(IPAM_Devices);

        SNMP_Devices.forEach(function (snmp_device) {

            IPAM_Devices.forEach(function (ipam_device) {

                if(ipam_device.mac === snmp_device.mac) {
                    mappedData.push({
                        'hostname' : ipam_device.hostname,
                        'ip'       : ipam_device.ip,
                        'mac'      : ipam_device.mac,
                        'user'     : ipam_device.user,
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

    filterDuplicatedDevices : function (switches, mappedDevices, trunkPorts) {

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

/**
 * Converts dezimal MAC-Address into Hexadezimal Mac-Adresse.
 * @param dezMac
 * @returns {string}
 */
function convertDezMacToHex (dezMac) {

    var dezMacArr = dezMac.split(',');
    var mac = '';
    dezMacArr.forEach(function (num) {
        num = parseInt(num);
        if(num < 16) {
            mac += '0'
        }
        mac += num.toString(16);
    });
    mac = mac.match( /.{1,2}/g )
        .join(':');
    return mac;
}


function checkContainedMac (data, mappedData) {
    var check;
    check = mappedData.filter(function (_data) {
        return _data.mac === data.mac;
    });
    return check.length === 0;
}
