const { spawn } = require('child_process');
const fs = require('fs');

const processNOAA = require('./lib/processNOAA.js');
const processMETEOR = require('./lib/processMETEOR.js');

// load config
let config = require(__dirname + '/config.json');
console.log('Config loaded');
// update config paths
console.log('Updating paths...');
if (config.dataDir.charAt(0) !== '/') {
	config.dataDir = __dirname + '/' + config.dataDir;
};
config.tleFile = config.dataDir + '/tledb.txt';

const pass = JSON.parse(process.argv.slice(2)[0]);

let date = new Date(pass.start).toLocaleString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', minute: 'numeric', hour12: false});
date = date.replace(/,/g, '').replace(/:/g, ' ').replace(/\//g, ' ').split(' ');
date = date[2] + '-' + date[0] + '-' + date[1] + '_' + date[3] + '-' + date[4];

const name = pass.sat.name.replace(/\s/g, '') + '_' + date;
const path = config.dataDir + '/' + name + '/';

if (!fs.existsSync(path)){
	fs.mkdirSync(path);
}

let rtl;
let sox;
let recordTimer;

if (pass.sat.noaa) {
	rtl = spawn('rtl_fm', ['-M', 'fm', '-f', pass.sat.freq, '-s', pass.sat.samplerate, '-g', pass.sat.gain, '-E', 'deemp', '-F', '9', '-']);
	sox = spawn('sox', ['-t', 'raw', '-r', pass.sat.samplerate, '-c', '1', '-e', 's', '-b', '16', '-', '-t', 'wav', path + name + '.pregain.wav', 'rate', '11025']);

} else if (!pass.sat.noaa) {
	rtl = spawn('rtl_fm', ['-M', 'raw', '-f', pass.sat.freq, '-s', pass.sat.samplerate, '-g', pass.sat.gain, '-']);
	sox = spawn('sox', ['-t', 'raw', '-r', pass.sat.samplerate, '-c', '2', '-e', 's', '-b', '16', '-', '-t', 'wav', path + name + '.raw.wav', 'rate', '140000']);

} else {
	process.exit(1);
}

// pipe sdr to sox
rtl.stdout.pipe(sox.stdin);
// log sdr/sox text output
rtl.stderr.on('data', (data) => {
	console.log(data.toString());
});
sox.stderr.on('data', (data) => {
	console.log(data.toString());
});
// stop timer if sdr/sox exits unexpectedly
rtl.on('exit', () => {
	clearTimeout(recordTimer);
});
sox.on('exit', () => {
	clearTimeout(recordTimer);
})

recordTimer = setTimeout(async () => {
	await rtl.kill();
	await sox.kill();
	if (pass.sat.noaa) {
		processNOAA(config, pass, path, name);
	} else {
		processMETEOR(config, pass, path, name);
	}
}, pass.duration);

// kill child processes on exit
const exit = () => {
	console.log('killing child processes');
	rtl.kill();
	sox.kill();
};
process.on('SIGINT', exit); // catch ctrl-c
process.on('SIGTERM', exit); // catch kill
process.on('exit', exit); // catch exit
