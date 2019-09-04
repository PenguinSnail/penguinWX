import * as classes from './classes';

import checkDeps from './dependencies';

import updateTLE from './schedule/tle';
import createSchedule from './schedule/create';

import * as path from 'path';
import * as fs from 'fs';

// messy config import
const configFileContents = require('../config.json');
let config = new classes.config(configFileContents);

const afterChecks = () => {
	const passSchedule = createSchedule(config);
	
	console.log(passSchedule);
};

// check if dependencies are met
checkDeps().then(() => {
	console.log('All dependencies met!\n');

	const date = new Date();
	// does the TLE file exist?
	if (!fs.existsSync(config.tleFile)) {
		// update TLE database from internet
		console.log('Creating TLE database from ' + config.tleURL);

		updateTLE(config.tleURL, config.tleFile).then(() => {
			console.log('TLE database successfully created!');
			afterChecks();
		});

	// else is the file older than 2 days?
	} else if (fs.statSync(config.tleFile).mtime < new Date(date.setDate(date.getDate() - 2))) {
		// update TLE database from internet
		console.log('Updating TLE database from ' + config.tleURL);
		updateTLE(config.tleURL, config.tleFile).then(() => {
			console.log('TLE database successfully updated!');
			afterChecks();
		});
	} else {
		afterChecks();
	}
}, () => {
	process.exit(1);
});