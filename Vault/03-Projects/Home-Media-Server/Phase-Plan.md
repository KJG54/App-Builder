# Phase Plan — Home Media Server
**Date:** 2026-06-11
**Based on spec:** Vault/09-Requirements/Home-Media-Server/Project-Spec.md
**Status:** Pending Approval

---

## Summary

| Phase | Goal | Effort | Risk |
|-------|------|--------|------|
| 1 | Ubuntu Server installed, network configured, SSH and firewall active | 2–3 hrs | Medium |
| 2 | External drives mounted and auto-mounting on boot | 1–2 hrs | Low |
| 3 | Jellyfin running with media library and GPU hardware transcoding | 2–3 hrs | Medium |
| 4 | WireGuard VPN active; remote access working from outside the home | 2–4 hrs | High |
| 5 | All services auto-start on reboot; firewall locked down; system verified stable | 1–2 hrs | Low |

**Total estimated effort:** 8–14 hours
**Budget ceiling:** $0 — all free, open-source software
**Estimated API/cloud cost:** None

---

## Phase 1: Ubuntu Server Installation & Network Configuration

**Goal:** Ubuntu Server is installed on the PC, assigned a permanent local IP address, accessible via SSH, and protected by a basic firewall.

**Deliverables:**
- Ubuntu Server LTS installed and booted
- Static local IP address assigned via Netplan (e.g. `192.168.1.100`)
- SSH enabled and accessible from another device on the network
- `ufw` firewall enabled with rules: allow SSH (22), allow Jellyfin (8096), allow WireGuard (51820/UDP)
- System updated (`apt upgrade`)

**Dependencies:** None (first phase)

**Test Plan:**
- Unit: SSH into the server from another device using its static IP — connection succeeds
- Integration: Reboot the server; confirm it comes back up with the same static IP
- Acceptance: Another household device can SSH to `192.168.1.100` (or chosen IP); `ufw status` shows correct rules active

**Estimated effort:** 2–3 hours
**Risk:** Medium — Ubuntu install is straightforward, but static IP configuration via Netplan has a learning curve and misconfiguration can cause loss of network access. Mitigation: keep a monitor and keyboard attached to the server during Phase 1.

---

## Phase 2: External Storage Setup

**Goal:** All external drives are mounted, organized, and configured to auto-mount on every boot.

**Deliverables:**
- Each external drive identified by UUID (not device name, which changes between reboots)
- Mount points created (e.g. `/mnt/movies`, `/mnt/music`, `/mnt/files`)
- `/etc/fstab` entries configured for each drive using UUID
- Correct permissions set so Jellyfin can read the drives

**Dependencies:** Phase 1 complete (Ubuntu installed, SSH accessible)

**Test Plan:**
- Unit: Each drive mounts successfully via `mount -a`
- Integration: Reboot the server; confirm all drives are auto-mounted at correct paths
- Acceptance: All drives visible at their mount points after a fresh reboot; a test file placed on each drive is readable

**Estimated effort:** 1–2 hours
**Risk:** Low — fstab is well-documented. Main risk is using device names (`/dev/sdb`) instead of UUIDs, which causes boot failures if drive order changes. Mitigation: always use UUIDs.

---

## Phase 3: Jellyfin Media Server + GPU Hardware Transcoding

**Goal:** Jellyfin is installed, media libraries are configured pointing to the external drives, and the RX 580 GPU is handling video transcoding.

**Deliverables:**
- Jellyfin installed via official Linux repository
- Jellyfin web UI accessible at `http://192.168.1.100:8096` from any household device
- Media libraries configured: Movies, Music, Files (pointing to Phase 2 mount points)
- AMD RX 580 VA-API hardware transcoding enabled in Jellyfin dashboard
- `jellyfin` user added to `render` and `video` groups for GPU access
- Jellyfin tested on: browser, phone, and smart TV (via Jellyfin app)

**Dependencies:** Phase 2 complete (drives mounted and readable)

**Test Plan:**
- Unit: Jellyfin web UI loads at `http://192.168.1.100:8096`; libraries show correct media count
- Integration: Play a video from a smart TV Jellyfin app; confirm smooth playback; confirm GPU is used (check Jellyfin dashboard — "Transcoding" tab shows VAAPI)
- Acceptance: Two household devices simultaneously stream different videos without buffering or CPU overload (`htop` shows GPU transcoding, CPU stays below 80%)

**Estimated effort:** 2–3 hours
**Risk:** Medium — VA-API setup on AMD requires correct driver and group permissions; misconfiguration causes Jellyfin to fall back to CPU transcoding silently. Mitigation: verify GPU access with `vainfo` command before enabling in Jellyfin.

---

## Phase 4: WireGuard VPN + DuckDNS Remote Access

**Goal:** WireGuard VPN is running on the server; household devices can route all traffic through it for privacy; any household member can connect remotely from anywhere in the world.

**Deliverables:**

**WireGuard Server:**
- WireGuard installed and configured as a VPN server
- Server key pair generated; `wg0.conf` server config written
- IP forwarding enabled in `/etc/sysctl.conf`
- WireGuard listening on UDP port 51820
- Xfinity router port forwarding rule: external UDP 51820 → server static IP UDP 51820
- Xfinity "Advanced Security" feature disabled (required for port forwarding to work)

**DuckDNS (Dynamic DNS):**
- DuckDNS account created and subdomain registered (e.g. `myhomeserver.duckdns.org`)
- DuckDNS update script installed and scheduled via cron every 5 minutes
- WireGuard config uses DuckDNS hostname instead of raw IP

**WireGuard Clients:**
- WireGuard client config generated for each household device (phone, laptop, etc.)
- Each client installed with the WireGuard app (Android, iOS, Windows, macOS all supported)
- Full-tunnel mode configured (all traffic routed through VPN)

**Dependencies:** Phase 1 complete (firewall rules for 51820/UDP already in place)

**Test Plan:**
- Unit: `wg show` on server shows active interface; at least one peer connected
- Integration: On a phone with mobile data (not home WiFi), enable WireGuard — confirm internet works and IP shows as home IP (not mobile carrier IP) via `whatismyip.com`
- Acceptance: Household member connects via WireGuard on mobile data and successfully streams a video from Jellyfin; DuckDNS hostname resolves correctly after a simulated IP change

**Estimated effort:** 2–4 hours
**Risk:** High — This is the most complex phase. Xfinity routers occasionally have double-NAT issues if in "bridge mode" or paired with another router, which blocks port forwarding entirely. Port blocking by Xfinity is also possible (rare but known). Mitigation: if port 51820 is blocked, try port 443/UDP as an alternative. If double-NAT is detected, resolve before proceeding.

---

## Phase 5: System Hardening & Reliability

**Goal:** All services start automatically on boot, firewall rules are locked to minimum required ports, and the system survives a hard reboot with everything working.

**Deliverables:**
- `jellyfin.service` confirmed enabled via systemd (`systemctl enable jellyfin`)
- `wg-quick@wg0.service` enabled via systemd for WireGuard auto-start
- DuckDNS cron job verified persistent across reboots
- `ufw` firewall reviewed: only ports 22 (SSH), 8096 (Jellyfin), 51820/UDP (WireGuard) open — all others closed
- Full reboot test: server cold-started; all services come up without manual intervention
- Optional: disable SSH password login, enable key-based auth only (recommended if server is exposed to internet)

**Dependencies:** Phases 1–4 complete and verified

**Test Plan:**
- Unit: `systemctl status jellyfin` and `systemctl status wg-quick@wg0` both show "active (running)" after reboot
- Integration: Pull power from server, restart, wait 2 minutes — Jellyfin and WireGuard both accessible without SSH intervention
- Acceptance: System is fully operational within 2 minutes of a cold boot with zero manual steps

**Estimated effort:** 1–2 hours
**Risk:** Low — All components have well-tested systemd integration. Main risk is WireGuard systemd service name varying by config file name. Mitigation: verify service name matches `wg0.conf` filename.

---

## Requirements Coverage Check

| Requirement | Covered In |
|-------------|-----------|
| FR-001: Jellyfin UI on all devices | Phase 3 |
| FR-002: Stream movies, music, files | Phase 3 |
| FR-003: External drives as media storage | Phase 2 + 3 |
| FR-004: WireGuard routes traffic privately | Phase 4 |
| FR-005: Remote access from anywhere | Phase 4 |
| FR-006: Dynamic DNS for changing public IP | Phase 4 |
| NFR-001: Efficient on older hardware | Phase 3 (GPU transcoding) |
| NFR-002: Free software only | All phases — no paid tools used |
| NFR-003: Auto-start on reboot | Phase 5 |
| NFR-004: Low maintenance | Phase 5 |

---

## Open Questions

None — all questions from discovery are resolved.

---

## Approval Gate

> **Implementation does NOT begin until this plan is approved.**
>
> Does this plan accurately reflect what you want to build? Should any phases be merged, split, reordered, or removed before we begin?
>
> Reply **"approved"** or suggest changes.
