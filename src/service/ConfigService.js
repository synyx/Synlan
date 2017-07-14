var fs = require('fs');

var ConfigService = {

    generateConfig : function () {

        var config = {};

        config['general'] = ConfigService.getGeneralConfig();

        return config;
    },

    getGeneralConfig : function () {
        return JSON.parse(fs.readFileSync('./config/general.json', 'utf8'));
    }
};

module.exports = ConfigService;
