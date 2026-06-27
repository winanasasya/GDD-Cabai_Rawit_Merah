// ============================================================
// DATA DUMMY — Gudang Data Digital Cabai Rawit Merah
// Disusun konsisten dengan riset Esai Satria Data:
// HAP cabai rawit merah (Perbadan No.11/2022): produsen Rp25.000-31.500/kg,
// konsumen Rp40.000-57.000/kg. Harga BBM Biosolar subsidi Rp6.800/liter (2026).
// ============================================================

const STATE = {
  hargaBBM: [
    { jenis: "Biosolar (subsidi)", harga: 6800, berlaku: "2026-06-20" },
    { jenis: "Dexlite (nonsubsidi)", harga: 12740, berlaku: "2026-06-20" },
    { jenis: "Pertamina Dex", harga: 13200, berlaku: "2026-06-20" },
  ],

  wilayah: [
    { id: "W01", nama: "Jakarta Pusat", tipe: "non-sentra", jarakDariSentra: 780 },
    { id: "W02", nama: "Bandung", tipe: "non-sentra", jarakDariSentra: 320 },
    { id: "W03", nama: "Banyuwangi", tipe: "sentra", jarakDariSentra: 15 },
    { id: "W04", nama: "Surabaya", tipe: "non-sentra", jarakDariSentra: 290 },
    { id: "W05", nama: "Semarang", tipe: "non-sentra", jarakDariSentra: 410 },
    { id: "W06", nama: "Halmahera Barat", tipe: "non-sentra", jarakDariSentra: 1850 },
    { id: "W07", nama: "Mataram", tipe: "non-sentra", jarakDariSentra: 540 },
    { id: "W08", nama: "Makassar", tipe: "non-sentra", jarakDariSentra: 980 },
  ],

  panen: [
    { tanggal: "2026-06-21", petani: "Kelompok Tani Sari Makmur", wilayah: "Banyuwangi", volume: 18500, pPetani: 27500 },
    { tanggal: "2026-06-22", petani: "Kelompok Tani Tani Jaya", wilayah: "Banyuwangi", volume: 21200, pPetani: 26800 },
    { tanggal: "2026-06-23", petani: "Kelompok Tani Subur Abadi", wilayah: "Jember", volume: 14300, pPetani: 28200 },
    { tanggal: "2026-06-24", petani: "Kelompok Tani Mekar Tani", wilayah: "Probolinggo", volume: 12800, pPetani: 29000 },
    { tanggal: "2026-06-25", petani: "Kelompok Tani Sari Makmur", wilayah: "Banyuwangi", volume: 9700, pPetani: 31200 },
    { tanggal: "2026-06-26", petani: "Kelompok Tani Tani Jaya", wilayah: "Banyuwangi", volume: 8200, pPetani: 32500 },
    { tanggal: "2026-06-27", petani: "Kelompok Tani Subur Abadi", wilayah: "Jember", volume: 7600, pPetani: 33800 },
  ],

  panenSeries7Hari: [
    { hari: "21 Jun", volumeTon: 41.2 },
    { hari: "22 Jun", volumeTon: 44.6 },
    { hari: "23 Jun", volumeTon: 39.8 },
    { hari: "24 Jun", volumeTon: 35.1 },
    { hari: "25 Jun", volumeTon: 24.3 },
    { hari: "26 Jun", volumeTon: 19.7 },
    { hari: "27 Jun", volumeTon: 17.9 },
  ],

  distribusi: [
    { asal: "Banyuwangi", tujuan: "Surabaya", volume: 6200, jarak: 290, bbmId: 0 },
    { asal: "Banyuwangi", tujuan: "Jakarta Pusat", volume: 8400, jarak: 780, bbmId: 0 },
    { asal: "Jember", tujuan: "Bandung", volume: 5100, jarak: 700, bbmId: 0 },
    { asal: "Probolinggo", tujuan: "Semarang", volume: 4300, jarak: 410, bbmId: 1 },
    { asal: "Banyuwangi", tujuan: "Mataram", volume: 2100, jarak: 540, bbmId: 0 },
    { asal: "Jember", tujuan: "Makassar", volume: 1800, jarak: 980, bbmId: 1 },
    { asal: "Probolinggo", tujuan: "Halmahera Barat", volume: 650, jarak: 1850, bbmId: 1 },
  ],

  // Harga eceran riil per wilayah hari ini, dipakai untuk hitung P_ideal & ID
  hargaPasar: [
    { wilayah: "Banyuwangi", tanggal: "2026-06-27", pRiil: 33000 },
    { wilayah: "Surabaya", tanggal: "2026-06-27", pRiil: 41500 },
    { wilayah: "Bandung", tanggal: "2026-06-27", pRiil: 47800 },
    { wilayah: "Semarang", tanggal: "2026-06-27", pRiil: 45200 },
    { wilayah: "Jakarta Pusat", tanggal: "2026-06-27", pRiil: 52000 },
    { wilayah: "Mataram", tanggal: "2026-06-27", pRiil: 58500 },
    { wilayah: "Makassar", tanggal: "2026-06-27", pRiil: 61000 },
    { wilayah: "Halmahera Barat", tanggal: "2026-06-27", pRiil: 100000 },
  ],

  // margin keuntungan wajar pedagang (Rp/kg), dari selisih historis HAP
  marginWajar: 9000,
  pPetaniRataRata: 28500,
};

// ============================================================
// HELPER: cari data pendukung untuk sebuah wilayah
// ============================================================
function getDistribusiUntukWilayah(namaWilayah) {
  return STATE.distribusi.find(d => d.tujuan === namaWilayah) || null;
}

function hitungBDistribusi(distribusi) {
  if (!distribusi) return 0;
  const bbm = STATE.hargaBBM[distribusi.bbmId];
  // Asumsi: truk angkutan pangan menempuh 4 km per liter solar, kapasitas muat 5.000 kg per perjalanan.
  // Biaya BBM total perjalanan dibagi rata ke setiap kg yang diangkut -> biaya distribusi per kg.
  const KM_PER_LITER = 4;
  const KAPASITAS_KG = 5000;
  const literDipakai = distribusi.jarak / KM_PER_LITER;
  const biayaBBMTotal = literDipakai * bbm.harga;
  const biayaPerKg = biayaBBMTotal / KAPASITAS_KG;
  // Komponen non-BBM (sopir, retribusi, penyusutan/losses cabai yang mudah busuk) diasumsikan 1.5x biaya BBM per kg.
  const biayaNonBBM = biayaPerKg * 1.5;
  return Math.round(biayaPerKg + biayaNonBBM);
}

function hitungPIdeal(namaWilayah) {
  const distribusi = getDistribusiUntukWilayah(namaWilayah);
  const isSentraSendiri = !distribusi; // wilayah sentra sendiri (Banyuwangi dkk)
  const bDistribusi = isSentraSendiri ? 1500 : hitungBDistribusi(distribusi);
  const pPetani = STATE.pPetaniRataRata;
  const margin = STATE.marginWajar;
  const pIdeal = pPetani + bDistribusi + margin;
  return { pIdeal, pPetani, bDistribusi, margin, distribusi };
}

function hitungID(pRiil, pIdeal) {
  return ((pRiil - pIdeal) / pIdeal) * 100;
}

function getKluster(idPercent) {
  if (idPercent <= 10) return "hijau";
  if (idPercent <= 30) return "kuning";
  return "merah";
}

function klusterLabel(k) {
  return { hijau: "Hijau", kuning: "Kuning", merah: "Merah" }[k];
}

function klusterIntervensi(k) {
  return {
    hijau: "Pemantauan rutin",
    kuning: "Fasilitasi Distribusi Pangan (FDP) terjadwal",
    merah: "Gerakan Pangan Murah (GPM) + audit jalur distribusi 24-48 jam",
  }[k];
}

function rupiah(n) {
  return "Rp" + Math.round(n).toLocaleString("id-ID");
}

// Hitung ulang semua wilayah dengan P_riil tercatat -> dipakai di seluruh dashboard
function computeAllRegions() {
  return STATE.hargaPasar.map(hp => {
    const { pIdeal, pPetani, bDistribusi, margin, distribusi } = hitungPIdeal(hp.wilayah);
    const id = hitungID(hp.pRiil, pIdeal);
    // ID negatif (harga riil di bawah ideal) tetap dikategorikan wajar/hijau,
    // karena yang menjadi perhatian kebijakan adalah penyimpangan ke ATAS (memberatkan konsumen).
    const klusterKey = getKluster(Math.max(id, 0));
    return {
      wilayah: hp.wilayah,
      tanggal: hp.tanggal,
      pRiil: hp.pRiil,
      pIdeal, pPetani, bDistribusi, margin, distribusi,
      id,
      kluster: klusterKey,
    };
  });
}
