import type { ReactNode } from "react";
import { STATUS_FILTERS, type TenderListFilters, type TenderListRow } from "@/lib/tender-list";
import { Button, ButtonLink } from "../Button/Button";
import { FilterSelect } from "../FilterSelect/FilterSelect";
import { IconChevronRight12, IconSearch16 } from "../icons";
import { Pagination } from "../Pagination/Pagination";
import { RuledTable, type RuledTableColumn } from "../RuledTable/RuledTable";
import { StatusLabel } from "../StatusLabel/StatusLabel";
import { Switch } from "../Switch/Switch";
import { FiltersToggle } from "./FiltersToggle";
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
            <FiltersToggle
              targetId="tender-filters"
              initiallyOpen={filters.status !== "all" || filters.category !== "all" || filters.entity !== "all"}
            />
          </div>
          <hr className={styles.rule} />
          <div className={styles.filterRow}>
            <div className={styles.filters} id="tender-filters">
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
            <p className={styles.mobileCount}>
              Showing {total.toLocaleString("en-US")} {total === 1 ? "tender" : "tenders"}
            </p>
            <Switch name="soon" label="Closing soon" checked={filters.closingSoon} />
          </div>
        </form>

        {/* p1-mobile: the same rows as cards (the table is hidden there when it has rows). */}
        {!loading && rows.length > 0 ? (
          <ul className={styles.cards} aria-label="Published tenders">
            {rows.map((row) => (
              <li key={row.key} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.cardReference}>{row.reference}</span>
                  <a href={`/tenders/${row.key}`} className={styles.cardTitle}>
                    {row.title}
                  </a>
                </div>
                <dl className={styles.cardDetails}>
                  <div>
                    <dt>Procuring entity</dt>
                    <dd className={styles.cardEntity}>{row.entity}</dd>
                  </div>
                  <div>
                    <dt>Budget ceiling</dt>
                    <dd className={styles.cardBudget}>{row.budget}</dd>
                  </div>
                  <div>
                    <dt>{row.status === "published" ? "Closes" : "Closed"}</dt>
                    <dd>{row.closes}</dd>
                  </div>
                </dl>
                <div className={styles.cardFooter}>
                  <StatusLabel status={row.status} />
                  <a href={`/tenders/${row.key}?event=published&history=1`} className={styles.cardLink}>
                    View history
                    <IconChevronRight12 />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={rows.length > 0 && !loading ? styles.tableWrap : undefined}>
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
        </div>

        {!loading && total > 0 ? (
          <div className={pageCount === 1 ? styles.singlePage : undefined}>
          <Pagination
            summary={`Showing ${first}–${last} of ${total.toLocaleString("en-US")} ${total === 1 ? "tender" : "tenders"}${
              filtered ? ` (${published.toLocaleString("en-US")} published)` : ""
            }`}
            page={page}
            pageCount={pageCount}
            hrefForPage={(n) => listQuery(filters, n)}
          />
          </div>
        ) : null}
      </main>
    </>
  );
}
