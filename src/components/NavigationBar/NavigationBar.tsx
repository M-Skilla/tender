import { ButtonLink } from "../Button/Button";
import { IconFileSearch20 } from "../icons";
import styles from "./NavigationBar.module.css";

export type NavSection = "tenders" | "awards" | "check";

const LINKS: { id: NavSection; label: string; href: string }[] = [
  { id: "tenders", label: "Tenders", href: "/" },
  { id: "awards", label: "Awards", href: "/awards" },
  { id: "check", label: "Check a record", href: "/check" },
];

/** Top bar on every desktop frame: brand, section links, sign in (P1, P2, H3, A1). */
export function NavigationBar({ active }: { active?: NavSection }) {
  return (
    <header className={styles.bar}>
      <a href="/" className={styles.brand}>
        <IconFileSearch20 className={styles.brandIcon} />
        <span>Tender Tracker</span>
      </a>
      <nav aria-label="Main" className={styles.nav}>
        <ul className={styles.links}>
          {LINKS.map((link) => (
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
        <ButtonLink href="/sign-in" variant="secondary" size="small">
          Sign in
        </ButtonLink>
      </nav>
    </header>
  );
}
