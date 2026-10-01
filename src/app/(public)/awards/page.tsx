import { redirect } from "next/navigation";

// "Awards" in the navigation: no frame draws an awards list, so it is P1 filtered to awarded tenders.
export default function AwardsPage() {
  redirect("/?status=awarded");
}
