# Next session — nn-soap

Updated 2026-09-15.

NUS/ECS SOAP for Wii U and 3DS eShop: Pretendo's SOAP (AGPL), containerised
and rewired for OpenPak. Deployed 2026-09-10 on port 20110 behind the Traefik
TLS leaf for the `*.shop.nintendo.net` / `*.shop.nintendowifi.net` names,
tagged `v0.1.0`, not console-verified. Tree is clean apart from placeholder
`CHANGELOG.md` / `docs/` / `prds/`.

## Where things stand

- One commit of OpenPak work (`a1a171c`: container image + tag-driven ghcr
  release) on top of upstream's arc: test server → "eShop goes online now!
  Still can't download titles" → "Comeplete rewrite. Now can serve titles".
- Serves only what the operator mounts: nothing ships in the image. Content
  goes to `/app/src/titles/{wup,ctr}/{aoc,patch,title}/<title-id>/` with
  `title.tmd`, `title.tik` and encrypted contents (README has the tree).
- Upstream limitations inherited unchanged, still true:
  - Tickets are requested by TIV, not title id; each `ecs.js` has hard-coded
    paths and must be edited per served ticket.
  - 3DS: a TIV list that omits a ticket the console has makes the 3DS delete
    it — titles vanish from HOME (content survives; `faketik` restores the
    icon, but see the README's faketik warning). Wii U unaffected.
  - 3DS eShop beyond SOAP needs Samurai/Ninja; upstream points at Hokage,
    which upstream itself calls not yet usable.
- Emulator angle: Cemu online still needs a console dump; Azahar has no
  eShop path — so verification is real-hardware-only for now.

## Next steps

1. First console exercise: a Wii U update check (NUS) and ECS request through
  Traefik, once a console is signed in (`nn-inkay` / SSSL). Nothing in this
  repo has ever answered a real console.
2. Decide the first operator content set for `/app/src/titles` — currently
   unspecified; the service is an empty shelf by design.
3. When a real ticket request is observed: replace the hard-coded TIV paths
   in `ecs.js` with config (upstream's own stated future direction).
4. Keep the 3DS TIV-deletion warning in front of anyone adding 3DS tickets.

## Pointers

- `README.md` — layout, TIV note, the two 3DS warnings in full.
- `src/wup/`, `src/ctr/` — the two SOAP surfaces and their routes.
- `../../prds/platform-wiiu-prd.md`, `../../prds/platform-3ds-prd.md` —
  server-side inventory rows that name this service.
- `../../ports.md` — row 20110 and the Traefik TLS row.

## Scratch (research and throwaway work)

Decompiles, Ghidra projects, dumps, exefs/romfs extracts, packet captures,
strace and emulator logs, probe harnesses: put them in
`~/REPOS/Openpak/scratch/<topic>`. That folder is a local mount of the media pool,
outside every repository, so nothing in it is committed. Never use `/tmp` (a
shared 15 GB RAM disk) or elsewhere on `/home` for this. Keys and signing
material never go there. Rule: `docs/playbooks/conventions.md` in the workspace.
