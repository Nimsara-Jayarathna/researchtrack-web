import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { buttonStyles } from "@/components/ui/Button";
import { isApiException } from "@/services/apiClient";
import type { ApiError } from "@/types";
import { ExternalLink, FolderGit2, Github, ShieldCheck } from "lucide-react";
import { publicGitHubAccessApi } from "../api/publicGitHubAccessApi";
import type { GitHubRepositoryAccessRequestValidation } from "../types";

const INVALID_LINK_MESSAGE =
  "This access request link is invalid or has expired. Ask the ResearchTrack supervisor for a new request link.";

function apiError(message: string, status = 400): ApiError {
  return {
    code: status === 404 ? "NOT_FOUND" : "BAD_REQUEST",
    message,
    details: [],
    timestamp: new Date().toISOString(),
    status,
    error: status === 404 ? "Not Found" : "Bad Request",
    path: "/github/request-access",
    traceId: null,
  };
}

function isValidGitHubAuthorizeUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname.toLowerCase() === "github.com"
    );
  } catch {
    return false;
  }
}

function statusMessage(status: string): string | null {
  switch (status.toUpperCase()) {
    case "COMPLETED":
      return "This request has already been completed. The supervisor can now select repositories in ResearchTrack.";
    case "EXPIRED":
      return "This request has expired. Ask the supervisor to create a new request.";
    case "REVOKED":
      return "This request was revoked by the supervisor.";
    case "FAILED":
      return "The previous authorization attempt did not complete. Ask the supervisor to create a new request.";
    default:
      return null;
  }
}

export function RequestGitHubRepositoryAccessPage() {
  const [searchParams] = useSearchParams();
  const { token: pathToken } = useParams();
  const token = useMemo(
    () => pathToken?.trim() || searchParams.get("token")?.trim() || "",
    [pathToken, searchParams],
  );
  const [validation, setValidation] =
    useState<GitHubRepositoryAccessRequestValidation | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isContinuing, setIsContinuing] = useState(false);
  const [error, setError] = useState<ApiError | null>(
    token ? null : apiError(INVALID_LINK_MESSAGE),
  );

  useEffect(() => {
    let cancelled = false;
    if (!token) return;
    setIsLoading(true);
    setError(null);
    void publicGitHubAccessApi
      .validate(token)
      .then((data) => {
        if (!cancelled) setValidation(data);
      })
      .catch((caught) => {
        if (cancelled) return;
        setError(
          isApiException(caught)
            ? caught.apiError
            : apiError(INVALID_LINK_MESSAGE, 404),
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const normalizedStatus = validation?.status?.toUpperCase() ?? "";
  const requestUnavailableMessage = validation
    ? statusMessage(normalizedStatus)
    : null;
  const canContinue = Boolean(
    token && validation && normalizedStatus === "PENDING" && !error,
  );

  async function handleContinue() {
    if (!canContinue) return;
    setIsContinuing(true);
    setError(null);
    try {
      const data = await publicGitHubAccessApi.continue(token);
      if (
        !data.githubAuthorizeUrl ||
        !isValidGitHubAuthorizeUrl(data.githubAuthorizeUrl)
      ) {
        setError(
          apiError(
            "GitHub authorization URL could not be prepared. Please try again.",
            503,
          ),
        );
        return;
      }
      window.location.assign(data.githubAuthorizeUrl);
    } catch (caught) {
      setError(
        isApiException(caught)
          ? caught.apiError
          : apiError(
              "Unable to continue to GitHub right now. Please try again.",
              503,
            ),
      );
    } finally {
      setIsContinuing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure GitHub App Request
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Authorize Repository Access
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            This request uses the same ResearchTrack GitHub App authorization as
            a direct connection. You are only authorizing the app on behalf of
            the requested GitHub owner; the ResearchTrack supervisor will choose
            which authorized repositories to link afterwards.
          </p>

          {isLoading ? (
            <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Validating secure request…
            </div>
          ) : validation ? (
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Project
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {validation.projectTitle}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  GitHub owner
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {validation.ownerLogin}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {validation.status}
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              "Authorize the ResearchTrack GitHub App",
              "Choose repositories in GitHub",
              "Return here; supervisor links repositories",
            ].map((label, index) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {index === 0 ? (
                    <Github className="h-4 w-4" />
                  ) : index === 1 ? (
                    <ShieldCheck className="h-4 w-4" />
                  ) : (
                    <FolderGit2 className="h-4 w-4" />
                  )}
                  Step {index + 1}
                </div>
                <p className="mt-2 text-sm text-slate-700">{label}</p>
              </div>
            ))}
          </div>

          {requestUnavailableMessage ? (
            <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              {requestUnavailableMessage}
            </div>
          ) : null}
          {error ? (
            <div className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
              {error.message}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Link
              to="/"
              className={buttonStyles({ variant: "secondary", size: "md" })}
            >
              Close
            </Link>
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={!canContinue || isContinuing}
              className={buttonStyles({ variant: "primary", size: "md" })}
            >
              <span className="inline-flex items-center gap-2">
                <Github className="h-4 w-4" />
                {isContinuing ? "Redirecting…" : "Authorize with GitHub"}
                {!isContinuing ? <ExternalLink className="h-4 w-4" /> : null}
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
