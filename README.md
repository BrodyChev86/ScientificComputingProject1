# ScientificComputingProject1

This project demonstrates sample-rate conversion for WAV audio using the Euclidean algorithm and a polyphase resampling approach. The main demo is a browser-based application that lets you upload a WAV file, choose a target sample rate, and download a resampled version.

## What is in this project?

- `index.html` — the demo UI
- `js/main.js` — the browser logic that loads audio, triggers conversion, and updates the page
- `js/resample.js` — the actual sample-rate conversion implementation
- `js/gcd.js` — Euclid's algorithm helper used to compute the L/M conversion ratio
- `resampling.py` — a Python reference implementation for sample-rate conversion using SciPy
- `Reptillia_48k.wav` — an example WAV file included for testing

## How to use the demo

The live demo is the browser version, not the Python script.

1. Open the project folder in a browser, or serve it locally from the project root.
   - Simple option:
     - Open `index.html` directly in a browser, or
     - Run a local server from the project folder, for example:
       `python -m http.server 8000`
     - Then open `http://localhost:8000` in the browser.
2. Click the file input and choose a WAV file to upload.
3. Enter the target sample rate in Hz (for example `22050`, `32000`, `44100`, or `48000`).
4. Click `Convert`.
5. The page will resample the audio and show the converted output.
6. Use the audio player and the download link to preview or save the converted WAV file.

## Notes about the implementation

The browser demo computes the gcd of the input and output sample rates and uses that to determine the L/M conversion ratio for the resampler. This is the approach used in the final demo code and matches the project goal of explaining how resampling works mathematically.

## About `resampling.py`

`resampling.py` was not used during the demo itself. It served as a reference point while developing the later browser-based implementation, and it shows a SciPy-based version of the same sample-rate conversion idea in Python.

## Example workflow

- Load a WAV file such as `Reptillia_48k.wav`
- Choose a different target rate such as `22050` Hz
- Convert the file
- Listen to the result or save the new WAV file

## Requirements

- A modern browser with support for the Web Audio API
- For the Python reference script only: Python, NumPy, and SciPy

## Python script usage

If you want to run the Python reference version directly, use it from the project root:

```bash
python resampling.py
```

Then enter the input WAV path, target output path, input sample rate, and output sample rate when prompted.

This script is useful as a reference implementation, but the actual interactive demo is the browser workflow described above.
