import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ErrorState } from "@/components/feedback/ErrorState";
import { buttonStyles } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { ApiError } from "@/types";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ProjectsPageAction = {
  to: string;
  label: string;
  icon?: ReactNode;
};

type ProjectsPageFilterOption = {
  value: string;
  label: string;
};

type ProjectsPageFilter = {
  value: string;
  onChange: (nextValue: string) => void;
  options: ProjectsPageFilterOption[];
};

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type ProjectsPageEmptyState = {
  title: string;
  description: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
};

type ProjectsPageViewProps<TItem> = {
  title: string;
  subtitle: string;
  searchValue: string;
  onSearchChange: (nextValue: string) => void;
  searchPlaceholder: string;
  searchAriaLabel?: string;
  action?: ProjectsPageAction;
  filter?: ProjectsPageFilter;
  isLoading: boolean;
  error: ApiError | null;
  onRetry: () => void;
  items: TItem[];
  renderItem: (item: TItem) => ReactNode;
  renderSkeleton: (index: number) => ReactNode;
  listGridClassName?: string;
  emptyState: ProjectsPageEmptyState;
  rootClassName?: string;
};

export function ProjectsPageView<TItem>({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchAriaLabel,
  action,
  filter,
  isLoading,
  error,
  onRetry,
  items,
  renderItem,
  renderSkeleton,
  listGridClassName = "grid gap-4 xl:grid-cols-2 2xl:grid-cols-3",
  emptyState,
  rootClassName = "space-y-6",
}: ProjectsPageViewProps<TItem>) {
  return (
    <div className={rootClassName}>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          action ? (
            <Link
              to={action.to}
              className={buttonStyles({
                variant: "primary",
                size: "md",
                className: "whitespace-nowrap",
              })}
            >
              {action.icon}
              {action.label}
            </Link>
          ) : undefined
        }
      />

      <section
        className={`grid gap-2.5 sm:gap-3 ${filter ? "md:grid-cols-[minmax(0,1fr)_210px]" : ""} md:gap-4`}
      >
        <div className="relative min-w-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400"
          />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel ?? searchPlaceholder}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          />
        </div>
        {filter ? (
          <Select
            value={filter.value}
            onChange={(event) => filter.onChange(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm shadow-sm outline-none transition-colors focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ) : null}
      </section>

      {isLoading && items.length === 0 ? (
        <section
          aria-label="Loading projects"
          aria-busy="true"
          className={listGridClassName}
        >
          {/* Render one perceived row. Responsive visibility follows the actual grid columns,
              without pretending to know the number of projects in the API response. */}
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={`project-loading-slot-${index}`}
              className={
                index === 0
                  ? "min-w-0"
                  : index === 1
                    ? "hidden min-w-0 xl:block"
                    : "hidden min-w-0 2xl:block"
              }
            >
              {renderSkeleton(index)}
            </div>
          ))}
          <span className="sr-only" role="status">
            Loading projects…
          </span>
        </section>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : items.length > 0 ? (
        <>
          {isLoading ? (
            <p role="status" className="mb-2 text-xs text-slate-500">
              Updating projects…
            </p>
          ) : null}
          <section aria-busy={isLoading} className={listGridClassName}>
            {items.map((item) => renderItem(item))}
          </section>
        </>
      ) : (
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          primaryAction={emptyState.primaryAction}
          secondaryAction={emptyState.secondaryAction}
        />
      )}
    </div>
  );
}
