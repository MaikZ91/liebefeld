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

export const initializeFCM = async () => {
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
    
    console.log("🔑 Getting NEW FCM token...");
    // Force a new token by deleting existing tokens first
    try {
      await deleteToken(messaging);
      console.log("🗑️ Deleted old token");
    } catch (deleteError) {
      console.log("ℹ️ No old token to delete:", deleteError);
    }
    
    const token = await getToken(messaging, {
      vapidKey: "BAa8eG9roLbc_UZg9P7qRDSWEbEwG4H79z1La5Q1-PiTdLUcpJwTIhHbL49oL3zteBHYAtwWufuGsyhqPpd1Xi0",
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log("✅ FCM Token obtained:", token);
      
      try {
        console.log("💾 Saving token to database...");
        const { error } = await supabase
          .from('push_tokens')
          .insert({ token });

        if (error) {
          console.error("❌ Error saving push token:", error);
        } else {
          console.log("✅ Push token saved to database successfully!");
        }
      } catch (saveError) {
        console.error("❌ Error during token save:", saveError);
      }

      try {
        localStorage.setItem('fcm_token', token);
      } catch (e) {
        console.warn('Could not persist FCM token to localStorage:', e);
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
          return initializeFCM();
        }
      }
      
      return null;
    }
  } catch (err) {
    console.error("❌ Error during FCM initialization:", err);
    return null;
  }
};

export const disableFCM = async () => {
  try {
    const storedToken = (() => {
      try { return localStorage.getItem('fcm_token'); } catch { return null; }
    })();

    // Delete token from FCM
    try {
      await deleteToken(messaging);
      console.log('🗑️ FCM token deleted');
    } catch (e) {
      console.warn('⚠️ Failed to delete FCM token from messaging:', e);
    }

    // Remove from database if we know the token
    if (storedToken) {
      try {
        const { error } = await supabase
          .from('push_tokens')
          .delete()
          .eq('token', storedToken);
        if (error) {
          console.warn('⚠️ Failed to delete token from database:', error);
        } else {
          console.log('✅ Token removed from database');
        }
      } catch (dbErr) {
        console.warn('⚠️ Error during DB token deletion:', dbErr);
      }
    }

    // Clean local storage
    try { localStorage.removeItem('fcm_token'); } catch {}

    return true;
  } catch (err) {
    console.error('❌ Error during FCM disable:', err);
    return false;
  }
};

export const isPushActive = (): boolean => {
  try {
    return typeof Notification !== 'undefined' &&
      Notification.permission === 'granted' &&
      !!localStorage.getItem('fcm_token');
  } catch {
    return false;
  }
};

export { messaging };