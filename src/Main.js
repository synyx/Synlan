var Promise         = require('promise');
var neo4j           = require('node-neo4j');

var ConfigService   = require('./service/ConfigService');
var DataService     = require('./service/DataService');
var SwitchService   = require('./service/SwitchService');
var LocationService = require('./service/LocationService');
var DeviceService   = require('./service/DeviceService');

console.log('Starting application...');

var config = ConfigService.generateConfig();
var networkData = [];

var neo4jDb = new neo4j(config.neo4j.url);

execute();


function execute () {

    DataService.generateData(config)

        .then(function (_networkData) {
            networkData = _networkData;
            return Promise.resolve();
        })

        .then(function () {
            return SwitchService.initSwitchService({
                'neo4j'  : neo4jDb,
                'data'   : networkData,
                'switches' : config.general.SNMP.switches
            });
        })

        .then(function () {
            return LocationService.initLocationService({
                'neo4j'     : neo4jDb,
                'locations' : config.locations
            });
        })

        .then(function () {
            return DeviceService.initDeviceService({
                'neo4j'         : neo4jDb,
                'devices_SNMP'  : networkData.SNMP,
                'devices_IPAM'  : networkData.IPAM,
                'switches'      : config.general.SNMP.switches,
                'trunkports'    : config.trunkports
            });
        });
}

module.exports = {
    initMain : function () {
        execute();
    }
};