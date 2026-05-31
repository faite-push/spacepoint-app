import { fetchSiteConfig } from "@/lib/site-api";
import { MaintenancePageContent } from "@/components/storefront/maintenance-gate";

export default async function MaintenancePage() {
  const config = await fetchSiteConfig();
  return <MaintenancePageContent config={config} />;
}
