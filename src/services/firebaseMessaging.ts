import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

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
    
    console.log("🔑 Getting FCM token...");
    const token = await getToken(messaging, {
      vapidKey: "BAa8eG9roLbc_UZg9P7qRDSWEbEwG4H79z1La5Q1-PiTdLUcpJwTIhHbL49oL3zteBHYAtwWufuGsyhqPpd1Xi0",
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log("✅ FCM Token obtained:", token);
      
      // Token in der Datenbank speichern
      try {
        console.log("💾 Saving token to database...");
        
        // Import hier, um zirkuläre Abhängigkeiten zu vermeiden
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          "https://ykleosfvtqcmqxqihnod.supabase.co",
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbGVvc2Z2dHFjbXF4cWlobm9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzQ0NjIsImV4cCI6MjA1NjUxMDQ2Mn0.70wsZ-c7poYFnbTyXbKrG0b6YPSe-BonMN6kjZ2a2Wo"
        );
        
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

export { messaging };