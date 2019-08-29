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

		// if next pass starts before the end of this pass
		if (array[index + 1].start - item.end < 0) {
			// if next pass starts before 50% of this pass
			if (array[index + 1].start < item.start + (item.duration / 2)) {
				console.log('50% overlap detected! Flagging lower pass for removal...');
				// flag to remove whichever pass has lower elevation
				if (item.maxElevation > array[index + 1].maxElevation) {
					toRemove.push(index + 1);
				} else {
					toRemove.push(index);
				};
				return;
			};

			console.log('Overlap detected! Calculating new pass times...');

			let overlap = item.end - array[index + 1].start;
			let difference = Math.round(overlap / 2) + 2500;

			allPasses[index].end = item.end - difference;
			allPasses[index].duration = item.duration - difference;
			allPasses[index].endDate = new Date(item.end - difference);

			allPasses[index + 1].start = allPasses[index + 1].start + difference;
			allPasses[index + 1].duration = allPasses[index + 1].duration - difference;
			allPasses[index + 1].startDate = new Date(allPasses[index + 1].start + difference);
		};

		return;
	});

	if (toRemove.length > 0) {
		console.log('Removing low passes...');
		// sort removal array descending
		toRemove = toRemove.sort((a, b) => b - a);
		// for each in removal array
		toRemove.forEach((item) => {
			// remove one element from pass array starting at index `item`
			allPasses = allPasses.splice(item, 1);
		});
	};

	console.log(allPasses.length + ' pass schedule created');
	console.log('\n' + allPasses + '\n');
	return allPasses;
};
