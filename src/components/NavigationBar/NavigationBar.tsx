import type { ReactNode } from "react";
import { ButtonLink } from "../Button/Button";
import { IconFileSearch20 } from "../icons";
import styles from "./NavigationBar.module.css";

export type NavSection = "worklist" | "queue" | "audit" | "bids" | "tenders" | "awards" | "check";

const PUBLIC_LINKS: { id: NavSection; label: string; href: string }[] = [
  { id: "tenders", label: "Tenders", href: "/" },
  { id: "awards", label: "Awards", href: "/awards" },
  { id: "check", label: "Check a record", href: "/check" },
];

export type NavUser = { name: string; role: string };

/**
 * Top bar on every desktop frame: brand, section links, then "Sign in" (P1, P2, H3, A1) or the
 * signed-in user (B2, H2). A procuring entity admin also gets "Worklist" first (H2).
 * `signOut` is the sign-out control, passed in so this component stays server-agnostic.
 */
export function NavigationBar({ active, user, signOut }: { active?: NavSection; user?: NavUser; signOut?: ReactNode }) {
  // Each role gets its own first link: the worklist (H2), the evaluation queue (C2), the audit
  // log (A1) or a bidder's bids (B2).
  const first =
    user?.role === "pe_admin"
      ? [{ id: "worklist" as const, label: "Worklist", href: "/entity" }]
      : user?.role === "evaluator"
        ? [{ id: "queue" as const, label: "Evaluation queue", href: "/committee" }]
        : user?.role === "auditor"
          ? [{ id: "audit" as const, label: "Audit log", href: "/audit" }]
          : user?.role === "bidder"
            ? [{ id: "bids" as const, label: "My bids", href: "/bidder/bids" }]
            : [];
  const links = [...first, ...PUBLIC_LINKS];
  return (
    <header className={styles.bar}>
      <a href="/" className={styles.brand}>
        <IconFileSearch20 className={styles.brandIcon} />
        <span>Tender Tracker</span>
      </a>
      <nav aria-label="Main" className={styles.nav}>
        <ul className={styles.links}>
          {links.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                className={styles.link}
                data-active={link.id === active || undefined}
                aria-current={link.id === active ? "page" : undefined}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        {user ? (
          <div className={styles.user}>
            <span className={styles.userName}>{user.name}</span>
            {signOut}
          </div>
        ) : (
          <ButtonLink href="/sign-in" variant="secondary" size="small">
            Sign in
          </ButtonLink>
        )}
      </nav>
    </header>
  );
}
