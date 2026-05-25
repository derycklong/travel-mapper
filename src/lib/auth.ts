export function validateAdmin(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [prefix, timestamp] = decoded.split(":");
    if (prefix !== "admin") return false;
    const tokenTime = parseInt(timestamp);
    const now = Date.now();
    // Token expires after 24 hours
    return now - tokenTime < 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function createAdminToken(): string {
  return Buffer.from(`admin:${Date.now()}`).toString("base64");
}
