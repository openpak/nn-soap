# Changelog — nn-soap

Generated from git history on 2026-09-15. `git log` stays the source
of truth; this file is the readable summary.

## v0.2.1 - 2026-11-04

- The 404 catch-all now logs `unhandled <method> <host> <path>` (v0.2.0 documented it but did not ship it).

## v0.2.0 - 2026-11-04

- Protocol capture mode (card 124, P0): with `NN_SOAP_CAPTURE_DIR` set every request that reaches the
  service, including unknown hosts and paths that end in the 404 catch-all, is written to a daily
  JSON-lines file (method, host, URL, all headers, body, status). Tokens, tickets, passwords, cookies
  and session handles are masked; files are removed after 90 days. The 404 catch-all also logs
  `unhandled <method> <host> <path>`. The error handler now has its four-argument form.

## v0.1.2 — 2026-11-03

- Request log line is now `<method> <path> -> <status> <ms>ms` with no query string (morgan `dev`
  printed the full URL).

## v0.1.1 — 2026-09-24

- deps: express 4.22, body-parser, qs, path-to-regexp, send, serve-static, cookie, morgan patched (Dependabot)

## v0.1.0 — 2026-09-10

- OpenPak fork: container image and tag-driven ghcr release [a1a171c]
- Comeplete rewrite. Now can serve titles [d54ff3e]
- eShop goes online now! Still can't download titles [b48cfd4]
- Still broken, but updated [074a3bd]
- Updated tests [4d042de]
- Updated SOAP stuff [338c5d1]
- Added test SOAP stuff [a6d5135]
- Please don't use this, this is just a test [a909cc8]
- Initial commit [8c5ce13]

