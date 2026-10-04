import { useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ModalShell } from "@/components/ui/ModalShell";
import { submissionApi } from "../api/submissionApi";
import { parseDocxPreview, type DocxPreviewDocument } from "../lib/docxPreview";
import { formatBytes } from "../lib/submissionFiles";
import { submissionPreviewKind } from "../lib/submissionPreview";
import type { SubmissionVersion } from "../types";

type Props = {
  isOpen: boolean;
  projectId: string;
  submissionId: string | null;
  version: SubmissionVersion | null;
  onClose: () => void;
};

type LoadState = "idle" | "loading" | "ready" | "error";

function paragraphClasses(style: string) {
  if (style === "title")
    return "text-2xl font-bold leading-tight text-slate-950";
  if (style === "heading1") return "mt-5 text-xl font-bold text-slate-950";
  if (style === "heading2") return "mt-4 text-lg font-bold text-slate-900";
  if (style === "heading3") return "mt-3 text-base font-bold text-slate-900";
  return "text-sm leading-7 text-slate-800";
}

function DocxDocument({ document }: { document: DocxPreviewDocument }) {
  if (document.blocks.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        This document does not contain previewable text.
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-[720px] max-w-[850px] rounded-sm bg-white px-10 py-12 shadow-sm ring-1 ring-slate-200 sm:px-14">
      <div className="space-y-3">
        {document.blocks.map((block, blockIndex) => {
          if (block.type === "table") {
            return (
              <div key={`table-${blockIndex}`} className="overflow-x-auto py-2">
                <table className="w-full border-collapse text-sm text-slate-800">
                  <tbody>
                    {block.rows.map((row, rowIndex) => (
                      <tr key={`row-${blockIndex}-${rowIndex}`}>
                        {row.map((cell, cellIndex) => (
                          <td
                            key={`cell-${blockIndex}-${rowIndex}-${cellIndex}`}
                            className="whitespace-pre-wrap border border-slate-300 px-3 py-2 align-top"
                          >
                            {cell || "\u00a0"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          const alignClass =
            block.align === "center"
              ? "text-center"
              : block.align === "right"
                ? "text-right"
                : block.align === "justify"
                  ? "text-justify"
                  : "text-left";

          return (
            <p
              key={`paragraph-${blockIndex}`}
              className={`${paragraphClasses(block.style)} ${alignClass} whitespace-pre-wrap`}
            >
              {block.bullet ? <span className="mr-2">•</span> : null}
              {block.runs.length > 0 ? (
                block.runs.map((run, runIndex) => (
                  <span
                    key={`run-${blockIndex}-${runIndex}`}
                    className={`${run.bold ? "font-bold" : ""} ${run.italic ? "italic" : ""} ${run.underline ? "underline" : ""}`}
                  >
                    {run.text}
                  </span>
                ))
              ) : (
                <span>&nbsp;</span>
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export function SubmissionPreviewModal({
  isOpen,
  projectId,
  submissionId,
  version,
  onClose,
}: Props) {
  const [state, setState] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [docxDocument, setDocxDocument] = useState<DocxPreviewDocument | null>(
    null,
  );
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const kind = useMemo(
    () => (version ? submissionPreviewKind(version) : null),
    [version],
  );

  useEffect(() => {
    if (!isOpen || !submissionId || !version || !kind) return;

    const previewSubmissionId = submissionId;
    const previewVersionId = version.id;
    const controller = new AbortController();
    let objectUrl: string | null = null;

    async function loadPreview() {
      setState("loading");
      setError(null);
      setPdfUrl(null);
      setDocxDocument(null);

      try {
        const grant = await submissionApi.getDownloadUrl(
          projectId,
          previewSubmissionId,
          previewVersionId,
          "inline",
        );
        const response = await fetch(grant.url, { signal: controller.signal });
        if (!response.ok)
          throw new Error("The file could not be loaded for preview.");

        if (kind === "pdf") {
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(
            blob.type === "application/pdf"
              ? blob
              : new Blob([blob], { type: "application/pdf" }),
          );
          setPdfUrl(objectUrl);
        } else {
          const buffer = await response.arrayBuffer();
          setDocxDocument(await parseDocxPreview(buffer));
        }
        setState("ready");
      } catch {
        if (controller.signal.aborted) return;
        setState("error");
        setError(
          "We could not display this file here. Please try again or download the original file.",
        );
      }
    }

    void loadPreview();
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isOpen, kind, projectId, reloadKey, submissionId, version]);

  useEffect(() => {
    if (isOpen) return;
    setState("idle");
    setError(null);
    setPdfUrl(null);
    setDocxDocument(null);
    setDownloadBusy(false);
    setReloadKey(0);
  }, [isOpen]);

  async function downloadOriginal() {
    if (!submissionId || !version) return;
    setDownloadBusy(true);
    setError(null);
    try {
      const grant = await submissionApi.getDownloadUrl(
        projectId,
        submissionId,
        version.id,
        "attachment",
      );
      const anchor = document.createElement("a");
      anchor.href = grant.url;
      anchor.rel = "noopener noreferrer";
      anchor.target = "_blank";
      anchor.click();
    } catch {
      setError("Unable to download the original file. Please try again.");
    } finally {
      setDownloadBusy(false);
    }
  }

  if (!version || !submissionId || !kind) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      containerClassName="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5"
      backdropClassName="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"
      dialogClassName="relative z-10 h-[94vh] w-full max-w-6xl"
      onBackdropClick={onClose}
      lockBodyScroll
      ariaLabel={`Preview ${version.originalFileName}`}
    >
      <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-2xl">
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 shrink-0 text-slate-500" />
              <h2 className="truncate text-base font-bold text-slate-900">
                {version.originalFileName}
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Version {version.versionNumber} · {kind.toUpperCase()} ·{" "}
              {formatBytes(version.fileSizeBytes)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={downloadBusy}
              leftIcon={<Download className="h-4 w-4" />}
              onClick={() => void downloadOriginal()}
            >
              {downloadBusy ? "Preparing…" : "Download original"}
            </Button>
            <button
              type="button"
              aria-label="Close preview"
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {error ? (
          <div
            role="alert"
            className="mx-5 mt-4 flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <span>{error}</span>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => setReloadKey((value) => value + 1)}
            >
              Retry
            </Button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          {state === "loading" ? (
            <div className="mx-auto flex min-h-[65vh] max-w-4xl items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="text-center">
                <RefreshCw className="mx-auto h-6 w-6 animate-spin text-slate-500" />
                <p className="mt-3 text-sm font-medium text-slate-600">
                  Preparing preview…
                </p>
              </div>
            </div>
          ) : null}

          {state === "ready" && kind === "pdf" && pdfUrl ? (
            <iframe
              title={`Preview of ${version.originalFileName}`}
              src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              className="h-full min-h-[72vh] w-full rounded-2xl border border-slate-200 bg-white shadow-sm"
            />
          ) : null}

          {state === "ready" && kind === "docx" && docxDocument ? (
            <DocxDocument document={docxDocument} />
          ) : null}

          {state === "error" ? (
            <div className="mx-auto flex min-h-[55vh] max-w-3xl items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div>
                <FileText className="mx-auto h-9 w-9 text-slate-400" />
                <h3 className="mt-3 font-bold text-slate-900">
                  Preview unavailable
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  We could not display this file here. You can still download
                  the original file.
                </p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={() => void downloadOriginal()}
                >
                  Download original
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ModalShell>
  );
}
