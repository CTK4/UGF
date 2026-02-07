const te = new TextEncoder();

export async function sha256Hex(input: string): Promise<string> {
  const buf = te.encode(input);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = Array.from(new Uint8Array(digest));
  return bytes.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Tagged(tag: string, material: string): Promise<string> {
  return sha256Hex(`${tag}:${material}`);
}
