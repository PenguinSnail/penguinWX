import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import del from 'del';

import * as classes from '../../classes';

// initialize the image file list
let imagefiles = [];

const postProcessing = (config: classes.config, pass: classes.pass, passPath: string, passName: string) => {

};

export default (config: classes.config, pass: classes.pass, passPath: string, passName: string) => {
	console.log('Processing NOAA satellite...');

	// normalize the recording with sox
	let normalize = spawn ('sox', [path.resolve(passPath, passName + '.pregain.wav'), path.resolve(passPath, passName + '.wav'), 'gain', '-n']);
	normalize.stderr.on('data', (data) => {
		console.log(data.toString());
	});

	// after normalizing
	normalize.on('exit', () => {
		// delete the pregain file
		del([path.resolve(passPath, name + '.pregain.wav')]).then((deletedpaths: string[]) => {
			console.log('Deleted files: ' + deletedpaths.join('\n'));

			// generate the map overlay
			let wxmap = spawn('wxmap', ['-T', pass.satellite.name, '-H', config.tleFile, '-L', config.location.join('/'), (Math.floor(pass.start / 1000) + 90).toString(), path.resolve(passPath, passName + '.map')]);
			wxmap.stdout.on('data', (data) => {
				console.log(data.toString());
			});
			wxmap.stderr.on('data', (data) => {
				console.log(data.toString());
			});

			wxmap.on('exit', () => {
				// generate plain image
				let wxtoimg = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', path.resolve(passPath, name + '.wav'), path.resolve(passPath, passName + '.png')]);
				wxtoimg.stdout.on('data', (data) => {
					console.log(data.toString());
				});
				wxtoimg.stderr.on('data', (data) => {
					console.log(data.toString());
				});

				wxtoimg.on('exit', () => {
					// add processed image to image list
					imagefiles.push(path.resolve(passPath, passName + '.png'));

					// generate plain image with map overlay
					let wxtoimg_map = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-m', path.resolve(passPath, passName + '.map'), path.resolve(passPath, passName + '.wav'), path.resolve(passPath, passName + '_map.png')]);
					wxtoimg_map.stdout.on('data', (data) => {
						console.log(data.toString());
					});
					wxtoimg_map.stderr.on('data', (data) => {
						console.log(data.toString());
					});

					wxtoimg_map.on('exit', () => {
						// add processed image to image list
						imagefiles.push(path.resolve(passPath, passName + '_map.png'));

						// generate precipitation enhanced image
						let wxtoimg_no = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-e', 'no', '-m', path.resolve(passPath, passName + '.map'), path.resolve(passPath, passName + '.wav'), path.resolve(passPath, passName + '_no.png')]);
						wxtoimg_no.stdout.on('data', (data) => {
							console.log(data.toString());
						});
						wxtoimg_no.stderr.on('data', (data) => {
							console.log(data.toString());
						});

						wxtoimg_no.on('exit', () => {
							// add processed image to image list
							imagefiles.push(path.resolve(passPath, passName + '_no.png'));

							// generate false color image
							let wxtoimg_msa = spawn('wxtoimg', [pass.northbound ? '-N' : '-S', '-e', 'msa', '-m', path.resolve(passPath, passName + '.map'), path.resolve(passPath, passName + '.wav'), path.resolve(passPath, passName + '_msa.png')]);
							// initialize variable for the processing command output
							let stderrstring = '';
							wxtoimg_msa.stdout.on('data', (data) => {
								console.log(data.toString());
							});
							wxtoimg_msa.stderr.on('data', (data) => {
								console.log(data.toString());
								stderrstring = stderrstring + data.toString();
							});

							wxtoimg_msa.on('exit', () => {
								// if the enhancement wasn't done or the sun is very low, skip the image
								if (stderrstring.includes('warning: enhancement ignored') || stderrstring.includes('warning: solar elevation')) {
									console.log('MSA enhancement unusable - deleting file...');

									del([path.resolve(passPath, passName + '_msa.png')]).then((deletedpaths: string[]) => {
										console.log('Deleted files: ' + deletedpaths.join('\n'));

										postProcessing(config, pass, passPath, passName);
									});
								} else {
									// add processed image to image list
									imagefiles.push(path + name + '_msa.png');

									postProcessing(config, pass, passPath, passName);
								};
							});
						});
					});
				});
			});
		});
	});

};