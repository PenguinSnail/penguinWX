const commandExists = require('command-exists');

export default () => new Promise<void>(async (resolve, reject) => {
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

	// wx* programs for NOAA
	await commandExists('wxtoimg').catch(() => {
		console.error('ERROR: wxtoimg not installed!');
		failed = true;
	});
	await commandExists('wxmap').catch(() => {
		console.error('ERROR: wxmap not installed!');
		failed = true;
	});

	// tools for decoding METEOR
	await commandExists('meteor_demod').catch(() => {
		console.error('ERROR: meteor_demod not installed!');
		failed = true;
	});
	await commandExists('meteor_decode').catch(() => {
		console.error('ERROR: medet not installed!');
		failed = true;
	});
	await commandExists('rectify.py').catch(() => {
		console.error('ERROR: rectify.py (meteor_rectify) not installed!');
		failed = true;
	});
	await commandExists('ffmpeg').catch(() => {
		console.error('ERROR: ffmpeg not installed!');
		failed = true;
	});
	await commandExists('convert').catch(() => {
		console.error('ERROR: imagemagick/convert not installed!');
		failed = true;
	});

	if (failed) {
		reject();
	} else {
		resolve();
	}
});