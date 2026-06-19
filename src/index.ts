interface Env {
  LINEAR_WEBHOOK_SECRET: string;
  IFTTT_WEBHOOK_URL: string;
}

const LINEAR_IPS = [
  "35.231.147.226",
  "35.243.134.228",
  "34.140.253.14",
  "34.38.87.206",
  "34.134.222.122",
  "35.222.25.142",
];

async function computeHmac(key: string, data: ArrayBuffer): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return crypto.subtle.sign("HMAC", cryptoKey, data);
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

function timingSafeEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  const aView = new Uint8Array(a);
  const bView = new Uint8Array(b);
  if (aView.length !== bView.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < aView.length; i++) {
    result |= aView[i] ^ bView[i];
  }
  return result === 0;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const ip = request.headers.get("cf-connecting-ip") || "";
    if (ip && !LINEAR_IPS.includes(ip)) {
      return new Response("Unauthorized", { status: 403 });
    }

    const rawBody = await request.arrayBuffer();

    const linearSignature = request.headers.get("linear-signature");
    if (!linearSignature) {
      return new Response("Missing signature", { status: 401 });
    }

    const expectedSig = await computeHmac(env.LINEAR_WEBHOOK_SECRET, rawBody);
    const headerSig = hexToBuffer(linearSignature);
    if (!timingSafeEqual(expectedSig, headerSig)) {
      return new Response("Invalid signature", { status: 401 });
    }

    const decoder = new TextDecoder();
    const bodyText = decoder.decode(rawBody);
    const payload = JSON.parse(bodyText) as { webhookTimestamp?: number };
    if (payload.webhookTimestamp) {
      const drift = Math.abs(Date.now() - payload.webhookTimestamp);
      if (drift > 60_000) {
        return new Response("Stale webhook", { status: 401 });
      }
    }

    const iftttResponse = await fetch(env.IFTTT_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyText,
    });

    if (!iftttResponse.ok) {
      return new Response("Failed to forward to IFTTT", { status: 502 });
    }

    return new Response("OK", { status: 200 });
  },
};
