"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/app/actions/session";
import { Button } from "@/components/Button/Button";
import { Field } from "@/components/Field/Field";
import styles from "./page.module.css";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { email: "" });
  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="next" value={next} />
      <div className={styles.fields}>
        <Field
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.email}
          error={state.errors?.email}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={state.errors?.password}
          required
        />
      </div>
      <div className={styles.actions}>
        <Button type="submit" className={styles.submit} loading={pending} loadingLabel="Signing in">
          Sign in
        </Button>
        <a href="/sign-in/help" className={styles.help}>
          Forgot password?
        </a>
      </div>
    </form>
  );
}
