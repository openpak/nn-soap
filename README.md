# Wii U/3DS SOAP Server

OpenPak's Wii U/3DS SOAP Server.

| | |
| --- | --- |
| Network | Wii U, 3DS |
| Role | NUS and eShop ECS SOAP: serves the Nintendo Update Server and ECS endpoints for titles and tickets an operator provides |
| Image | `ghcr.io/openpak/nn-soap` |
| Based on | [Pretendo `SOAP`](https://github.com/PretendoNetwork/SOAP) (AGPL-3.0) |
| Licence | AGPL-3.0-only |

## What it serves

| Surface | What |
| --- | --- |
| Wii U (`src/wup/`) | NUS and ECS SOAP routes: IAS, CCS, CCS CDN and ECS |
| 3DS (`src/ctr/`) | eShop SOAP routes: CCS, CCS CDN and ECS |

Nothing ships in the image. Titles and tickets are mounted by the operator at `/app/src/titles`.

## Run

```sh
cp src/example.config.json src/config.json   # set http.port
npm ci --omit=dev
npm start
```

## Docs

- [Protocol](docs/protocol.md)
- [Deploy](docs/deploy.md)
- [Notes](docs/notes.md)
- [Upstream README](docs/upstream.md)
- [Docs index](docs/README.md)

## Licence

AGPL-3.0-only. See [LICENSE](LICENSE).
