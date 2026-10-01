import type { ReactNode } from "react";
import { STATUS_FILTERS, type TenderListFilters, type TenderListRow } from "@/lib/tender-list";
import { Button, ButtonLink } from "../Button/Button";
import { FilterSelect } from "../FilterSelect/FilterSelect";
import { IconSearch16 } from "../icons";
import { Pagination } from "../Pagination/Pagination";
import { RuledTable, type RuledTableColumn } from "../RuledTable/RuledTable";
import { StatusLabel } from "../StatusLabel/StatusLabel";
import { Switch } from "../Switch/Switch";
import styles from "./TenderListView.module.css";

// P1 widths: 440, 280, 180 and 200px text columns plus Figma's 16px gaps, over 1280.
const COLUMNS: RuledTableColumn[] = [
  { key: "title", header: "Tender title", width: "35.63%" },
  { key: "entity", header: "Procuring entity", width: "23.13%" },
  { key: "budget", header: "Budget ceiling", width: "15.31%" },
  { key: "closes", header: "Closing date", width: "16.88%" },
  { key: "status", header: "Status" },
];

export function listQuery(f: TenderListFilters, page?: number): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.status !== "all") p.set("status", f.status);
  if (f.category !== "all") p.set("category", f.category);
  if (f.entity !== "all") p.set("entity", f.entity);
  if (f.closingSoon) p.set("soon", "1");
  if (page && page > 1) p.set("page", String(page));
  const s = p.toString();
  return s ? `/?${s}` : "/";
}

/** P1: search, filters, the ruled list of tenders, pages. `loading` shows the static skeleton. */
export function TenderListView({
  header,
  filters,
  rows,
  total,
  published,
  page,
  pageCount,
  categories,
  entities,
  loading = false,
}: {
  header: ReactNode;
  filters: TenderListFilters;
  rows: TenderListRow[];
  total: number;
  published: number;
  page: number;
  pageCount: number;
  categories: string[];
  entities: string[];
  loading?: boolean;
}) {
  const filtered = Boolean(filters.q) || filters.status !== "all" || filters.category !== "all" || filters.entity !== "all" || filters.closingSoon;
  const first = total === 0 ? 0 : (page - 1) * 20 + 1;
  const last = Math.min(page * 20, total);
  return (
    <>
      {header}
      <main className={styles.page}>
        <h1 className="visually-hidden">Tenders</h1>
        <form method="get" action="/" className={styles.search} role="search">
          <div className={styles.searchRow}>
            <label className={styles.searchField}>
              <IconSearch16 className={styles.searchIcon} />
              <span className="visually-hidden">Search tenders</span>
              <input
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder="Search tenders by title, reference number, or procuring entity"
                className={styles.searchInput}
              />
            </label>
            <Button type="submit" className={styles.searchButton}>
              Search
            </Button>
          </div>
          <hr className={styles.rule} />
          <div className={styles.filterRow}>
            <div className={styles.filters}>
              <FilterSelect name="status" label="Status" value={filters.status} options={STATUS_FILTERS} />
              <FilterSelect
                name="category"
                label="Category"
                value={filters.category}
                options={[{ id: "all", label: "All" }, ...categories.map((c) => ({ id: c, label: c }))]}
              />
              <FilterSelect
                name="entity"
                label="Procuring entity"
                value={filters.entity}
                options={[{ id: "all", label: "All" }, ...entities.map((e) => ({ id: e, label: e }))]}
              />
            </div>
            <Switch name="soon" label="Closing soon" checked={filters.closingSoon} />
          </div>
        </form>

        <RuledTable
          caption="Published tenders"
          columns={COLUMNS}
          loading={loading}
          loadingRows={8}
          rows={rows.map((row) => ({
            id: row.key,
            cells: {
              title: (
                <a href={`/tenders/${row.key}`} className={styles.title}>
                  {row.title}
                </a>
              ),
              entity: row.entity,
              budget: row.budget,
              closes: <span className={styles.muted}>{row.closes}</span>,
              status: <StatusLabel status={row.status} />,
            },
          }))}
          empty={
            filtered
              ? {
                  message: "No tenders match your search. Clear the search and filters to see every tender.",
                  action: (
                    <ButtonLink href="/" variant="secondary" size="small">
                      Clear search and filters
                    </ButtonLink>
                  ),
                }
              : { message: "No tenders have been published yet. Published tenders appear here." }
          }
        />

        {!loading && total > 0 ? (
          <Pagination
            summary={`Showing ${first}–${last} of ${total.toLocaleString("en-US")} ${total === 1 ? "tender" : "tenders"}${
              filtered ? ` (${published.toLocaleString("en-US")} published)` : ""
            }`}
            page={page}
            pageCount={pageCount}
            hrefForPage={(n) => listQuery(filters, n)}
          />
        ) : null}
      </main>
    </>
  );
}
