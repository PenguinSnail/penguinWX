const { spawn } = require('child_process');
const email = require('./email.js');
const tweet = require('./twitter.js');
const del = require('del');

let imagefiles = [];

let afterProcessing = (config, pass, path, name) => {
	if (pass.sat.email) {
		email(config, name, name, imagefiles);
	};
	if (pass.sat.tweet) {
		tweet(config, pass, imagefiles);
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
		del([path + name + '.pregain.wav']).then((deletedpaths) => {
			console.log('Deleted files: ' + deletedpaths.join('\n'));

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
					imagefiles.push(path + name + '.png');

					let wxtoimg_map = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-m', path + name + '.map', path + name + '.wav', path + name + '_map.png']);
					wxtoimg_map.stdout.on('data', (data) => {
						console.log(data.toString());
					});
					wxtoimg_map.stderr.on('data', (data) => {
						console.log(data.toString());
					});
					wxtoimg_map.on('exit', () => {
						imagefiles.push(path + name + '_map.png');

						let wxtoimg_no = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-e', 'no', '-m', path + name + '.map', path + name + '.wav', path + name + '_no.png']);
						wxtoimg_no.stdout.on('data', (data) => {
							console.log(data.toString());
						});
						wxtoimg_no.stderr.on('data', (data) => {
							console.log(data.toString());
						});
						wxtoimg_no.on('exit', () => {
							imagefiles.push(path + name + '_no.png');

							let wxtoimg_msa = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-e', 'msa', '-m', path + name + '.map', path + name + '.wav', path + name + '_msa.png']);
							let stderrstring = '';
							wxtoimg_msa.stdout.on('data', (data) => {
								console.log(data.toString());
							});
							wxtoimg_msa.stderr.on('data', (data) => {
								console.log(data.toString());
								stderrstring = stderrstring + data.toString();
							});
							wxtoimg_msa.on('exit', () => {
								if (stderrstring.includes('warning: enhancement ignored') || stderrstring.includes('warning: solar elevation')) {
									console.log('MSA enhancement unusable - deleting file...');
									del([path + name + '_msa.png']).then((deletedpaths) => {
										console.log('Deleted files: ' + deletedpaths.join('\n'));
										afterProcessing(config, pass, path, name);
									});
								} else {
									imagefiles.push(path + name + '_msa.png');
									afterProcessing(config, pass, path, name);
								};
							});
						});
					});
				});
			});
		});
	});
};
