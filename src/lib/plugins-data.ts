import type { PluginDefinition } from '@/lib/admin-api';

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
      { key: 'config', label: 'config', placeholder: 'AW-16512102289' },
      { key: 'send_to', label: 'send_to', placeholder: 'AW-16512102289/CqRgCKz9I6AZEI_' },
    ],
  },
  {
    id: 'facebook-pixel',
    name: 'Facebook Pixel',
    category: 'marketing',
    description: 'Instale o pixel para rastrear conversões com precisão, otimizar campanhas e criar públicos personalizados altamente segmentados no Facebook e Instagram.',
    logoUrl: '/facebook_pixel.png',
    fields: [{ key: 'pixelId', label: 'Pixel ID', placeholder: '123456789012345' }],
  },
  {
    id: 'tiktok-pixel',
    name: 'TikTok Pixel',
    category: 'marketing',
    description: 'Monitore o comportamento dos usuários e extraia insights valiosos para escalar suas campanhas de alta performance no TikTok Ads.',
    logoUrl: '/tiktok_pixel.png',
    fields: [{ key: 'pixelId', label: 'Pixel ID', placeholder: 'CXXXXXXXXXXXXXXX' }],
  },
  {
    id: 'google-merchant',
    name: 'Google Merchant',
    category: 'marketing',
    description: 'Sincronize automaticamente seu catálogo de produtos com o Google Merchant Center e exiba seus itens no Google Shopping.',
    logoUrl: '/google_facebook_merchant.png',
    fields: [
      { key: 'merchantId', label: 'Merchant ID', placeholder: '3816595280' },
      {
        key: 'siteVerification',
        label: 'Código de verificação',
        placeholder: '8bboyC5h1r46GEPLXST5j8Ci8EiRXMD3G_ztWq0bxIg',
      },
    ],
  },
  {
    id: 'utmify',
    name: 'Utmify',
    category: 'marketing',
    description: 'Garanta um rastreamento completo de suas origens de tráfego com UTMs avançadas e tenha precisão total na atribuição de suas vendas.',
    logoUrl: '/utmify.png',
    fields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sua-chave-api' }],
  },
  {
    id: 'crisp',
    name: 'Crisp',
    category: 'atendimento',
    description: 'Ofereça um suporte ao cliente moderno e ágil com um chat ao vivo integrado diretamente em sua loja.',
    logoUrl: '/crisp.png',
    fields: [{ key: 'websiteId', label: 'Website ID', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' }],
  },
  {
    id: 'tawk-to',
    name: 'Tawk.to',
    category: 'atendimento',
    description: 'Monitore e converse com os visitantes do seu site em tempo real através de uma ferramenta de chat gratuita e intuitiva.',
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
    description: 'Centralize todo o seu atendimento em uma plataforma omnichannel robusta, facilitando a gestão de conversas em múltiplos canais.',
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
    description: 'Gerencie todas as suas tags de marketing e scripts de rastreamento em um único lugar, sem precisar editar o código fonte do site.',
    logoUrl: '/google_tag_manager.png',
    fields: [{ key: 'containerId', label: 'Container ID', placeholder: 'GTM-XXXXXXX' }],
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    category: 'metricas',
    description: 'Obtenha uma visão profunda do tráfego do seu site e entenda exatamente como seus visitantes interagem com seu conteúdo e produtos.',
    logoUrl: '/google_analytics.png',
    fields: [{ key: 'measurementId', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' }],
  },
];
