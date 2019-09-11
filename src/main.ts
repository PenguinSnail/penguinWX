import * as classes from './classes';

import checkDeps from './dependencies';

import updateTLE from './schedule/tle';
import createSchedule from './schedule/create';

import processNOAA from './receive/processing/noaa';
import processMETEOR from './receive/processing/meteor';

import * as path from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';

// messy config import
const configFileContents = require('../config.json');
let config = new classes.config(configFileContents);

const schedule = () => {
	// create a pass schedule
	const passSchedule = createSchedule(config);
	// blank date to schedule creating a new schedule
	// each time we schedule a pass this is set to 2 minutes after the pass ends
	let reScheduleDate: Date;

	console.log(passSchedule);

	// for each pass
	passSchedule.forEach((pass) => {
		// get a date for the pass start
		const atDate = new Date(pass.start);
		// set the reschedule date to 2 minutes after the pass end
		reScheduleDate = new Date(pass.start + pass.duration + (60000 * 2));

		// at takes human readable dates for scheduling, so here's some messy text parsing
		// get a date string including local date and time
		// split the date string at each space
		// stitch the pieces together into a date at will take
		const dateComponents = atDate.toLocaleString('en-US', {year: 'numeric', month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric'}).replace(/,/g, '').split(' ');
		const dateString = dateComponents[3] + ' ' + dateComponents[4] + ' ' + dateComponents[0] + ' ' + dateComponents[1] + ' ' + dateComponents[2];

		// at makes you pipe the command into it, so we need a stream for our command string
		// set contents of the stream to this executable, plus a json string of our pass
		let passCommand = new Readable;
		passCommand._read = () => {};
		passCommand.push('node ' + __filename + ' \'' + JSON.stringify(pass) + '\'');
		passCommand.push(null);

		// at command for scheduling with the date string passed in
		let at = spawn('at', dateString.split(' '));

		// pipe our pass command stream into at to schedule
		passCommand.pipe(at.stdin);
	});

	// after all the passes are scheduled, format the reschedule date for at
	// the passes are done in chronological order, so after they're all scheduled the reschedule date will be 2 minutes after the final pass
	const reScheduleComponents = reScheduleDate.toLocaleString('en-US', {year: 'numeric', month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric'}).replace(/,/g, '').split(' ');
	const reScheduleDateString = reScheduleComponents[3] + ' ' + reScheduleComponents[4] + ' ' + reScheduleComponents[0] + ' ' + reScheduleComponents[1] + ' ' + reScheduleComponents[2];
	
	// stream for command
	let reSchedule = new Readable;
	reSchedule._read = () => {};
	reSchedule.push('node ' + __filename);
	reSchedule.push(null);

	// at command
	let at = spawn('at', reScheduleDateString.split(' '));

	// pipe the stream
	reSchedule.pipe(at.stdin);
};

const receive = (pass: classes.pass) => {
	console.log('Receiving pass:');
	console.log(pass);
	
	// messy text parsing to get an ISO 8601 date string
	const date = new Date(pass.start).toLocaleString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: false});
	const dateParts = date.replace(/,/g, '').replace(/:/g, ' ').replace(/\//g, ' ').split(' ');
	const dateFormatted: string = dateParts[2] + '-' + dateParts[0] + '-' + dateParts[1] + '_' + dateParts[3] + '-' + dateParts[4];

	// create our pass ID and path to where it will be recorded
	const passName = dateFormatted + '_' + pass.satellite.name.replace(/\s/g, '');
	const passPath = path.resolve(config.dataDir, passName);
	// create the pass path if it doesn't already exist as a directory
	if (!fs.existsSync(passPath)){
		fs.mkdirSync(passPath);
	};

	// vars for our child processes
	let rtl: ChildProcessWithoutNullStreams;
	let sox: ChildProcessWithoutNullStreams;
	let recordTimer: NodeJS.Timeout;

	let afterRecord = () => {};

	// define noaa rtl and sox commands
	if (pass.satellite.type === 'noaa') {
		rtl = spawn('rtl_fm', ['-M', 'fm', '-f', pass.satellite.frequency.toString(), '-s', pass.satellite.samplerate.toString(), '-g', pass.satellite.gain.toString(), '-E', 'deemp', '-E', 'dc', '-F', '9', '-']);
		sox = spawn('sox', ['-t', 'raw', '-r', pass.satellite.samplerate.toString(), '-c', '1', '-e', 's', '-b', '16', '-', '-t', 'wav', path.resolve(passPath, passName + '.pregain.wav'), 'rate', '11025']);
		if (!pass.satellite.skipProcessing) {
			afterRecord = () => {
				processNOAA(config, pass, passPath, passName);
			};
		} else {
			console.log('Skip processing flag set!');
		};
	// define meteor rtl and sox commands
	} else if (pass.satellite.type === 'meteor') {
		rtl = spawn('rtl_fm', ['-M', 'raw', '-f', pass.satellite.frequency.toString(), '-s', pass.satellite.samplerate.toString(), '-g', pass.satellite.gain.toString(), '-E', 'dc', '-']);
		sox = spawn('sox', ['-t', 'raw', '-r', pass.satellite.samplerate.toString(), '-c', '2', '-e', 's', '-b', '16', '-', '-t', 'wav', path.resolve(passPath, passName + '.raw.wav'), 'rate', pass.satellite.samplerate.toString()]);
		if (!pass.satellite.skipProcessing) {
			afterRecord = () => {
				processMETEOR(config, pass, passPath, passName);
			};
		} else {
			console.log('Skip processing flag set!');
		};
	} else {
		console.error(`ERROR: Unknown satellite type ${pass.satellite.type}`);
		process.exit(1);
	};

	// set pass recording timer
	recordTimer = setTimeout(() => {
		// kill sox when rtl exits
		rtl.on('exit', () => {
			sox.kill();
		});
		// start processing when sox exits
		sox.on('exit', () => {
			afterRecord();
		});
		// kill rtl
		rtl.kill();
	}, pass.duration);

	// pipe sdr to sox
	rtl.stdout.pipe(sox.stdin);
	// log sdr/sox text output
	rtl.stderr.on('data', (data: any) => {
		console.log(data.toString());
	});
	sox.stderr.on('data', (data: any) => {
		console.log(data.toString());
	});
	// stop timer if sdr/sox exits unexpectedly
	rtl.on('exit', () => {
		clearTimeout(recordTimer);
		console.log('rtl exited');
	});
	sox.on('exit', () => {
		clearTimeout(recordTimer);
		console.log('sox exited');
	});

	// kill child processes on exit
	const exit = () => {
		console.log('killing child processes');
		rtl.kill();
		sox.kill();
	};
	process.on('SIGINT', exit); // catch ctrl-c
	process.on('SIGTERM', exit); // catch kill
	process.on('exit', exit); // catch exit
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