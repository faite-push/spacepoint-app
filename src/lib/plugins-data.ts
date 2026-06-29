import type { PluginDefinition } from '@/lib/admin-api';

export const PLUGIN_CATEGORIES = [
  { id: 'marketing' as const, label: 'Marketing', description: 'Ferramentas de marketing e anúncios' },
  { id: 'atendimento' as const, label: 'Atendimento', description: 'Ferramentas de atendimento ao cliente' },
  { id: 'metricas' as const, label: 'Métricas e Relatórios', description: 'Ferramentas de métricas e relatórios' },
];

export const PLUGIN_DEFINITIONS: PluginDefinition[] = [
  {
    id: 'google-ads',
    name: 'Google ADS',
    category: 'marketing',
    description: 'Plataforma de publicidade online para exibir anúncios nos resultados de pesquisa do Google.',
    logoUrl: '/google_ads.png',
    fields: [
      { key: 'config', label: 'config', placeholder: 'AW-16512102289' },
      { key: 'send_to', label: 'send_to', placeholder: 'AW-16512102289/CqRgCKz9I6AZEI_' },
    ],
  },
  {
    id: 'facebook-pixel',
    name: 'Facebook Pixel',
    category: 'marketing',
    description: 'Rastreie conversões, otimize anúncios e crie públicos personalizados no Facebook e Instagram.',
    logoUrl: '/facebook_pixel.png',
    fields: [{ key: 'pixelId', label: 'Pixel ID', placeholder: '123456789012345' }],
  },
  {
    id: 'tiktok-pixel',
    name: 'TikTok Pixel',
    category: 'marketing',
    description: 'Monitore ações dos usuários e otimize campanhas no TikTok Ads.',
    logoUrl: '/tiktok_pixel.png',
    fields: [{ key: 'pixelId', label: 'Pixel ID', placeholder: 'CXXXXXXXXXXXXXXX' }],
  },
  {
    id: 'google-merchant',
    name: 'Google Merchant',
    category: 'marketing',
    description: 'Envie seu catálogo de produtos para o Google Shopping.',
    logoUrl: '/google_facebook_merchant.png',
    fields: [{ key: 'merchantId', label: 'Merchant ID', placeholder: '123456789' }],
  },
  {
    id: 'utmify',
    name: 'Utmify',
    category: 'marketing',
    description: 'Rastreamento avançado de UTMs e atribuição de vendas.',
    logoUrl: '/utmify.png',
    fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sua-chave-api' }],
  },
  {
    id: 'crisp',
    name: 'Crisp',
    category: 'atendimento',
    description: 'Chat ao vivo para atendimento ao cliente no seu site.',
    logoUrl: '/crisp.png',
    fields: [{ key: 'websiteId', label: 'Website ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }],
  },
  {
    id: 'tawk-to',
    name: 'Tawk.to',
    category: 'atendimento',
    description: 'Chat gratuito para comunicação com visitantes em tempo real.',
    logoUrl: '/tawk_to.png',
    fields: [
      { key: 'propertyId', label: 'Property ID', placeholder: 'xxxxxxxxxxxxxxxxxxxx' },
      { key: 'widgetId', label: 'Widget ID', placeholder: 'default' },
    ],
  },
  {
    id: 'chatwoot',
    name: 'Chatwoot',
    category: 'atendimento',
    description: 'Plataforma open-source de atendimento omnichannel.',
    logoUrl: '/chatwoot.png',
    fields: [
      { key: 'baseUrl', label: 'Base URL', placeholder: 'https://app.chatwoot.com' },
      { key: 'websiteToken', label: 'Website Token', placeholder: 'seu-token' },
    ],
  },
  {
    id: 'google-tag-manager',
    name: 'Google Tag Manager',
    category: 'metricas',
    description: 'Gerencie tags de marketing e analytics sem alterar o código do site.',
    logoUrl: '/google_tag_manager.png',
    fields: [{ key: 'containerId', label: 'Container ID', placeholder: 'GTM-XXXXXXX' }],
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'metricas',
    description: 'Analise o tráfego e o comportamento dos visitantes do seu site.',
    logoUrl: '/google_analytics.png',
    fields: [{ key: 'measurementId', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' }],
  },
];
