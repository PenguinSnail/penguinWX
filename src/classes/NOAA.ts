import Satellite from "./Satellite";

// global NOAA samplerate
const samplerate = 55000;

/** A NOAA weather satellite */
class NOAA extends Satellite {
	/**
	 * Create a NOAA satellite
	 * @param name satellite name
	 * @param frequency signal frequency
	 */
	constructor(name: string, frequency: number) {
		super(name, frequency, samplerate);
	}
}

export default NOAA;