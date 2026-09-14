import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { buttonStyles } from "@/components/ui/Button";
import { RequestStateModal } from "@/components/ui/RequestStateModal";
import { isApiException } from "@/services/apiClient";
import type { ApiError } from "@/types";
import { getBlockingErrorTitle, isBlockingError } from "@/utils/errorSeverity";
import { ExternalLink, FolderGit2, Github, ShieldCheck } from "lucide-react";
import { supervisorApi } from "../api/supervisorApi";
import type { GitHubRepositoryAccessRequestValidation } from "../types";
import { isTrustedGitHubInstallationUrl } from "../utils/githubAuthorizeUrl";

const INVALID_LINK_MESSAGE =
  "This access request link is invalid or unavailable. Please create a new access request from the project.";

function createPageError(
  status: number,
  code: ApiError["code"],
  message: string,
): ApiError {
  return {
    code,
    message,
    details: [],
    timestamp: new Date().toISOString(),
    status,
    error: status === 410 ? "Gone" : "Request Failed",
    path: "/github/request-access",
    traceId: null,
  };
}


function terminalRequestError(
  request: GitHubRepositoryAccessRequestValidation,
): ApiError | null {
  if (request.status === "PENDING") {
    return null;
  }
  if (request.status === "EXPIRED") {
    return createPageError(
      410,
      "CONFLICT",
      "This repository access request has expired. Ask the ResearchTrack project member to create a new request.",
    );
  }
  if (request.status === "COMPLETED") {
    return createPageError(
      409,
      "CONFLICT",
      "This repository access request has already been completed.",
    );
  }
  return createPageError(
    409,
    "CONFLICT",
    "This repository access request is no longer available to continue.",
  );
}

export function RequestGitHubRepositoryAccessPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(
    () => searchParams.get("token")?.trim() ?? "",
    [searchParams],
  );

  const [validation, setValidation] =
    useState<GitHubRepositoryAccessRequestValidation | null>(null);
  const [isValidating, setIsValidating] = useState(Boolean(token));
  const [isContinuing, setIsContinuing] = useState(false);
  const [error, setError] = useState<ApiError | null>(
    token
      ? null
      : createPageError(400, "BAD_REQUEST", INVALID_LINK_MESSAGE),
  );

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setValidation(null);
      setIsValidating(false);
      setError(createPageError(400, "BAD_REQUEST", INVALID_LINK_MESSAGE));
      return () => {
        cancelled = true;
      };
    }

    setIsValidating(true);
    setValidation(null);
    setError(null);

    void supervisorApi
      .validatePublicGitHubRepositoryAccessRequest(token)
      .then((data) => {
        if (cancelled) return;
        setValidation(data);
        setError(terminalRequestError(data));
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          isApiException(loadError)
            ? loadError.apiError
            : createPageError(404, "NOT_FOUND", INVALID_LINK_MESSAGE),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsValidating(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const errorMessage = error?.message ?? null;
  const canContinue =
    Boolean(token) && validation?.status === "PENDING" && !error;

  async function handleContinue() {
    if (!token || !canContinue) {
      return;
    }

    setIsContinuing(true);
    setError(null);

    try {
      const data =
        await supervisorApi.continuePublicGitHubRepositoryAccessRequest(token);
      if (!data.githubAuthorizeUrl?.trim()) {
        setError(
          createPageError(
            503,
            "SERVICE_UNAVAILABLE",
            "GitHub authorization URL could not be prepared. Please try again.",
          ),
        );
        return;
      }
      if (!isTrustedGitHubInstallationUrl(data.githubAuthorizeUrl)) {
        setError(
          createPageError(
            400,
            "BAD_REQUEST",
            "GitHub authorization URL is invalid. Please try again.",
          ),
        );
        return;
      }
      window.location.assign(data.githubAuthorizeUrl);
    } catch (continueError) {
      setError(
        isApiException(continueError)
          ? continueError.apiError
          : createPageError(
              503,
              "SERVICE_UNAVAILABLE",
              "Unable to continue to GitHub right now. Please try again.",
            ),
      );
    } finally {
      setIsContinuing(false);
    }
  }

  const showBlockingState = error ? isBlockingError(error) : false;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-slate-50 to-transparent" />

        <div className="relative z-10 p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Access Request
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Request Repository Access
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
            Review the exact repository requested by ResearchTrack, then
            continue to GitHub to grant the required GitHub App access. The
            repository cannot be changed from this page.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <FolderGit2 className="h-4 w-4" />
                Repository
              </div>
              <p className="mt-2 break-all text-sm font-semibold text-slate-700">
                {isValidating
                  ? "Validating request..."
                  : validation?.repositoryFullName ?? "Unavailable"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                Request status
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {isValidating ? "Checking..." : validation?.status ?? "Invalid"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <Github className="h-4 w-4" />
                Expires
              </div>
              <p className="mt-2 text-sm text-slate-700">
                {validation?.expiresAt
                  ? new Date(validation.expiresAt).toLocaleString()
                  : isValidating
                    ? "Checking..."
                    : "Unavailable"}
              </p>
            </div>
          </div>

          {errorMessage && !showBlockingState ? (
            <div className="mt-7 rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <p className="text-sm font-semibold text-rose-700">
                Unable to continue
              </p>
              <p className="mt-1 text-sm text-rose-700">{errorMessage}</p>
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Link
              to="/"
              className={buttonStyles({ variant: "secondary", size: "md" })}
            >
              Back
            </Link>
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={!canContinue || isValidating || isContinuing}
              className={buttonStyles({ variant: "primary", size: "md" })}
            >
              <span className="inline-flex items-center gap-2">
                <Github className="h-4 w-4" />
                <span>
                  {isValidating
                    ? "Validating..."
                    : isContinuing
                      ? "Redirecting..."
                      : "Continue to GitHub"}
                </span>
                {!isContinuing && !isValidating ? (
                  <ExternalLink className="h-4 w-4" />
                ) : null}
              </span>
            </button>
          </div>
        </div>
      </section>

      <RequestStateModal
        isOpen={showBlockingState}
        status="error"
        title={getBlockingErrorTitle(error)}
        message={error?.message ?? "Unable to continue right now."}
        onClose={() => setError(null)}
      />
    </div>
  );
}
