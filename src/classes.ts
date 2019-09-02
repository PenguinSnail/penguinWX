type satType = 'noaa' | 'meteor'
export class satellite {
	name: string
	type: satType
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
		}
	}

	public constructor(name: string, type: satType, frequency: number, samplerate: number, gain: number, email: boolean, tweet: boolean, tle?: string) {
		this.name = name;
		this.type = type;
		this.frequency = frequency;
		this.samplerate = samplerate;
		this.gain = gain;
		this.email = email;
		this.tweet = tweet;
		// if a TLE is given, check before setting
		if (tle) {
			this.setTLE(tle);
		};
	};
};

class pass {
	start: number
	end: number
	duration: number
	startDate: Date
	endDate: Date
	maxElevation: number
	northbound: boolean
	sat: satellite
};
