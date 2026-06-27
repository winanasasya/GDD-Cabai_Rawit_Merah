// ============================================================
// APP LOGIC — Gudang Data Digital
// ============================================================

const STAGES = [
  { id: "ringkasan", label: "Ringkasan", pipeName: "Ringkasan", pipeLabel: "Beranda" },
  { id: "hulu",      label: "Hulu",      pipeName: "Sentra Panen", pipeLabel: "01 · Hulu" },
  { id: "tengah",    label: "Tengah",    pipeName: "Distribusi",  pipeLabel: "02 · Tengah" },
  { id: "hilir",     label: "Hilir",     pipeName: "Pasar Eceran",pipeLabel: "03 · Hilir" },
  { id: "model",     label: "Pemodelan", pipeName: "Harga Ideal & ID", pipeLabel: "04 · Model" },
  { id: "kluster",   label: "Kluster",   pipeName: "Kebijakan",   pipeLabel: "05 · Aksi" },
];

let currentView = "ringkasan";
let charts = {};

// ---------- NAV BUILD ----------
function buildNav() {
  const tabNav = document.getElementById("tabNav");
  const mobileNav = document.getElementById("mobileNav");
  tabNav.innerHTML = "";
  mobileNav.innerHTML = "";

  STAGES.forEach(s => {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (s.id === currentView ? " active" : "");
    btn.textContent = s.label;
    btn.onclick = () => switchView(s.id);
    tabNav.appendChild(btn);

    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.label;
    mobileNav.appendChild(opt);
  });

  mobileNav.value = currentView;
  mobileNav.onchange = (e) => switchView(e.target.value);
}

function buildPipeline() {
  const row = document.getElementById("pipelineRow");
  row.innerHTML = "";
  const mainStages = STAGES.filter(s => s.id !== "ringkasan");
  // pipeline shows: Hulu -> Tengah -> Hilir -> Pemodelan (4 nodes, 3 connectors -> grid 1fr auto 1fr auto 1fr requires 3 nodes)
  // we'll show Hulu, Tengah, Hilir as the 3-node pipeline, with metrics
  const nodes = [
    { id: "hulu", name: "Hulu", metricLabel: "Total panen 7 hari", metricValue: () => sumPanen7Hari().toFixed(1) + " ton" },
    { id: "tengah", name: "Tengah", metricLabel: "Pengiriman aktif", metricValue: () => STATE.distribusi.length + " rute" },
    { id: "hilir", name: "Hilir", metricLabel: "Wilayah terpantau", metricValue: () => STATE.hargaPasar.length + " wilayah" },
  ];

  const regions = computeAllRegions();
  const worst = regions.reduce((a, b) => (b.id > a.id ? b : a), regions[0]);
  const flowClass = "flow-" + worst.kluster;

  nodes.forEach((n, i) => {
    const div = document.createElement("div");
    div.className = "pipe-stage" + (currentView === n.id ? " active" : "");
    div.tabIndex = 0;
    div.setAttribute("role", "button");
    div.onclick = () => switchView(n.id);
    div.onkeypress = (e) => { if (e.key === "Enter") switchView(n.id); };
    div.innerHTML = `
      <div class="pipe-label">${i === 0 ? "01" : i === 1 ? "02" : "03"} · Tahap</div>
      <div class="pipe-name">${n.name}</div>
      <div class="pipe-metric">${n.metricLabel}: <strong>${n.metricValue()}</strong></div>
    `;
    row.appendChild(div);

    if (i < nodes.length - 1) {
      const conn = document.createElement("div");
      conn.className = "pipe-connector " + flowClass;
      row.appendChild(conn);
    }
  });
}

function sumPanen7Hari() {
  return STATE.panenSeries7Hari.reduce((a, b) => a + b.volumeTon, 0);
}

function switchView(id) {
  currentView = id;
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + id).classList.add("active");
  buildNav();
  buildPipeline();
  renderCurrentView();
  window.scrollTo({ top: document.querySelector("main").offsetTop - 80, behavior: "smooth" });
}

function renderCurrentView() {
  if (currentView === "ringkasan") renderRingkasan();
  if (currentView === "hulu") renderHulu();
  if (currentView === "tengah") renderTengah();
  if (currentView === "hilir") renderHilir();
  if (currentView === "model") renderModel();
  if (currentView === "kluster") renderKluster();
}

// ---------- TOAST ----------
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}

// ============================================================
// RINGKASAN
// ============================================================
function renderRingkasan() {
  const regions = computeAllRegions();
  const kpiRow = document.getElementById("kpiRow");
  const totalPanen = sumPanen7Hari();
  const rataID = regions.reduce((a, b) => a + b.id, 0) / regions.length;
  const merahCount = regions.filter(r => r.kluster === "merah").length;
  const hargaTertinggi = regions.reduce((a, b) => (b.pRiil > a.pRiil ? b : a), regions[0]);

  kpiRow.innerHTML = `
    <div class="kpi"><div class="stat"><span class="label">Total Panen 7 Hari</span><span class="value">${totalPanen.toFixed(1)}<span class="unit"> ton</span></span></div></div>
    <div class="kpi"><div class="stat"><span class="label">Rata-rata Indeks Disparitas</span><span class="value">${rataID.toFixed(1)}<span class="unit">%</span></span></div></div>
    <div class="kpi"><div class="stat"><span class="label">Wilayah Kluster Merah</span><span class="value">${merahCount}<span class="unit"> dari ${regions.length}</span></span></div></div>
    <div class="kpi"><div class="stat"><span class="label">Harga Eceran Tertinggi</span><span class="value" style="font-size:22px;">${rupiah(hargaTertinggi.pRiil)}<span class="unit"> · ${hargaTertinggi.wilayah}</span></span></div></div>
  `;

  renderChartHargaWilayah(regions);
  renderRegionMap(regions);
}

function renderChartHargaWilayah(regions) {
  const ctx = document.getElementById("chartHargaWilayah");
  if (charts.hargaWilayah) charts.hargaWilayah.destroy();
  charts.hargaWilayah = new Chart(ctx, {
    type: "bar",
    data: {
      labels: regions.map(r => r.wilayah),
      datasets: [
        {
          label: "P_riil",
          data: regions.map(r => r.pRiil),
          backgroundColor: regions.map(r => ({ hijau: "#2F6E4F", kuning: "#B8821A", merah: "#A82B22" }[r.kluster])),
          borderRadius: 3,
          order: 2,
        },
        {
          label: "P_ideal",
          data: regions.map(r => r.pIdeal),
          type: "line",
          borderColor: "#1C1410",
          borderDash: [5, 4],
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#1C1410",
          fill: false,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "bottom", labels: { font: { family: "Space Grotesk", size: 11 } } } },
      scales: {
        x: { ticks: { font: { size: 10.5 } }, grid: { display: false } },
        y: { ticks: { callback: (v) => "Rp" + (v / 1000) + "rb", font: { size: 10.5 } } },
      },
    },
  });
}

function renderRegionMap(regions) {
  const map = document.getElementById("regionMap");
  map.innerHTML = "";
  regions.sort((a, b) => b.id - a.id).forEach(r => {
    const tile = document.createElement("div");
    tile.className = "region-tile " + r.kluster;
    tile.tabIndex = 0;
    tile.innerHTML = `
      <div class="rname">${r.wilayah}</div>
      <div class="rid">${r.id > 0 ? "+" : ""}${r.id.toFixed(1)}%</div>
      <span class="badge ${r.kluster}">${klusterLabel(r.kluster)}</span>
    `;
    tile.onclick = () => openSimulasiModal(r.wilayah);
    map.appendChild(tile);
  });
}

// ============================================================
// HULU
// ============================================================
function renderHulu() {
  renderChartPanen();
  const tbody = document.querySelector("#tablePanen tbody");
  tbody.innerHTML = "";
  [...STATE.panen].reverse().forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${formatTanggal(p.tanggal)}</td><td>${p.petani}</td><td>${p.wilayah}</td>
      <td class="num">${p.volume.toLocaleString("id-ID")}</td><td class="num">${rupiah(p.pPetani)}</td>`;
    tbody.appendChild(tr);
  });
}

function renderChartPanen() {
  const ctx = document.getElementById("chartPanen");
  if (charts.panen) charts.panen.destroy();
  charts.panen = new Chart(ctx, {
    type: "line",
    data: {
      labels: STATE.panenSeries7Hari.map(d => d.hari),
      datasets: [{
        label: "Volume Panen (ton)",
        data: STATE.panenSeries7Hari.map(d => d.volumeTon),
        borderColor: "#C23B22",
        backgroundColor: "rgba(194,59,34,0.12)",
        fill: true, tension: 0.35, pointBackgroundColor: "#C23B22", pointRadius: 4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { ticks: { font: { size: 10.5 } } }, x: { grid: { display: false }, ticks: { font: { size: 10.5 } } } },
    },
  });
}

function formatTanggal(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
}

// ============================================================
// TENGAH
// ============================================================
function renderTengah() {
  const bbmBody = document.getElementById("tableBBM");
  bbmBody.innerHTML = "";
  STATE.hargaBBM.forEach(b => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${b.jenis}</td><td class="num">${rupiah(b.harga)}</td><td>${formatTanggal(b.berlaku)}</td>`;
    bbmBody.appendChild(tr);
  });

  const kBody = document.querySelector("#tableKirim tbody");
  kBody.innerHTML = "";
  STATE.distribusi.forEach(d => {
    const biaya = hitungBDistribusi(d);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${d.asal}</td><td>${d.tujuan}</td><td class="num">${d.volume.toLocaleString("id-ID")}</td>
      <td class="num">${d.jarak}</td><td class="num">${rupiah(biaya)}</td>`;
    kBody.appendChild(tr);
  });
}

// ============================================================
// HILIR
// ============================================================
function renderHilir() {
  const regions = computeAllRegions().sort((a, b) => Math.abs(b.id) - Math.abs(a.id));
  const tbody = document.querySelector("#tableHargaPasar tbody");
  tbody.innerHTML = "";
  regions.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.wilayah}</td><td>${formatTanggal(r.tanggal)}</td>
      <td class="num">${rupiah(r.pRiil)}</td><td class="num">${rupiah(r.pIdeal)}</td>
      <td class="num">${r.id > 0 ? "+" : ""}${r.id.toFixed(1)}%</td>
      <td><span class="badge ${r.kluster}">${klusterLabel(r.kluster)}</span></td>`;
    tbody.appendChild(tr);
  });
}

// ============================================================
// PEMODELAN
// ============================================================
function renderModel() {
  const select = document.getElementById("simRegionSelect");
  select.innerHTML = "";
  STATE.hargaPasar.forEach(hp => {
    const opt = document.createElement("option");
    opt.value = hp.wilayah;
    opt.textContent = hp.wilayah;
    select.appendChild(opt);
  });
  select.onchange = () => renderSimResult(select.value);
  renderSimResult(select.value);
}

function renderSimResult(namaWilayah) {
  const hp = STATE.hargaPasar.find(h => h.wilayah === namaWilayah);
  const { pIdeal, pPetani, bDistribusi, margin, distribusi } = hitungPIdeal(namaWilayah);
  const id = hitungID(hp.pRiil, pIdeal);
  const kluster = getKluster(id < 0 ? 0 : id);

  const container = document.getElementById("simResult");
  container.innerHTML = `
    <div class="grid-2">
      <div>
        <table class="data">
          <tbody>
            <tr><td>P_petani (rata-rata)</td><td class="num">${rupiah(pPetani)}</td></tr>
            <tr><td>B_distribusi ${distribusi ? `(${distribusi.jarak} km)` : "(sentra lokal)"}</td><td class="num">${rupiah(bDistribusi)}</td></tr>
            <tr><td>Margin wajar pedagang (M)</td><td class="num">${rupiah(margin)}</td></tr>
            <tr style="font-weight:600;"><td>P_ideal</td><td class="num">${rupiah(pIdeal)}</td></tr>
            <tr style="font-weight:600;"><td>P_riil tercatat</td><td class="num">${rupiah(hp.pRiil)}</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="stat" style="margin-bottom:14px;">
          <span class="label">Indeks Disparitas</span>
          <span class="value">${id > 0 ? "+" : ""}${id.toFixed(1)}<span class="unit">%</span></span>
        </div>
        <span class="badge ${kluster}" style="font-size:13px; padding:6px 14px;">Kluster ${klusterLabel(kluster)}</span>
        <p class="hint" style="margin-top:14px;">${klusterIntervensi(kluster)}</p>
      </div>
    </div>
  `;
}

// ============================================================
// KLUSTER
// ============================================================
function renderKluster() {
  const regions = computeAllRegions();
  const counts = { hijau: 0, kuning: 0, merah: 0 };
  regions.forEach(r => counts[r.kluster]++);

  const cardsDiv = document.getElementById("clusterCards");
  const defs = [
    { key: "hijau", title: "Kluster Hijau", range: "ID ≤ 10%", desc: "Harga riil mendekati harga ideal; pasar berfungsi wajar.", action: "Pemantauan rutin tanpa intervensi langsung." },
    { key: "kuning", title: "Kluster Kuning", range: "10% < ID ≤ 30%", desc: "Indikasi awal distorsi distribusi atau tekanan biaya logistik.", action: "Fasilitasi Distribusi Pangan (FDP) terjadwal dari wilayah surplus terdekat." },
    { key: "merah", title: "Kluster Merah", range: "ID > 30%", desc: "Anomali harga akut (pola Paradoks Surplus); risiko kegagalan distribusi.", action: "Gerakan Pangan Murah (GPM) & audit jalur distribusi dalam 24–48 jam." },
  ];
  cardsDiv.innerHTML = defs.map(d => `
    <div class="card" style="border-left:4px solid var(--${d.key === 'hijau' ? 'hijau' : d.key === 'kuning' ? 'kuning' : 'merah'});">
      <div class="stat" style="margin-bottom:10px;">
        <span class="label">${d.range}</span>
        <span class="value">${counts[d.key]}<span class="unit"> wilayah</span></span>
      </div>
      <h4>${d.title}</h4>
      <p class="hint">${d.desc}</p>
      <p style="font-size:12.5px; font-weight:600;">${d.action}</p>
    </div>
  `).join("");

  const tbody = document.querySelector("#tableKebijakan tbody");
  tbody.innerHTML = "";
  regions.sort((a, b) => b.id - a.id).forEach(r => {
    const tr = document.createElement("tr");
    const status = r.kluster === "merah" ? "Menunggu eksekusi" : r.kluster === "kuning" ? "Terjadwal" : "Tidak ada tindakan";
    tr.innerHTML = `<td>${r.wilayah}</td><td><span class="badge ${r.kluster}">${klusterLabel(r.kluster)}</span></td>
      <td class="num">${r.id > 0 ? "+" : ""}${r.id.toFixed(1)}%</td><td>${klusterIntervensi(r.kluster)}</td><td>${status}</td>`;
    tbody.appendChild(tr);
  });
}

// ============================================================
// MODAL: simulasi cepat dari Ringkasan
// ============================================================
function openSimulasiModal(namaWilayah) {
  switchView("model");
  setTimeout(() => {
    document.getElementById("simRegionSelect").value = namaWilayah;
    renderSimResult(namaWilayah);
  }, 50);
}

// ============================================================
// FORM MODALS: tambah data baru
// ============================================================
function openModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modalBg").classList.add("show");
}
function closeModal() {
  document.getElementById("modalBg").classList.remove("show");
}
document.getElementById("modalBg").addEventListener("click", (e) => {
  if (e.target.id === "modalBg") closeModal();
});

function setupAddPanenButton() {
  document.getElementById("btnAddPanen").onclick = () => {
    openModal(`
      <h3>Catat Panen Baru</h3>
      <p class="hint">Input ini akan menambah Volume Panen 7 Hari pada grafik Hulu.</p>
      <div class="form-grid">
        <div class="field"><label>Nama Petani/Kelompok</label><input id="fPetani" type="text" placeholder="Kelompok Tani Maju Bersama"></div>
        <div class="field"><label>Wilayah Sentra</label>
          <select id="fWilayahPanen">
            <option>Banyuwangi</option><option>Jember</option><option>Probolinggo</option>
          </select>
        </div>
        <div class="field"><label>Volume Panen (kg)</label><input id="fVolume" type="number" placeholder="12000"></div>
        <div class="field"><label>Harga Tingkat Petani (Rp/kg)</label><input id="fPPetani" type="number" placeholder="28000"></div>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" onclick="closeModal()">Batal</button>
        <button class="btn" id="submitPanen">Simpan Catatan</button>
      </div>
    `);
    document.getElementById("submitPanen").onclick = () => {
      const petani = document.getElementById("fPetani").value || "Kelompok Tani Baru";
      const wilayah = document.getElementById("fWilayahPanen").value;
      const volume = parseFloat(document.getElementById("fVolume").value) || 0;
      const pPetani = parseFloat(document.getElementById("fPPetani").value) || STATE.pPetaniRataRata;
      if (volume <= 0) { showToast("Volume panen harus lebih dari nol."); return; }

      const today = new Date().toISOString().slice(0, 10);
      STATE.panen.push({ tanggal: today, petani, wilayah, volume, pPetani });
      STATE.panenSeries7Hari.push({ hari: "Baru", volumeTon: volume / 1000 });
      if (STATE.panenSeries7Hari.length > 7) STATE.panenSeries7Hari.shift();

      closeModal();
      showToast(`Panen baru tercatat: ${volume.toLocaleString("id-ID")} kg dari ${wilayah}.`);
      renderHulu();
      buildPipeline();
    };
  };
}

function setupAddKirimButton() {
  document.getElementById("btnAddKirim").onclick = () => {
    openModal(`
      <h3>Catat Pengiriman Baru</h3>
      <p class="hint">Biaya distribusi otomatis dihitung dari jarak × harga BBM Biosolar berlaku.</p>
      <div class="form-grid">
        <div class="field"><label>Wilayah Asal</label>
          <select id="fAsal"><option>Banyuwangi</option><option>Jember</option><option>Probolinggo</option></select>
        </div>
        <div class="field"><label>Wilayah Tujuan</label><input id="fTujuan" type="text" placeholder="Yogyakarta"></div>
        <div class="field"><label>Volume Kirim (kg)</label><input id="fVolKirim" type="number" placeholder="3000"></div>
        <div class="field"><label>Jarak Tempuh (km)</label><input id="fJarak" type="number" placeholder="450"></div>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" onclick="closeModal()">Batal</button>
        <button class="btn" id="submitKirim">Simpan Manifes</button>
      </div>
    `);
    document.getElementById("submitKirim").onclick = () => {
      const asal = document.getElementById("fAsal").value;
      const tujuan = document.getElementById("fTujuan").value || "Wilayah Baru";
      const volume = parseFloat(document.getElementById("fVolKirim").value) || 0;
      const jarak = parseFloat(document.getElementById("fJarak").value) || 0;
      if (volume <= 0 || jarak <= 0) { showToast("Volume dan jarak harus lebih dari nol."); return; }

      STATE.distribusi.push({ asal, tujuan, volume, jarak, bbmId: 0 });
      closeModal();
      showToast(`Manifes baru: ${asal} → ${tujuan} (${jarak} km).`);
      renderTengah();
      buildPipeline();
    };
  };
}

function setupAddHargaButton() {
  document.getElementById("btnAddHarga").onclick = () => {
    openModal(`
      <h3>Lapor Harga Pasar</h3>
      <p class="hint">Harga ini langsung dipakai untuk menghitung ulang Indeks Disparitas wilayah tersebut.</p>
      <div class="form-grid">
        <div class="field" style="grid-column: 1 / -1;"><label>Wilayah</label><input id="fWilayahHarga" type="text" placeholder="Yogyakarta"></div>
        <div class="field" style="grid-column: 1 / -1;"><label>Harga Eceran Riil (Rp/kg)</label><input id="fPRiil" type="number" placeholder="48000"></div>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" onclick="closeModal()">Batal</button>
        <button class="btn" id="submitHarga">Simpan Harga</button>
      </div>
    `);
    document.getElementById("submitHarga").onclick = () => {
      const wilayah = document.getElementById("fWilayahHarga").value;
      const pRiil = parseFloat(document.getElementById("fPRiil").value) || 0;
      if (!wilayah || pRiil <= 0) { showToast("Lengkapi nama wilayah dan harga."); return; }

      const today = new Date().toISOString().slice(0, 10);
      const existing = STATE.hargaPasar.find(h => h.wilayah === wilayah);
      if (existing) { existing.pRiil = pRiil; existing.tanggal = today; }
      else STATE.hargaPasar.push({ wilayah, tanggal: today, pRiil });

      if (!STATE.wilayah.find(w => w.nama === wilayah)) {
        STATE.wilayah.push({ id: "W" + (STATE.wilayah.length + 1), nama: wilayah, tipe: "non-sentra", jarakDariSentra: 500 });
      }

      closeModal();
      showToast(`Harga ${wilayah} tercatat: ${rupiah(pRiil)}/kg. Indeks Disparitas diperbarui.`);
      renderHilir();
      renderKluster();
      renderModel();
      buildPipeline();
    };
  };
}

// ============================================================
// INIT
// ============================================================
function init() {
  buildNav();
  buildPipeline();
  renderRingkasan();
  setupAddPanenButton();
  setupAddKirimButton();
  setupAddHargaButton();
}

document.addEventListener("DOMContentLoaded", init);
