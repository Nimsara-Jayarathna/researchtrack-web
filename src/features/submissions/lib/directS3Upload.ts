export function uploadFileDirectly(
  uploadUrl: string,
  file: File,
  requiredHeaders: Record<string, string>,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", uploadUrl, true);

    Object.entries(requiredHeaders).forEach(([name, value]) => {
      request.setRequestHeader(name, value);
    });

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onerror = () => reject(new Error("The file upload failed."));
    request.onabort = () => reject(new Error("The file upload was cancelled."));
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(
          new Error("The file upload was not accepted. Please try again."),
        );
      }
    };

    request.send(file);
  });
}
