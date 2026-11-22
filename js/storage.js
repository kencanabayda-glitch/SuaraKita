// storage.js : semua urusan Firebase (login + database Firestore) ada di sini.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, query, orderBy, limit, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, arrayUnion, arrayRemove }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// persistentLocalCache = data disimpan di HP juga, jadi tetap bisa dibaca saat offline
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
const laporanRef = collection(db, "laporan");

// ---- Login ----
export const masuk = (email, password) => signInWithEmailAndPassword(auth, email, password);
export const keluar = () => signOut(auth);
export const pantauAuth = (callback) => onAuthStateChanged(auth, callback);

// ---- Data (realtime: setiap perubahan dari perangkat mana pun langsung masuk) ----
export function pantauLaporan(callback, galat) {
  const q = query(laporanRef, orderBy("tanggal", "desc"), limit(200));
  return onSnapshot(q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    galat);
}
// Catatan: JANGAN di-await untuk tampilan, karena saat offline janjinya baru selesai ketika online lagi.
export function tambahLaporan(laporan) {
  return addDoc(laporanRef, { ...laporan, tanggal: new Date().toISOString() });
}
export const ubahLaporan = (id, perubahan) => updateDoc(doc(db, "laporan", id), perubahan);
export const hapusLaporan = (id) => deleteDoc(doc(db, "laporan", id));
// Suka / batal suka memakai arrayUnion/arrayRemove agar aman jika banyak orang menekan bersamaan
export const ubahSuka = (id, nama, sudahSuka) =>
  updateDoc(doc(db, "laporan", id), { suka: sudahSuka ? arrayRemove(nama) : arrayUnion(nama) });
