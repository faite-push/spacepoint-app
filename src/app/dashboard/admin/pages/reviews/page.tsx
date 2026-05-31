"use client";

import { HomeReviewsSettings } from "@/components/admin/pages/home-reviews-settings";
import { Can } from "@/providers/PermissionProvider";

export default function HomeReviewsPageConfig() {
  return (
    <Can I="settings:manage" message="Você não tem permissão para configurar páginas do site.">
      <HomeReviewsSettings />
    </Can>
  );
}
