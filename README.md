# SuaraKita

# 📢 SuaraKita — E-Aspirasi & Lost and Found Sekolah

**SuaraKita** adalah aplikasi web *mobile-first* (PWA) untuk SMK Negeri 1 Blitar yang menggabungkan dua fungsi dalam satu aplikasi: **E-Aspirasi** (penyampaian saran dan pengaduan fasilitas sekolah) dan **Lost & Found** (barang hilang dan ditemukan). Aplikasi ini berjalan tanpa server berbayar dengan memanfaatkan **GitHub Pages** sebagai antarmuka web dan **Firebase** (Authentication + Cloud Firestore) sebagai database *cloud* yang dapat dilihat dari semua perangkat.

---

## ✨ Fitur Utama

1. **Login Dua Peran: Siswa & Guru**
   - Aplikasi selalu dimulai dari halaman login. **Siswa** masuk dengan username (nama tampilan) dan password siswa, sedangkan **Guru** masuk hanya dengan password guru.
   - Pemeriksaan password dilakukan oleh **Firebase Authentication**, sehingga password **tidak tertulis di dalam kode**.
2. **E-Aspirasi dengan Sistem Dukungan (Suka)**
   - Siswa mengirim aspirasi berisi kategori, judul, isi, lokasi, dan dapat memilih mode **anonim**.
   - Siswa lain dapat menekan tombol **Dukung**. Aspirasi dengan dukungan terbanyak otomatis tampil **paling atas**, sehingga lebih mudah terlihat dan ditindaklanjuti guru.
   - Aspirasi dapat dicari dan disaring berdasarkan status: **Baru → Diproses → Selesai** (atau **Ditolak**).
3. **Balasan & Pengelolaan oleh Guru**
   - Guru dapat melihat semua aspirasi, menulis **balasan**, mengubah status, dan menghapus laporan. Balasan guru langsung tampil di kartu aspirasi yang dilihat siswa.
   - Saat guru membalas aspirasi berstatus *Baru*, statusnya otomatis berubah menjadi *Diproses*.
   - Guru dapat melihat nama pengirim aspirasi anonim (diberi label *anonim*), sedangkan siswa lain hanya melihat tulisan **Anonim**.
4. **Lost & Found dengan Foto**
   - Laporan **Hilang** atau **Ditemukan** berisi nama barang, ciri-ciri, lokasi, kontak WhatsApp, dan **foto barang** (opsional).
   - Foto otomatis **dikecilkan** (maksimal 600 piksel) sebelum disimpan agar ringan dan hemat kuota.
   - Tombol **Hubungi via WhatsApp** muncul pada laporan yang masih berstatus *Aktif*. Guru dapat menandai laporan menjadi **Sudah Kembali**.
5. **Sinkronisasi Real-time Lintas Perangkat**
   - Setiap laporan, dukungan, dan balasan langsung muncul di semua perangkat tanpa perlu memuat ulang halaman.
6. **Bisa Dipasang di HP & Tetap Jalan Offline**
   - Dapat dipasang ke layar utama sebagai aplikasi (PWA). Data yang pernah dimuat tetap bisa dibaca saat offline, dan laporan yang dikirim saat offline akan terkirim sendiri ketika internet kembali.
7. **Beranda Ringkas**
   - Menampilkan jumlah aspirasi, barang hilang, barang ditemukan, serta 3 laporan terbaru.

---

## 🔐 Hak Akses Peran

| Fitur | Siswa | Guru |
| :--- | :---: | :---: |
| Melihat aspirasi dan laporan barang | ✅ | ✅ |
| Mengirim aspirasi & laporan barang | ✅ | ✅ |
| Mendukung (suka) aspirasi | ✅ | ❌ *(hanya melihat jumlah dukungan)* |
| Membalas aspirasi | ❌ | ✅ |
| Mengubah status laporan | ❌ | ✅ |
| Menghapus laporan | ❌ | ✅ |
| Melihat nama pengirim anonim | ❌ | ✅ |
| Unduh rekap data (menu **Rekap**) | ❌ | ✅ |

> Pembatasan ini tidak hanya ada di tampilan, tetapi juga dijaga oleh **Rules Firestore** di server (lihat bagian instalasi).

---

## 🛠️ Panduan Instalasi Database (Firebase)

### Langkah 1: Buat Proyek Firebase
1. Buka [console.firebase.google.com](https://console.firebase.google.com), klik **Add project**, dan beri nama (misalnya `SuaraKita`). Google Analytics boleh dimatikan.

### Langkah 2: Buat Database Firestore
1. Buka **Databases & Storage → Firestore → Create database**.
2. Pilih edisi **Standard**, biarkan Database ID `(default)`, pilih lokasi `asia-southeast2` (Jakarta), dan mode **production**. Lokasi tidak bisa diganti setelah dibuat.

### Langkah 3: Aktifkan Login & Buat Dua Akun
1. Buka **Security → Authentication → Get started → Sign-in method → Email/Password → Enable**.
2. Buka tab **Users → Add user** dan buat dua akun:

| Akun | Email | Password |
| :--- | :--- | :--- |
| Siswa (dipakai bersama) | `siswa@suarakita.app` | *(tetapkan sendiri, minimal 6 karakter)* |
| Guru | `guru@suarakita.app` | *(tetapkan sendiri, minimal 6 karakter)* |

> **Jangan menulis password di README atau di kode.** Bagikan password siswa dan guru langsung kepada pihak yang berhak.

### Langkah 4: Ambil Konfigurasi Aplikasi Web
1. Di **Project Overview**, klik **+ Add app**, pilih ikon web `</>`, beri nama aplikasi, **jangan** centang Firebase Hosting, lalu klik **Register app**.
2. Salin blok `firebaseConfig` ke file `js/firebase-config.js`:

```javascript
export const firebaseConfig = {
  apiKey: "...",
  authDomain: "....firebaseapp.com",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

export const EMAIL_SISWA = "siswa@suarakita.app";
export const EMAIL_GURU = "guru@suarakita.app";
```

> **Penting:** pertahankan kata `export` di depan `const`. Kunci ini memang boleh terlihat publik, karena yang melindungi data adalah **Rules Firestore**, bukan kerahasiaan kunci.

### Langkah 5: Pasang Rules Firestore
1. Buka **Firestore → tab Rules**, hapus seluruh isi lama, lalu tempel kode berikut (sama dengan isi file `ATURAN-FIRESTORE.txt`) dan klik **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Hanya dua akun resmi (siswa & guru) yang dianggap "masuk"
    function masuk() {
      return request.auth != null
        && request.auth.token.email in ['siswa@suarakita.app', 'guru@suarakita.app'];
    }
    function guru() {
      return masuk() && request.auth.token.email == 'guru@suarakita.app';
    }

    match /laporan/{id} {
      allow read: if masuk();

      allow create: if masuk()
        && request.resource.data.jenis in ['aspirasi', 'hilang', 'ditemukan']
        && request.resource.data.status in ['Baru', 'Aktif']
        && request.resource.data.judul is string
        && request.resource.data.judul.size() <= 100
        && request.resource.data.isi is string
        && request.resource.data.isi.size() <= 2000
        && request.resource.data.get('suka', []).size() == 0
        && (!('foto' in request.resource.data) || request.resource.data.foto.size() < 300000);

      // Guru boleh ubah apa saja; siswa hanya boleh mengubah daftar "suka"
      allow update: if guru()
        || (masuk() && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['suka']));

      allow delete: if guru();
    }
  }
}
```

> Jika Anda memakai alamat email akun yang berbeda, ubah juga di `js/firebase-config.js` dan di bagian atas Rules.

### Langkah 6: Deploy ke GitHub Pages
1. Unggah **isi** folder proyek ke repository GitHub (`index.html` harus berada di tingkat paling atas repository).
2. Buka **Settings → Pages**, pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
3. Tunggu 1–2 menit. Alamat aplikasi akan berbentuk `https://username.github.io/SuaraKita/`.

> **Tips Pembaruan:** Aplikasi menyimpan file di cache agar bisa dibuka offline. Setiap kali Anda mengubah file, naikkan angka `VERSI` di `sw.js` (misalnya `suarakita-v3` → `suarakita-v4`), lalu buka aplikasi dua kali supaya versi terbaru terpasang.

---

## 📖 Tata Cara Menggunakan Aplikasi

### 1. Masuk ke Aplikasi
1. Buka alamat aplikasi, lalu pilih **Siswa** atau **Guru**.
2. **Siswa:** isi username (bebas, hanya untuk nama tampilan) dan password siswa. **Guru:** cukup isi password guru.
3. Centang **Tampilkan password** jika ingin memeriksa ketikan. Gunakan tombol **Keluar** di pojok kanan atas untuk berganti akun.

> Login pertama kali dan pembukaan aplikasi pertama kali **harus online**.

### 2. Menyampaikan Aspirasi (Siswa)
1. Buka tab **Aspirasi**, lalu isi kategori, judul, isi aspirasi, dan lokasi.
2. Centang **Sembunyikan nama saya (anonim)** bila tidak ingin nama ditampilkan, lalu klik **Kirim aspirasi**.
3. Tekan **Dukung** pada aspirasi yang Anda setujui (tekan lagi untuk membatalkan). Aspirasi yang paling banyak didukung muncul paling atas.

### 3. Melaporkan Barang Hilang / Ditemukan
1. Buka tab **Lost & Found**, pilih jenis laporan (*Saya kehilangan barang* atau *Saya menemukan barang*).
2. Isi nama barang, ciri-ciri, lokasi, dan nomor WhatsApp (awalan `62`), lalu tambahkan **foto** bila ada.
3. Klik **Kirim laporan**. Pemilik atau penemu dapat saling menghubungi lewat tombol **Hubungi via WhatsApp**.
4. Untuk keamanan, minta penjelasan ciri khusus barang sebelum mengembalikan.

### 4. Menanggapi Laporan (Guru)
1. Buka tab **Aspirasi**, lalu tinjau aspirasi dari urutan dukungan terbanyak.
2. Tulis balasan pada kolom di kartu aspirasi, lalu klik **Balas**. Status *Baru* otomatis menjadi *Diproses*.
3. Ubah status melalui menu pilihan (*Baru / Diproses / Selesai / Ditolak*). Untuk barang, ubah ke *Sudah Kembali* saat barang sudah diserahkan.
4. Gunakan tombol **Hapus** untuk laporan yang tidak pantas atau sudah tidak diperlukan.
5. Buka menu **Rekap** untuk mengunduh salinan seluruh data dalam format JSON.

### 5. Memasang Aplikasi di HP
- Buka alamat aplikasi di Chrome, buka menu titik tiga, lalu pilih **Tambahkan ke layar utama** (*Install app*).

---

## 🧯 Mengatasi Masalah Umum

| Pesan / Gejala | Penyebab & Solusi |
| :--- | :--- |
| `auth/api-key-not-valid` | `apiKey` di `firebase-config.js` salah ketik. Salin ulang langsung dari **Project settings → Your apps → Config**. Periksa juga pembatasan kunci di Google Cloud (*Credentials → Browser key*) dan pastikan **Identity Toolkit API** diizinkan. |
| Aplikasi tidak memuat / layar kosong | Kata `export` hilang di `firebase-config.js`, atau file dibuka langsung dari folder (bukan lewat GitHub Pages / Live Server). |
| "Password salah" | Password tidak cocok dengan akun di Authentication, atau email akun salah ketik. |
| "Tidak bisa membaca data" | Rules Firestore belum di-**Publish**, atau database belum dibuat. |
| `auth/unauthorized-domain` | Tambahkan `username.github.io` di **Authentication → Settings → Authorized domains**. |
| Tampilan lama masih muncul | Naikkan `VERSI` di `sw.js`, lalu buka aplikasi dua kali atau tekan Ctrl+Shift+R. |

---

## ⚠️ Batasan & Catatan Keamanan

- **Password siswa dipakai bersama.** Siapa pun yang mengetahuinya dapat masuk sebagai siswa. Cukup untuk skala sekolah, tetapi jangan disebarkan di luar sekolah.
- **Dukungan (suka) berdasarkan username.** Siswa yang iseng dapat memakai username berbeda untuk menyuka berulang kali. Pembatasan ketat memerlukan satu akun per siswa.
- **Hak guru dijaga oleh Rules Firestore**, bukan hanya oleh tampilan. Siswa tidak dapat mengubah status, membalas, atau menghapus laporan walaupun mencoba mengakalinya dari browser.
- **Foto disimpan di dalam dokumen Firestore** (bukan Firebase Storage) agar tetap gratis. Karena itu foto dikecilkan otomatis dan dibatasi ukurannya oleh Rules.
- Aplikasi hanya memuat **200 laporan terbaru** untuk menghemat kuota pembacaan. Kuota gratis (paket *Spark*) cukup untuk skala satu sekolah; periksa dokumentasi Firebase untuk batas terbarunya.
- Jangan menyimpan data sensitif (nomor identitas, alamat rumah) di dalam laporan.

---

## 📁 Struktur File Repository

```text
SuaraKita/
├── index.html              # Halaman login & aplikasi (beranda, aspirasi, lost & found, rekap)
├── manifest.json           # Konfigurasi PWA (nama, warna, ikon)
├── sw.js                   # Service worker: cache agar bisa dibuka offline
├── ATURAN-FIRESTORE.txt    # Salinan Rules Firestore untuk ditempel di Firebase Console
├── css/
│   └── style.css           # Tampilan antarmuka & halaman login
├── js/
│   ├── app.js              # Login, navigasi, form, tampilan kartu, suka, balasan guru
│   ├── storage.js          # Semua urusan Firebase (Authentication & Firestore)
│   └── firebase-config.js  # Konfigurasi proyek Firebase & email dua akun
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md               # Dokumentasi proyek & panduan penggunaan
```

---

## 💡 Catatan Pembuat & Riwayat Pengembangan

> *Bagian ini sebaiknya disesuaikan dan diisi sendiri oleh pembuat proyek (nama, kelas, dan sekolah).*

**Pembuat:** `(isi nama pembuat)` — `(isi kelas/jurusan)`, SMK Negeri 1 Blitar.

### Proses Pembuatan
Konsep awal aplikasi (penggabungan E-Aspirasi dan Lost & Found dalam satu PWA) disusun bersama bantuan AI, kemudian dikembangkan dan disesuaikan secara bertahap sesuai kebutuhan pembuat. AI digunakan sebagai alat bantu untuk merancang struktur, menjelaskan konsep, dan menuliskan kode; pembuat menentukan fitur, melakukan pengujian, mengatur proyek Firebase, serta melakukan *deploy* ke GitHub Pages.

### Ringkasan Tahapan Pengembangan
1. **Perancangan Konsep & Struktur**
   - Menentukan dua fungsi utama (E-Aspirasi dan Lost & Found), struktur halaman, alur kerja, serta fitur yang realistis untuk dikerjakan siswa SMA/SMK.
2. **Versi Awal Berbasis `localStorage`**
   - Membuat versi dasar dengan data tersimpan di browser, lengkap dengan PWA (manifest dan service worker) agar bisa dipasang di HP dan dipakai offline.
3. **Penambahan Fitur Pilihan Pembuat**
   - Unggah **foto** pada Lost & Found.
   - **Login dua peran** (siswa dan guru) di awal aplikasi, dengan guru dapat membuka semua fitur serta melihat dan membalas aspirasi.
   - Sistem **suka/dukungan**, dengan aspirasi paling banyak didukung tampil paling atas agar lebih mungkin ditanggapi guru.
   - Tampilan halaman login yang terinspirasi dari halaman login Moodle sekolah.
4. **Perpindahan ke Firebase**
   - Mengganti penyimpanan `localStorage` dengan **Cloud Firestore** agar semua perangkat melihat data yang sama secara *real-time*, serta memindahkan pemeriksaan password ke **Firebase Authentication** dan pembatasan hak akses ke **Rules Firestore**.
5. **Deploy & Penyempurnaan**
   - Melakukan *deploy* ke GitHub Pages, memperbaiki kesalahan konfigurasi Firebase, dan menyesuaikan pengaturan pada setiap pembaruan.# SuaraKita
