/** A LEO weather satellite */
class Satellite {
	protected name: string;
	protected frequency: number;
	protected samplerate: number;

	/**
	 * Create a satellite
	 * @param name satellite name
	 * @param frequency signal frequency
	 * @param samplerate signal samplerate
	 */
	constructor(name: string, frequency: number, samplerate: number) {
		this.name = name;
		this.frequency = frequency;
		this.samplerate = samplerate;
	}

	/** Get the satellite name */
	public getName(): string {
		return this.name;
	}
	/** Get the signal frequency in Hz */
	public getFrequency(): number {
		return this.frequency;
	}
	/** Get the signal samplerate in samples/second */
	public getSamplerate(): number {
		return this.samplerate;
	}
}

export default Satellite;