const { spawn } = require('child_process');
const email = require('./email.js');
const tweet = require('./twitter.js');

let afterProcessing = (config, pass, path, name) => {
	if (pass.sat.email) {
		email(config, name, name, [path + name + '.png', path + name + '_map.png', path + name + '_msa_map.png', path + name + '_precip.png']);
	};
	if (pass.sat.tweet) {
		tweet(config, pass, [path + name + '.png', path + name + '_map.png', path + name + '_msa_map.png', path + name + '_precip.png']);
	};
}

module.exports = (config, pass, path, name) => {
	console.log('Processing NOAA satellite...');
	let normalize = spawn ('sox', [path + name + '.pregain.wav', path + name + '.wav', 'gain', '-n']);
	let wxtoimg;
	let wxmap;
	normalize.stdout.on('data', (data) => {
		console.log(data.toString());
	});
	normalize.stderr.on('data', (data) => {
		console.log(data.toString());
	});
	normalize.on('exit', () => {
		wxmap = spawn('wxmap', ['-T', pass.sat.name, '-H', config.tleFile, '-L', config.location.join('/'), Math.floor(pass.start / 1000) + 90, path + name + '.map']);
		wxmap.stdout.on('data', (data) => {
			console.log(data.toString());
		});
		wxmap.stderr.on('data', (data) => {
			console.log(data.toString());
		});
		wxmap.on('exit', () => {
			wxtoimg = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', path + name + '.wav', path + name + '.png']);
			wxtoimg.stdout.on('data', (data) => {
				console.log(data.toString());
			});
			wxtoimg.stderr.on('data', (data) => {
				console.log(data.toString());
			});
			wxtoimg.on('exit', () => {
				let wxtoimg_map = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-m', path + name + '.map', path + name + '.wav', path + name + '_map.png']);
				wxtoimg_map.stdout.on('data', (data) => {
					console.log(data.toString());
				});
				wxtoimg_map.stderr.on('data', (data) => {
					console.log(data.toString());
				});
				wxtoimg_map.on('exit', () => {
					let wxtoimg_msa = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-e', 'msa', '-m', path + name + '.map', path + name + '.wav', path + name + '_msa_map.png']);
					wxtoimg_msa.stdout.on('data', (data) => {
						console.log(data.toString());
					});
					wxtoimg_msa.stderr.on('data', (data) => {
						console.log(data.toString());
					});
					wxtoimg_msa.on('exit', () => {
						if (config.upgradedWxtoimg) {
							let wxtoimg_precip = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-e', 'msa-precip', '-m', path + name + '.map', path + name + '.wav', path + name + '_precip.png']);
							wxtoimg_precip.stdout.on('data', (data) => {
								console.log(data.toString());
							});
							wxtoimg_precip.stderr.on('data', (data) => {
								console.log(data.toString());
							});
							wxtoimg_precip.on('exit', () => {
								afterProcessing(config, pass, path, name);
							});
						} else {
							afterProcessing(config, pass, path, name);
						};
					});
				});
			});
		});
	});
};
