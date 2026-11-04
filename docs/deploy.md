# Deploy: nn-soap

Fork of Pretendo's `SOAP` (AGPL-3.0). Serves the Nintendo Update Server and eShop ECS SOAP
endpoints for titles and tickets an operator provides (nothing ships in the image). Image:
`ghcr.io/openpak/nn-soap` on tag, listening on 20110; mount content at `/app/src/titles`.

## Capture mode

Set `NN_SOAP_CAPTURE_DIR=/capture` and mount a volume at `/capture` to record every request
(method, host, URL, headers, body, status) as `/capture/<YYYY-MM-DD>.jsonl`, secrets masked, kept
90 days. Used for protocol work on the Wii U shop (`prds/repos/wiiu-eshop-plan.md`). It is not the
service log: the one-line request log still goes to stdout and `openpak-logd`.
