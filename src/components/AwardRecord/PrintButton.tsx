"use client";

import { Button } from "../Button/Button";

export function PrintButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      Print
    </Button>
  );
}
