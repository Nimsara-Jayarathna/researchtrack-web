const CONTENT_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  pptx: [
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  zip: ["application/zip", "application/x-zip-compressed"],
};

export function fileExtension(fileName: string) {
  const dot = fileName.lastIndexOf(".");
  return dot < 0 ? "" : fileName.slice(dot + 1).trim().toLowerCase();
}

export function normalizedContentType(file: File) {
  const extension = fileExtension(file.name);
  return file.type || CONTENT_TYPES[extension]?.[0] || "application/octet-stream";
}

export function validateSubmissionFile(
  file: File,
  allowedTypes: string[],
  maxFileSizeBytes: number,
): string | null {
  if (file.size <= 0) return "The selected file is empty.";
  if (file.size > maxFileSizeBytes) {
    return `The selected file exceeds the ${formatBytes(maxFileSizeBytes)} limit.`;
  }

  const extension = fileExtension(file.name);
  const allowed = new Set(
    allowedTypes.map((value) => value.replace(/^\./, "").toLowerCase()),
  );
  if (!allowed.has(extension)) {
    return `Choose one of the accepted file types: ${[...allowed]
      .map((value) => `.${value}`)
      .join(", ")}.`;
  }

  const acceptedMimeTypes = CONTENT_TYPES[extension];
  if (
    file.type &&
    acceptedMimeTypes &&
    !acceptedMimeTypes.includes(file.type.toLowerCase())
  ) {
    return `The file content type does not match .${extension}.`;
  }
  return null;
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}
