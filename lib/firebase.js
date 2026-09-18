import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  updatePhoneNumber
} from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAXvs9O9C55kj2j9HmVqtuI5P5XVY-obj4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-558122280-a3fef.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-558122280-a3fef",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-558122280-a3fef.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "243426479784",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:243426479784:web:9f72c90b42dd012cbe3c9d",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YSHX50YZ1E"
};

// Initialize Firebase safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
// initializeFirestore() throws if called twice for the same app (e.g. on dev-server
// hot-reload, which re-executes this module). Fall back to getFirestore() then.
let db;
try {
  db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
} catch (err) {
  db = getFirestore(app);
}
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Analytics client-side safely
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Setup Firebase RecaptchaVerifier for SMS Auth
export function setupRecaptcha(containerId = 'recaptcha-container') {
  if (typeof window === "undefined") return null;
  const container = document.getElementById(containerId);
  if (!container) return null;
  
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber
      },
      'expired-callback': () => {
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      }
    });
  }
  return window.recaptchaVerifier;
}

// Send SMS OTP via Firebase Phone Auth, to verify/attach a phone number to the
// CURRENTLY signed-in user. We deliberately use PhoneAuthProvider.verifyPhoneNumber
// (which only sends the SMS and returns a verificationId) instead of
// signInWithPhoneNumber, because signInWithPhoneNumber performs a full sign-in and
// would replace the logged-in user with a brand-new phone-only account, wiping out
// their email/displayName/uid.
export async function sendFirebaseSmsOtp(phoneNumber, containerId = 'recaptcha-container') {
  if (typeof window === "undefined") return null;

  // Format phone number to E.164 (+216XXXXXXXX, +33XXXXXXXXX, etc.)
  let formatted = phoneNumber.trim().replace(/\s+/g, '');
  if (!formatted.startsWith('+')) {
    if (formatted.startsWith('33')) {
      formatted = '+' + formatted;
    } else if (formatted.startsWith('216')) {
      formatted = '+' + formatted;
    } else if (formatted.startsWith('0')) {
      // If French 10-digit number starting with 0 (e.g. 06..., 07...)
      if (formatted.length === 10) {
        formatted = '+33' + formatted.substring(1);
      } else {
        formatted = '+216' + formatted.substring(1);
      }
    } else {
      formatted = '+216' + formatted;
    }
  }

  try {
    const appVerifier = setupRecaptcha(containerId);
    const provider = new PhoneAuthProvider(auth);
    const verificationId = await provider.verifyPhoneNumber(formatted, appVerifier);
    window.phoneVerificationId = verificationId;
    return verificationId;
  } catch (err) {
    // Reset reCAPTCHA on failure to allow retry
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {}
      window.recaptchaVerifier = null;
    }
    console.warn("Firebase Phone Auth SMS Error:", err);
    throw err;
  }
}

// Verify SMS OTP code and attach the phone number to the current user's account
// (via linkWithCredential/updatePhoneNumber) without touching their existing
// sign-in session.
export async function verifyFirebaseSmsOtp(code) {
  if (typeof window === "undefined" || !window.phoneVerificationId) {
    throw new Error("Aucune session SMS active. Veuillez renvoyer un code.");
  }
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Vous devez être connecté pour vérifier votre numéro.");
  }

  const credential = PhoneAuthProvider.credential(window.phoneVerificationId, code);

  try {
    await linkWithCredential(user, credential);
  } catch (err) {
    // User already has a phone provider linked (e.g. re-verifying a new number):
    // update it in place instead of linking a second one.
    if (err?.code === 'auth/provider-already-linked') {
      await updatePhoneNumber(user, credential);
    } else {
      throw err;
    }
  }

  window.phoneVerificationId = null;
  return auth.currentUser;
}

const FCM_VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BKj2gxerq_NF_oRxrJWnbL24cUUqs_ezLiDr-YB0_u9r5_e7L-xljeUdnfNMdopFWmgTq5t85B3bUGg16g4I67w";

// Request Push Notification permission & return FCM registration token
export async function requestFcmToken() {
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  try {
    const { getMessaging, getToken, isSupported: isMessagingSupported } = await import("firebase/messaging");
    const supported = await isMessagingSupported();
    if (!supported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Notification permission not granted:", permission);
      return null;
    }

    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY
    });

    if (currentToken) {
      console.log("FCM Registration Token:", currentToken);
      localStorage.setItem("tanit_fcm_token", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.warn("FCM Token Error:", err);
    return null;
  }
}

// Foreground message listener
export async function onFcmMessage(callback) {
  if (typeof window === "undefined") return () => {};

  try {
    const { getMessaging, onMessage, isSupported: isMessagingSupported } = await import("firebase/messaging");
    const supported = await isMessagingSupported();
    if (!supported) return () => {};

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);
      if (typeof callback === "function") callback(payload);
    });
  } catch (err) {
    return () => {};
  }
}

export { 
  app, 
  auth, 
  db, 
  storage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  analytics 
};

