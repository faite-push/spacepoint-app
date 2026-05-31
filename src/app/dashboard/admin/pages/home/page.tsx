"use client";

import { HomeUnifiedSettings } from "@/components/admin/pages/home-unified-settings";
import { Can } from "@/providers/PermissionProvider";

export default function HomePageConfigPage() {
  return (
    <Can I="settings:manage" message="Você não tem permissão para configurar páginas do site.">
      <HomeUnifiedSettings />
    </Can>
  );
};