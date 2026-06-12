---
type: KnownProblem
status: Resolved
severity: High
authority: sessions
chroma_collection: live-subtitle-translator-known-problems
tags: [audio, capture, soundcard, numpy, wasapi, loopback]
related: []
---

# Audio — soundcard WASAPI Loopback Corruption under NumPy 2.x

**Status:** Resolved
**Severity:** High
**Discovered:** 2026-06-12
**Last Updated:** 2026-06-12

---

## Problem Description

In Live Subtitle Translator, WASAPI loopback capture via the `soundcard` library returned
corrupted audio on the NVIDIA HDMI output device. The app ran end-to-end (model loaded, pipeline
started) but produced zero usable transcriptions — only silence-rejections and hallucinations —
because the audio fed to Whisper was garbage.

---

## Symptoms

- A captured WAV (`logs/capture_sample.wav`) played back as a single loud buzzing tone, not speech.
- Whisper produced only hallucinations ("Thank you for watching") or empty segments.
- Constant `SoundcardRuntimeWarning: data discontinuity in recording` in stderr.
- `overflow encountered in square` warning from faster-whisper's feature extractor.

---

## Root Cause

`soundcard`'s raw WASAPI recorder corrupts the captured stream on this device, confirmed by
elimination:

- `prepare_audio()` (stereo→mono downmix + 48k→16k resample) was proven clean — it preserved
  200/500/1000 Hz test tones at exact ratio 3.0.
- The WAV writer is standard int16.
- Therefore corruption originated in `soundcard`'s raw `record()`, before `prepare_audio`.

Contributing factors: `soundcard` is incompatible with NumPy 2.x (its playback path crashes on the
removed `ndarray.tostring()`; environment had NumPy 2.4.6) and only recorded at all via two fragile
manual patches to `venv/Lib/site-packages/soundcard/mediafoundation.py`. Its mix-format negotiation
is admitted guesswork (asserts an empirically-found float32 format). Likely mechanism: the device's
real loopback mix format (multichannel/rate) was misread as 2-channel, misaligning frame
boundaries into a periodic buzz.

---

## Impact

App was unusable — no real subtitles ever produced despite the GPU Whisper pipeline working.

---

## Workaround

None viable. Windows mix-format was already 16-bit/48000 stereo; no config change helped.

---

## Permanent Fix

**Replaced `soundcard` with `PyAudioWPatch`** (maintained PyAudio fork purpose-built for WASAPI
loopback). It returns raw bytes converted to NumPy in our own code, removing NumPy coupling and
hidden format guessing. `src/audio/capture.py` wraps it in `_LoopbackDevice`/`_LoopbackRecorder`
adapter classes that preserve the existing `device.recorder(samplerate, channels).record(numframes)`
contract, so `chunker.py`, the Audio device-picker menu, and `main.py` were untouched.
`prepare_audio()` (proven clean) was kept as the conversion layer.

**Verification:** `check_transcribe.py` produced a clean-speech WAV and real JA→EN translation;
`run.bat` then showed real subtitles over anime dialogue.

**Could be escalated to an ADR** (dependency strategy change) if cross-project standardization on
PyAudioWPatch for Windows audio capture is desired.

---

## Links

- Diagnostics: `check_transcribe.py`, `check_audio.py` (in project root)
- Memory: project-loopback-capture-pyaudiowpatch

---

**Last Updated:** 2026-06-12
