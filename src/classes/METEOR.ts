import Satellite from "./Satellite";

// global METEOR samplerate
const samplerate: number = 150000;
const defaultApid: Array<number> = [66, 65, 64];

/** A METEOR weather satellite */
class METEOR extends Satellite {
	private apid: Array<number>;

	/**
	 * Create a METEOR satellite
	 * @param name satellite name
	 * @param frequency signal frequency
	 * @param apid signal apids (channels)
	 */
	constructor(name: string, frequency: number, apid: Array<number> = defaultApid) {
		super(name, frequency, samplerate);
		if (apid.length !== 3) {
			this.apid = defaultApid;
		} else {
			this.apid = apid;
		}
	}

	/** Get the signal apids (channels) */
	public getApid(): Array<number> {
		return this.apid;
	}
}

export default METEOR;