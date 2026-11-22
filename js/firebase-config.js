// firebase-config.js : konfigurasi dari Firebase Console
// Catatan: kunci ini memang boleh terlihat publik. Yang melindungi data adalah
// Aturan (Rules) Firestore, bukan kerahasiaan kunci ini.
export const firebaseConfig = {
  apiKey: "AIzaSyAQEzI7PWBxNEs_rpk9NQ2Knbu-ZoAeOAI",
  authDomain: "suarakita-80a91.firebaseapp.com",
  projectId: "suarakita-80a91",
  storageBucket: "suarakita-80a91.firebasestorage.app",
  messagingSenderId: "221895344775",
  appId: "1:221895344775:web:fab24511ebadf4e0de6e22"
};

// Dua akun ini dibuat di Firebase Authentication.
// Password-nya TIDAK ditulis di kode, tetapi diperiksa oleh Firebase.
export const EMAIL_SISWA = "siswa@suarakita.app";
export const EMAIL_GURU = "guru@suarakita.app";
