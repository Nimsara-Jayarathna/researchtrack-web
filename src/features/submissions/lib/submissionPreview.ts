import type { SubmissionVersion } from "../types";
import { fileExtension } from "./submissionFiles";

export type SubmissionPreviewKind = "pdf" | "docx";

export function submissionPreviewKind(
  version: Pick<
    SubmissionVersion,
    "originalFileName" | "fileExtension" | "contentType"
  >,
): SubmissionPreviewKind | null {
  const extension = (
    version.fileExtension || fileExtension(version.originalFileName)
  )
    .replace(/^\./, "")
    .toLowerCase();
  if (
    extension === "pdf" ||
    version.contentType.toLowerCase() === "application/pdf"
  ) {
    return "pdf";
  }
  if (
    extension === "docx" ||
    version.contentType.toLowerCase() ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  return null;
}

export function previewUnavailableMessage(
  version: Pick<SubmissionVersion, "fileExtension">,
) {
  const type =
    version.fileExtension.replace(/^\./, "").toUpperCase() || "this file type";
  return `Preview is not available for ${type} files. Download the original file instead.`;
}
