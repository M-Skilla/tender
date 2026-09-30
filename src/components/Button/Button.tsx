import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "text" | "destructive";
export type ButtonSize = "default" | "small";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Busy: the button keeps its colours, ignores clicks and shows `loadingLabel`. */
  loading?: boolean;
  /**
   * Present-tense label shown while loading, repeating the button's verb
   * ("Open all bids" becomes "Opening bids"). No spinner: the brief allows no motion here.
   */
  loadingLabel?: string;
};

export function Button({
  variant = "primary",
  size = "default",
  loading = false,
  loadingLabel,
  disabled,
  type = "button",
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(" ");
  return (
    <button
      type={type}
      className={classes}
      // Loading blocks clicks and repeat form submits natively; CSS keeps the variant colours.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...rest}
    >
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
