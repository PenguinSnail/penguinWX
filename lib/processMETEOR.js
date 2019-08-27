const { spawn } = require('child_process');
const email = require('./email.js');
const tweet = require('./twitter.js');

module.exports = (config, pass, path, name) => {
	console.log('Processing METEOR satellite...');

	let imgmean = 10000;

	let demod = spawn('meteor_demod', ['-o', path + name + '.s', '-B', path + name + '.raw.wav']);
	let decode;
	let convert;
	let rectify;
	let isblack;
	demod.stdout.on('data', (data) => {
		console.log(data.toString());
	});
	demod.on('exit', () => {
		decode = spawn('medet', [path + name + '.s', path + name, '-cd', '-S', '-t', '-r', '66']);
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
				rectify.on('exit', () => {
					isblack = spawn('convert', [path + name + '-rectified.jpg', '-format', '"%[mean]"', 'info:']);
					isblack.stderr.on('data', (data) => {
						console.log(data.toString());
					});
					isblack.stdout.on('data', (data) => {
						imgmean = parseFloat(JSON.parse(data.toString()));
						console.log(imgmean);
					});
					isblack.on('exit', () => {
						// should be > 10%
						if (imgmean > 6500) {
							if (pass.sat.email) {
								email(config, name, name, [path + name + '-rectified.jpg']);
							};
							if (pass.sat.tweet) {
								tweet(config, pass, [path + name + '-rectified.jpg']);
							};
						} else {
							console.log('processed image is too dark! - not uploading');
						}
					});
				});
			});
		});
	});
}
