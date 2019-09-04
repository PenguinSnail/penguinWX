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

	// sort passes chronologically
	allPasses = allPasses.sort((a, b) => a.start - b.start);

	// initialize pass removal array
	let toRemove: classes.pass[] = [];

	// pass array repairs
	allPasses.forEach((pass, index, array) => {
		// if last pass
		if (index === allPasses.length - 1) {
			return;
		};
		// if pass is to be removed
		if (toRemove.includes(pass)) {
			return;
		};

		/*

		`at` scheduling is only accurate down to 1 minute,
		    so if there's a 30 second gap and pass 1 ends before 30 seconds into a minute,
		    the second pass will be started at the begining of the minute because it's rounded down to the nearest minute,
		    the pass will then try to claim the radio but fail because it's still being used by pass 1.
		    A 65 second buffer will guarantee that the previous pass will have stopped recording and the radio will be free.

			\/    \/    \/    \/    \/

		*/

		// if next pass starts before 65 seconds after the end of this pass
		if (array[index + 1].start - pass.end < 65000) {
			// if next pass starts before 50% of this pass
			if (array[index + 1].start < pass.start + (pass.duration * 0.5)) {
				console.warn('50% overlap detected!');
				console.log('Conflicting passes:\n');
				console.log(array[index]);
				console.log(array[index + 1]);

				// if this pass satellite has a priority set OR the next pass satellite has a prioriy set, AND both priorities don't equal each other
				if ((pass.satellite.priority || array[index + 1].satellite.priority) && (pass.satellite.priority !== array[index + 1].satellite.priority)) {
					// if only pass 2 has a defined priority
					if (!pass.satellite.priority) {
						console.log('Flagging pass 1 (lower priority)\n');
						toRemove.push(pass);
					// if only pass 1 has a defined priority
					} else if (!array[index + 1].satellite.priority) {
						console.log('Flagging pass 2 (lower priority)\n');
						toRemove.push(array[index + 1]);
					// else if both have priority, take the higher (lower number)
					} else {
						if (pass.satellite.priority < array[index + 1].satellite.priority) {
							console.log('Flagging pass 2 (lower priority)\n');
							toRemove.push(array[index + 1]);
						} else {
							console.log('Flagging pass 1 (lower priority)\n');
							toRemove.push(pass);
						};
					};
				// if neither have a priority, remove based on max elevation
				} else {
					console.log('Priorities not set or are equal, falling back on elevation...\n');
					if (pass.maxElevation > array[index + 1].maxElevation) {
						console.log('Flagging pass 2\n');
						toRemove.push(array[index + 1]);
					} else {
						console.log('Flagging pass 1\n');
						toRemove.push(pass);
					};
				};
			// else if less than 50% overlap
			} else {
				console.warn('Insufficient gap detected! Calculating new pass times...');

				// get the amount of overlap time between the two passes in ms
				const overlap = pass.end - array[index + 1].start;
				console.log('Overlap: ' + overlap.toString() + '\n');

				// half of the overlap plus half of a buffer time (65 seconds) we require
				//     so that there's enough time to disconnect from the radio before the next recording starts
				const difference = Math.round(overlap / 2) + 32500;

				// print initial pass stats
				console.log('INITIAL Pass 1:');
				console.log(`    Satellite: ${pass.satellite.name}\n`);
				console.log(`    Start: ${pass.startDate.toLocaleString()}\n`);
				console.log(`    Duration: ${pass.duration}\n`);
				console.log(`    End: ${pass.endDate.toLocaleString()}\n`);
				console.log('\nINITIAL Pass 2:');
				console.log(`    Satellite: ${allPasses[index + 1].satellite.name}\n`);
				console.log(`    Start: ${allPasses[index + 1].startDate.toLocaleString()}\n`);
				console.log(`    Duration: ${allPasses[index + 1].duration}\n`);
				console.log(`    End: ${allPasses[index + 1].endDate.toLocaleString()}\n`);

				// shift pass 1 end back by difference
				allPasses[index].end = pass.end - difference;
				allPasses[index].duration = pass.duration - difference;
				allPasses[index].endDate = new Date(pass.end);
				// shift pass 2 start forward by difference
				allPasses[index + 1].start = allPasses[index + 1].start + difference;
				allPasses[index + 1].duration = allPasses[index + 1].duration - difference;
				allPasses[index + 1].startDate = new Date(allPasses[index + 1].start);

				// print corrected pass stats
				console.log('\nINITIAL Pass 1:');
				console.log(`    Satellite: ${allPasses[index].satellite.name}\n`);
				console.log(`    Start: ${allPasses[index].startDate.toLocaleString()}\n`);
				console.log(`    Duration: ${allPasses[index].duration}\n`);
				console.log(`    End: ${allPasses[index].endDate.toLocaleString()}\n`);
				console.log('\nINITIAL Pass 2:');
				console.log(`    Satellite: ${allPasses[index + 1].satellite.name}\n`);
				console.log(`    Start: ${allPasses[index + 1].startDate.toLocaleString()}\n`);
				console.log(`    Duration: ${allPasses[index + 1].duration}\n`);
				console.log(`    End: ${allPasses[index + 1].endDate.toLocaleString()}\n`);
			};
		};
	});

	// filter out passes flagged in the toRemove array
	allPasses = allPasses.filter((pass) => {
		if (toRemove.includes(pass)) {
			console.log(`Removing low pass: ${pass.satellite.name} (${new Date(pass.start).toLocaleString()})`);
		} else {
			return true;
		};
	});
	console.log('\n');

	return allPasses;
};