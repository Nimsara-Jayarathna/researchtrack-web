const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

function tryParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function normalizeGitHubRepositoryUrl(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return null;
  }

  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  const parsed = tryParseUrl(withScheme);
  if (!parsed) {
    return null;
  }

  const protocol = parsed.protocol.toLowerCase();
  const host = parsed.hostname.toLowerCase();
  if (
    protocol !== "https:" ||
    !GITHUB_HOSTS.has(host) ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.port !== "" ||
    parsed.search !== "" ||
    parsed.hash !== "" ||
    parsed.pathname.includes("%")
  ) {
    return null;
  }

  const segments = parsed.pathname.split("/").filter(Boolean);
  if (segments.length !== 2) {
    return null;
  }

  const owner = segments[0];
  const repository = segments[1].replace(/\.git$/i, "");
  if (
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(owner) ||
    !/^[A-Za-z0-9._-]{1,100}$/.test(repository)
  ) {
    return null;
  }

  return `https://github.com/${owner}/${repository}`;
}
