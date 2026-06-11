---
type: index
status: active
last_updated: 2026-06-11
author: Krystian Garcia
chroma_collection: ai-software-factory-sessions
tags: [ideas, projects, backlog]
related: [Registry.md, ../04-Workflows/GETTING-STARTED.md]
---

# Project Ideas

A running list of project concepts to build with the App Builder framework.
Start a project with `/discover` to turn any idea into a full spec.

---

## Games

- **3D action RPG** — Unreal Engine 5 + C++; open world, custom combat system, procedural dungeons
- **Roguelike dungeon crawler** — procedurally generated maps, permadeath, deep item/build systems; pure logic, no AI
- **2D platformer** — custom physics, level editor, local co-op; Unity or Godot
- **Turn-based strategy game** — hex grid, faction system, fog of war; C++ or Python
- **Text adventure engine** — parser-based interactive fiction with a reusable story scripting language
- **Tabletop RPG virtual table** — digital battle map, dice roller, initiative tracker, campaign notes; local network multiplayer

---

## AI & Local Models

- **Local model trained on Vault data** — fine-tune or RAG a small LLM on your Vault notes using Ollama; fully offline, no cloud API
- **Calorie tracker you can talk to** — log meals and workouts by speaking naturally; local speech-to-text + local LLM for parsing; no cloud
- **Personal knowledge assistant** — ask questions about your own notes, documents, and bookmarks; Chroma + local model; runs offline
- **Local code review bot** — runs a local model against your diffs and flags issues; integrates into git hooks
- **Voice-controlled home dashboard** — local speech recognition triggers automations and queries; no cloud services

---

## Tools & Utilities

- **Self-hosted bookmark manager** — save, tag, and full-text search URLs and saved page content; no external dependencies
- **File organizer** — watch a folder, auto-sort files by type/date/project using rules you define; runs as a background service
- **Code snippet manager** — save, tag, search, and copy code snippets; syntax highlighting; desktop app
- **Local password manager** — encrypted vault, autofill via browser extension, no cloud sync required
- **Pomodoro + focus tracker** — timer, session logging, daily focus reports; desktop app

---

## Health & Lifestyle

- **Workout tracker** — log exercises, sets, reps, weight; track PRs over time; visualize progress; fully offline
- **Meal planner + grocery list** — plan weekly meals, auto-generate shopping lists, track pantry inventory
- **Sleep tracker** — log sleep manually or via wearable export; trend analysis; no cloud
- **Habit tracker** — daily check-ins, streaks, heatmap calendar; simple and fast

---

## Web & Internal Tools

- **Small business invoicing tool** — client management, invoice creation, payment tracking, PDF export; self-hosted
- **Personal finance tracker** — log income/expenses, categorize transactions, visualize spending; local database
- **Project time tracker** — log time against projects/tasks, generate reports, export to CSV; internal use
- **Recipe manager** — store recipes, scale servings, generate shopping lists; searchable; self-hosted
- **Home inventory tracker** — catalog possessions by room, track warranties and purchase dates; useful for insurance

---

## Hardware & IoT

- **Home automation dashboard** — control smart lights, thermostat, outlets from a single local web UI; no cloud
- **Raspberry Pi security camera system** — motion detection, local recording, web UI for playback; no cloud storage
- **Plant watering monitor** — soil sensors + Pi; alerts when plants need water; logs moisture over time
- **Home media server** *(in progress)* — Jellyfin + WireGuard + DuckDNS on Ubuntu Server

---

## Your Ideas

*Add your own ideas below — use any format you like.*

- forex trading bot
- translator for videos actively playing.
- ai drone
- homelab
- finance ai
- skill builder
- make children of this framework
-

---

## How to Start a Project

1. Pick an idea
2. Run `/discover` — structured requirements interview
3. Run `/plan-project` — phased implementation plan
4. Build phase by phase
