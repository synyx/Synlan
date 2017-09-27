var Promise = require('promise');
var http    = require('http');
var snmp    = require('snmp-native');

var DataService = {

    generateData : function (config) {

        var data = [];

        return new Promise(function (resolve) {

            DataService.getIPAMData(config)
                .then(function (IPAM) {
                    data['IPAM'] = IPAM;
                    return Promise.resolve();
                })
                .then(function () {
                    return DataService.getSNMPData(config);
                })
                .then(function (SNMP) {
                    data['SNMP'] = SNMP;
                    return Promise.resolve();
                })
                .then(function () {
                    resolve(data);
                });

        });
    },


    /**
     * Loading all devices from IP address management tool.
     * @returns {Array}
     */
    getIPAMData : function (config) {

        return new Promise (function (resolve) {

            var data = [];

            http.get({
                "host" : config.general.host,
                "path" : config.general.path,
                "port" : 80,
                "method" : "GET",
                "headers" : {
                    "Accept" : "application/json"
                }
            }, function (res) {

                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    console.log('[DataService.js] Finished loading from IPAM');
                    resolve(data);
                });
            });

        });
    },

    /**
     * Loading all MAC-Addresses and Ports from Switch.
     * @returns {Array}
     */
    getSNMPData : function (config) {

        var data = [];
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
                            data.push({
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
                            resolve(data);
                        }
                    }
                });
            });
        });
    }
};

module.exports = DataService;

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
