"use client";

import { TechnicalUnifiedSettings } from "@/components/admin/pages/technical-unified-settings";
import { Can } from "@/providers/PermissionProvider";

export default function SeoPageConfig() {
  return (
    <Can I="settings:manage" message="Você não tem permissão para configurar páginas do site.">
      <TechnicalUnifiedSettings />
    </Can>
  );
}
