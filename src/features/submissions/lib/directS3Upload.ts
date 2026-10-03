export function uploadFileDirectly(
  url: string,
  file: File,
  requiredHeaders: Record<string, string>,
  onProgress: (percentage: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url, true);

    Object.entries(requiredHeaders).forEach(([name, value]) => {
      request.setRequestHeader(name, value);
    });

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    request.onerror = () => reject(new Error("The direct S3 upload failed."));
    request.onabort = () => reject(new Error("The upload was cancelled."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(
        new Error(
          `S3 rejected the upload (${request.status || "network error"}).`,
        ),
      );
    };
    request.send(file);
  });
}
