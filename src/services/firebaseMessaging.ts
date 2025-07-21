import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
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
    const registration = await navigator.serviceWorker.register("/sw.js");
    
    const token = await getToken(messaging, {
      vapidKey: "BAa8eG9roLbc_UZg9P7qRDSWEbEwG4H79z1La5Q1-PiTdLUcpJwTIhHbL49oL3zteBHYAtwWufuGsyhqPpd1Xi0",
      serviceWorkerRegistration: registration
    });

    if (token) {
      const { data, error } = await supabase .from('push_tokens').insert({ token });
      console.log("✅ FCM Token:", token);
      //alert("Dein Firebase Push-Token:\n" + token);
      return token;
    } else {
      console.warn("⚠️ Kein Token erhalten. Berechtigungen fehlen?");
      return null;
    }
  } catch (err) {
    console.error("❌ Fehler beim Token holen:", err);
    return null;
  }
};

export { messaging };