import { gcd } from './gcd.js';
import { resampleAudioBuffer, encodeWAV } from './resample.js';

const els = {
  file: document.getElementById('fileInput'),
  target: document.getElementById('targetRate'),
  convert: document.getElementById('convertBtn'),
  status: document.getElementById('status'),
  info: document.getElementById('info'),
  original: document.getElementById('originalAudio'),
  converted: document.getElementById('convertedAudio'),
  download: document.getElementById('downloadLink'),
};

let audioCtx = null;
let decoded = null;
let lastConvertedUrl = null;

function setStatus(msg) { els.status.textContent = msg; }

function describe(buf) {
  return `${buf.numberOfChannels} ch • ${buf.sampleRate} Hz • ${buf.duration.toFixed(2)} s`;
}

els.file.addEventListener('change', async (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
  setStatus('Decoding…');
  try {
    const bytes = await file.arrayBuffer();
    decoded = await audioCtx.decodeAudioData(bytes.slice(0));
    els.info.textContent = `Loaded: ${describe(decoded)}`;
    els.original.src = URL.createObjectURL(file);
    els.convert.disabled = false;
    setStatus('Ready. Choose a target rate and convert.');
  } catch (err) {
    console.error(err);
    setStatus('Could not decode that file: ' + err.message);
  }
});

els.convert.addEventListener('click', async () => {
  if (!decoded) return;
  const target = Number(els.target.value);
  if (!Number.isFinite(target) || target < 1000 || target > 384000) {
    setStatus('Enter a target sample rate between 1000 and 384000 Hz.');
    return;
  }
  const inRate = decoded.sampleRate;
  const g = gcd(inRate, target);
  const L = target / g;
  const M = inRate / g;
  setStatus(`Resampling ${inRate} → ${target} Hz  (gcd=${g}, L/M = ${L}/${M})…`);
  els.convert.disabled = true;
  await new Promise((r) => setTimeout(r, 20)); // let the UI paint before the blocking work

  try {
    const t0 = performance.now();
    const { channels } = resampleAudioBuffer(decoded, target, audioCtx);
    const blob = encodeWAV(channels, target);
    const url = URL.createObjectURL(blob);
    if (lastConvertedUrl) URL.revokeObjectURL(lastConvertedUrl);
    lastConvertedUrl = url;

    els.converted.src = url;
    els.download.href = url;
    els.download.download = `resampled_${target}Hz.wav`;
    els.download.hidden = false;
    const ms = (performance.now() - t0).toFixed(0);
    setStatus(`Done in ${ms} ms.  ${inRate} → ${target} Hz  (gcd=${g}, L/M = ${L}/${M}).`);
  } catch (err) {
    console.error(err);
    setStatus('Resample failed: ' + err.message);
  } finally {
    els.convert.disabled = false;
  }
});
