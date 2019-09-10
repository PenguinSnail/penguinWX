import * as path from 'path';

// define valid satellite types
const satTypes = ['noaa', 'meteor'];
// define valid modulation types (for METEOR)
const modTypes = ['qpsk', 'oqpsk'];

export class satellite {
	name: string
	type: string
	frequency: number
	samplerate: number
	gain: number
	modulation?: string
	apid?: string
	minElevation: number
	maxEclipseDepth?: number
	priority?: number
	skipProcessing?: boolean
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

	public constructor(data: {
		name: string
		type: string
		frequency: number
		samplerate: number
		gain: number
		modulation?: string
		apid?: string
		minElevation?: number
		maxEclipseDepth?: number
		priority?: number
		skipProcessing?: boolean
		email?: boolean
		tweet?: boolean
		tle?: string
	}) {
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

		if (data.type === 'meteor') {
			if (!data.modulation) {
				console.warn(`SATELLITE (${data.name}): METEOR satellite modulation not specified!\nDefaulting to ${modTypes[0]}\n`);
				this.modulation = modTypes[0];
			} else if (typeof(data.modulation) !== 'string') {
				console.error(`SATELLITE ERROR (${data.name}): METEOR satellite modulation is not a string!`);
				process.exit(1);
			} else if (!modTypes.includes(data.modulation)) {
				console.error(`SATELLITE ERROR (${data.name}): ${data.modulation} is not a valid METEOR satellite modulation!\nValid modulations: ${modTypes}`);
				process.exit(1);
			} else {
				this.modulation = data.modulation;
			};
		};

		if (data.type === 'meteor') {
			if (!data.apid) {
				console.warn(`SATELLITE (${data.name}): METEOR satellite APIDs not specified!\nDefaulting to 66,65,64\n`);
				this.apid = '66,65,64';
			} else if (typeof(data.apid) !== 'string') {
				console.error(`SATELLITE ERROR (${data.name}): METEOR satellite APID field is not a string!`);
				process.exit(1);
			} else if (data.apid.split(',').length !== 3) {
				console.error(`SATELLITE ERROR (${data.name}): METEOR satellite APID field doesn't contain 3 comma separated values!`);
				process.exit(1);
			} else {
				this.apid = data.apid;
			};
		};

		// does the satellite have a minElevation defined?
		if (!data.minElevation) {
			console.warn(`SATELLITE (${data.name}): minElevation not specified!\nDefaulting to 20 degrees\n`);
			this.minElevation = 20;
		// if so, is it a number?
		} else if (typeof(data.minElevation) !== 'number') {
			console.error(`SATELLITE ERROR (${data.name}): Satellite minElevation is not a number!`);
			process.exit(1);
		// if so, is it a valid elevation?
		} else if (data.minElevation < 0) {
			console.error(`SATELLITE ERROR (${data.name}): Satellite minElevation is less than 0!`);
			process.exit(1);
		} else {
			this.minElevation = data.minElevation;
		};

		// does the satellite have a maxEclipseDepth defined?
		if (data.maxEclipseDepth) {
			if (typeof(data.maxEclipseDepth) !== 'number') {
				console.error(`SATELLITE ERROR (${data.name}): Satellite maxEclipseDepth is not a number!`);
				process.exit(1);
			} else {
				this.maxEclipseDepth = data.maxEclipseDepth;
			};
		};

		// do we skip processing for the satellite?
		if (data.skipProcessing) {
			if (typeof(data.skipProcessing) !== 'boolean') {
				console.error(`SATELLITE ERROR (${data.name}): Satellite skipProcessing is not a boolean!`);
				process.exit(1);
			} else {
				this.skipProcessing = data.skipProcessing;
			};
		};

		// does the satellite have a priority defined?
		if (data.priority) {
			if (typeof(data.priority) !== 'number') {
				console.error(`SATELLITE ERROR (${data.name}): Satellite priority is not a number!`);
				process.exit(1);
			} else {
				this.priority = data.priority;
			};
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
				console.warn(`SATELLITE ERROR (${data.name}): Invalid TLE format!\n`);
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
	avgEclipseDepth: number
	northbound: boolean
	satellite: satellite

	constructor(data: {
		start: number
		end: number
		duration: number
		maxElevation: number
		avgEclipseDepth: number
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

		// is avgEclipseDepth defined?
		if (!data.avgEclipseDepth) {
			console.error('PASS ERROR: avgEclipseDepth is not defined!');
			process.exit(1);
		// if so, is it a number?
		} else if (typeof(data.avgEclipseDepth) !== 'number') {
			console.error('PASS ERROR: avgEclipseDepth is not a number!');
			process.exit(1);
		} else {
			this.avgEclipseDepth = data.avgEclipseDepth;
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
	tleFile: string
	emailSettings?: {
		user: string
		pass: string
		receiveAddress: string
	}
	twitterSettings?: {
		consumer_key: string
		consumer_secret: string
		access_token: string
		access_token_secret: string
	}
	satellites: satellite[]

	constructor(data: {
		tleURL: string
		location: number[]
		dataDir: string
		emailSettings?: {
			user: string
			pass: string
			receiveAddress: string
		}
		twitterSettings?: {
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
		// if so, is the url body valid?
		// regexes modified from https://github.com/segmentio/is-url
		} else if (!data.tleURL.match(/^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/) && !data.tleURL.match(/^[^\s\.]+\.\S{2,}$/)) {
			console.error('CONFIG ERROR: tleURL is not a valid URL!');
			process.exit(1);
		// if so, is a protocol specified?
		} else if (!data.tleURL.match(/^(?:http+s?:)?\/\/(\S+)$/)) {
			console.error('CONFIG ERROR: tleURL is not a valid URL (protocol isn\'t http or https)!');
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
			this.dataDir = path.resolve(data.dataDir);
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

		// was tlefile specified?
		if (data.tleFile) {
			// is tlefile a string?
			if (typeof(data.tleFile) !== 'string') {
				console.error('CONFIG ERROR: tleFile is not a string!');
				process.exit(1);
			// if so, resolve it as a path
			} else {
				this.tleFile = path.resolve(data.tleFile);
			};
		// if not, set the default
		} else {
			this.tleFile = path.resolve(data.dataDir, 'tledb.txt');
		};

		this.satellites = [];
		data.satellites.forEach((sat) => {
			this.satellites.push(new satellite(sat));
		});
	};
};
