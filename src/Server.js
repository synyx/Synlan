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
    var interval = config.server.updateInterval;
    Main.initMain(interval * 60 * 1000);
}