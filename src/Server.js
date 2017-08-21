var ApiController   = require('./api/ApiController');
var Main            = require('./Main');
var ConfigService   = require('./service/ConfigService');

var config = ConfigService.generateConfig();


initScript();
initApi();


function initApi () {
    ApiController.initApiController(config);
}


function initScript () {
    setInterval(function () {
        Main.initMain();
    }, config.server.updateInterval * 60 * 1000);
}