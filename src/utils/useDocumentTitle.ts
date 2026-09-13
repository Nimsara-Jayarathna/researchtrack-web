import { useEffect } from "react";

const DEFAULT_TITLE = "ResearchTrack";

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
