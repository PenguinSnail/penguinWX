# Dependencies

## Compilation

- `nodejs` and `npm`
- `tsc` (typescript compiler)

## Runtime

### General Dependencies

- `rtl_sdr` (we only need the `rtl_fm` command)
- `sox`
- `at`

### METEOR Dependencies

- `meteor_demod` ([https://github.com/dbdexter-dev/meteor_demod/](https://github.com/dbdexter-dev/meteor_demod/))
- `meteor_decode` ([https://github.com/dbdexter-dev/meteor_decode/](https://github.com/dbdexter-dev/meteor_decode/))
	- currently need the `devel` branch
- `meteor_rectify` ([https://github.com/dbdexter-dev/meteor_rectify/](https://github.com/dbdexter-dev/meteor_rectify/))
	- requires `python3`, `python3-pil (pillow)`, `python3-numpy (numpy)`
- `ffmpeg`
- `imagemagick`

### NOAA Dependencies

- `wxtoimg` and `wxmap` ([https://wxtoimgrestored.xyz/beta/](https://wxtoimgrestored.xyz/beta/))
