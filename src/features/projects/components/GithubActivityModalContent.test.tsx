import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { GithubActivityModalContent } from "./GithubActivityModalContent";

afterEach(cleanup);

it("keeps later development activity reachable after a metadata-only page", async () => {
  const activity = {
    sha: "abc",
    message: "Repository renamed",
    author: "Author",
    committedAt: null,
    type: "REPOSITORY_RENAMED",
  };
  const fetchPage = vi
    .fn()
    .mockResolvedValueOnce({ items: [activity], page: 1, hasMore: true })
    .mockResolvedValueOnce({
      items: [
        { ...activity, sha: "def", message: "Initial commit", type: "commit" },
      ],
      page: 2,
      hasMore: false,
    });
  render(<GithubActivityModalContent isOpen fetchPage={fetchPage} />);
  const loadMore = await screen.findByRole("button", {
    name: "View more activity",
  });
  expect(screen.queryByText("Repository renamed")).not.toBeInTheDocument();
  await userEvent.click(loadMore);
  expect(await screen.findByText("Initial commit")).toBeInTheDocument();
  expect(fetchPage).toHaveBeenLastCalledWith(2);
});
