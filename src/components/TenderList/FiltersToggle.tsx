"use client";

import { useEffect, useState } from "react";
import { IconSlidersHorizontal16 } from "../icons";
import styles from "./TenderListView.module.css";

/**
 * p1-mobile's filter button: shows or hides the filter selects (`targetId`). Hidden on desktop,
 * where the filters are always shown. Starts open when a filter is already applied.
 */
export function FiltersToggle({ targetId, initiallyOpen }: { targetId: string; initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  useEffect(() => {
    document.getElementById(targetId)?.toggleAttribute("data-open", open);
  }, [open, targetId]);
  return (
    <button
      type="button"
      className={styles.filtersToggle}
      aria-expanded={open}
      aria-controls={targetId}
      aria-label={open ? "Hide filters" : "Show filters"}
      onClick={() => setOpen((o) => !o)}
    >
      <IconSlidersHorizontal16 />
    </button>
  );
}
