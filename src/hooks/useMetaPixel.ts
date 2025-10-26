import { useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

interface MetaPixelConfig {
  pixelId: string;
  linkId: string;
}

interface EventData {
  eventName: string;
  eventId?: string;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    externalId?: string;
  };
  customData?: Record<string, any>;
  eventSourceUrl?: string;
}

export const useMetaPixel = (config: MetaPixelConfig | null) => {
  const pixelLoadedRef = useRef(false);
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Load Facebook Pixel script
  useEffect(() => {
    if (!config?.pixelId || pixelLoadedRef.current) return;

    const loadPixel = () => {
      if (window.fbq) return;

      // Create pixel script
      const script = document.createElement("script");
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${config.pixelId}');
      `;
      document.head.appendChild(script);

      // Add noscript pixel
      const noscript = document.createElement("noscript");
      const img = document.createElement("img");
      img.height = 1;
      img.width = 1;
      img.style.display = "none";
      img.src = `https://www.facebook.com/tr?id=${config.pixelId}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.body.appendChild(noscript);

      pixelLoadedRef.current = true;
    };

    loadPixel();
  }, [config?.pixelId]);

  const trackEvent = async (eventData: EventData) => {
    if (!configRef.current?.pixelId) return;

    const eventId = eventData.eventId || crypto.randomUUID();
    const eventSourceUrl = eventData.eventSourceUrl || window.location.href;

    // Track via Browser Pixel
    const pixelData = {
      event_id: eventId,
      ...eventData.customData,
    };

    window.fbq?.("track", eventData.eventName, pixelData);

    // Track via Conversions API (token retrieved server-side)
    try {
      const userData = eventData.userData || {};
      
      // Hash sensitive data
      const hashedUserData: any = {};
      if (userData.email) {
        hashedUserData.em = await sha256(userData.email.toLowerCase().trim());
      }
      if (userData.phone) {
        hashedUserData.ph = await sha256(userData.phone.replace(/\D/g, ""));
      }
      if (userData.firstName) {
        hashedUserData.fn = await sha256(userData.firstName.toLowerCase().trim());
      }
      if (userData.lastName) {
        hashedUserData.ln = await sha256(userData.lastName.toLowerCase().trim());
      }
      if (userData.externalId) {
        hashedUserData.external_id = await sha256(userData.externalId);
      }

      // Send to Conversions API via edge function (linkId passed, token retrieved server-side)
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-conversions-api`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          linkId: configRef.current.linkId,
          eventName: eventData.eventName,
          eventId,
          eventSourceUrl,
          userData: hashedUserData,
          customData: eventData.customData || {},
          userAgent: navigator.userAgent,
          timestamp: Math.floor(Date.now() / 1000),
        }),
      });
    } catch (error) {
      console.error("Error sending to Conversions API:", error);
    }
  };

  return { trackEvent };
};

// SHA-256 hashing utility
async function sha256(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
