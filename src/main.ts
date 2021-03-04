import { Logger } from "tslog";
import NOAA from "./classes/NOAA";
import METEOR from "./classes/METEOR";

const log = new Logger();

const noaa19 = new NOAA("NOAA 19", 137100000);
log.debug(noaa19);
const meteorm2 = new METEOR("METEOR-M 2", 137100000);
log.debug(meteorm2);