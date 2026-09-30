import { ButtonLink } from "../Button/Button";
import buttonStyles from "../Button/Button.module.css";
import styles from "./Pagination.module.css";

export type PaginationProps = {
  /** Plain summary, for example "Showing 1–8 of 142 tenders". */
  summary: string;
  page: number;
  pageCount: number;
  /** Builds the link for a page number. */
  hrefForPage: (page: number) => string;
};

/** Page numbers to show: all when there are seven or fewer, otherwise a window with gaps. */
function pageList(page: number, pageCount: number): (number | "gap")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

function Unavailable({ label }: { label: string }) {
  return (
    <span
      className={`${buttonStyles.button} ${buttonStyles.secondary} ${buttonStyles.small} ${styles.edge}`}
      aria-disabled="true"
    >
      {label}
    </span>
  );
}

export function Pagination({ summary, page, pageCount, hrefForPage }: PaginationProps) {
  return (
    <nav className={styles.pagination} aria-label="Pages">
      <p className={styles.summary}>{summary}</p>
      {pageCount > 1 ? (
        <ul className={styles.pages}>
          <li>
            {page > 1 ? (
              <ButtonLink href={hrefForPage(page - 1)} variant="secondary" size="small" className={styles.edge}>
                Previous
              </ButtonLink>
            ) : (
              <Unavailable label="Previous" />
            )}
          </li>
          {pageList(page, pageCount).map((item, index) =>
            item === "gap" ? (
              <li key={`gap-${index}`} className={styles.gap} aria-hidden="true">
                …
              </li>
            ) : (
              <li key={item}>
                <ButtonLink
                  href={hrefForPage(item)}
                  variant={item === page ? "primary" : "secondary"}
                  size="small"
                  aria-current={item === page ? "page" : undefined}
                  aria-label={`Page ${item}`}
                >
                  {item}
                </ButtonLink>
              </li>
            ),
          )}
          <li>
            {page < pageCount ? (
              <ButtonLink href={hrefForPage(page + 1)} variant="secondary" size="small" className={styles.edge}>
                Next
              </ButtonLink>
            ) : (
              <Unavailable label="Next" />
            )}
          </li>
        </ul>
      ) : null}
    </nav>
  );
}
