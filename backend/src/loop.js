const satellites = require('./utils/satellites');
const passes = require('./utils/passes');
const tle = require('./utils/tle');
const ground = require('./utils/ground');
const scheduler = require('./utils/scheduler');

const logger = require('./utils/logger');

/**
 * Interval definitions
 */
const intervals = {
	// tles update every 24 hours
	tleUpdate: 1000 * 60 * 60 * 24,
	// passes are generated every hour
	generatePasses: 1000 * 60 * 60,
	// new passes are checked and scheduled every minute
	schedulePasses: 1000 * 60,
};

/**
 * Run a TLE update and log whether it succeeded or failed
 */
const updateTLEs = () => {
	tle.updateTLEs().then(
		() => {
			logger.log('TLE Loop', 'Updated TLE database');
		},
		e => {
			logger.error('TLE Loop', 'Error updating TLEs: ', e);
		}
	);
};

/**
 * Generate new passes and store them
 * - read the ground position
 * 
 * - read stored passes
 * - filter stored passes to only upcoming ones
 * - get the end date for the latest scheduled pass
 * 
 * - get a list of stored satellites
 * - generate 24 hours of passes for each satellite
 * - format the passes for each satellite
 * 
 * - convert a total list of passes into a schedule
 * - update each scheduled pass into the database
 */
const generatePasses = () => {
	// get the ground station info
	ground.getGround().then(
		ground => {
			// if we've read a ground position
			if (ground) {
				passes.getPasses().then(
					oldPasses => {
						oldPasses = oldPasses
							.filter(p => p.status === 'scheduled')
							.sort((a, b) => b.end - a.end);
						let lastDate = new Date();
						if (oldPasses.length > 0) {
							lastDate = new Date(oldPasses[0].end);
						}
						// get all satellites
						satellites.getSatellites().then(
							allSatellites => {
								// set a counter equal to the number of satellites
								let counter = allSatellites.length;
								// set an empty passes array
								let allPasses = [];

								// for each satellite
								allSatellites.forEach(sat => {
									// generate a list of passes for this satellite from our ground position
									// over the course of the pass generation interval
									satellites
										.generatePasses(
											sat.satellite,
											sat.min_elevation,
											lastDate,
											// check for passes 24 hours out from now
											new Date(new Date().getTime() + 1000 * 60 * 60 * 24),
											ground.longitude,
											ground.latitude,
											ground.elevation
										)
										.then(
											generatedPasses => {
												// increment our counter after generating passes
												counter = counter - 1;
												// add the satellite name to our generated passes
												// and add the new passes into our total passes array
												generatedPasses
													.map(generatedPass => ({
														// generate a pass id
														// satellite name plus the start time rounded to the nearest 10 minutes
														// we round to 10 minutes so that the id stays the same,
														// even if we have some variability in the calculated start time
														pass_id:
															sat.satellite +
															'_' +
															Math.floor(generatedPass.start / 1000 / 60 / 30),
														satellite: sat.satellite,
														max_elevation: generatedPass.maxElevation,
														start: new Date(generatedPass.start),
														end: new Date(generatedPass.end),
														duration: generatedPass.duration,
													}))
													.forEach(generatedPass => allPasses.push(generatedPass));

												// warn if we didn't find any passes for this specific satellite
												if (generatedPasses.length < 1) {
													logger.warn(
														'Passes Loop',
														'No passes found for ' +
															sat.satellite.green +
															' from ' +
															lastDate.toLocaleString().yellow +
															' to ' +
															new Date(
																new Date().getTime() + 1000 * 60 * 60 * 24
															).toLocaleString().yellow
													);
												}

												// if this was the last satellite to get passes for, continue
												if (counter === 0) {
													// convert our full passes array into a usable schedule
													// this involves correcting for any overlapping passes
													const newSchedule = passes.transitsToSchedule([
														...allPasses,
														...oldPasses,
													]);

													// for each corrected pass
													newSchedule.forEach(newPass => {
														// add the pass into the database
														passes.updatePass(newPass).then(() => {
															logger.log(
																'Passes Loop',
																'Updated pass ' +
																	newPass.pass_id.green +
																	' in the database'
															);
														});
													});
												}
											},
											e => {
												// increment the counter and log an error when we fail to generate passes
												counter = counter - 1;
												logger.error(
													'Passes Loop',
													'Error generating passes for ' + sat.satellite + ': ',
													e
												);
											}
										);
								});
							},
							e => {
								// error if we can't get satellites
								logger.error('Passes Loop', 'Error getting satellites: ', e);
							}
						);
					},
					e => {
						logger.error('Passes Loop', 'Error getting currently scheduled passes: ', e);
					}
				);
			} else {
				// else error if there is no ground station
				logger.error('Passes Loop', 'No saved ground position!');
			}
		},
		e => {
			// error if we can't read the ground position table
			logger.error('Passes Loop', 'Error getting ground position: ', e);
		}
	);
};

/**
 * Read scheduled passes and create timers to run them
 */
const schedulePasses = () => {
	passes.getPasses().then(
		allPasses => {
			allPasses.forEach(newPass => {
				if (newPass.status === 'scheduled') {
					if (newPass.start < new Date(new Date() + 1000 * 60)) {
						passes.updateStatus(newPass.pass_id, 'canceled', 0).then(
							() => {
								logger.log('Scheduler Loop', 'Canceled missed pass ' + newPass.pass_id.green);
							},
							e => {
								logger.error(
									'Scheduler Loop',
									'Error canceling missed pass ' + newPass.pass_id.green,
									e
								);
							}
						);
					} else {
						const isScheduled = scheduler.exists(newPass.pass_id);
						if (!isScheduled) {
							scheduler.scheduleCallback(
								newPass.start,
								null,
								() => {
									passes.updateStatus(newPass.pass_id, 'completed', 0).then(
										() => {
											logger.log('Scheduler Loop', 'Ran pass ' + newPass.pass_id.green);
										},
										e => {
											logger.error(
												'Scheduler Loop',
												'Failed to update pass status ' + newPass.pass_id.green,
												e
											);
										}
									);
								},
								newPass.pass_id
							);
							logger.log(
								'Scheduler Loop',
								'Scheduled pass for ' +
									newPass.satellite.green +
									' at ' +
									new Date(newPass.start).toLocaleString().yellow
							);
						}
					}
				}
			});
		},
		e => {
			logger.error('Scheduler Loop', 'Error getting passes: ', e);
		}
	);
};

// export the main loop methods
module.exports.updateTLEs = updateTLEs;
module.exports.generatePasses = generatePasses;
module.exports.schedulePasses = schedulePasses;

/**
 * Setup the main scheduling loops
 */
module.exports.startLoops = () => {
	logger.log('Loops', 'Starting program loop...');

	// ------------------------------------

	scheduler.scheduleInterval(
		intervals.tleUpdate,
		updateTLEs,
		'tleUpdater',
		false
	);

	// ------------------------------------

	// pass generator loop
	scheduler.scheduleInterval(
		intervals.generatePasses,
		generatePasses,
		'generatePasses',
		true
	);

	// ------------------------------------

	scheduler.scheduleInterval(
		intervals.schedulePasses,
		schedulePasses,
		'schedulePasses',
		true
	);
};
