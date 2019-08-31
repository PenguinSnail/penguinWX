const fs = require('fs');
const jspredict = require('jspredict');

module.exports = (config) => {
	console.log('Reading TLE database at ' + config.tleFile)
	const tledb = fs.readFileSync(config.tleFile).toString().replace(/\r/g, '').split('\n');

	let allPasses = [];

	config.satellites.forEach((sat) => {
		const date = new Date();
		const index = tledb.findIndex((element) => {
			return element.trim() === sat.name;
		});

		if (index === -1) {
			console.error('Satellite TLE not found!');
			return;
		} else {
			const tle = tledb[index] + '\n' + tledb[index + 1] + '\n' + tledb[index + 2];
			let rawPasses = jspredict.transits(tle, config.location, date.setDate(date.getDate()), date.setDate(date.getDate() + 1), 20);

			rawPasses.forEach((pass) => {
				let northbound;
				let startPos = jspredict.observe(tle, config.location, pass.start);
				let endPos = jspredict.observe(tle, config.location, pass.end);
				if (startPos.latitude < endPos.latitude) {
					northbound = true;
				} else if (startPos.latitude > endPos.latitude) {
					northbound = false;
				} else {
					console.warn('Error calculating pass direction - defaulting to southbound');
					northbound = false;
				}

				allPasses.push({
					start: Math.round(pass.start),
					end: Math.round(pass.end),
					duration: Math.round((pass.end - pass.start)),
					startDate: new Date(Math.round(pass.start)),
					endDate: new Date(Math.round(pass.end)),
					maxElevation: Math.round(pass.maxElevation * 100) / 100,
					northbound: northbound,
					sat: sat
				});
			});
		};
	});
	allPasses = allPasses.sort((a, b) => a.start - b.start);
	const passCount = allPasses.length;

	let toRemove = [];
	allPasses.forEach((item, index, array) => {
		// if last pass
		if (index === passCount - 1) {
			return;
		};

		// if pass is to be removed
		if (toRemove.includes(index)) {
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
		if (array[index + 1].start - item.end < 65000) {
			// if next pass starts before 50% of this pass
			if (array[index + 1].start < item.start + (item.duration / 2)) {
				console.log('50% overlap detected!');
				// flag to remove whichever pass has lower elevation
				console.log('Conflicting passes:\n');
				console.log(array[index]);
				console.log(array[index + 1]);
				if (item.sat.priority && array[index + 1].sat.priority && (item.sat.priority !== array[index + 1].sat.priority)) {
					if (item.sat.priority < array[index + 1].sat.priority) {
						console.log('removing pass 2 (lower priority)');
						toRemove.push(array[index + 1]);
					} else {
						console.log('removing pass 1 (lower priority)');
						toRemove.push(item);
					};
				} else {
					console.log('Priorities not set or are equal, falling back on elevation...');
					if (item.maxElevation > array[index + 1].maxElevation) {
						console.log('removing pass 2');
						toRemove.push(array[index + 1]);
					} else {
						console.log('removing pass 1');
						toRemove.push(item);
					};
				};
			} else {
				console.log('Insufficient gap detected! Calculating new pass times...');

				// get the amount of oberlap between the two passes in ms
				let overlap = item.end - array[index + 1].start;
				console.log('Overlap: ' + overlap.toString());
				// half of the overlap plus half of a buffer time (65 seconds) we require
				//     so that there's enough time to disconnect from the radio before the next recording starts
				let difference = Math.round(overlap / 2) + 32500;

				console.log('\nINITIAL Pass 1:\n');
				console.log(item);
				console.log('\nINITIAL Pass 2:\n');
				console.log(allPasses[index + 1]);
				console.log('\n');

				allPasses[index].end = item.end - difference;
				allPasses[index].duration = item.duration - difference;
				allPasses[index].endDate = new Date(item.end - difference);

				allPasses[index + 1].start = allPasses[index + 1].start + difference;
				allPasses[index + 1].duration = allPasses[index + 1].duration - difference;
				allPasses[index + 1].startDate = new Date(allPasses[index + 1].start + difference);

				console.log('\nCorrected Pass 1:\n');
				console.log(allPasses[index]);
				console.log('\nCorrected Pass 2:\n');
				console.log(allPasses[index + 1]);
				console.log('\n');
			};
		};

		return;
	});

	if (toRemove.length > 0) {
		console.log('Removing low passes...');
		toRemove.forEach((item) => {
			// remove one element from pass array starting at index `item`
			allPasses = allPasses.filter((value) => {
				return value !== item;
			});
		});
	};

	console.log(allPasses.length + ' pass schedule created');
	console.log('\n');
	console.log(allPasses);
	console.log('\n');
	return allPasses;
};
