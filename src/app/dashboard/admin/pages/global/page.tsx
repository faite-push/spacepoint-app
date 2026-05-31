"use client";

import { AppearanceUnifiedSettings } from "@/components/admin/pages/appearance-unified-settings";
import { Can } from "@/providers/PermissionProvider";

export default function GlobalPageConfig() {
  return (
    <Can I="settings:manage" message="Você não tem permissão para configurar páginas do site.">
      <AppearanceUnifiedSettings />
    </Can>
  );
}
