const Twit = require('twit');
const fs = require('fs');

let T;
let mediaIds = [];
let uploadCounter = 0;
let statusString = '';
let failCount = 0;

/* https://www.makeuseof.com/tag/photo-tweeting-twitter-bot-raspberry-pi-nodejs/ */

const afterUploads = () => {
	T.post('statuses/update', { status: statusString, media_ids: mediaIds }, (err, data, response) => {
		if (err) {
			console.log('Tweet ERROR:');
			console.log(err);
			failCount = failCount + 1;
			if (failCount < 3) {
				console.log('retrying post...');
				afterUploads();
			} else {
				console.log('failed after 3 attempts')
			}
		} else {
			console.log('Tweeted images!');
		};
	});
};

module.exports = (config, pass, images) => {
	T = new Twit(config.twitter);
	
	const date = new Date(pass.start);
	const dateParts = date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric', timeZoneName: 'short'}).split(', ');
	const dateString = dateParts[0] + ', ' + dateParts[1] + '\n' + dateParts[2];

	statusString = pass.sat.name + '\n' + dateString;

	console.log('\n\n' + statusString + '\n\n');

	images.forEach((item) => {
		if (fs.existsSync(item)) {
			const b64content = fs.readFileSync(item, { encoding: 'base64' });
			console.log('Uploading an image...');
			T.post('media/upload', { media_data: b64content }, (err, data, response) => {
				if (err) {
					console.log('Image Upload ERROR:');
					console.log(err);
				} else {
					console.log('Image uploaded!');
					mediaIds.push(data.media_id_string);
					uploadCounter = uploadCounter + 1;
					if (uploadCounter === images.length) {
						afterUploads();
					};
				};
			});
		} else {
			console.log('Image doesn\'t exist - skipping!');
			uploadCounter = uploadCounter + 1;
			if (uploadCounter === mediaIds.length) {
				afterUploads();
			};
		};
	});
};
