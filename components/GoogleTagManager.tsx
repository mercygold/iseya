import { getGoogleTagManagerId } from "@/lib/analytics";

export function googleTagManagerBootstrap(tagManagerId: string) {
  const serializedTagManagerId = JSON.stringify(tagManagerId);
  return `
(function(w,d,s,l,i){
  w[l]=w[l]||[];
  w.gtag=w.gtag||function(){w[l].push(arguments);};
  w.gtag('consent','default',{
    analytics_storage:'denied',
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    functionality_storage:'granted',
    security_storage:'granted',
    wait_for_update:500
  });
  w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
  var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
  j.async=true;
  j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer',${serializedTagManagerId});`;
}

export function GoogleTagManagerNoScript() {
  const tagManagerId = getGoogleTagManagerId();

  if (!tagManagerId) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(tagManagerId)}`}
        height="0"
        width="0"
        title="Google Tag Manager"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
