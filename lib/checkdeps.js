const commandExists = require('command-exists');

module.exports = () => {
	// we require rtl_fm
	commandExists('rtl_fm').catch(() => {
		console.error('ERROR: rtl_fm not installed!');
		process.exit(1);
	});

	// we require sox
	commandExists('sox').catch(() => {
		console.error('ERROR: sox not installed!');
		process.exit(1);
	});
}