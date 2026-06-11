# Project Specification — Live Subtitle Translator
**Date:** 2026-06-11
**Status:** Draft — Confirmed by user

---

## Goals

Build a lightweight Windows desktop app that captures system audio in real-time, runs it through a local Whisper model (GPU-accelerated), and displays translated subtitles in a floating always-on-top window. Works on any audio source playing on the computer — streaming services, local files, video calls, anything.

**Success in 6 months:** App launches reliably, subtitles appear within 2 seconds of spoken audio, and it handles Japanese → English across a full streaming session without crashing or accumulating data.

---

## Users

| Persona | Description | Technical Level | Scale |
|---------|-------------|-----------------|-------|
| Primary user | Single user on a Windows desktop | Intermediate | 1 user |

---

## Functional Requirements

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| FR-001 | Capture system audio via WASAPI loopback | Any audio playing on the machine is captured without additional hardware | Must Have |
| FR-002 | Transcribe and translate audio using local Whisper model | Audio is converted to translated text with no external API calls | Must Have |
| FR-003 | Display subtitles in a floating always-on-top window | Window stays above all other windows including fullscreen apps | Must Have |
| FR-004 | Subtitle window is freely repositionable | User can drag the window anywhere on screen | Must Have |
| FR-005 | Menu bar auto-hides in fullscreen | Menu bar visible in windowed mode, hidden when app enters fullscreen context | Must Have |
| FR-006 | Settings panel for language pair selection | User can select source language and target language from a list | Must Have |
| FR-007 | Session cleanup on close | All captured audio buffers and temp files deleted when app closes | Must Have |
| FR-008 | Language modularity | System supports adding new language pairs without code changes | Should Have |
| FR-009 | Pause/resume subtitle generation | Hotkey or button to pause and resume without closing the app | Should Have |

---

## Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|----|-------------|--------|----------|
| NFR-001 | Subtitle latency | Max 2 seconds from spoken audio to displayed subtitle | Must Have |
| NFR-002 | Fully local/offline | Zero network calls during operation; no data leaves the machine | Must Have |
| NFR-003 | Lightweight UI | Minimal resource usage; app does not noticeably degrade video playback | Must Have |
| NFR-004 | No data retention | No audio files, transcripts, or logs persisted after session ends | Must Have |
| NFR-005 | Windows compatibility | Runs on Windows 10/11 with CUDA-capable GPU | Must Have |
| NFR-006 | Packaged as executable | Distributed as a clickable `.exe`; no terminal required to launch | Must Have |

---

## Business Requirements

| ID | Requirement | Rationale |
|----|-------------|-----------|
| BR-001 | Zero ongoing cost | All processing must be free; no subscriptions, API keys, or cloud services | Personal project, cost must be $0 |
| BR-002 | Works with streaming services | Must capture audio post-DRM via OS-level loopback; not dependent on browser extensions or service cooperation | Primary use case is streaming video |
| BR-003 | No content storage | Session cleanup ensures no recording of protected content occurs | ToS compliance and privacy |

---

## Architecture Recommendations

### Audio Capture
- **WASAPI loopback** via `soundcard` or `pyaudio` library — captures the Windows audio mix after DRM decryption, invisible to streaming services

### Speech-to-Text + Translation (Single Pass)
- **faster-whisper** (CTranslate2-optimized Whisper) with `medium` model
- Whisper's `translate` task mode outputs English directly from any source language — no separate translation step needed
- CUDA acceleration via PyTorch on RTX 2060 — `medium` model uses ~5GB VRAM, fits comfortably
- Audio chunked in 3–5 second segments with 0.5s overlap to maintain context across chunk boundaries

### UI
- **PyQt6** — mature, well-documented, supports always-on-top windows, frameless overlays, and system tray
- Floating subtitle window: frameless, always-on-top, dark semi-transparent background, large readable font
- Menu bar: standard PyQt6 QMenuBar, auto-hidden when window loses focus in fullscreen context
- Settings: QDialog with source/target language dropdowns

### Packaging
- **PyInstaller** — bundles Python runtime and dependencies into a single `.exe`
- Whisper model downloaded on first launch (~1.5GB) and cached locally — not bundled in the exe (would make it ~3GB+)

---

## Suggested Tools and Integrations

| Tool | Purpose | License |
|------|---------|---------|
| faster-whisper | GPU-accelerated Whisper inference | MIT |
| soundcard | WASAPI loopback audio capture | MIT |
| PyQt6 | Desktop UI framework | GPL/Commercial |
| PyInstaller | Python → .exe packaging | GPL |
| CUDA Toolkit | GPU acceleration (user installs separately) | NVIDIA proprietary |

No paid APIs. No cloud services. No external integrations required.

---

## Development Roadmap

| Phase | Features | Priority |
|-------|----------|----------|
| 1 — Core Pipeline | WASAPI capture → Whisper `medium` → subtitle display (hardcoded JP→EN) | Must Have |
| 2 — UI Polish | Always-on-top floating window, drag-to-reposition, menu bar, semi-transparent background | Must Have |
| 3 — Settings + Modularity | Language pair settings panel, pause/resume hotkey, session cleanup on close | Must Have |
| 4 — Packaging | PyInstaller `.exe`, first-launch model download, basic error handling | Must Have |
| 5 — Hardening | Latency tuning, chunk overlap, GPU memory management, crash recovery | Should Have |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Whisper `medium` misses 2s latency target | Medium | High | Fall back to `small` model; profile on target hardware before committing |
| WASAPI loopback not capturing specific app audio | Low | High | Test with target streaming services early; soundcard library handles most cases |
| PyInstaller bundle is very large | High | Low | Exclude model from bundle; download on first run |
| CUDA not available / driver mismatch | Medium | High | Detect at launch and fall back to CPU with a warning; document CUDA requirements |
| PyQt6 always-on-top fails over fullscreen apps | Medium | Medium | Test with DirectX/fullscreen apps early; may need workaround via Windows API |

---

## Open Issues

- None — all questions resolved during discovery.

---

## Assumptions

- User has an NVIDIA RTX 2060 with CUDA drivers installed (or will install them)
- Single-user personal use; no distribution or multi-user requirements
- First-launch model download (~1.5GB) is acceptable; no need to bundle model in exe
- Japanese is the primary source language; other pairs added via settings in Phase 3

---

## Project Rules

- **No paid APIs** — all processing must be free and local
- **No data retention** — audio buffers and temp files must be deleted on session close; no logging of transcribed content
- **Windows only** — no cross-platform requirement
- **Minimal UI** — no animations, themes, or cosmetic complexity; function over form
- **Framework defaults apply** for everything else

---

## Budget Ceiling

- **Soft ceiling:** $0 — no API costs permitted at any point
- **Type:** Hard stop
- **Scope:** All costs including LLM API calls, cloud hosting, third-party APIs

---

## Hosting and Deployment Target

- **Runtime environment:** Local Windows machine (user's desktop)
- **Cloud provider:** None
- **CI/CD:** Not required
- **Containerization:** Not needed — native Windows `.exe`

---

## Paid API Tolerance

- **Pre-approved APIs:** None
- **Prohibited APIs:** All paid APIs prohibited
- **Per-call cap:** N/A
- **Monthly cap:** N/A

---

## Test Plan Summary

- **Unit tests:** Audio chunking logic, language pair configuration loading, cleanup routine (verify no files remain after session)
- **Integration tests:** Full pipeline test (captured audio → Whisper output → subtitle display) using a short Japanese audio clip
- **Acceptance criteria:** Subtitles appear within 2 seconds on RTX 2060 hardware for continuous Japanese speech; app closes cleanly with no temp files remaining; language pair switch works without restart
