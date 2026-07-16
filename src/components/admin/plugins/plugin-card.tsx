'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { CirclePlus, Copy, Edit2, Loader2, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  pluginHasRequiredFields,
  validatePluginConfig,
} from '@/lib/plugins-data';

import type { PluginDefinition, PluginInstallState } from '@/lib/admin-api';

interface PluginCardProps {
  plugin: PluginDefinition;
  installState?: PluginInstallState;
  isSaving?: boolean;
  onInstall: (config: Record<string, string>) => void;
  onRequestUninstall: () => void;
}

export function PluginCard({
  plugin,
  installState,
  isSaving,
  onInstall,
  onRequestUninstall,
}: PluginCardProps) {
  const isInstalled = Boolean(installState?.enabled);
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [siteOrigin, setSiteOrigin] = useState('');

  useEffect(() => {
    if (installState?.config) {
      setValues(installState.config);
    } else {
      const empty: Record<string, string> = {};
      plugin.fields.forEach((f) => {
        empty[f.key] = '';
      });
      setValues(empty);
    }
    setErrors({});
  }, [installState, plugin.fields]);

  useEffect(() => {
    setSiteOrigin(window.location.origin);
  }, []);

  const publicResourceUrl = useMemo(() => {
    if (!plugin.publicResourcePath || !siteOrigin) return null;
    return `${siteOrigin}${plugin.publicResourcePath}`;
  }, [plugin.publicResourcePath, siteOrigin]);

  const submitConfig = (nextValues: Record<string, string>) => {
    const nextErrors = validatePluginConfig(plugin, nextValues, { isInstalled });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Corrija os campos destacados');
      setExpanded(true);
      return;
    }
    onInstall(nextValues);
    setExpanded(false);
    setErrors({});
  };

  const handlePrimary = () => {
    if (!expanded) {
      if (!pluginHasRequiredFields(plugin) && !isInstalled) {
        submitConfig(values);
        return;
      }
      setExpanded(true);
      return;
    }
    submitConfig(values);
  };

  const handleCancel = () => {
    setExpanded(false);
    setErrors({});
    if (installState?.config) {
      setValues(installState.config);
    }
  };

  const copyResourceUrl = async () => {
    if (!publicResourceUrl) return;
    try {
      await navigator.clipboard.writeText(publicResourceUrl);
      toast.success('URL copiada');
    } catch {
      toast.error('Não foi possível copiar a URL');
    }
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-md border border-white/5 bg-white/2">
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center p-1.5">
            {plugin.logoUrl ? (
              <img
                src={plugin.logoUrl}
                alt={plugin.name}
                className="pointer-events-none h-full w-full select-none rounded-sm object-contain"
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

        {isInstalled && publicResourceUrl && !expanded && (
          <div className="mb-3 space-y-1.5 rounded-sm border border-white/5 bg-black/20 p-3">
            <p className="text-xs font-medium text-white">
              {plugin.publicResourceLabel || 'Recurso público'}
            </p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={publicResourceUrl}
                className="border-white/10 bg-black/30 text-xs"
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="shrink-0"
                onClick={copyResourceUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {expanded && (
          <div className="mb-4 space-y-3 duration-400 animate-in fade-in slide-in-from-top-2">
            {plugin.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-sm font-medium text-white">{field.label}</Label>
                <Input
                  type={field.secret ? 'password' : 'text'}
                  autoComplete={field.secret ? 'off' : undefined}
                  value={values[field.key] || ''}
                  onChange={(e) => {
                    setValues((prev) => ({ ...prev, [field.key]: e.target.value }));
                    if (errors[field.key]) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next[field.key];
                        return next;
                      });
                    }
                  }}
                  onFocus={() => {
                    if (!field.secret) return;
                    const current = values[field.key] || '';
                    if (/^•{4,}/.test(current)) {
                      setValues((prev) => ({ ...prev, [field.key]: '' }));
                    }
                  }}
                  placeholder={
                    field.secret && (isInstalled || /^•{4,}/.test(values[field.key] || ''))
                      ? 'Deixe em branco para manter a chave atual'
                      : field.placeholder
                  }
                  className={cn(
                    'border-white/10 bg-black/30',
                    errors[field.key] && 'border-red-500/50 focus-visible:ring-red-500/30'
                  )}
                />
                {errors[field.key] ? (
                  <p className="text-[11px] text-red-400">{errors[field.key]}</p>
                ) : field.hint ? (
                  <p className="text-[11px] text-muted-foreground">{field.hint}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}

        <div className="mt-auto">
          {isInstalled && !expanded ? (
            <div className="flex gap-2">
              <Button
                className="flex-1 bg-white text-black"
                onClick={() => setExpanded(true)}
                disabled={isSaving}
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={onRequestUninstall}
                disabled={isSaving}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              {expanded && (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button
                className="flex-1 bg-white text-black"
                onClick={handlePrimary}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CirclePlus className="mr-2 h-4 w-4" />
                )}
                {expanded ? (isInstalled ? 'Salvar' : 'Instalar') : 'Instalar'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
