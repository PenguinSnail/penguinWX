const { spawn } = require('child_process');

module.exports = (config, pass, path, name) => {
	let normalize = spawn ('sox', [path + name + '.pregain.wav', pass + name + '.wav', 'gain', '-n']);
	let wxtoimg;
	let wxmap;
	normalize.on('exit', () => {
		//wxmap = spawn('wxmap', ['-H', config.tleFile, , path + name + '.map']);
		//wxmap.on('exit', () => {
			wxtoimg = spawn('wxtoimg', [path + name + '.wav', path + name + '.png']);
			
		//});
	});
};
