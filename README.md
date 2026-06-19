# linear-forwarder

A Cloudflare Worker that receives [Linear webhook](https://linear.app/developers/webhooks) events, verifies their signature, and forwards them to IFTTT.

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Configure secrets

Create two secrets via `wrangler`:

```sh
npx wrangler secret put LINEAR_WEBHOOK_SECRET
npx wrangler secret put IFTTT_WEBHOOK_URL
```

- `LINEAR_WEBHOOK_SECRET` — The signing secret from your Linear webhook configuration page.
- `IFTTT_WEBHOOK_URL` — The IFTTT webhook endpoint URL to forward payloads to.

### 3. Deploy

```sh
npm run deploy
```

### 4. Configure Linear webhook

In Linear, go to **Settings → API → Webhooks**, create a new webhook, and point it at your deployed Worker URL (e.g. `https://linear-forwarder.<your-subdomain>.workers.dev`).

### Local development

```sh
npm run dev
```

### IFTTT filter script example

See [`examples/ifttt-filter-script.ts`](examples/ifttt-filter-script.ts) for a filter script that appends completed Linear issues to a daily Dropbox text file.

### Type-check

```sh
npm run typecheck
```
