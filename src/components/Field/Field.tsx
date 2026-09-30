import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { IconChevronDown16 } from "../icons";
import styles from "./Field.module.css";

type Common = {
  label: string;
  /** Specific message saying what is wrong and what to do. The design has no error treatment yet. */
  error?: string;
};

type InputField = Common & { kind?: "input" } & InputHTMLAttributes<HTMLInputElement>;
type SelectField = Common & { kind: "select" } & SelectHTMLAttributes<HTMLSelectElement>;
type TextareaField = Common & { kind: "textarea" } & TextareaHTMLAttributes<HTMLTextAreaElement>;

export type FieldProps = InputField | SelectField | TextareaField;

export function Field(props: FieldProps) {
  const autoId = useId();
  const { label, error, id = autoId, className, ...rest } = props;
  const errorId = error ? `${id}-error` : undefined;
  const aria = { "aria-invalid": error ? true : undefined, "aria-describedby": errorId };

  let control: React.ReactNode;
  if (props.kind === "select") {
    const { kind: _k, children, ...selectRest } = rest as Omit<SelectField, keyof Common | "id" | "className">;
    control = (
      <span className={styles.selectWrap}>
        <select id={id} className={`${styles.control} ${styles.select}`} {...aria} {...selectRest}>
          {children}
        </select>
        <IconChevronDown16 className={styles.chevron} />
      </span>
    );
  } else if (props.kind === "textarea") {
    const { kind: _k, ...textareaRest } = rest as Omit<TextareaField, keyof Common | "id" | "className">;
    control = <textarea id={id} className={`${styles.control} ${styles.textarea}`} {...aria} {...textareaRest} />;
  } else {
    const { kind: _k, ...inputRest } = rest as Omit<InputField, keyof Common | "id" | "className">;
    control = <input id={id} className={styles.control} {...aria} {...inputRest} />;
  }

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {control}
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
