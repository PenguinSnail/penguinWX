// define valid satellite types
const satTypes = ['noaa', 'meteor'];

export class satellite {
	name: string
	type: string
	frequency: number
	samplerate: number
	gain: number
	email: boolean
	tweet: boolean
	tle?: string

	/**
	 * Checks a TLE for the proper format
	 * @param tle TLE to check
	 */
	private checkTLE(tle: string): boolean {
		// split TLE at newline characters
		const tleParts = tle.split('\n');
		// Should have 3 lines
		// Line 1 should be 24 characters and lines 2-3 should be 69 characters
		if (tleParts.length === 3 && tleParts[0].length === 24 && tleParts[1].length === 69 && tleParts[2].length === 69) {
			return true;
		} else {
			return false;
		};
	};

	/**
	 * Checks a TLE for the proper format and sets it
	 * @param tle TLE to check and set
	 */
	public setTLE(tle: string): boolean {
		// if the TLE format checks out, set it
		if (this.checkTLE(tle)) {
			this.tle = tle;
			return true;
		} else {
			return false;
		};
	};

	public constructor(data: {name: string, type: string, frequency: number, samplerate: number, gain: number, email: boolean, tweet: boolean, tle?: string}) {
		// does the satellite have a name defined?
		if (!data.name) {
			console.error('SATELLITE ERROR: Satellite name is not defined!');
			process.exit(1);
		// if so, is it a string?
		} else if (typeof(data.name) !== 'string') {
			console.error('SATELLITE ERROR: Satellite name is not a string!');
			process.exit(1);
		} else {
			this.name = data.name;
		};

		// does the satellite have a type defined?
		if (!data.type) {
			console.error(`SATELLITE ERROR (${data.name}): Satellite type is not defined!\nValid types: ${satTypes}`);
			process.exit(1);
		// if so, is it a valid type?
		} else if (!satTypes.includes(data.type)) {
			console.error(`SATELLITE ERROR (${data.name}): ${data.type} is not a valid satellite type!\nValid types: ${satTypes}`);
			process.exit(1);
		} else {
			this.type = data.type;
		};
		
		// does the satellite have a frequency defined?
		if (!data.frequency) {
			console.error(`SATELLITE ERROR (${data.name}): Satellite frequency is not defined!`);
			process.exit(1);
		// if so, is it a number?
		} else if (typeof(data.frequency) !== 'number') {
			console.error(`SATELLITE ERROR (${data.name}): Satellite frequency is not a number!`);
			process.exit(1);
		} else {
			this.frequency = data.frequency;
		};

		// does the satellite have a samplerate defined?
		if (!data.samplerate) {
			console.error(`SATELLITE ERROR (${data.name}): Satellite samplerate is not defined!`);
			process.exit(1);
		// if so, is it a number?
		} else if (typeof(data.samplerate) !== 'number') {
			console.error(`SATELLITE ERROR (${data.name}): Satellite samplerate is not a number!`);
			process.exit(1);
		} else {
			this.samplerate = data.samplerate;
		};

		// does the satellite have a gain defined?
		if (!data.gain) {
			console.error(`SATELLITE ERROR (${data.name}): Satellite gain is not defined!`);
			process.exit(1);
		// if so, is it a number?
		} else if (typeof(data.gain) !== 'number') {
			console.error(`SATELLITE ERROR (${data.name}): Satellite gain is not a number!`);
			process.exit(1);
		} else {
			this.gain = data.gain;
		};
		
		// does the satellite have the email flag?
		if (!data.email) {
			this.email = false;
		// if so, is it a boolean?
		} else if (typeof(data.email) !== 'boolean') {
			console.error(`SATELLITE ERROR (${data.name}): Satellite email flag is not a boolean!`);
			process.exit(1);
		} else {
			this.email = data.email;
		};

		// does the satellite have the tweet flag?
		if (!data.tweet) {
			this.tweet = false;
		// if so, is it a boolean?
		} else if (typeof(data.tweet) !== 'boolean') {
			console.error(`SATELLITE ERROR (${data.name}): Satellite tweet flag is not a boolean!`);
			process.exit(1);
		} else {
			this.tweet = data.tweet;
		};
		
		// if a TLE is given, check before setting
		if (data.tle) {
			if(!this.setTLE(data.tle)) {
				console.warn(`SATELLITE ERROR (${data.name}): Invalid TLE format!`);
			};
		};
	};
};

export class pass {
	start: number
	end: number
	duration: number
	startDate: Date
	endDate: Date
	maxElevation: number
	northbound: boolean
	satellite: satellite

	constructor(data: {
		start: number
		end: number
		duration: number
		maxElevation: number
		northbound: boolean
		satellite: satellite
	}) {
		// is start defined?
		if (!data.start) {
			console.error('PASS ERROR: start is not defined!');
			process.exit(1);
		// if so, is it a number?
		} else if (typeof(data.start) !== 'number') {
			console.error('PASS ERROR: start is not a number!');
			process.exit(1);
		} else {
			this.start = data.start;
		};

		// is end defined?
		if (!data.end) {
			console.error('PASS ERROR: end is not defined!');
			process.exit(1);
		// if so, is it a number?
		} else if (typeof(data.end) !== 'number') {
			console.error('PASS ERROR: end is not a number!');
			process.exit(1);
		} else {
			this.end = data.end;
		};

		// is duration defined?
		if (!data.duration) {
			console.error('PASS ERROR: duration is not defined!');
			process.exit(1);
		// if so, is it a number?
		} else if (typeof(data.duration) !== 'number') {
			console.error('PASS ERROR: duration is not a number!');
			process.exit(1);
		} else {
			this.duration = data.duration;
		};

		// is maxElevation defined?
		if (!data.maxElevation) {
			console.error('PASS ERROR: maxElevation is not defined!');
			process.exit(1);
		// if so, is it a number?
		} else if (typeof(data.maxElevation) !== 'number') {
			console.error('PASS ERROR: maxElevation is not a number!');
			process.exit(1);
		} else {
			this.maxElevation = data.maxElevation;
		};

		// is northbound flag specified?
		// if not, default to false (southbound)
		if (!data.northbound) {
			this.northbound = false;
		// if so, is it a boolean?
		} else if (typeof(data.northbound) !== 'boolean') {
			console.error('PASS ERROR: Northbound property is not a boolean!');
			process.exit(1);
		} else {
			this.northbound = data.northbound;
		};

		// set satellite
		this.satellite = new satellite(data.satellite);

		// set dates from timestamps
		this.startDate = new Date(data.start);
		this.endDate = new Date(data.end);
	};
};

export class config {
	tleURL: string
	location: number[]
	dataDir: string
	emailSettings: {
		user: string
		pass: string
		receiveAddress: string
	}
	twitterSettings: {
		consumer_key: string
		consumer_secret: string
		access_token: string
		access_token_secret: string
	}
	satellites: satellite[]
	tleFile?: string

	constructor(data: {
		tleURL: string
		location: number[]
		dataDir: string
		emailSettings: {
			user: string
			pass: string
			receiveAddress: string
		}
		twitterSettings: {
			consumer_key: string
			consumer_secret: string
			access_token: string
			access_token_secret: string
		}
		satellites: satellite[]
		tleFile?: string
	}) {
		// is tleurl defined?
		if (!data.tleURL) {
			console.error('CONFIG ERROR: tleURL is not defined!');
			process.exit(1);
		// if so, is it a string?
		} else if (typeof(data.tleURL) !== 'string') {
			console.error('CONFIG ERROR: tleURL is not a string!');
			process.exit(1);
		} else {
			this.tleURL = data.tleURL;
		};

		// is the location defined?
		if (!data.location) {
			console.error('CONFIG ERROR: location is not defined!');
			process.exit(1);
		// if so, is it an object
		} else if (!Array.isArray(data.location)) {
			console.error('CONFIG ERROR: location is not an array!');
			process.exit(1);
		// if it's an object does it have 3 elements?
		} else if (data.location.length !== 3) {
			console.error('CONFIG ERROR: location doesn\'t have 3 elements!');
			process.exit(1);
		} else {
			this.location = data.location;
		};

		// is datadir defined?
		if (!data.dataDir) {
			console.error('CONFIG ERROR: dataDir is not defined!');
			process.exit(1);
		// if so, is it a string?
		} else if (typeof(data.dataDir) !== 'string') {
			console.error('CONFIG ERROR: dataDir is not a string!');
			process.exit(1);
		} else {
			this.dataDir = data.dataDir;
		};

		// does emailsettings exist?
		if (data.emailSettings) {
			// is emailsettings an object?
			if (typeof(data.emailSettings) !== 'object') {
				console.error('CONFIG ERROR: emailSettings is not an object!');
				process.exit(1);
			// if it's an object does user field exist?
			} else if (!data.emailSettings.user) {
				console.error('CONFIG ERROR: no user proerty in emailSettings!');
				process.exit(1);
			// does pass field exist?
			} else if (!data.emailSettings.pass) {
				console.error('CONFIG ERROR: no pass proerty in emailSettings!');
				process.exit(1);
			// does receiveAddress exist?
			} else if (!data.emailSettings.receiveAddress) {
				console.error('CONFIG ERROR: no receiveAddress proerty in emailSettings!');
				process.exit(1);
			} else {
				// is user a string
				if (typeof(data.emailSettings.user) !== 'string') {
					console.error('CONFIG ERROR: emailSettings.user property is not a string!');
					process.exit(1);
				// is pass a string
				} else if (typeof(data.emailSettings.pass) !== 'string') {
					console.error('CONFIG ERROR: emailSettings.pass property is not a string!');
					process.exit(1);
				// is receiveAddress a string
				} else if (typeof(data.emailSettings.receiveAddress) !== 'string') {
					console.error('CONFIG ERROR: emailSettings.receiveAddress is not a string!');
					process.exit(1);
				} else {
					this.emailSettings = data.emailSettings;
				};
			};
		};

		// does twittersettings exist?
		if (data.twitterSettings) {
			// is emailsettings an object?
			if (typeof(data.twitterSettings) !== 'object') {
				console.error('CONFIG ERROR: twitterSettings is not an object!');
				process.exit(1);
			// if it's an object does user field exist?
			} else if (!data.twitterSettings.consumer_key) {
				console.error('CONFIG ERROR: no consumer_key proerty in twitterSettings!');
				process.exit(1);
			// does pass field exist?
			} else if (!data.twitterSettings.consumer_secret) {
				console.error('CONFIG ERROR: no consumer_secret proerty in twitterSettings!');
				process.exit(1);
			// does receiveAddress exist?
			} else if (!data.twitterSettings.access_token) {
				console.error('CONFIG ERROR: no access_token proerty in twitterSettings!');
				process.exit(1);
			} else if (!data.twitterSettings.access_token_secret) {
				console.error('CONFIG ERROR: no access_token_secret proerty in twitterSettings!');
				process.exit(1);
			} else {
				// is user a string
				if (typeof(data.twitterSettings.consumer_key) !== 'string') {
					console.error('CONFIG ERROR: twitterSettings.consumer_key property is not a string!');
					process.exit(1);
				// is pass a string
				} else if (typeof(data.twitterSettings.consumer_secret) !== 'string') {
					console.error('CONFIG ERROR: twitterSettings.consumer_secret property is not a string!');
					process.exit(1);
				// is receiveAddress a string
				} else if (typeof(data.twitterSettings.access_token) !== 'string') {
					console.error('CONFIG ERROR: twitterSettings.access_token is not a string!');
					process.exit(1);
				} else if (typeof(data.twitterSettings.access_token_secret) !== 'string') {
					console.error('CONFIG ERROR: twitterSettings.access_token_secret is not a string!');
					process.exit(1);
				} else {
					this.twitterSettings = data.twitterSettings;
				};
			};
		};

		this.satellites = [];
		data.satellites.forEach((sat) => {
			this.satellites.push(new satellite(sat));
		});
	};
};
