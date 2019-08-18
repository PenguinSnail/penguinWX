const { spawn } = require('child_process');

module.exports = (pass, path, name) => {
	let demod = spawn('meteor_demod', ['-o', path + name + '.s', '-B', '-m', pass.sat.modulation, path + name + '.raw.wav']);
	let decode;
	let convert;
	let rectify;
	let crop;
	demod.stdout.on('data', (data) => {
		console.log(data.toString());
	});
	demod.on('exit', () => {
		decode = spawn('medet', [path + name + '.s', path + name, '-cd', '-S', '-t']);
		decode.stdout.on('data', (data) => {
			console.log(data.toString());
		});
	});
}
