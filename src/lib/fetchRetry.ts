/**
 * Wraps fetch with automatic retry on:
 *   - HTTP 429  (Rate-Limit)   — waits the duration advertised in the body
 *   - HTTP 412  (PREC412)      — ingestion not yet propagated; waits 5 s
 *                               (only when retryOn412 = true)
 * Falls back to escalating delays (5 s, 10 s, 15 s …) when no hint available.
 */
export async function fetchRetry(
  url: string,
  options: RequestInit = {},
  maxAttempts = 8,
  retryOn412 = true,
): Promise<Response> {
  let res!: Response;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    res = await fetch(url, options);

    if (res.status === 429) {
      let wait = 5_000 * (attempt + 1); // escalating: 5s, 10s, 15s …
      try {
        const body = await res.clone().text();
        const match = body.match(/(\d+(?:\.\d+)?)\s*second/i);
        if (match) {
          // Respect the advertised wait, but also apply the escalating floor
          const advertised = Math.ceil(parseFloat(match[1])) * 1_000 + 500;
          wait = Math.max(advertised, wait);
        }
      } catch { /* ignore */ }
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (res.status === 412 && retryOn412) {
      // PREC412: backend ingestion not yet propagated — retry with fixed delay
      await new Promise((r) => setTimeout(r, 5_000));
      continue;
    }

    return res;
  }
  return res;
}
