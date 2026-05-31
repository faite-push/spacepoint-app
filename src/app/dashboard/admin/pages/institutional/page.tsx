"use client";

import { InstitutionalSettings } from "@/components/admin/pages/institutional-settings";
import { Can } from "@/providers/PermissionProvider";

export default function InstitutionalPageConfig() {
  return (
    <Can I="settings:manage" message="Você não tem permissão para configurar páginas do site.">
      <InstitutionalSettings />
    </Can>
  );
}
