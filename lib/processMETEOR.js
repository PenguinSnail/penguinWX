const { spawn } = require('child_process');

module.exports = (config, pass, path, name) => {
	let demod = spawn('meteor_demod', ['-o', path + name + '.s', '-B', '-m', pass.sat.modulation, path + name + '.raw.wav']);
	let decode;
	let convert;
	let rectify;
	demod.stdout.on('data', (data) => {
		console.log(data.toString());
	});
	demod.on('exit', () => {
		decode = spawn('medet', [path + name + '.s', path + name, '-cd', '-S', '-t']);
		decode.stdout.on('data', (data) => {
			console.log(data.toString());
		});
		decode.on('exit', () => {
			convert = spawn('ffmpeg', ['-i', path + name + '.bmp', '-q:v', '1', path + name + '.jpg']);
			convert.stdout.on('data', (data) => {
				console.log(data.toString());
			});
			convert.on('exit', () => {
				rectify = spawn('rectify-jpg', [path + name + '.jpg']);
			});
		});
	});
}
