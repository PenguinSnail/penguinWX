const fs = require('fs');

// load library modules
const checkDeps = require('./lib/checkdeps.js');
const updateTLE = require('./lib/updatetle.js');

// load config
let config = require(__dirname + '/config.json');
console.log('Config loaded');

// update config paths
console.log('Updating paths...');
if (config.dataDir.charAt(0) !== '/') {
	config.dataDir = __dirname + '/' + config.dataDir;
};
config.tleFile = config.dataDir + '/tledb.tle';

// check shell dependencies (rtl_fm, sox, etc)
console.log('Checking shell dependencies...');
checkDeps();
console.log('All dependencies satisfied!');

// update TLE database from internet
console.log('Updating TLE database from ' + config.tleURL);
updateTLE(config.tleURL, config.tleFile);
console.log('TLE database successfully updated!');