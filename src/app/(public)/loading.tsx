import { NavigationBar } from "@/components/NavigationBar/NavigationBar";
import { TenderListView } from "@/components/TenderList/TenderListView";

// P1 loading: the page with static skeleton rows (no shimmer).
export default function Loading() {
  return (
    <TenderListView
      header={<NavigationBar active="tenders" />}
      filters={{ q: "", status: "all", category: "all", entity: "all", closingSoon: false }}
      rows={[]}
      total={0}
      published={0}
      page={1}
      pageCount={1}
      categories={[]}
      entities={[]}
      loading
    />
  );
}
