import { notFound } from "next/navigation";
import { Button, type ButtonVariant } from "@/components/Button/Button";
import { Field } from "@/components/Field/Field";
import { FingerprintChip } from "@/components/FingerprintChip/FingerprintChip";
import { StatusLabel, type Status } from "@/components/StatusLabel/StatusLabel";
import {
  VerificationBanner,
  VerificationBannerAction,
  VerificationMark,
} from "@/components/VerificationMark/VerificationMark";
import styles from "./page.module.css";
import { fp, Task2Sections } from "./sections";

export const metadata = { title: "Components" };

const BUTTONS: { variant: ButtonVariant; label: string; loadingLabel: string; name: string }[] = [
  { variant: "primary", label: "Open all bids", loadingLabel: "Opening bids", name: "Primary" },
  { variant: "secondary", label: "Copy my changes", loadingLabel: "Copying my changes", name: "Secondary" },
  { variant: "text", label: "Load latest version", loadingLabel: "Loading latest version", name: "Text" },
  { variant: "destructive", label: "Cancel tender", loadingLabel: "Cancelling tender", name: "Destructive" },
];

const TENDER_STATUSES: Status[] = ["draft", "published", "closed", "awarded", "cancelled", "tampered"];
const BID_STATUSES: Status[] = ["sealed", "opened", "opened-matches", "opened-does-not-match", "withdrawn"];

const FINGERPRINTS = [
  "7be1c0a4f25d93e1b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e90d",
  "c410b7e2d19f0a3c5e8b6d4f2a1c3e5b7d9f0a2c4e6b8d0f1a3c5e7b9d0f22af",
  "91dd3a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8bae07",
];

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <p className={styles.rowName}>{name}</p>
      <div className={styles.rowItems}>{children}</div>
    </div>
  );
}

function Sample({ state, children }: { state: string; children: React.ReactNode }) {
  return (
    <div className={styles.sample}>
      {children}
      <p className={styles.state}>{state}</p>
    </div>
  );
}

export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className={styles.page}>
      <h1 className="text-title">Components</h1>

      <section className={styles.section}>
        <h2 className="text-section">Button</h2>
        {BUTTONS.map(({ variant, label, loadingLabel, name }) => (
          <Row key={variant} name={name}>
            <Sample state="Default (point at it for hover)">
              <Button variant={variant}>{label}</Button>
            </Sample>
            <Sample state="Focus">
              <span className={styles.forceFocus}>
                <Button variant={variant}>{label}</Button>
              </span>
            </Sample>
            <Sample state="Disabled">
              <Button variant={variant} disabled>
                {label}
              </Button>
            </Sample>
            <Sample state="Loading">
              <Button variant={variant} loading loadingLabel={loadingLabel}>
                {label}
              </Button>
            </Sample>
          </Row>
        ))}
        <Row name="Small">
          <Sample state="Default">
            <Button variant="secondary" size="small">
              Sign in
            </Button>
          </Sample>
          <Sample state="Focus">
            <span className={styles.forceFocus}>
              <Button variant="secondary" size="small">
                Sign in
              </Button>
            </span>
          </Sample>
        </Row>
      </section>

      <section className={styles.section}>
        <h2 className="text-section">Field</h2>
        <Row name="Input">
          <Sample state="Default">
            <Field label="Email address" defaultValue="bidder@amanibuilders.co.tz" />
          </Sample>
          <Sample state="Focus">
            <div className={styles.forceFocus}>
              <Field label="Email address" defaultValue="bidder@amanibuilders.co.tz" />
            </div>
          </Sample>
          <Sample state="Disabled">
            <Field label="Procuring entity" defaultValue="Ministry of Works" disabled />
          </Sample>
          <Sample state="Error">
            <Field
              label="Email address"
              defaultValue="bidder@amanibuilders"
              error="Enter an email address with a domain, for example name@company.co.tz."
            />
          </Sample>
        </Row>
        <Row name="Select">
          <Sample state="Default">
            <Field kind="select" label="Category" defaultValue="works">
              <option value="works">Works and infrastructure</option>
              <option value="goods">Goods</option>
            </Field>
          </Sample>
          <Sample state="Focus">
            <div className={styles.forceFocus}>
              <Field kind="select" label="Category" defaultValue="works">
                <option value="works">Works and infrastructure</option>
              </Field>
            </div>
          </Sample>
          <Sample state="Disabled">
            <Field kind="select" label="Category" defaultValue="works" disabled>
              <option value="works">Works and infrastructure</option>
            </Field>
          </Sample>
          <Sample state="Error">
            <Field kind="select" label="Category" defaultValue="" error="Choose a category.">
              <option value="">Choose a category</option>
            </Field>
          </Sample>
        </Row>
        <Row name="Textarea">
          <Sample state="Default">
            <Field
              kind="textarea"
              label="Reason for cancellation"
              placeholder="Type the official justification for cancelling this procurement process..."
            />
          </Sample>
          <Sample state="Focus">
            <div className={styles.forceFocus}>
              <Field kind="textarea" label="Reason for cancellation" defaultValue="Budget withdrawn by the ministry." />
            </div>
          </Sample>
          <Sample state="Disabled">
            <Field kind="textarea" label="Reason for cancellation" defaultValue="Budget withdrawn by the ministry." disabled />
          </Sample>
          <Sample state="Error">
            <Field kind="textarea" label="Reason for cancellation" error="Give a reason. It is shown on the public record." />
          </Sample>
        </Row>
      </section>

      <section className={styles.section}>
        <h2 className="text-section">Status label</h2>
        <Row name="Tender">
          <div className={styles.inlineItems}>
            {TENDER_STATUSES.map((status) => (
              <StatusLabel key={status} status={status} />
            ))}
          </div>
        </Row>
        <Row name="Bid">
          <div className={styles.inlineItems}>
            {BID_STATUSES.map((status) => (
              <StatusLabel key={status} status={status} />
            ))}
          </div>
        </Row>
      </section>

      <section className={styles.section}>
        <h2 className="text-section">Fingerprint chip</h2>
        <Row name="Default">
          {FINGERPRINTS.map((value) => (
            <Sample key={value} state="Point for hover, click to copy">
              <FingerprintChip value={value} />
            </Sample>
          ))}
        </Row>
        <Row name="Mismatch">
          <Sample state="A2 tone">
            <FingerprintChip value={fp("7be1", "90d")} tone="mismatch" />
          </Sample>
        </Row>
        <Row name="Focus">
          <Sample state="Focus shows the full value">
            <span className={`${styles.forceFocus} ${styles.forceTooltip}`}>
              <FingerprintChip value={FINGERPRINTS[0]} />
            </span>
          </Sample>
        </Row>
      </section>

      <section className={styles.section}>
        <h2 className="text-section">Verification mark</h2>
        <Row name="Inline">
          <VerificationMark result="matches" />
          <VerificationMark result="does-not-match" />
          <VerificationMark result="checking" />
        </Row>
        <div className={styles.banners}>
          <VerificationBanner
            result="matches"
            action={<VerificationBannerAction>Check again</VerificationBannerAction>}
          >
            All 14 records match. Checked 30 Sep 2026, 14:02.
          </VerificationBanner>
          <VerificationBanner result="checking">Checking 14 records.</VerificationBanner>
          <VerificationBanner result="does-not-match">
            The stored copy of this document no longer matches its recorded fingerprint. The recorded version is
            unchanged.
          </VerificationBanner>
        </div>
      </section>

      <Task2Sections />
    </main>
  );
}
