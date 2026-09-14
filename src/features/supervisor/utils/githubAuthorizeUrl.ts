export function isTrustedGitHubInstallationUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname.toLowerCase() !== "github.com" ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      parsed.hash
    ) {
      return false;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (
      segments.length !== 4 ||
      segments[0] !== "apps" ||
      !segments[1] ||
      segments[2] !== "installations" ||
      segments[3] !== "new"
    ) {
      return false;
    }

    const keys = [...parsed.searchParams.keys()];
    return (
      keys.length === 1 &&
      keys[0] === "state" &&
      Boolean(parsed.searchParams.get("state")?.trim())
    );
  } catch {
    return false;
  }
}
