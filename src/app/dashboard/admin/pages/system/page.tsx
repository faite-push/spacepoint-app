"use client";

import { SystemPagesSettings } from "@/components/admin/pages/system-pages-settings";
import { Can } from "@/providers/PermissionProvider";

export default function SystemPagesConfig() {
  return (
    <Can I="settings:manage" message="Você não tem permissão para configurar páginas do site.">
      <SystemPagesSettings />
    </Can>
  );
}
