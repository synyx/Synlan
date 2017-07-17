var Promise = require('promise');
var http    = require('http');

var DataService = {

    generateData : function (config) {

        var data = [];

        return new Promise(function (resolve) {

            DataService.getIPAMData(config)
                    .then(function (IPAM) {
                        data['IPAM'] = IPAM;
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
            var ipam = config.general.IPAM;

            http.get(ipam, function (res) {

                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    data += chunk;
                });
                res.on('end', function () {
                    console.log('Finished loading all devices from IPAM');
                    resolve(data);
                });
            });

        });
    }
};

module.exports = DataService;