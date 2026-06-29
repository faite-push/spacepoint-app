"use client";

import Script from "next/script";
import type { PluginsConfig } from "@/lib/admin-api";

function clean(value: string | undefined, pattern: RegExp): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  return pattern.test(trimmed) ? trimmed : null;
}

function escapeJs(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/</g, "\\u003c");
}

function getPluginConfig(
  config: PluginsConfig | null | undefined,
  id: string
): Record<string, string> | null {
  const entry = config?.[id];
  if (!entry?.enabled || !entry.config) return null;
  return entry.config;
}

type StorefrontPluginsProps = {
  config?: PluginsConfig | null;
};

export function StorefrontPlugins({ config }: StorefrontPluginsProps) {
  if (!config) return null;

  const googleAds = getPluginConfig(config, "google-ads");
  const googleAnalytics = getPluginConfig(config, "google-analytics");
  const facebook = getPluginConfig(config, "facebook-pixel");
  const tiktok = getPluginConfig(config, "tiktok-pixel");
  const utmify = getPluginConfig(config, "utmify");
  const crisp = getPluginConfig(config, "crisp");
  const tawk = getPluginConfig(config, "tawk-to");
  const chatwoot = getPluginConfig(config, "chatwoot");
  const gtm = getPluginConfig(config, "google-tag-manager");

  const adsConversionId = clean(googleAds?.config, /^AW-\d+$/);
  const adsSendTo = clean(googleAds?.send_to, /^AW-\d+\/[A-Za-z0-9_-]+$/);
  const measurementId = clean(googleAnalytics?.measurementId, /^G-[A-Z0-9]+$/);
  const pixelId = clean(facebook?.pixelId, /^\d+$/);
  const tiktokPixelId = clean(tiktok?.pixelId, /^[A-Z0-9]+$/);
  const utmifyKey = utmify?.apiKey?.trim() || null;
  const crispWebsiteId = clean(crisp?.websiteId, /^[a-f0-9-]{36}$/i);
  const tawkPropertyId = clean(tawk?.propertyId, /^[a-zA-Z0-9]+$/);
  const tawkWidgetId = clean(tawk?.widgetId, /^[a-zA-Z0-9/_-]+$/) ?? "default";
  const chatwootBaseUrl = chatwoot?.baseUrl?.trim().replace(/\/$/, "") || null;
  const chatwootToken = chatwoot?.websiteToken?.trim() || null;
  const gtmContainerId = clean(gtm?.containerId, /^GTM-[A-Z0-9]+$/);

  const gtagIds = [adsConversionId, measurementId].filter(Boolean) as string[];
  const chatwootUrl =
    chatwootBaseUrl && /^https?:\/\//i.test(chatwootBaseUrl) ? chatwootBaseUrl : null;

  return (
    <>
      {gtmContainerId && (
        <Script id="spacepoint-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${escapeJs(gtmContainerId)}');`}
        </Script>
      )}

      {gtmContainerId && (
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      )}

      {gtagIds.length > 0 && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagIds[0]}`}
            strategy="afterInteractive"
          />
          <Script id="spacepoint-gtag" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());${gtagIds.map((id) => `gtag('config','${escapeJs(id)}');`).join("")}${adsConversionId && adsSendTo ? `window.__spacepointGoogleAds={conversionId:'${escapeJs(adsConversionId)}',sendTo:'${escapeJs(adsSendTo)}'};` : ""}`}
          </Script>
        </>
      )}

      {pixelId && (
        <Script id="spacepoint-fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');fbq('init','${escapeJs(pixelId)}');fbq('track','PageView');`}
        </Script>
      )}

      {tiktokPixelId && (
        <Script id="spacepoint-tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${escapeJs(tiktokPixelId)}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}

      {utmifyKey && (
        <Script
          id="spacepoint-utmify"
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify={utmifyKey}
          strategy="afterInteractive"
        />
      )}

      {crispWebsiteId && (
        <Script id="spacepoint-crisp" strategy="afterInteractive">
          {`window.$crisp=[];window.CRISP_WEBSITE_ID='${escapeJs(crispWebsiteId)}';(function(){var d=document,s=d.createElement('script');s.src='https://client.crisp.chat/l.js';s.async=1;d.getElementsByTagName('head')[0].appendChild(s);})();`}
        </Script>
      )}

      {tawkPropertyId && (
        <Script id="spacepoint-tawk" strategy="afterInteractive">
          {`var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();(function(){var s1=document.createElement('script'),s0=document.getElementsByTagName('script')[0];s1.async=true;s1.src='https://embed.tawk.to/${escapeJs(tawkPropertyId)}/${escapeJs(tawkWidgetId)}';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();`}
        </Script>
      )}

      {chatwootUrl && chatwootToken && (
        <Script id="spacepoint-chatwoot" strategy="afterInteractive">
          {`(function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];g.src='${escapeJs(chatwootUrl)}/packs/js/sdk.js';g.defer=true;g.async=true;s.parentNode.insertBefore(g,s);g.onload=function(){window.chatwootSDK.run({websiteToken:'${escapeJs(chatwootToken)}',baseUrl:'${escapeJs(chatwootUrl)}'})}})(document,'script');`}
        </Script>
      )}
    </>
  );
}
