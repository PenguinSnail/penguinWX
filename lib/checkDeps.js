const commandExists = require('command-exists');

module.exports = () => {
	return new Promise(async (resolve, reject) => {
		let failed = false;

		// we require rtl_fm
		await commandExists('rtl_fm').catch(() => {
			console.error('ERROR: rtl_fm not installed!');
			failed = true;
		});

		// we require sox
		await commandExists('sox').catch(() => {
			console.error('ERROR: sox not installed!');
			failed = true;
		});

		// at for scheduling
		await commandExists('at').catch(() => {
			console.error('ERROR: at not installed!');
			failed = true;
		});

		if (failed) {
			reject();
		} else {
			resolve();
		}
	});
}