#!/usr/bin/env python3
'''resampling.py'''

import math
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import resample_poly


def resample_wav(
    input_path: Path,
    output_path: Path,
    input_rate: int,
    target_rate: int,
) -> None:
    sample_rate, audio = wavfile.read(input_path)
    if input_rate <= 0:
        raise ValueError("input rate must be positive")
    if target_rate <= 0:
        raise ValueError("target rate must be positive")
    if sample_rate != input_rate:
        raise ValueError(
            f"input rate does not match the WAV file ({sample_rate} Hz)"
        )

    # GCD reduces the two rates to the smallest integer up/down factors.
    rate_gcd = math.gcd(sample_rate, target_rate)
    upsample_factor = target_rate // rate_gcd
    downsample_factor = sample_rate // rate_gcd
    print(
        f"GCD({target_rate}, {sample_rate}) = {rate_gcd}; "
        f"upsampling factor = {upsample_factor}, "
        f"downsampling factor = {downsample_factor}"
    )

    # Resample the audio using Scipy's polyphase filtering method. 
    resampled = resample_poly(
        audio, upsample_factor, downsample_factor, axis=0
    )

    # Convert the filtered floating-point result back to the input WAV type.
    if np.issubdtype(audio.dtype, np.integer):
        limits = np.iinfo(audio.dtype)
        resampled = np.clip(resampled, limits.min, limits.max)
        resampled = np.rint(resampled).astype(audio.dtype)
    else:
        resampled = resampled.astype(audio.dtype)

    wavfile.write(output_path, target_rate, resampled)
    print(f"Wrote {output_path} ({sample_rate} Hz -> {target_rate} Hz)")


def prompt_rate(prompt: str) -> int:
    while True:
        try:
            rate = int(input(prompt))
        except ValueError:
            print("Please enter a whole number.")
            continue
        if rate <= 0:
            print("Please enter a positive sample rate.")
            continue
        return rate


def main() -> None:
    input_path = Path(input("Enter the input WAV path: ").strip())
    output_path = Path(input("Enter the output WAV path: ").strip())
    input_rate = prompt_rate("Enter the input sample rate in Hz: ")
    output_rate = prompt_rate("Enter the output sample rate in Hz: ")
    resample_wav(input_path, output_path, input_rate, output_rate)


if __name__ == "__main__":
    main()