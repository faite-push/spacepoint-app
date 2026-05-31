"use client";

import { FooterSettings } from "@/components/admin/pages/footer-settings";
import { Can } from "@/providers/PermissionProvider";

export default function FooterPageConfig() {
  return (
    <Can I="settings:manage" message="Você não tem permissão para configurar páginas do site.">
      <FooterSettings />
    </Can>
  );
}
