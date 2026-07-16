'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { PluginCard } from '@/components/admin/plugins/plugin-card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PLUGIN_CATEGORIES, PLUGIN_DEFINITIONS } from '@/lib/plugins-data';
import { siteSettingsApi, type PluginDefinition, type PluginsConfig } from '@/lib/admin-api';

type SiteSettingsQuery = Awaited<ReturnType<typeof siteSettingsApi.get>>;

export default function AdminPluginsPage() {
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uninstallTarget, setUninstallTarget] = useState<PluginDefinition | null>(null);
  const saveQueueRef = useRef(Promise.resolve());
  const pluginsConfigRef = useRef<PluginsConfig>({});

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'site-settings'],
    queryFn: () => siteSettingsApi.get(),
  });

  const pluginsConfig = (data?.config?.pluginsConfig || {}) as PluginsConfig;

  useEffect(() => {
    pluginsConfigRef.current = pluginsConfig;
  }, [pluginsConfig]);

  const enqueuePluginsSave = (
    pluginId: string,
    updater: (current: PluginsConfig) => PluginsConfig,
    successMessage: string
  ) => {
    setSavingId(pluginId);

    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const cached = queryClient.getQueryData<SiteSettingsQuery>(['admin', 'site-settings']);
        const current =
          (cached?.config?.pluginsConfig as PluginsConfig | undefined) ||
          pluginsConfigRef.current ||
          {};
        const next = updater(current);
        pluginsConfigRef.current = next;

        queryClient.setQueryData<SiteSettingsQuery>(['admin', 'site-settings'], (old) => {
          if (!old?.config) return old;
          return {
            ...old,
            config: {
              ...old.config,
              pluginsConfig: next,
            },
          };
        });

        await siteSettingsApi.update({ pluginsConfig: next });
        toast.success(successMessage);
        await queryClient.invalidateQueries({ queryKey: ['admin', 'site-settings'] });
      })
      .catch(() => {
        toast.error('Erro ao salvar plugin');
        void queryClient.invalidateQueries({ queryKey: ['admin', 'site-settings'] });
      })
      .finally(() => {
        setSavingId((current) => (current === pluginId ? null : current));
      });
  };

  const handleInstall = (pluginId: string, config: Record<string, string>) => {
    enqueuePluginsSave(
      pluginId,
      (current) => ({
        ...current,
        [pluginId]: { enabled: true, config },
      }),
      'Plugin salvo com sucesso'
    );
  };

  const handleConfirmUninstall = () => {
    if (!uninstallTarget) return;
    const pluginId = uninstallTarget.id;
    const name = uninstallTarget.name;
    setUninstallTarget(null);
    enqueuePluginsSave(
      pluginId,
      (current) => {
        const next = { ...current };
        delete next[pluginId];
        return next;
      },
      `${name} removido`
    );
  };

  const pluginsByCategory = useMemo(() => {
    return PLUGIN_CATEGORIES.map((cat) => ({
      ...cat,
      plugins: PLUGIN_DEFINITIONS.filter((p) => p.category === cat.id),
    }));
  }, []);

  return (
    <div className="relative space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-5%] z-0 h-[300px] w-[300px] rounded-full bg-white/3 blur-[120px] pointer-events-none sm:h-[600px] sm:w-[600px]" />
      <div className="absolute top-0 left-[-5%] z-0 h-[300px] w-[300px] rounded-full bg-white/3 blur-[120px] pointer-events-none sm:h-[600px] sm:w-[600px]" />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {section.plugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  installState={pluginsConfig[plugin.id]}
                  isSaving={savingId === plugin.id}
                  onInstall={(config) => handleInstall(plugin.id, config)}
                  onRequestUninstall={() => setUninstallTarget(plugin)}
                />
              ))}
            </div>
          </section>
        ))
      )}

      <Dialog
        open={!!uninstallTarget}
        onOpenChange={(open) => {
          if (!open) setUninstallTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desinstalar plugin</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{uninstallTarget?.name}</strong>? Os scripts
              deixarão de carregar na loja.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2">
            <Button
              variant="ghost"
              size="lg"
              className="flex-1"
              onClick={() => setUninstallTarget(null)}
            >
              Cancelar
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-destructive text-white hover:bg-destructive/80"
              onClick={handleConfirmUninstall}
              disabled={!!savingId}
            >
              {savingId === uninstallTarget?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Desinstalar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
