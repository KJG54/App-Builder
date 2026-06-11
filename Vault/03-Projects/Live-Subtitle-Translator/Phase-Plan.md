# Phase Plan — Live Subtitle Translator
**Date:** 2026-06-11
**Based on spec:** Vault/09-Requirements/Live-Subtitle-Translator/Project-Spec.md
**Status:** Pending Approval

---

## Summary

| Phase | Goal | Effort | Risk |
|-------|------|--------|------|
| 1 | Scaffold project + validate audio capture and Whisper latency on target hardware | 3–4 hrs | High |
| 2 | Build floating subtitle window (always-on-top, draggable, menu bar) | 3–4 hrs | Medium |
| 3 | Wire full pipeline: capture → Whisper → live subtitle display | 3–4 hrs | Medium |
| 4 | Settings panel, language modularity, session cleanup | 2–3 hrs | Low |
| 5 | Package as .exe with first-launch model download and error handling | 3–4 hrs | Medium |

**Total estimated effort:** 14–19 hours
**Budget ceiling:** $0 — all local, no API costs
**Estimated API cost:** $0

---

## Phase 1: Scaffold + Pipeline Proof of Concept

**Goal:** Establish the project structure, install all dependencies, capture system audio via WASAPI loopback, run it through Whisper `medium` with CUDA, and confirm the 2-second latency target is achievable on the RTX 2060 before committing to any UI work.

**Deliverables:**
- `pyproject.toml` / `requirements.txt` with pinned dependencies (faster-whisper, soundcard, PyQt6, torch+CUDA, PyInstaller)
- `src/audio/capture.py` — WASAPI loopback capture, returns audio chunks
- `src/transcriber/whisper_engine.py` — loads Whisper `medium` with CUDA, exposes `translate(chunk) -> str`
- `scripts/benchmark.py` — CLI script that captures 5 seconds of audio and prints transcription + elapsed time
- `README.md` — setup instructions (Python version, CUDA toolkit prerequisite, model download)

**Dependencies:** None (first phase)

**Test Plan:**
- Unit: Audio capture returns non-silent float32 numpy array when audio is playing; chunk duration matches requested length
- Integration: `benchmark.py` captures live audio and returns English text from Japanese speech within 2 seconds
- Acceptance: Whisper `medium` transcribes a 4-second Japanese audio clip to English in ≤ 2 seconds on RTX 2060; if it misses, fall back to `small` and re-benchmark before proceeding to Phase 2

**Estimated effort:** 3–4 hours
**Risk:** High — latency target is the core project risk; this phase exists specifically to surface that risk before UI investment

---

## Phase 2: Floating Subtitle Window

**Goal:** Build the always-on-top floating subtitle window with drag-to-reposition, semi-transparent background, readable subtitle text, and a menu bar that auto-hides in relevant contexts.

**Deliverables:**
- `src/ui/subtitle_window.py` — PyQt6 frameless, always-on-top, semi-transparent window
- `src/ui/menu_bar.py` — QMenuBar with File → Settings, File → Exit; auto-hides when window loses focus in fullscreen
- `src/ui/styles.py` — minimal stylesheet (dark semi-transparent BG, white text, readable font size)
- Manual test: window stays above fullscreen browser video; drag repositioning works; menu bar shows/hides correctly

**Dependencies:** Phase 1 complete (all tests passing)

**Test Plan:**
- Unit: Window initializes with always-on-top flag set; subtitle text updates when `set_text()` called; window position persists after drag
- Integration: Launch window, manually verify it stays above a fullscreen browser tab
- Acceptance: Window is draggable, always-on-top, semi-transparent, menu bar present in windowed mode; subtitle text is legible at normal viewing distance

**Estimated effort:** 3–4 hours
**Risk:** Medium — PyQt6 always-on-top can behave inconsistently with hardware-accelerated fullscreen apps (DirectX/Vulkan); must test early with target streaming services

---

## Phase 3: Full Pipeline Integration

**Goal:** Connect the audio capture, Whisper engine, and subtitle window into a single running application with real-time subtitle updates, audio chunk overlap for continuity, and pause/resume control.

**Deliverables:**
- `src/pipeline.py` — orchestrates capture → transcription → UI update on a background thread; exposes `start()`, `pause()`, `resume()`, `stop()`
- `src/audio/chunker.py` — splits audio stream into overlapping 3–5 second chunks (0.5s overlap) to preserve context at boundaries
- `main.py` — app entry point; initializes pipeline and window together
- Pause/resume: button in menu bar or configurable hotkey (default: Space)

**Dependencies:** Phase 2 complete (all tests passing)

**Test Plan:**
- Unit: Chunker produces correct chunk length and overlap; pipeline state machine transitions (idle → running → paused → running → stopped) work correctly
- Integration: Launch `main.py` with Japanese audio playing; subtitles appear within 2 seconds and update continuously; pause stops new subtitles; resume continues within one chunk
- Acceptance: Continuous Japanese speech produces rolling English subtitles with ≤ 2 second lag; pausing stops output immediately; no audio data written to disk during operation

**Estimated effort:** 3–4 hours
**Risk:** Medium — threading between audio capture, Whisper inference, and PyQt6 UI updates requires careful queue management to avoid frame drops or race conditions

---

## Phase 4: Settings Panel + Language Modularity + Session Cleanup

**Goal:** Add a settings dialog for language pair selection, make the language configuration modular and data-driven, and ensure all session data (audio buffers, temp files) is deleted on app close.

**Deliverables:**
- `src/config/languages.yaml` — data-driven list of supported language pairs (source language, target language, Whisper task mode)
- `src/ui/settings_dialog.py` — QDialog with source language dropdown, target language dropdown, apply/cancel buttons
- `src/config/settings_manager.py` — loads/saves user settings (selected language pair) to a local config file; no audio content stored
- `src/cleanup.py` — registered as app exit handler; deletes all temp audio files and buffers
- Initial supported pairs: Japanese→English, Spanish→English, French→English, Korean→English (extensible via `languages.yaml`)

**Dependencies:** Phase 3 complete (all tests passing)

**Test Plan:**
- Unit: `languages.yaml` loads correctly; settings manager persists and retrieves language pair; cleanup handler deletes all files in temp directory
- Integration: Change language pair in settings, apply, verify next subtitle chunk uses new language config
- Acceptance: Language pair switch takes effect on next audio chunk without restart; closing the app leaves zero temp files; adding a new language pair to `languages.yaml` requires no code changes

**Estimated effort:** 2–3 hours
**Risk:** Low — well-understood patterns; no novel technical risk

---

## Phase 5: Packaging + Error Handling + Distribution

**Goal:** Package the app as a clickable Windows `.exe` with a first-launch Whisper model download, graceful error handling for missing CUDA, no audio device, and model load failures.

**Deliverables:**
- `build/` — PyInstaller spec file and build scripts
- `dist/LiveSubtitleTranslator.exe` — self-contained Windows executable (Python runtime bundled, Whisper model downloaded separately on first launch)
- `src/bootstrap.py` — first-launch check: detects if model is cached; if not, shows download progress dialog (~1.5GB) before opening main window
- Error dialogs for: CUDA not detected (offers CPU fallback with latency warning), no audio output device found, model download failed
- `INSTALL.md` — user-facing setup notes (CUDA toolkit version, Windows requirements)

**Dependencies:** Phase 4 complete (all tests passing)

**Test Plan:**
- Unit: Bootstrap correctly detects model present/absent; error handlers display correct messages for each failure mode
- Integration: Run `.exe` on a clean Windows machine (no Python installed); verify model downloads, app launches, subtitles work end-to-end
- Acceptance: Double-clicking `.exe` launches the app without a terminal window; first-launch model download completes with visible progress; app functions identically to development build; zero temp files remain after closing

**Estimated effort:** 3–4 hours
**Risk:** Medium — PyInstaller + CUDA + PyQt6 bundles can have missing DLL or path issues; test on a clean machine or VM before considering this phase complete

---

## Open Questions

None — all decisions resolved during discovery. If Whisper `medium` fails the latency benchmark in Phase 1, fall back to `small` model (documented in Phase 1 acceptance criteria).

---

## Approval Gate

> Implementation does NOT begin until this plan is approved.
> Review the phases above and reply "approved" or suggest changes (merge, split, reorder, or remove any phase).
