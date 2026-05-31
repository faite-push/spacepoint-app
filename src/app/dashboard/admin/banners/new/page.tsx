"use client";

import { BannerForm } from "@/components/admin/forms/banner-form";
import { Can } from "@/providers/PermissionProvider";

export default function NewBannerPage() {
  return (
    <Can I="settings:manage" message="Você não tem permissão para gerenciar banners.">
      <BannerForm />
    </Can>
  );
}
