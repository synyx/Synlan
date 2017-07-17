var ConfigService   = require('./service/ConfigService');
var DataService     = require('./service/DataService');

console.log('Starting application...');


var config = ConfigService.generateConfig();

DataService.generateData(config);
