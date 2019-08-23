const { spawn } = require('child_process');
const emailImg = require('./email.js');

module.exports = (config, pass, path, name) => {
	console.log('Processing NOAA satellite...');
	let normalize = spawn ('sox', [path + name + '.pregain.wav', pass + name + '.wav', 'gain', '-n']);
	let wxtoimg;
	let wxmap;
	normalize.stdout.on('data', (data) => {
		console.log(data.toString());
	});
	normalize.stderr.on('data', (data) => {
		console.log(data.toString());
	});
	normalize.on('exit', () => {
		//wxmap = spawn('wxmap', ['-H', config.tleFile, , path + name + '.map']);
		//wxmap.on('exit', () => {
			wxtoimg = spawn('wxtoimg', [path + name + '.wav', path + name + '.png']);
			wxtoimg.stdout.on('data', (data) => {
				console.log(data.toString());
			});
			wxtoimg.stderr.on('data', (data) => {
				console.log(data.toString());
			});
			wxtoimg.on('exit', () => {
				if (pass.sat.email) {
					emailImg(config, name, name, path + name + '.png');
				}
			});
		//});
	});
};
