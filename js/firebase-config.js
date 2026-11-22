// firebase-config.js : ISI bagian ini dengan konfigurasi dari Firebase Console
// (Project settings -> Your apps -> Web app -> firebaseConfig).
// Catatan: kunci ini memang boleh terlihat publik. Yang melindungi data adalah
// Aturan (Rules) Firestore, bukan kerahasiaan kunci ini.
export const firebaseConfig = {
  apiKey: "ISI_API_KEY",
  authDomain: "ISI_PROJECT_ID.firebaseapp.com",
  projectId: "ISI_PROJECT_ID",
  storageBucket: "ISI_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "ISI_ANGKA",
  appId: "ISI_APP_ID"
};

// Dua akun ini kamu buat sendiri di Firebase Authentication (lihat langkah setup).
// Password-nya TIDAK ditulis di kode, tetapi diperiksa oleh Firebase.
export const EMAIL_SISWA = "siswa@suarakita.app";
export const EMAIL_GURU = "guru@suarakita.app";
