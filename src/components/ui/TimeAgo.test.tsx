import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TimeAgo } from "./TimeAgo";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("renders timezone-less API timestamps as UTC with a normalized time attribute", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-15T05:46:42Z"));
  render(<TimeAgo date="2026-09-15T05:44:42" />);
  expect(screen.getByText("2m ago")).toHaveAttribute(
    "datetime",
    "2026-09-15T05:44:42.000Z",
  );
});

it("renders nothing for an invalid date", () => {
  const { container } = render(<TimeAgo date="not-a-date" />);
  expect(container).toBeEmptyDOMElement();
});
