"use client";

import { AppearanceUnifiedSettings } from "@/components/admin/pages/appearance-unified-settings";
import { Can } from "@/providers/PermissionProvider";

export default function GlobalPageConfig() {
  return (
    <Can I="pages:manage" message="Você não tem permissão para configurar páginas do site.">
      <div className="relative space-y-6">
        <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

        <AppearanceUnifiedSettings />
      </div>
    </Can>
  );
}
