import * as classes from './classes';

let test = new classes.satellite('NOAA 19', 'noaa', 137100000, 50000, 40, false, true);
console.log(test)
console.log(test.setTLE('NOAA 19                 \n1 33591U 09005A   19227.49643893  .00000041  00000-0  47625-4 0  9995\n2 33591  99.1828 220.0267 0013328 212.9326 147.1016 14.12371355542060'));
console.log(test)