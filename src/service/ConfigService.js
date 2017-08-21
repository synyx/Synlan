var fs = require('fs');

var ConfigService = {

    generateConfig : function () {

        var config = {};

        config['general']    = ConfigService.getGeneralConfig();
        config['neo4j']      = ConfigService.getNeo4jConfig();
        config['locations']  = ConfigService.getLocationConfig();
        config['trunkports'] = ConfigService.getTrunkportConfig();
        config['server']     = ConfigService.getServerConfig();

        return config;
    },

    getGeneralConfig : function () {
        return JSON.parse(fs.readFileSync('./config/general.json', 'utf8'));
    },

    getNeo4jConfig : function () {
        return JSON.parse(fs.readFileSync('./config/neo4j.json', 'utf8'));
    },

    getLocationConfig : function () {
        return JSON.parse(fs.readFileSync('./config/locations.json', 'utf8'));
    },

    getTrunkportConfig : function () {
        return JSON.parse(fs.readFileSync('./config/trunkports.json', 'utf8'));
    },

    getServerConfig : function () {
        return JSON.parse(fs.readFileSync('./config/server.json', 'utf8'));
    }
};

module.exports = ConfigService;
