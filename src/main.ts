import * as classes from './classes';

import checkDeps from './dependencies';

import updateTLE from './schedule/tle';
import createSchedule from './schedule/create';

import * as path from 'path';
import * as fs from 'fs';

// messy config import
const configFileContents = require('../config.json');
let config = new classes.config(configFileContents);

const schedule = () => {
	const passSchedule = createSchedule(config);

	console.log(passSchedule);
};

const receive = (pass: classes.pass) => {
	console.log('Receiving pass:');
	console.log(pass);

};

// check if dependencies are met
checkDeps().then(() => {
	console.log('All dependencies met!\n');

	// if a pass object was passed in then
	if (process.argv.length > 2) {
		const pass = JSON.parse(process.argv.slice(2)[0]);
		receive(pass);
	// else check tledb and schedule more passes
	} else {
		const date = new Date();
		// does the TLE file exist?
		if (!fs.existsSync(config.tleFile)) {
			// update TLE database from internet
			console.log('Creating TLE database from ' + config.tleURL);

			updateTLE(config.tleURL, config.tleFile).then(() => {
				console.log('TLE database successfully created!');
				schedule();
			});

		// else is the file older than 2 days?
		} else if (fs.statSync(config.tleFile).mtime < new Date(date.setDate(date.getDate() - 2))) {
			// update TLE database from internet
			console.log('Updating TLE database from ' + config.tleURL);
			updateTLE(config.tleURL, config.tleFile).then(() => {
				console.log('TLE database successfully updated!');
				schedule();
			});
		} else {
			schedule();
		};
	};
}, () => {
	process.exit(1);
});