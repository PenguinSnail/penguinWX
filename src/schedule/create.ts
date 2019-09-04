import * as fs from 'fs';
import * as classes from '../classes';

const jspredict = require('jspredict');

export default (config: classes.config): classes.pass[] => {
	// read tledb file into an array of it's lines
	console.log(`Reading TLE database at ${config.tleFile}\n`);
	const tledb = fs.readFileSync(config.tleFile).toString().replace(/\r/g, '').split('\n');

	// empty pass array
	let allPasses: classes.pass[] = [];

	config.satellites.forEach((sat: classes.satellite) => {
		const date = new Date();

		// find index (tledb line) with the satellite name
		const index: number = tledb.findIndex((element: string) => {
			return element.trim() === sat.name;
		});

		// if the index is -1 the line doesn't exist
		if (index === -1) {
			console.error(`${sat.name}: Satellite TLE not found!\n`);
			return;
		// else if we found it
		} else {
			// set the tle string - the line with the name we found and the next two lines
			const tle: string = tledb[index] + '\n' + tledb[index + 1] + '\n' + tledb[index + 2];
			// predict passes in the next 24 hours above the satellites specified elevation
			const rawPasses: any[] = jspredict.transits(tle, config.location, date.setDate(date.getDate()), date.setDate(date.getDate() + 1), sat.minElevation);

			// iterate through the predicted passes
			rawPasses.forEach((pass: any) => {
				let northbound: boolean;

				// set begin and end position for calculations
				const startPos: any = jspredict.observe(tle, config.location, pass.start);
				const endPos: any = jspredict.observe(tle, config.location, pass.end);

				// calculate satellite direction (northbound/southbound)
				if (startPos.latitude < endPos.latitude) {
					northbound = true;
				} else if (startPos.latitude > endPos.latitude) {
					northbound = false;
				} else {
					console.warn(`${sat.name} (${new Date(pass.start).toLocaleString()}): Error calculating pass direction - defaulting to southbound\n`);
					northbound = false;
				};

				// calculate average eclipse depth of pass
				const avgEclipseDepth = (startPos.eclipseDepth + endPos.eclipseDepth) / 2;

				// if avg eclipse depth is below the max specified
				if (!sat.maxEclipseDepth || (avgEclipseDepth < sat.maxEclipseDepth)) {
					allPasses.push(new classes.pass({
						start: Math.round(pass.start),
						end: Math.round(pass.end),
						duration: Math.round((pass.end - pass.start)),
						maxElevation: Math.round(pass.maxElevation * 100) / 100,
						avgEclipseDepth: Math.round(avgEclipseDepth * 100) / 100,
						northbound: northbound,
						satellite: sat
					}));
				// else skip
				} else {
					console.warn(`${sat.name} (${new Date(pass.start).toLocaleString()}): Sun too low, skipping pass...\n`);
				};
			});
		};
	});

	allPasses = allPasses.sort((a, b) => a.start - b.start);

	return allPasses;
};