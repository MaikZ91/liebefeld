import { supabase } from "@/integrations/supabase/client";

const firebaseConfig = {
  apiKey: "AIzaSyAoSNvosYckg1hCRIbmEOkVVAXEEB6qAUI",
  authDomain: "the-tribe-bi.firebaseapp.com",
  projectId: "the-tribe-bi",
  storageBucket: "the-tribe-bi.firebasestorage.app",
  messagingSenderId: "1030892599544",
  appId: "1:1030892599544:web:57984afaba2a8d2394a30d",
  measurementId: "G-J4DS43HNBF"
};

// Lazy-loaded Firebase instances
let firebaseApp: any = null;
let messaging: any = null;

// Lazy initialize Firebase only when needed
const getFirebaseMessaging = async () => {
  if (!messaging) {
    const { initializeApp } = await import("firebase/app");
    const { getMessaging } = await import("firebase/messaging");
    firebaseApp = initializeApp(firebaseConfig);
    messaging = getMessaging(firebaseApp);
  }
  return messaging;
};

export const initializeFCM = async (city?: string, forceRefresh: boolean = false) => {
  try {
    console.log("🚀 Starting FCM initialization...");

    // Guard: skip in Lovable preview / iframe contexts
    const isInIframe = (() => {
      try { return window.self !== window.top; } catch { return true; }
    })();
    const isPreviewHost =
      window.location.hostname.includes('id-preview--') ||
      window.location.hostname.includes('lovableproject.com');

    if (isPreviewHost || isInIframe) {
      console.log("⏭️ Skipping FCM in preview/iframe context");
      return null;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.error("❌ Service Worker not supported");
      return null;
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
      console.error("❌ Push messaging not supported");
      return null;
    }

    // Explicitly request notification permission BEFORE getToken
    console.log("🔔 Current notification permission:", Notification.permission);
    if (Notification.permission === 'denied') {
      console.error("❌ Notification permission denied by user");
      return null;
    }

    if (Notification.permission !== 'granted') {
      console.log("📋 Requesting notification permission...");
      const permission = await Notification.requestPermission();
      console.log("🔔 Permission result:", permission);
      if (permission !== 'granted') {
        console.warn("⚠️ Notification permission not granted:", permission);
        return null;
      }
    }

    console.log("📋 Registering service worker...");
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("✅ Service worker registered:", registration);
    
    // Lazy load Firebase
    const firebaseMessaging = await getFirebaseMessaging();
    const { getToken, deleteToken } = await import("firebase/messaging");
    
    console.log("🔑 Getting FCM token...");
    // Optionally refresh token
    if (forceRefresh) {
      try {
        await deleteToken(firebaseMessaging);
        console.log("🗑️ Deleted old token (forceRefresh=true)");
      } catch (deleteError) {
        console.log("ℹ️ No old token to delete:", deleteError);
      }
    }
    
    const token = await getToken(firebaseMessaging, {
      vapidKey: "BAa8eG9roLbc_UZg9P7qRDSWEbEwG4H79z1La5Q1-PiTdLUcpJwTIhHbL49oL3zteBHYAtwWufuGsyhqPpd1Xi0",
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log("✅ FCM Token obtained:", token.substring(0, 20) + "...");
      
      // Token in der Datenbank speichern
      try {
        console.log("💾 Saving token to database...");
        
        const nameFromLS = (typeof localStorage !== 'undefined') ? localStorage.getItem('selectedCityName') : null;
        const abbrFromLS = (typeof localStorage !== 'undefined') ? localStorage.getItem('selectedCityAbbr') : null;
        const cityToStore = nameFromLS || (city && city.toUpperCase() === 'BI' ? 'Bielefeld' : city) || abbrFromLS || null;

        const { error } = await supabase
          .from('push_tokens')
          .upsert({ token, city: cityToStore }, { onConflict: 'token' });

        if (error) {
          console.error("❌ Error saving push token:", error.message, error.details, error.hint);
        } else {
          console.log("✅ Push token saved to database successfully! City:", cityToStore);
        }
      } catch (saveError) {
        console.error("❌ Error during token save:", saveError);
      }
      
      return token;
    } else {
      console.warn("⚠️ No FCM token received despite granted permission");
      return null;
    }
  } catch (err) {
    console.error("❌ Error during FCM initialization:", err);
    return null;
  }
};

export { messaging };
