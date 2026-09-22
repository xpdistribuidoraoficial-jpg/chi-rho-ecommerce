const STORAGE_KEY='chi-rho-attribution-v1';

const safe=(value,max=240)=>String(value||'').trim().slice(0,max);
const device=()=>{
  const width=window.innerWidth||screen.width||0;
  const ua=navigator.userAgent||'';
  if(/ipad|tablet|playbook|silk/i.test(ua)||(width>=600&&width<1024)) return 'Tablet';
  if(/mobi|android|iphone|ipod/i.test(ua)||width<600) return 'Celular';
  return 'Desktop';
};
const inferChannel=(source,medium,referrer)=>{
  const s=(source||'').toLowerCase(),m=(medium||'').toLowerCase(),r=(referrer||'').toLowerCase();
  if(/instagram/.test(s)||/instagram/.test(r)) return 'Instagram';
  if(/facebook|fb/.test(s)||/facebook/.test(r)) return 'Facebook';
  if(/whatsapp|wa/.test(s)||/whatsapp/.test(r)) return 'WhatsApp';
  if(/google/.test(s)||/google/.test(r)) return /cpc|paid|ads/.test(m)?'Google Ads':'Google';
  if(/bing/.test(s)||/bing/.test(r)) return 'Bing';
  if(/email|newsletter/.test(m)||/mail/.test(s)) return 'E-mail';
  if(source) return safe(source,80);
  if(referrer) {
    try { return new URL(referrer).hostname.replace(/^www\./,''); } catch {}
  }
  return 'Direto';
};

export const captureAttribution=()=>{
  let stored=null;
  try { stored=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null'); } catch {}
  if(stored) return stored;
  const params=new URLSearchParams(location.search);
  const referrer=document.referrer&&(()=>{try{return new URL(document.referrer).origin===location.origin?'':document.referrer;}catch{return document.referrer;}})();
  const data={
    channel:inferChannel(params.get('utm_source'),params.get('utm_medium'),referrer),
    source:safe(params.get('utm_source'),100),
    medium:safe(params.get('utm_medium'),100),
    campaign:safe(params.get('utm_campaign'),160),
    content:safe(params.get('utm_content'),160),
    term:safe(params.get('utm_term'),160),
    referrer:safe(referrer,500),
    landing_path:safe(location.pathname+location.search,500),
    device:device()
  };
  try { sessionStorage.setItem(STORAGE_KEY,JSON.stringify(data)); } catch {}
  return data;
};

export const getAttribution=()=>{
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null')||captureAttribution(); }
  catch { return captureAttribution(); }
};

if(typeof window!=='undefined') captureAttribution();
