// app.js : login, navigasi, form, tampilan. Data diambil dari Firebase lewat storage.js
import { masuk, keluar, pantauAuth, pantauLaporan, tambahLaporan, ubahLaporan, hapusLaporan, ubahSuka }
  from "./storage.js";
import { EMAIL_SISWA, EMAIL_GURU } from "./firebase-config.js";

const STATUS_ASPIRASI = ["Baru", "Diproses", "Selesai", "Ditolak"];
const STATUS_LF = ["Aktif", "Sudah Kembali"];

let sesi = null;              // { peran: "siswa" | "guru", nama: "..." }
let peranDipilih = "siswa";
let semuaData = [];           // salinan data dari Firestore (diperbarui otomatis)
let berhentiPantau = null;

const $ = (s) => document.querySelector(s);
const adalahGuru = () => sesi && sesi.peran === "guru";

function esc(t) {             // mencegah teks pengguna dibaca sebagai kode HTML
  const d = document.createElement("div");
  d.textContent = t ?? "";
  return d.innerHTML;
}
function toast(pesan) {
  const t = $("#toast");
  t.textContent = pesan;
  t.classList.add("tampil");
  setTimeout(() => t.classList.remove("tampil"), 2600);
}
function tglIndo(iso) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
function fotoValid(f) {
  return typeof f === "string" && /^data:image\/[a-z]+;base64,[A-Za-z0-9+\/=]+$/.test(f);
}

// ---------- Login (diperiksa oleh Firebase Authentication) ----------
document.querySelectorAll("[data-peran]").forEach(b => b.addEventListener("click", () => {
  peranDipilih = b.dataset.peran;
  document.querySelectorAll("[data-peran]").forEach(x => x.classList.toggle("aktif", x === b));
  $("#baris-nama").hidden = peranDipilih === "guru";
  $("#pesan-login").textContent = "";
}));
$("#lihat-pass").addEventListener("change", (e) => {
  $("#login-pass").type = e.target.checked ? "text" : "password";
});
function pesanGalat(kode) {
  if (kode === "auth/network-request-failed") return "Tidak ada internet. Login pertama butuh koneksi.";
  if (kode === "auth/too-many-requests") return "Terlalu banyak percobaan. Coba lagi nanti.";
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found",
       "auth/invalid-login-credentials"].includes(kode)) return "Password salah.";
  return "Gagal masuk (" + kode + ").";
}
$("#form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const tombol = e.target.querySelector("[type=submit]");
  if (peranDipilih === "siswa") {
    const nama = $("#login-nama").value.trim();
    if (!nama) return ($("#pesan-login").textContent = "Isi username dulu.");
    localStorage.setItem("suarakita_nama", nama);   // username hanya nama tampilan
  }
  tombol.disabled = true;
  try {
    await masuk(peranDipilih === "guru" ? EMAIL_GURU : EMAIL_SISWA, $("#login-pass").value);
    $("#login-pass").value = "";
  } catch (err) {
    $("#pesan-login").textContent = pesanGalat(err.code);
  }
  tombol.disabled = false;
});
$("#btn-keluar").addEventListener("click", () => keluar());

// Firebase memberi tahu setiap kali status login berubah (termasuk saat aplikasi dibuka lagi)
pantauAuth((user) => {
  if (berhentiPantau) { berhentiPantau(); berhentiPantau = null; }
  if (!user) {
    sesi = null; semuaData = [];
    $("#aplikasi").hidden = true;
    $("#login").hidden = false;
    return;
  }
  sesi = user.email === EMAIL_GURU
    ? { peran: "guru", nama: "Guru" }
    : { peran: "siswa", nama: localStorage.getItem("suarakita_nama") || "Siswa" };
  $("#login").hidden = true;
  $("#aplikasi").hidden = false;
  $("#nav-guru").hidden = !adalahGuru();
  infoUser();
  tampil("beranda");
  berhentiPantau = pantauLaporan(
    (data) => { semuaData = data; render(); },
    () => toast("Tidak bisa membaca data. Periksa Rules Firestore."));
});
function infoUser() {
  if (!sesi) return;
  const siapa = adalahGuru() ? "Masuk sebagai guru" : "Masuk sebagai " + sesi.nama;
  $("#info-user").textContent = siapa + (navigator.onLine ? "" : " | Offline");
}
window.addEventListener("online", infoUser);
window.addEventListener("offline", infoUser);

// ---------- Navigasi ----------
function tampil(nama) {
  if (nama === "cadangan" && !adalahGuru()) return;
  document.querySelectorAll(".halaman").forEach(h => h.hidden = true);
  $("#h-" + nama).hidden = false;
  document.querySelectorAll(".bawah button").forEach(b =>
    b.classList.toggle("aktif", b.dataset.hal === nama));
  render();
  window.scrollTo(0, 0);
}

// ---------- Foto: dikecilkan dulu agar dokumen Firestore tetap kecil ----------
function kecilkanFoto(file, maks = 600) {
  return new Promise((ok, gagal) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const skala = Math.min(1, maks / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * skala);
      c.height = Math.round(img.height * skala);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = gagal;
    img.src = url;
  });
}
$("#foto").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const p = $("#preview-foto");
  if (!file) { p.hidden = true; return; }
  try { p.src = await kecilkanFoto(file); p.hidden = false; }
  catch (err) { p.hidden = true; toast("File itu bukan gambar."); e.target.value = ""; }
});

// ---------- Kartu laporan ----------
function buatKartu(l) {
  const guru = adalahGuru();
  const asp = l.jenis === "aspirasi";
  const opsi = asp ? STATUS_ASPIRASI : STATUS_LF;
  const label = asp ? l.kategori : (l.jenis === "hilang" ? "Hilang" : "Ditemukan");
  const pengirim = asp ? (l.anonim && !guru ? "Anonim" : (l.pengirim || "Siswa")) + (l.anonim && guru ? " (anonim)" : "") : "";

  let html = `<article class="kartu ${l.jenis}">
    <h3>${esc(l.judul)}</h3>
    <span class="lencana ${esc((l.status || "").replace(" ", "-"))}">${esc(l.status)}</span>
    <span class="meta"> ${esc(label)} | ${tglIndo(l.tanggal)}${pengirim ? " | " + esc(pengirim) : ""}</span>
    ${fotoValid(l.foto) ? `<img class="foto" src="${l.foto}" alt="Foto ${esc(l.judul)}">` : ""}
    <p>${esc(l.isi)}</p>
    ${l.lokasi ? `<p class="meta">Lokasi: ${esc(l.lokasi)}</p>` : ""}
    ${l.tanggapan ? `<p class="tanggapan"><b>Balasan guru:</b> ${esc(l.tanggapan)}</p>` : ""}`;

  if (asp) {
    const suka = l.suka || [];
    const sudah = sesi && suka.includes(sesi.nama.toLowerCase());
    html += guru
      ? `<p class="meta">${suka.length} siswa mendukung</p>`
      : `<button class="suka ${sudah ? "aktif" : ""}" data-aksi="suka" data-id="${esc(l.id)}">${sudah ? "Didukung" : "Dukung"} (${suka.length})</button>`;
  }
  if (l.kontak && l.status === "Aktif") {
    html += `<a href="https://wa.me/${encodeURIComponent(l.kontak)}" target="_blank" rel="noopener">Hubungi via WhatsApp</a>`;
  }
  if (guru) {
    html += `<div class="filter">
      <select data-aksi="status" data-id="${esc(l.id)}">
        ${opsi.map(o => `<option ${o === l.status ? "selected" : ""}>${o}</option>`).join("")}
      </select>
      <button class="bahaya" data-aksi="hapus" data-id="${esc(l.id)}">Hapus</button></div>`;
    if (asp) {
      html += `<div class="filter">
        <input placeholder="Tulis balasan untuk siswa" value="${esc(l.tanggapan || "")}">
        <button data-aksi="balas" data-id="${esc(l.id)}">Balas</button></div>`;
    }
  }
  return html + "</article>";
}
function isiDaftar(el, daftar) {
  el.innerHTML = daftar.length
    ? daftar.map(buatKartu).join("")
    : `<p class="kosong">Belum ada laporan.</p>`;
}

// ---------- Render ----------
function render() {
  if (!sesi) return;
  const data = semuaData;

  const asp = data.filter(l => l.jenis === "aspirasi").length;
  const hilang = data.filter(l => l.jenis === "hilang" && l.status === "Aktif").length;
  const temu = data.filter(l => l.jenis === "ditemukan" && l.status === "Aktif").length;
  $("#statistik").innerHTML =
    `<div><b>${asp}</b><span>Aspirasi</span></div>
     <div><b>${hilang}</b><span>Barang hilang</span></div>
     <div><b>${temu}</b><span>Barang ditemukan</span></div>`;
  isiDaftar($("#daftar-terbaru"), data.slice(0, 3));

  // Aspirasi: suka terbanyak di atas; kalau sama, yang terbaru dulu
  const kataA = $("#cari-aspirasi").value.toLowerCase();
  const statA = $("#status-aspirasi").value;
  isiDaftar($("#daftar-aspirasi"), data
    .filter(l => l.jenis === "aspirasi" &&
      (l.judul + l.isi).toLowerCase().includes(kataA) &&
      (!statA || l.status === statA))
    .sort((a, b) => (b.suka || []).length - (a.suka || []).length || b.tanggal.localeCompare(a.tanggal)));

  const kataL = $("#cari-lf").value.toLowerCase();
  const jenisL = $("#jenis-lf").value;
  isiDaftar($("#daftar-lf"), data.filter(l =>
    l.jenis !== "aspirasi" &&
    (l.judul + l.isi).toLowerCase().includes(kataL) &&
    (!jenisL || l.jenis === jenisL)));
}
["#cari-aspirasi", "#status-aspirasi", "#cari-lf", "#jenis-lf"].forEach(s =>
  $(s).addEventListener("input", render));

// ---------- Form ----------
// Tidak di-await: saat offline, laporan tampil langsung dan terkirim sendiri ketika online.
function kirim(laporan, pesanOk) {
  tambahLaporan(laporan).catch(() => toast("Gagal terkirim. Cek koneksi atau ukuran foto."));
  toast(navigator.onLine ? pesanOk : "Tersimpan. Akan terkirim saat online.");
}
$("#form-aspirasi").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  kirim({
    jenis: "aspirasi", status: "Baru", suka: [],
    kategori: f.get("kategori"), judul: f.get("judul").trim(),
    isi: f.get("isi").trim(), lokasi: f.get("lokasi").trim(),
    anonim: f.get("anonim") === "on", pengirim: sesi.nama
  }, "Aspirasi terkirim");
  e.target.reset();
});
$("#form-lf").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  let foto = "";
  const file = $("#foto").files[0];
  if (file) {
    try { foto = await kecilkanFoto(file); }
    catch (err) { return toast("Foto tidak bisa dibaca."); }
  }
  kirim({
    jenis: f.get("jenis"), status: "Aktif",
    judul: f.get("judul").trim(), isi: f.get("isi").trim(),
    lokasi: f.get("lokasi").trim(), kontak: f.get("kontak").trim(),
    pengirim: sesi.nama, foto
  }, "Laporan terkirim");
  e.target.reset();
  $("#preview-foto").hidden = true;
});

// ---------- Aksi di kartu ----------
const galatAksi = () => toast("Aksi gagal. Cek koneksi atau hak akses.");
document.addEventListener("click", (e) => {
  const t = e.target;
  if (t.dataset.hal) return tampil(t.dataset.hal);
  const id = t.dataset.id;
  switch (t.dataset.aksi) {
    case "suka": {
      const l = semuaData.find(x => x.id === id);
      if (!l) break;
      const nama = sesi.nama.toLowerCase();
      ubahSuka(id, nama, (l.suka || []).includes(nama)).catch(galatAksi);
      break;
    }
    case "hapus":
      if (adalahGuru() && confirm("Hapus laporan ini?")) hapusLaporan(id).catch(galatAksi);
      break;
    case "balas": {
      if (!adalahGuru()) break;
      const teks = t.previousElementSibling.value.trim();
      const l = semuaData.find(x => x.id === id);
      const perubahan = { tanggapan: teks };
      if (l && l.status === "Baru" && teks) perubahan.status = "Diproses";
      ubahLaporan(id, perubahan).catch(galatAksi);
      toast("Balasan disimpan");
      break;
    }
  }
});
document.addEventListener("change", (e) => {
  if (e.target.dataset.aksi === "status" && adalahGuru()) {
    ubahLaporan(e.target.dataset.id, { status: e.target.value }).catch(galatAksi);
    toast("Status diperbarui");
  }
});

// ---------- Unduh rekap (guru) ----------
$("#btn-ekspor").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(semuaData, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "rekap-suarakita.json";
  a.click();
});

// ---------- PWA ----------
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
