const fs = require('fs');
const { Readable } = require('stream');
const { spawn } = require('child_process');

// load library modules
const checkDeps = require('./lib/checkDeps.js');
const updateTLE = require('./lib/updateTLE.js');
const createSchedule = require('./lib/createSchedule.js');

// load config
let config = require(__dirname + '/config.json');
console.log('Config loaded');

// update config paths
console.log('Updating paths...');
if (config.dataDir.charAt(0) !== '/') {
	config.dataDir = __dirname + '/' + config.dataDir;
};
config.tleFile = config.dataDir + '/tledb.txt';

// ------------------------------------
// we put this here because hooray asynchronous code
const afterChecks = () => {
	let passSchedule = createSchedule(config);
	let reScheduleDate;
	passSchedule.forEach((pass) => {
		let atDate = new Date(pass.start);
		reScheduleDate = new Date(pass.start + pass.duration + 60000);

		let dateComponents = atDate.toLocaleString(undefined, {year: 'numeric', month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric'}).replace(/,/g, '').split(' ');
		let dateString = dateComponents[3] + ' ' + dateComponents[4] + ' ' + dateComponents[0] + ' ' + dateComponents[1] + ' ' + dateComponents[2];

		let passCommand = new Readable;
		passCommand._read = () => {};
		passCommand.push('node ' + __dirname + '/recieve.js \'' + JSON.stringify(pass) + '\'');
		passCommand.push(null);

		let at = spawn('at', dateString.split(' '));

		passCommand.pipe(at.stdin);
	});

	let reScheduleComponents = reScheduleDate.toLocaleString(undefined, {year: 'numeric', month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric'}).replace(/,/g, '').split(' ');
	let reScheduleDateString = reScheduleComponents[3] + ' ' + reScheduleComponents[4] + ' ' + reScheduleComponents[0] + ' ' + reScheduleComponents[1] + ' ' + reScheduleComponents[2];
	
	let reSchedule = new Readable;
	reSchedule._read = () => {};
	reSchedule.push('node ' + __dirname + '/index.js');
	reSchedule.push(null);

	let at = spawn('at', reScheduleDateString.split(' '));

	reSchedule.pipe(at.stdin);
}

// ------------------------------------

// check shell dependencies (rtl_fm, sox, etc)
console.log('Checking shell dependencies...');
checkDeps().then(() => {
	// check if tle file is out of date (older than 2 days)
	const date = new Date();
	if (!fs.existsSync(config.tleFile)) {
		// update TLE database from internet
		console.log('Creating TLE database from ' + config.tleURL);
		updateTLE(config.tleURL, config.tleFile).then(() => {
			console.log('TLE database successfully created!');
			afterChecks();
		});
	} else if (fs.statSync(config.tleFile).mtime < new Date(date.setDate(date.getDate() - 2))) {
		// update TLE database from internet
		console.log('Updating TLE database from ' + config.tleURL);
		updateTLE(config.tleURL, config.tleFile).then(() => {
			console.log('TLE database successfully updated!');
			afterChecks();
		});
	} else {
		afterChecks();
	};
}, () => {
	// exit if deps aren't met
	process.exit(1);
});
