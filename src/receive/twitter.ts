import Twit from 'twit';
import * as fs from 'fs';

import * as classes from '../classes';

let T: Twit;

let postFailCount = 3;

const afterUploads = (statusString: string, mediaIds: string[]) => {
	if (mediaIds.length > 0) {
		T.post('statuses/update', { status: statusString, media_ids: mediaIds }, (err, data, response) => {
			if (err) {
				console.log('Tweet ERROR:');
				console.log(err);
				postFailCount = postFailCount - 1;
				if (postFailCount > 0) {
					console.log('retrying post...');
					afterUploads(statusString, mediaIds);
				} else {
					console.error('Failed to tweet after 3 attempts!');
				}
			} else {
				console.log('Tweeted images!');
			};
		});
	};
};

const upload = (b64content: string): Promise<string> => new Promise((resolve, reject) => {
	console.log('Uploading an image...');

	let failCount = 3;

	// twitter api image post
	const uploadimg = () => {
		T.post('media/upload', { media_data: b64content }, (err, data: any) => {
			if (err) {
				console.error('IMAGE UPLOAD ERROR:');
				console.log(err);
	
				failCount = failCount - 1;
				if (failCount > 0) {
					uploadimg();
				} else {
					reject();
				};
			} else {
				resolve(data.media_id_string);
			};
		});
	};

	uploadimg();
});

export default (config: classes.config, pass: classes.pass, imgfiles: string[]) => {
	// define twitter api
	T = new Twit(config.twitterSettings);

	// initialize media id array and upload counter
	let mediaIds: any[];
	let uploadCounter = 0;

	// nicely formatted pass date string
	const date = new Date(pass.start);
	const dateParts = date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric', timeZoneName: 'short'}).split(', ');
	const dateString = dateParts[0] + ', ' + dateParts[1] + '\n' + dateParts[2];

	// define status string
	const statusString = pass.satellite.name + '\n' + dateString;

	console.log('\n\n' + statusString + '\n\n');

	imgfiles.forEach((item) => {
		// if the image file exists
		if (fs.existsSync(item)) {
			// read b64 encoded contents of imagefile
			const b64content = fs.readFileSync(item, { encoding: 'base64' });

			upload(b64content).then((id) => {
				console.log('Image uploaded!');

				// push media id
				mediaIds.push(id);

				// increment upload counter
				uploadCounter = uploadCounter + 1;
				// if we've uploaded all the images:
				if (uploadCounter === imgfiles.length) {
					afterUploads(statusString, mediaIds);
				};
			}, () => {
				// increment upload counter
				uploadCounter = uploadCounter + 1;
				// if we've uploaded all the images:
				if (uploadCounter === imgfiles.length) {
					afterUploads(statusString, mediaIds);
				};
			});
			
		} else {
			console.log('Image doesn\'t exist - skipping!');

			// increment upload counter
			uploadCounter = uploadCounter + 1;
			// if we've uploaded all the images:
			if (uploadCounter === imgfiles.length) {
				afterUploads(statusString, mediaIds);
			};
		};
	});
};
