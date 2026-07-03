'use client';

import { useEffect, useState } from 'react';

import { CirclePlus, Edit2, Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { PluginDefinition, PluginInstallState } from '@/lib/admin-api';

interface PluginCardProps {
  plugin: PluginDefinition;
  installState?: PluginInstallState;
  isSaving?: boolean;
  onInstall: (config: Record<string, string>) => void;
  onUninstall: () => void;
};

export function PluginCard({ plugin, installState, isSaving, onInstall, onUninstall }: PluginCardProps) {
  const isInstalled = Boolean(installState?.enabled);
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (installState?.config) {
      setValues(installState.config);
    } else {
      const empty: Record<string, string> = {};
      plugin.fields.forEach((f) => { empty[f.key] = ''; });
      setValues(empty);
    }
  }, [installState, plugin.fields]);

  const handleOpenInstall = () => {
    setExpanded(true);
  };

  const handleSave = () => {
    onInstall(values);
    setExpanded(false);
  };

  const handleEdit = () => {
    setExpanded(true);
  };

  return (
    <>
      {isInstalled ? (
        <div className="relative flex flex-col rounded-md border border-white/5 bg-white/2 overflow-hidden">
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center p-1.5">
                {plugin.logoUrl ? (
                  <img
                    src={plugin.logoUrl}
                    alt={plugin.name}
                    className="h-full w-full rounded-sm select-none object-contain pointer-events-none"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
                    {plugin.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white">{plugin.name}</h3>
                <p className="text-[13px] text-muted-foreground">{plugin.description}</p>
              </div>
            </div>

            {expanded && (
              <div className="space-y-3 mb-4 animate-in slide-in-from-top-2 fade-in duration-400">
                {plugin.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-sm font-medium text-white">{field.label}</Label>
                    <Input
                      value={values[field.key] || ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto">
              {isInstalled && !expanded ? (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-white text-black"
                    onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={onUninstall}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-white text-black"
                  onClick={expanded ? handleSave : handleOpenInstall}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CirclePlus className="h-4 w-4 mr-2" />
                  )}
                  {expanded ? (isInstalled ? 'Salvar' : 'Instalar') : 'Instalar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col rounded-md border border-white/5 bg-white/2 overflow-hidden">
          <div className="p-4 flex flex-col flex-1">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center p-1.5">
                {plugin.logoUrl ? (
                  <img
                    src={plugin.logoUrl}
                    alt={plugin.name}
                    className="h-full w-full rounded-sm select-none object-contain pointer-events-none"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
                    {plugin.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white">{plugin.name}</h3>
                <p className="text-[13px] text-muted-foreground">{plugin.description}</p>
              </div>
            </div>

            {expanded && (
              <div className="space-y-3 mb-4 animate-in slide-in-from-top-2 fade-in duration-400">
                {plugin.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label className="text-sm font-medium text-white">{field.label}</Label>
                    <Input
                      value={values[field.key] || ''}
                      onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="bg-black/30 border-white/10"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto">
              {isInstalled && !expanded ? (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-white text-black"
                    onClick={handleEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={onUninstall}
                    disabled={isSaving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-white text-black"
                  onClick={expanded ? handleSave : handleOpenInstall}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CirclePlus className="h-4 w-4 mr-2" />
                  )}
                  {expanded ? (isInstalled ? 'Salvar' : 'Instalar') : 'Instalar'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};