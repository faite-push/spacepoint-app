import type { PluginDefinition, PluginField } from '@/lib/admin-api';

export const PLUGIN_CATEGORIES = [
  { id: 'marketing' as const, label: 'Marketing', description: 'Ferramentas de marketing para impulsionar o desempenho do seu site.' },
  { id: 'atendimento' as const, label: 'Atendimento', description: 'Ferramentas de atendimento ao cliente para melhorar a experiência do usuário.' },
  { id: 'metricas' as const, label: 'Métricas e Relatórios', description: 'Ferramentas para monitorar o tráfego, analisar dados e obter relatórios que ajudam na tomada de decisões.' },
];

export const PLUGIN_DEFINITIONS: PluginDefinition[] = [
  {
    id: 'google-ads',
    name: 'Google ADS',
    category: 'marketing',
    description: 'Potencialize suas vendas exibindo anúncios estratégicos na Rede de Pesquisa do Google para atrair clientes prontos para comprar.',
    logoUrl: '/google_ads.png',
    fields: [
      {
        key: 'config',
        label: 'Conversion ID',
        placeholder: 'AW-16512102289',
        pattern: '^AW-\\d+$',
        patternMessage: 'Use o formato AW-123456789',
      },
      {
        key: 'send_to',
        label: 'Send to',
        placeholder: 'AW-16512102289/CqRgCKz9I6AZEI_',
        pattern: '^AW-\\d+\\/[A-Za-z0-9_-]+$',
        patternMessage: 'Use o formato AW-123/label',
      },
    ],
  },
  {
    id: 'facebook-pixel',
    name: 'Facebook Pixel',
    category: 'marketing',
    description: 'Instale o pixel para rastrear conversões com precisão, otimizar campanhas e criar públicos personalizados altamente segmentados no Facebook e Instagram.',
    logoUrl: '/facebook_pixel.png',
    fields: [
      {
        key: 'pixelId',
        label: 'Pixel ID',
        placeholder: '123456789012345',
        pattern: '^\\d+$',
        patternMessage: 'Informe apenas números',
      },
      {
        key: 'accessToken',
        label: 'Access Token (CAPI)',
        placeholder: 'EAAB...',
        secret: true,
        required: false,
        hint: 'Opcional. Envia Purchase no servidor (Conversions API), com o mesmo event_id do pixel.',
      },
      {
        key: 'testEventCode',
        label: 'Test Event Code',
        placeholder: 'TEST12345',
        secret: true,
        required: false,
        hint: 'Opcional. Use só para validar eventos de teste no Events Manager.',
      },
    ],
  },
  // {
  //   id: 'tiktok-pixel',
  //   name: 'TikTok Pixel',
  //   category: 'marketing',
  //   description: 'Monitore o comportamento dos usuários e extraia insights valiosos para escalar suas campanhas de alta performance no TikTok Ads.',
  //   logoUrl: '/tiktok_pixel.png',
  //   fields: [
  //     {
  //       key: 'pixelId',
  //       label: 'Pixel ID',
  //       placeholder: 'CXXXXXXXXXXXXXXX',
  //       pattern: '^[A-Z0-9]+$',
  //       patternMessage: 'Use letras maiúsculas e números',
  //     },
  //     {
  //       key: 'accessToken',
  //       label: 'Access Token (Events API)',
  //       placeholder: 'seu-token',
  //       secret: true,
  //       required: false,
  //       hint: 'Opcional. Envia CompletePayment no servidor, com o mesmo event_id do pixel.',
  //     },
  //     {
  //       key: 'testEventCode',
  //       label: 'Test Event Code',
  //       placeholder: 'TEST12345',
  //       secret: true,
  //       required: false,
  //       hint: 'Opcional. Use para validar eventos de teste no TikTok.',
  //     },
  //   ],
  // },
  {
    id: 'discord-orders',
    name: 'Discord Pedidos',
    category: 'marketing',
    description: 'Receba um alerta no Discord sempre que um pedido for pago (webhook). A URL fica só no painel e não é enviada à vitrine.',
    logoUrl: '/discord.png',
    fields: [
      {
        key: 'webhookUrl',
        label: 'Webhook URL',
        placeholder: 'https://discord.com/api/webhooks/...',
        secret: true,
        required: true,
        pattern: '^https:\\/\\/(?:discord|discordapp)\\.com\\/api\\/webhooks\\/\\d+\\/[A-Za-z0-9_-]+$',
        patternMessage: 'Informe uma URL de webhook do Discord válida',
        hint: 'Canal → Integrações → Webhooks → Copiar URL do webhook',
      },
    ],
  },
  {
    id: 'google-merchant',
    name: 'Google Merchant',
    category: 'marketing',
    description:
      'Publique o feed de produtos no Google Merchant Center, verifique o domínio e exiba seus itens no Google Shopping.',
    logoUrl: '/google_facebook_merchant.png',
    publicResourcePath: '/merchant-feed.xml',
    publicResourceLabel: 'URL do feed de produtos',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', placeholder: '3816595280', required: false },
      {
        key: 'siteVerification',
        label: 'Código de verificação',
        placeholder: '8bboyC5h1r46GEPLXST5j8Ci8EiRXMD3G_ztWq0bxIg',
        required: false,
      },
    ],
  },
  // {
  //   id: 'utmify',
  //   name: 'Utmify',
  //   category: 'marketing',
  //   description:
  //     'Propaga UTMs em links e formulários da loja para atribuição precisa de tráfego. A API Key é opcional e fica só no painel (não vai para a vitrine).',
  //   logoUrl: '/utmify.png',
  //   fields: [
  //     {
  //       key: 'apiKey',
  //       label: 'API Key (opcional)',
  //       placeholder: 'sua-chave-api',
  //       secret: true,
  //       required: false,
  //       hint: 'Usada apenas no painel. O script de UTMs na loja funciona sem expor esta chave.',
  //     },
  //   ],
  // },
  {
    id: 'crisp',
    name: 'Crisp',
    category: 'atendimento',
    description: 'Ofereça um suporte ao cliente moderno e ágil com um chat ao vivo integrado diretamente em sua loja.',
    logoUrl: '/crisp.png',
    fields: [
      {
        key: 'websiteId',
        label: 'Website ID',
        placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        pattern: '^[a-fA-F0-9-]{36}$',
        patternMessage: 'Informe um UUID válido',
      },
    ],
  },
  {
    id: 'tawk-to',
    name: 'Tawk.to',
    category: 'atendimento',
    description: 'Monitore e converse com os visitantes do seu site em tempo real através de uma ferramenta de chat gratuita e intuitiva.',
    logoUrl: '/tawk_to.png',
    fields: [
      {
        key: 'propertyId',
        label: 'Property ID',
        placeholder: 'xxxxxxxxxxxxxxxxxxxx',
        pattern: '^[a-zA-Z0-9]+$',
        patternMessage: 'Use apenas letras e números',
      },
      {
        key: 'widgetId',
        label: 'Widget ID',
        placeholder: 'default',
        required: false,
        pattern: '^[a-zA-Z0-9/_-]+$',
        patternMessage: 'ID de widget inválido',
      },
    ],
  },
  {
    id: 'chatwoot',
    name: 'Chatwoot',
    category: 'atendimento',
    description: 'Centralize todo o seu atendimento em uma plataforma omnichannel robusta, facilitando a gestão de conversas em múltiplos canais.',
    logoUrl: '/chatwoot.png',
    fields: [
      {
        key: 'baseUrl',
        label: 'Base URL',
        placeholder: 'https://app.chatwoot.com',
        pattern: '^https?:\\/\\/.+',
        patternMessage: 'Informe uma URL começando com http:// ou https://',
      },
      { key: 'websiteToken', label: 'Website Token', placeholder: 'seu-token' },
    ],
  },
  {
    id: 'google-tag-manager',
    name: 'Google Tag Manager',
    category: 'metricas',
    description: 'Gerencie todas as suas tags de marketing e scripts de rastreamento em um único lugar, sem precisar editar o código fonte do site.',
    logoUrl: '/google_tag_manager.png',
    fields: [
      {
        key: 'containerId',
        label: 'Container ID',
        placeholder: 'GTM-XXXXXXX',
        pattern: '^GTM-[A-Z0-9]+$',
        patternMessage: 'Use o formato GTM-XXXXXXX',
      },
    ],
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'metricas',
    description: 'Obtenha uma visão profunda do tráfego do seu site e entenda exatamente como seus visitantes interagem com seu conteúdo e produtos.',
    logoUrl: '/google_analytics.png',
    fields: [
      {
        key: 'measurementId',
        label: 'Measurement ID',
        placeholder: 'G-XXXXXXXXXX',
        pattern: '^G-[A-Z0-9]+$',
        patternMessage: 'Use o formato G-XXXXXXXXXX',
      },
    ],
  },
];

export function isPluginFieldRequired(field: PluginField) {
  if (field.required === false) return false;
  if (field.required === true) return true;
  return !field.secret;
}

export function pluginHasRequiredFields(plugin: PluginDefinition) {
  return plugin.fields.some((field) => isPluginFieldRequired(field));
}

export function validatePluginConfig(
  plugin: PluginDefinition,
  values: Record<string, string>,
  options?: { isInstalled?: boolean }
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of plugin.fields) {
    const raw = (values[field.key] || '').trim();
    const required = isPluginFieldRequired(field);
    const isMaskedSecret = Boolean(field.secret && /^•{4,}/.test(raw));
    const keepingExistingSecret =
      Boolean(field.secret) &&
      Boolean(options?.isInstalled) &&
      (raw === '' || isMaskedSecret);

    if (!raw || isMaskedSecret) {
      if (required && !keepingExistingSecret) {
        errors[field.key] = `${field.label} é obrigatório`;
      }
      continue;
    }

    if (field.pattern) {
      try {
        const re = new RegExp(field.pattern);
        if (!re.test(raw)) {
          errors[field.key] = field.patternMessage || `${field.label} inválido`;
        }
      } catch {
        // ignore invalid pattern definitions
      }
    }
  }

  return errors;
}
