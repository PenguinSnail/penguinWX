const { spawn } = require('child_process');
const fs = require('fs');

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
	rtl = spawn('rtl_fm', ['-f', pass.sat.freq, '-s', pass.sat.samplerate, '-g', pass.sat.gain, '-E', 'wav', path + name + '.pre.wav']);

} else if (!pass.sat.noaa) {
	rtl = spawn('rtl_fm', ['-M', 'raw', '-f', pass.sat.freq, '-s', pass.sat.samplerate, '-g', pass.sat.gain, '-']);
	sox = spawn('sox', ['-t', 'raw', '-r', pass.sat.samplerate, '-c', '2', '-b', '16', '-e', 's', '-', '-t', 'wav', path + name + '.raw.wav', 'rate', pass.sat.samplerate]);

	// pipe sdr to sox
	rtl.stdout.pipe(sox.stdin);
	// log sox output to console
	sox.stderr.on('data', (data) => {
		console.log(data.toString());
	});
	sox.on('exit', (code) => {
		if (code !== 0) {clearTimeout(recordTimer)};
	});

} else {
	process.exit(1);
}


// log sdr text output
rtl.stderr.on('data', (data) => {
	console.log(data.toString());
});

// stop timer if sdr/sox exits unexpectedly
rtl.on('exit', (code) => {
	if (code !== 0) {clearTimeout(recordTimer)};
});

recordTimer = setTimeout(() => {
	rtl.kill();
	sox.kill();
}, pass.duration);

// kill child processes on exit
const exit = () => {
	console.log('killing child processes');
	rtl.kill();
	if (!pass.sat.noaa) {
		sox.kill();
	}
};
process.on('SIGINT', exit); // catch ctrl-c
process.on('SIGTERM', exit); // catch kill
process.on('exit', exit); // catch exit
