import { initializeApp } from "firebase/app";
import { getMessaging, getToken, deleteToken } from "firebase/messaging";
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

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const initializeFCM = async (city?: string, forceRefresh: boolean = false) => {
  try {
    console.log("🚀 Starting FCM initialization...");
    
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

    console.log("📋 Registering service worker...");
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("✅ Service worker registered:", registration);
    
    console.log("🔑 Getting FCM token...");
    // Optionally refresh token
    if (forceRefresh) {
      try {
        await deleteToken(messaging);
        console.log("🗑️ Deleted old token (forceRefresh=true)");
      } catch (deleteError) {
        console.log("ℹ️ No old token to delete:", deleteError);
      }
    }
    
    const token = await getToken(messaging, {
      vapidKey: "BAa8eG9roLbc_UZg9P7qRDSWEbEwG4H79z1La5Q1-PiTdLUcpJwTIhHbL49oL3zteBHYAtwWufuGsyhqPpd1Xi0",
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log("✅ FCM Token obtained:", token);
      
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
          console.error("❌ Error saving push token:", error);
        } else {
          console.log("✅ Push token saved to database successfully!");
        }
      } catch (saveError) {
        console.error("❌ Error during token save:", saveError);
      }
      
      return token;
    } else {
      console.warn("⚠️ No token received. Permissions missing?");
      
      // Check notification permission
      const permission = Notification.permission;
      console.log("🔔 Notification permission:", permission);
      
      if (permission === 'denied') {
        console.error("❌ Notification permission denied");
        alert("Benachrichtigungen sind blockiert. Bitte aktiviere sie in den Browser-Einstellungen.");
      } else if (permission === 'default') {
        console.log("📋 Requesting notification permission...");
        const newPermission = await Notification.requestPermission();
        console.log("🔔 New notification permission:", newPermission);
        
        if (newPermission === 'granted') {
          // Try again after permission granted
          return initializeFCM(city, true);
        }
      }
      
      return null;
    }
  } catch (err) {
    console.error("❌ Error during FCM initialization:", err);
    return null;
  }
};

export { messaging };