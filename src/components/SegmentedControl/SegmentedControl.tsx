import styles from "./SegmentedControl.module.css";

/** A1 collection selector: a strip of links, the current one tinted pen blue. */
export function SegmentedControl({
  label,
  items,
}: {
  label: string;
  items: { id: string; label: string; href: string; current: boolean }[];
}) {
  return (
    <nav aria-label={label}>
      <ul className={styles.control}>
        {items.map((item) => (
          <li key={item.id}>
            <a href={item.href} className={styles.item} aria-current={item.current ? "page" : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
