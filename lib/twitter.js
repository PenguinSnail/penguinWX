Twit = require('twit');

/* https://www.makeuseof.com/tag/photo-tweeting-twitter-bot-raspberry-pi-nodejs/ */

module.exports = (config, pass, image) => {
	const T = new Twit(config.twitter);

	const b64content = fs.readFileSync(image, { encoding: 'base64' });
	
	const date = new Date(pass.start);
	const dateParts = date.toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: '2-digit', hour: 'numeric', minute: 'numeric', timeZoneName: 'short'}).split(', ');
	const dateString = dateParts[0] + ', ' + dateParts[1] + '\n' + dateParts[2];

	const status_string = pass.sat.name + '\n' + dateString;

	console.log('Uploading an image...');

	T.post('media/upload', { media_data: b64content }, function (err, data, response) {
		if (err) {
			console.log('ERROR:');
			console.log(err);
		} else {
			console.log('Image uploaded!');
			T.post('statuses/update', { status: status_string, media_ids: new Array(data.media_id_string) }, (err, data, response) => {
				if (err) {
					console.log('ERROR:');
					console.log(err);
				} else {
					console.log('Posted an image!');
				}
			});
		}
	});
};
