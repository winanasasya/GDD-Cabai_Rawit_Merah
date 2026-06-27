# Gudang Data Digital — Prototipe Dashboard Cabai Rawit Merah

Prototipe ini adalah pemodelan visual dari sistem yang diusulkan pada Esai
Satria Data "Gudang Data Digital: Penerapan Gudang Data Digital Menggunakan
Model Spasial-Komponen Biaya Logistik Cabe Rawit".

## Cara membuka

Tidak perlu instalasi apa pun. Cukup buka file `index.html` langsung di
browser (klik dua kali, atau seret ke jendela browser).

Jika beberapa fitur tidak tampil sempurna saat dibuka langsung dari file
(`file://`), jalankan server lokal sederhana sebagai alternatif:

```bash
cd webapp
python3 -m http.server 8000
```

Lalu buka `http://localhost:8000` di browser.

## Struktur file

| File | Isi |
|---|---|
| `index.html` | Struktur halaman & seluruh tampilan (Ringkasan, Hulu, Tengah, Hilir, Pemodelan, Kluster) |
| `app.js` | Logika aplikasi: navigasi tab, render tabel/grafik, form tambah data, kalkulasi ulang otomatis |
| `data.js` | Data simulasi (panen, distribusi, harga BBM, harga pasar) + rumus P_ideal, Indeks Disparitas, dan penentuan kluster |

## Apa yang bisa dilakukan di dashboard ini

1. **Ringkasan** — KPI nasional, grafik perbandingan harga riil vs harga ideal per wilayah, dan peta status kluster yang bisa diklik.
2. **Hulu** — Tabel & grafik volume panen 7 hari terakhir; bisa menambah catatan panen baru.
3. **Tengah** — Tabel harga BBM yang berlaku dan manifes pengiriman; biaya distribusi dihitung otomatis dari jarak × harga BBM; bisa menambah pengiriman baru.
4. **Hilir** — Tabel harga eceran riil per wilayah, diurutkan dari penyimpangan tertinggi; bisa melaporkan harga pasar baru untuk wilayah mana pun.
5. **Pemodelan** — Penjelasan formula P_ideal dan Indeks Disparitas (ID), dengan simulator yang membongkar perhitungan langkah demi langkah per wilayah.
6. **Kluster** — Tiga kelompok kebijakan (Hijau/Kuning/Merah) dengan jumlah wilayah otomatis dan tabel rekomendasi tindakan.

Karena seluruh data tersimpan di memori browser (variabel JavaScript), setiap
input baru di tahap Hulu/Tengah/Hilir akan langsung memengaruhi hasil
perhitungan di tahap Pemodelan dan Kluster — mendemonstrasikan bagaimana
sistem yang diusulkan bekerja secara end-to-end.

## Catatan penting

- Ini adalah **prototipe demonstrasi**, bukan aplikasi produksi. Data akan
  kembali ke kondisi awal setiap kali halaman dimuat ulang (tidak ada
  database sungguhan di baliknya).
- Formula dan asumsi (konsumsi BBM per km, kapasitas truk, margin
  pedagang) bersifat ilustratif untuk mendukung penjelasan konsep di
  esai, dan dapat dikalibrasi lebih lanjut dengan data riil jika
  diperlukan untuk keperluan akademik yang lebih ketat.
