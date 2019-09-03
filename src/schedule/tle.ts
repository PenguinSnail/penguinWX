import * as fs from 'fs';
import * as https from 'https';

export default (tleURL: string, tlePath: string) => new Promise<boolean>((resolve) => {
	// backup the old TLE file
	fs.rename(tlePath, tlePath + '.old', (e) => {
		if (e) {
			// end on an error
			console.error('ERROR backing up old TLE file: ', e);
			resolve(false);
		} else {
			// write stream for TLE file
			const file = fs.createWriteStream(tlePath);

			// get request for TLE file
			https.get(tleURL, (response) => {
				// pipe response data to the file write stream
				response.pipe(file);

				// on finish writing close the file
				// on close resolve the promise
				file.on('finish', () => {
					file.close();
				});
				file.on('close', () => {
					resolve(true);
				});

			// on GET error
			}).on('error', (e) => {
				// log the error
				console.log('Error updating TLE database: ', e);

				// restore old TLE file
				fs.rename(tlePath, tlePath + '.old', (e) => {
					if (e) {
						// end on an error
						console.error('ERROR restoring old TLE file: ', e);
						process.exit(1);
					} else {
						resolve(false);
					};
				});
			});
		};
	});
});