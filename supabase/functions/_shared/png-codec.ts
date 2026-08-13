// Shared PNG codec wrappers.
//
// Edge functions run pure-JS pngjs; zlib deflate at the default level is the
// single most expensive thing in the image pipeline, and a cover render decodes
// + re-encodes the same canvas five or six times (trim → fit → QA → splash →
// logo → headline). At 1080x1920 that is enough to trip WORKER_RESOURCE_LIMIT.
//
// Two mitigations, both lossless for pixels:
//   1. write() uses a low deflate level + fixed filter — a few % larger file,
//      several times cheaper in CPU.
//   2. read() memoises by buffer identity, so repeated QA passes over the same
//      bytes decode once.
import { PNG } from "npm:pngjs@7.0.0";
import { Buffer } from "node:buffer";

const decodeCache = new WeakMap<Uint8Array, PNG>();

/** Decode a PNG, reusing the previous decode of the exact same buffer. */
export function readPng(bytes: Uint8Array): PNG {
  const hit = decodeCache.get(bytes);
  if (hit) return hit;
  const png = PNG.sync.read(Buffer.from(bytes));
  decodeCache.set(bytes, png);
  return png;
}

/** Encode a PNG with cheap deflate settings (CPU-bound runtime). */
export function writePng(png: PNG): Uint8Array {
  const bytes = new Uint8Array(
    PNG.sync.write(png, { deflateLevel: 3, deflateStrategy: 0, filterType: 0 } as any),
  );
  decodeCache.set(bytes, png);
  return bytes;
}
