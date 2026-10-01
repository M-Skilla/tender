import { CheckRecordView } from "@/components/CheckRecord/CheckRecordView";
import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { checkFingerprint } from "@/lib/check-record";

// Looks the fingerprint up in AmanaDB on every request: never cached.
export const dynamic = "force-dynamic";
export const metadata = { title: "Check a record" };

// P5 check a record: public. /check?fingerprint=<sha-256>
export default async function CheckRecordPage(props: PageProps<"/check">) {
  const { fingerprint } = await props.searchParams;
  const value = typeof fingerprint === "string" ? fingerprint : "";
  const result = value.trim() ? await checkFingerprint(value) : undefined;
  return <CheckRecordView header={<SiteHeader active="check" />} value={value} result={result} />;
}
