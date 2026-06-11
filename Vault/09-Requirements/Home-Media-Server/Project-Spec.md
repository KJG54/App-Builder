---
type: guide
status: active
last_updated: 2026-06-11
author: Claude-Builder-Agent
---

# Project Specification — Home Media Server
**Date:** 2026-06-11
**Status:** Confirmed

---

## Goals

Build a private home media and file server on an older PC running Ubuntu Server. All household devices (smart TVs, phones, laptops, desktops) can browse and stream media via a polished UI. Household internet traffic is routed privately via VPN. Remote access to the server from outside the home is also supported.

**Success in 6 months:** Every household device can browse and play any movie, song, or file from the server. No outside party can observe household traffic. Any household member can connect remotely from anywhere.

---

## Users

| Persona | Description | Technical Level | Scale |
|---------|-------------|-----------------|-------|
| Household members | Family/roommates on shared network | Non-technical to intermediate | 2–6 users |

---

## Functional Requirements

| ID | Requirement | Acceptance Criteria | Priority |
|----|-------------|---------------------|----------|
| FR-001 | Media library browsable from smart TVs, phones, laptops, desktops | All device types can open Jellyfin and browse library | Must Have |
| FR-002 | Stream movies, music, and general files from the server | Smooth playback with no buffering on local network | Must Have |
| FR-003 | External drives recognized as media storage | Jellyfin scans and indexes content from mounted external drives | Must Have |
| FR-004 | WireGuard VPN routes all household traffic privately | Connected devices show no ISP-visible traffic; DNS leaks absent | Must Have |
| FR-005 | Remote access to server and media from outside the home | Household members can connect via WireGuard from any location | Must Have |
| FR-006 | Dynamic DNS resolves server's public IP automatically | Remote VPN connection works even when public IP changes | Must Have |

---

## Non-Functional Requirements

| ID | Requirement | Metric | Priority |
|----|-------------|--------|----------|
| NFR-001 | Efficient on older hardware | Server CPU stays below 80% during 2 simultaneous streams | Must Have |
| NFR-002 | Free software only | Zero subscription or licensing costs | Must Have |
| NFR-003 | Reliable uptime | Server recovers automatically after reboot (systemd services) | Should Have |
| NFR-004 | Low maintenance | No manual intervention needed for routine operation | Should Have |

---

## Business Requirements

| ID | Requirement | Rationale |
|----|-------------|-----------|
| BR-001 | All software must be free and open-source | No recurring costs; household budget constraint |
| BR-002 | Private from outside the household | ISP and external parties should not observe traffic |
| BR-003 | No per-device licenses or subscriptions | Household has multiple device types |

---

## Architecture Recommendations

### OS: Ubuntu Server LTS
- No GUI overhead — better performance on older hardware
- Excellent community documentation
- Long-term support releases are stable and well-maintained
- **Alternative considered:** Ubuntu Desktop — rejected (higher resource usage, unnecessary on a headless server)

### Media Server: Jellyfin
- Free, open-source, no paywall features
- Polished web UI + native apps for all major platforms (TV, phone, desktop)
- Supports external drive libraries natively
- Hardware transcoding supported on older Intel/AMD GPUs
- **Alternative considered:** Plex — rejected (key features require Plex Pass subscription)

### VPN: WireGuard
- Significantly lower CPU overhead than OpenVPN — important for older hardware
- Built into Linux kernel (5.6+); Ubuntu Server includes it
- Simple configuration; ~10 lines per peer
- Supports split-tunnel (route only VPN traffic) or full-tunnel (route all traffic)
- **Alternative considered:** OpenVPN — rejected (higher CPU, more complex config)

### Dynamic DNS: DuckDNS
- Free, no account required beyond email
- Automatic IP update via cron job or systemd timer
- Required because home ISPs assign dynamic public IPs
- **Alternative considered:** No-IP — viable but has monthly confirmation requirement on free tier

### Static Local IP
- Assigned during Ubuntu setup via Netplan configuration
- Prevents server IP from changing on router restarts
- Required for reliable WireGuard and Jellyfin client connections

---

## Suggested Tools and Integrations

| Tool | Purpose | Cost |
|------|---------|------|
| Ubuntu Server LTS | Operating system | Free |
| Jellyfin | Media server + UI | Free |
| WireGuard | VPN (privacy + remote access) | Free |
| DuckDNS | Dynamic DNS for remote access | Free |
| Netplan | Static IP configuration (built into Ubuntu) | Free |
| systemd | Auto-start all services on reboot | Free (built-in) |
| ufw | Firewall (built into Ubuntu) | Free |

---

## Development Roadmap

| Phase | Tasks | Priority |
|-------|-------|----------|
| 1 — OS Setup | Install Ubuntu Server, configure static IP, set up firewall (ufw), enable SSH | Must Have |
| 2 — Storage | Mount external drives, configure fstab for auto-mount on boot | Must Have |
| 3 — Media Server | Install and configure Jellyfin, point at media libraries on external drives | Must Have |
| 4 — VPN | Install WireGuard, configure server and peer keys, set up port forwarding on router | Must Have |
| 5 — Remote Access | Install DuckDNS client, configure auto-update cron, test remote connection | Must Have |
| 6 — Hardening | Auto-start all services via systemd, test reboot recovery, basic firewall rules | Should Have |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Older PC lacks hardware for smooth transcoding | Medium | High | Jellyfin direct-play reduces transcoding need; test early |
| Router doesn't support port forwarding | Low | High | Check router admin panel early in Phase 4 |
| ISP blocks WireGuard port (51820) | Low | Medium | Use alternate port (e.g. 443/UDP) |
| External drives not auto-mounting after reboot | Medium | Medium | Configure fstab with UUID-based mount entries |
| Dynamic IP changes break remote access before DuckDNS updates | Low | Low | DuckDNS update interval is configurable down to 5 minutes |

---

## Open Issues

None — all questions resolved.

---

## Assumptions

- The server PC will be connected to the router via wired ethernet (recommended for streaming reliability)
- Router is Xfinity — port forwarding is supported but may require disabling Xfinity's "Advanced Security" feature first; double-NAT is a known risk if Xfinity Gateway is in router mode alongside another router
- GPU is AMD RX 580 — hardware transcoding via VAAPI (VA-API) is supported on Linux with the `amdgpu` driver; enables Jellyfin to offload transcoding from CPU
- Peak simultaneous streams: 2 — RX 580 handles this comfortably with hardware transcoding enabled
- External drives are USB 3.0 or SATA attached
- No authentication/access control required for Jellyfin at this time (can be added later)
- Household members are comfortable installing a WireGuard client app on their devices

---

## Project Rules

- Free and open-source software only — no paid tiers, subscriptions, or proprietary tools
- No cloud hosting — everything runs on the home PC
- No custom code unless an existing tool genuinely cannot solve the requirement
- Prefer well-documented, actively maintained projects

---

## Budget Ceiling

- **Soft ceiling:** $0 (free software only)
- **Type:** Hard stop on paid software; no API cost concerns (local deployment)
- **Scope:** Software licensing and subscriptions

---

## Hosting and Deployment Target

- **Runtime environment:** Local — older home PC on household LAN
- **Cloud provider:** None
- **CI/CD:** Not required
- **Containerization:** Optional (Docker can be used for Jellyfin if preferred, but native install is simpler)

---

## Paid API Tolerance

- **Pre-approved APIs:** None
- **Prohibited APIs:** All paid APIs — project must remain cost-free
- **Per-call cap:** N/A
- **Monthly cap:** $0

---

## Test Plan Summary

- **Unit:** Not applicable (no custom code)
- **Integration:** Each phase verified before proceeding to the next (e.g., confirm Jellyfin streams before configuring VPN)
- **Acceptance:** 
  - Smart TV can browse and play a movie via Jellyfin
  - Phone connected via WireGuard (off home WiFi) can stream a video
  - Server survives reboot with all services auto-starting
