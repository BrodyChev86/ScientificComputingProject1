import { gcd } from './gcd.js';

// Rational sample-rate conversion by L/M using a polyphase windowed-sinc FIR.
// L = outRate / gcd, M = inRate / gcd  → the GCD is what keeps L and M small.

const DEFAULT_TAPS_PER_PHASE = 24;

export function resampleChannel(input, inRate, outRate, tapsPerPhase = DEFAULT_TAPS_PER_PHASE) {
  if (inRate === outRate) return input.slice();
  const g = gcd(inRate, outRate);
  const L = outRate / g;
  const M = inRate / g;
  const h = designLowpass(L, M, tapsPerPhase);
  return polyphase(input, L, M, h, tapsPerPhase);
}

function designLowpass(L, M, K) {
  const N = K * L;
  const fc = 0.5 / Math.max(L, M); // normalized to upsampled Nyquist
  const mid = (N - 1) / 2;
  const h = new Float32Array(N);
  for (let n = 0; n < N; n++) {
    const x = n - mid;
    const sinc = x === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * x) / (Math.PI * x);
    const w = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1)); // Hamming
    h[n] = sinc * w * L; // compensate for zero-insertion gain loss
  }
  return h;
}

function polyphase(input, L, M, h, K) {
  const inLen = input.length;
  const outLen = Math.floor((inLen * L) / M);
  const out = new Float32Array(outLen);
  for (let n = 0; n < outLen; n++) {
    const nM = n * M;
    const phase = nM % L;
    const base = Math.floor(nM / L);
    let acc = 0;
    for (let k = 0; k < K; k++) {
      const idx = base - k;
      if (idx < 0) break;
      if (idx < inLen) acc += h[phase + k * L] * input[idx];
    }
    out[n] = acc;
  }
  return out;
}

export function resampleAudioBuffer(audioBuffer, outRate, audioCtx) {
  const inRate = audioBuffer.sampleRate;
  const channels = audioBuffer.numberOfChannels;
  const resampled = [];
  for (let c = 0; c < channels; c++) {
    resampled.push(resampleChannel(audioBuffer.getChannelData(c), inRate, outRate));
  }
  const outLen = resampled[0].length;
  const outBuf = audioCtx.createBuffer(channels, outLen, outRate);
  for (let c = 0; c < channels; c++) outBuf.copyToChannel(resampled[c], c);
  return { audioBuffer: outBuf, channels: resampled, sampleRate: outRate };
}

// 16-bit PCM WAV wrapper so <audio> can play the resampled data.
export function encodeWAV(channelData, sampleRate) {
  const numChannels = channelData.length;
  const numFrames = channelData[0].length;
  const bytesPerSample = 2;
  const dataSize = numFrames * numChannels * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
  view.setUint16(32, numChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  let off = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      let s = channelData[c][i];
      if (s > 1) s = 1; else if (s < -1) s = -1;
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
  }
  return new Blob([buffer], { type: 'audio/wav' });
}
