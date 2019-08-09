const fs = require('fs');
const https = require('https');

module.exports = (tleURL, tlePath) => {
	const file = fs.createWriteStream(tlePath);
	https.get(tleURL, (response) => {
		response.pipe(file);
		file.on('finish', () => {
			file.close();
		});
	}).on('error', (e) => {
		console.log('Error updating TLE database!');
		console.error(e);
		process.exit(1);
	});
}