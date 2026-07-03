'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { PluginCard } from '@/components/admin/plugins/plugin-card';
import { PLUGIN_CATEGORIES, PLUGIN_DEFINITIONS } from '@/lib/plugins-data';
import { siteSettingsApi, type PluginsConfig } from '@/lib/admin-api';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPluginsPage() {
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'site-settings'],
    queryFn: () => siteSettingsApi.get(),
  });

  const pluginsConfig = (data?.config?.pluginsConfig || {}) as PluginsConfig;

  const saveMutation = useMutation({
    mutationFn: (next: PluginsConfig) =>
      siteSettingsApi.update({ pluginsConfig: next }),
    onSuccess: () => {
      toast.success('Plugin salvo com sucesso');
      queryClient.invalidateQueries({ queryKey: ['admin', 'site-settings'] });
      setSavingId(null);
    },
    onError: () => {
      toast.error('Erro ao salvar plugin');
      setSavingId(null);
    },
  });

  const handleInstall = (pluginId: string, config: Record<string, string>) => {
    setSavingId(pluginId);
    const next: PluginsConfig = {
      ...pluginsConfig,
      [pluginId]: { enabled: true, config },
    };
    saveMutation.mutate(next);
  };

  const handleUninstall = (pluginId: string) => {
    setSavingId(pluginId);
    const next = { ...pluginsConfig };
    delete next[pluginId];
    saveMutation.mutate(next);
  };

  const pluginsByCategory = useMemo(() => {
    return PLUGIN_CATEGORIES.map((cat) => ({
      ...cat,
      plugins: PLUGIN_DEFINITIONS.filter((p) => p.category === cat.id),
    }));
  }, []);

  return (
    <div className="relative space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-md" />
          ))}
        </div>
      ) : (
        pluginsByCategory.map((section) => (
          <section key={section.id} className="relative space-y-2">
            <div>
              <h2 className="text-xl font-medium text-white">{section.label}</h2>
              <p className="text-sm text-muted-foreground">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {section.plugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  installState={pluginsConfig[plugin.id]}
                  isSaving={savingId === plugin.id && saveMutation.isPending}
                  onInstall={(config) => handleInstall(plugin.id, config)}
                  onUninstall={() => handleUninstall(plugin.id)}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
