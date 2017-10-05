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
var transactionId = 0;


function execute (updateInterval) {

    DataService.generateData(config)

        .then(function (_networkData) {
            networkData = _networkData;
            return Promise.resolve();
        })

        .then(function () {
            return new Promise(function (resolve) {
                neo4jDb.beginTransaction(function (err, result) {
                    transactionId = result._id;
                    console.log('[Main.js] Beginned transaction with id: ' + transactionId);
                    resolve();
                });
            });
        })

        .then(function () {
            return SwitchService.initSwitchService({
                'neo4j'         : neo4jDb,
                'transactionId' : transactionId,
                'data'          : networkData,
                'switches'      : config.general.SNMP.switches
            });
        })

        .then(function () {
            return LocationService.initLocationService({
                'neo4j'         : neo4jDb,
                'transactionId' : transactionId,
                'locations'     : config.locations
            });
        })

        .then(function () {
            return DeviceService.initDeviceService({
                'neo4j'         : neo4jDb,
                'transactionId' : transactionId,
                'mapped_devices': networkData.MAPPED
            });
        })

        .then(function () {
            return new Promise(function (resolve) {
                neo4jDb.commitTransaction(transactionId, function (err) {
                    if(err) throw err;
                    console.log('[Main.js] Committed transaction with id: ' + transactionId);
                    resolve();
                });
            })
        })
        
        .then(function () {
            setTimeout(function () {
                execute(updateInterval);
            }, updateInterval)
        });
}

module.exports = {
    initMain : function (updateInterval) {
        execute(updateInterval);
    }
};