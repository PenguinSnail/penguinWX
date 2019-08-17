const { spawn } = require('child_process');
const pass = JSON.parse(process.argv.slice(2)[0]);

console.log(pass);
const path = pass.sat.name.replace(/\s/g, '');

let rtl;
let sox;
let recordTimer;

if (pass.sat.noaa) {
	rtl = spawn('rtl_fm', ['-f', pass.sat.freq, '-s', pass.sat.samplerate, '-g', pass.sat.gain, '-E', 'wav', '-']);
	sox = spawn('sox', ['-t', 'wav', '-', path + '/' + path + '.wav', 'gain', '-n', 'remix', '1-2', 'rate', '11025']);

} else if (!pass.sat.noaa) {
	rtl = spawn('rtl_fm', ['-M', 'raw', '-f', pass.sat.freq, '-s', pass.sat.samplerate, '-g', pass.sat.gain, '-']);
	sox = spawn('sox', ['-t', 'raw', '-r', pass.sat.samplerate, '-c', '2', '-b', '16', '-e', 's', '-', '-t', 'wav', path + '.raw.wav', 'rate', pass.sat.samplerate])

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
rtl.on('exit', (code) => {
	if (code !== 0) {clearTimeout(recordTimer)};
});
sox.on('exit', (code) => {
	if (code !== 0) {clearTimeout(recordTimer)};
})

recordTimer = setTimeout(() => {
	rtl.kill();
	sox.kill();
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
