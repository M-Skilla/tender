import { SiteHeader } from "@/components/NavigationBar/SiteHeader";
import { TenderListView } from "@/components/TenderList/TenderListView";
import { parseListFilters, tenderListPage } from "@/lib/tender-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tenders" };

// P1: the home page is the list of tenders (brief: no hero).
export default async function TenderListPage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const filters = parseListFilters(params);
  const page = Number(typeof params.page === "string" ? params.page : "1") || 1;
  const list = await tenderListPage(filters, page);
  return <TenderListView header={<SiteHeader active="tenders" />} filters={filters} {...list} />;
}
