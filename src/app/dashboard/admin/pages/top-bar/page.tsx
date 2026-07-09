"use client";

import { TopBarSettings } from "@/components/admin/pages/top-bar-settings";
import { Can } from "@/providers/PermissionProvider";

export default function TopBarPageConfig() {
  return (
    <Can I="pages:manage" message="Você não tem permissão para configurar páginas do site.">
      <TopBarSettings />
    </Can>
  );
}
