// =========================================================================
// TITIK GOWES — ADMIN FLEET, OPS, BANNER & HANDOVER CONTROLLER (js/gowes-admin.js)
// Versi: V14.4 (4 Tab Pengaturan Lengkap, Cropper 4:3, Multi-Sepeda & Toko Tutup)
// =========================================================================

let mgbTempPhotoUrl = "";
let mghTempPhotoUrl = "";
let gwBannerTempImg = "";
let _gowesFleetAdminTab = "bikes"; // 'bikes' | 'ops' | 'banners' | 'categories'

function switchGowesFleetAdminTab(tab) {
    _gowesFleetAdminTab = tab || "bikes";
    if (typeof renderMasterWorkspaceContent === "function") {
        renderMasterWorkspaceContent();
    }
}

// ================= 0. PUSAT PENGATURAN LENGKAP TITIK GOWES (4 TAB) =================
function renderGowesFleetWorkspaceHtml() {
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isMaster = !!(curU && curU.role === "master");
    const shelter = db.gowesShelter || DEFAULT_GOWES_SHELTER;
    const isClosed = !!(shelter && shelter.isClosed);
    const bikes = (Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES).filter(b => b && b.status !== "Dihapus");
    const banners = Array.isArray(db.gowesBanners) && db.gowesBanners.length ? db.gowesBanners : DEFAULT_GOWES_BANNERS;
    const cats = Array.isArray(db.gowesCategories) && db.gowesCategories.length ? db.gowesCategories : DEFAULT_GOWES_CATEGORIES;

    const tabsHtml = `
        <div class="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 border-b gold-border">
            <button type="button" onclick="switchGowesFleetAdminTab('bikes')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${_gowesFleetAdminTab === 'bikes' ? 'gowes-pill-btn shadow' : 'app-btn-sec'}">
                <i class="fa-solid fa-bicycle mr-1"></i>Armada (${bikes.length})
            </button>
            <button type="button" onclick="switchGowesFleetAdminTab('ops')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${_gowesFleetAdminTab === 'ops' ? 'gowes-pill-btn shadow' : 'app-btn-sec'}">
                <i class="fa-solid ${isClosed ? 'fa-store-slash text-red-400' : 'fa-store'} mr-1"></i>Status Garasi
            </button>
            ${isMaster ? `
                <button type="button" onclick="switchGowesFleetAdminTab('banners')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${_gowesFleetAdminTab === 'banners' ? 'gowes-pill-btn shadow' : 'app-btn-sec'}">
                    <i class="fa-solid fa-rectangle-ad mr-1"></i>Banner 16:5 (${banners.length})
                </button>
                <button type="button" onclick="switchGowesFleetAdminTab('categories')" class="px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${_gowesFleetAdminTab === 'categories' ? 'gowes-pill-btn shadow' : 'app-btn-sec'}">
                    <i class="fa-solid fa-tags mr-1"></i>Kategori (${cats.length})
                </button>
            ` : ""}
        </div>
    `;

    let paneHtml = "";
    if (_gowesFleetAdminTab === "ops") {
        paneHtml = `
            <div class="app-card border rounded-3xl p-5 space-y-4 shadow-sm">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <span class="w-12 h-12 rounded-2xl ${isClosed ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'} flex items-center justify-center text-xl">
                            <i class="fa-solid ${isClosed ? 'fa-store-slash' : 'fa-store'}"></i>
                        </span>
                        <div>
                            <strong class="text-sm block">Garasi Saat Ini: ${isClosed ? '<span class="text-red-500">TUTUP SEMENTARA</span>' : '<span class="text-emerald-600">BUKA &amp; MELAYANI</span>'}</strong>
                            <span class="text-[11px] app-muted block">${escHtml(shelter.name || "Titik Gowes Shelter Utama")}</span>
                        </div>
                    </div>
                    <button type="button" onclick="openGowesShelterOpsModal()" class="gowes-pill-btn px-4 py-2.5 rounded-xl text-xs shadow">
                        <i class="fa-solid fa-sliders mr-1.5"></i>Ubah Status / Jam Operasional
                    </button>
                </div>
                <div class="grid sm:grid-cols-2 gap-2.5 text-xs pt-2 border-t gold-border">
                    <div class="app-card-soft border rounded-2xl p-3">
                        <span class="text-[10px] app-muted font-bold uppercase block">Jam Operasional</span>
                        <strong class="block mt-0.5">${escHtml(shelter.operationalHours || "05.30 - 20.00 WITA")}</strong>
                    </div>
                    <div class="app-card-soft border rounded-2xl p-3">
                        <span class="text-[10px] app-muted font-bold uppercase block">WhatsApp CS Shelter</span>
                        <strong class="block mt-0.5">${escHtml(shelter.csPhone || "085117488828")}</strong>
                    </div>
                    <div class="app-card-soft border rounded-2xl p-3 sm:col-span-2">
                        <span class="text-[10px] app-muted font-bold uppercase block">Pesan Pemberitahuan Saat Tutup</span>
                        <p class="mt-0.5 leading-relaxed">${escHtml(shelter.closedReason || "-")}</p>
                    </div>
                </div>
            </div>
        `;
    } else if (_gowesFleetAdminTab === "banners" && isMaster) {
        paneHtml = `
            <div class="grid md:grid-cols-2 gap-5">
                <form onsubmit="saveGowesBannerForm(event)" class="app-card border rounded-3xl p-4 space-y-2.5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <h4 class="font-extrabold text-sm text-emerald-600">Tambah / Edit Banner 16:5</h4>
                        <button type="button" onclick="resetGowesBannerForm()" class="text-[11px] app-muted hover:underline">Reset</button>
                    </div>
                    <input type="hidden" id="gwb-id">
                    <div class="w-full rounded-xl overflow-hidden border gold-border bg-black" style="aspect-ratio:16/5;">
                        <img id="gwb-preview-img" src="${(banners[0] && banners[0].img) || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=75'}" class="w-full h-full object-cover">
                    </div>
                    <label class="block gowes-pill-btn py-2 rounded-xl text-center cursor-pointer text-xs">
                        <i class="fa-solid fa-crop-simple mr-1"></i>Pilih &amp; Crop Foto Banner (16 : 5)
                        <input type="file" accept="image/*" class="hide" onchange="pickCroppedGowesBanner(this)">
                    </label>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="text" id="gwb-badge" placeholder="Label (GRATIS HELM)" class="app-input text-xs">
                        <input type="text" id="gwb-cta" placeholder="Tombol (Booking)" class="app-input text-xs">
                    </div>
                    <input type="text" id="gwb-title" placeholder="Judul Banner Promosi" class="app-input text-xs" required>
                    <input type="text" id="gwb-sub" placeholder="Deskripsi singkat banner..." class="app-input text-xs" required>
                    <select id="gwb-target" class="app-input text-xs">
                        <option value="gowes-showcase-track">Arahkan ke Pilihan Sepeda</option>
                        <option value="sec-gowes-booking-cta">Arahkan ke Tombol Booking</option>
                        <option value="sec-gowes-shelter">Arahkan ke Lokasi Garasi</option>
                    </select>
                    <input type="url" id="gwb-img-url" oninput="if(this.value.startsWith('http'))document.getElementById('gwb-preview-img').src=this.value;" placeholder="Atau tempel URL foto (https://...)" class="app-input text-xs">
                    <button type="submit" id="btn-save-gwb" class="w-full gowes-pill-btn py-2.5 rounded-xl text-xs uppercase">Simpan Banner Gowes</button>
                </form>

                <div class="space-y-2.5">
                    <h4 class="font-bold text-xs text-emerald-600 uppercase">Daftar Banner Aktif (${banners.length})</h4>
                    ${banners.map((b, i) => `
                        <div class="app-card border rounded-2xl p-2.5 flex items-center gap-3 shadow-sm">
                            <img src="${b.img}" class="w-24 h-10 rounded-lg object-cover bg-black shrink-0">
                            <div class="flex-1 min-w-0">
                                <strong class="text-xs block truncate">${escHtml(b.title)}</strong>
                                <span class="text-[10px] app-muted block truncate">${escHtml(b.badge || "Promo")}</span>
                            </div>
                            <button type="button" onclick="editGowesBannerItem(${i})" class="px-2.5 py-1 rounded app-btn-sec text-[10px] font-bold">Edit</button>
                            <button type="button" onclick="deleteGowesBannerItem(${i})" class="px-2.5 py-1 rounded bg-red-600/15 text-[10px] text-red-500"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    } else if (_gowesFleetAdminTab === "categories" && isMaster) {
        paneHtml = `
            <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
                <div>
                    <h4 class="font-extrabold text-sm text-emerald-600">Kategori Filter Beranda Titik Gowes</h4>
                    <p class="text-[11px] app-muted">Aktifkan atau sembunyikan kategori filter sepeda yang tampil di beranda.</p>
                </div>
                <div class="space-y-2">
                    ${cats.map((c, idx) => `
                        <div class="app-card-soft border rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <strong class="text-xs block truncate">${escHtml(c.name)}</strong>
                                <span class="text-[10px] app-muted">Kode: ${escHtml(c.id)}</span>
                            </div>
                            <label class="lbk-switch">
                                <input type="checkbox" ${c.active !== false ? "checked" : ""} ${c.id === "all" ? "disabled" : ""} onchange="toggleGowesCategoryActive(${idx}, this.checked)">
                                <span class="lbk-switch-track"></span>
                            </label>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    } else {
        paneHtml = `
            <div class="space-y-3.5">
                <div class="app-card border rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2.5 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
                    <div class="flex items-center gap-2.5">
                        <span class="w-9 h-9 rounded-xl ${isClosed ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-600'} flex items-center justify-center text-sm">
                            <i class="fa-solid ${isClosed ? 'fa-store-slash' : 'fa-store'}"></i>
                        </span>
                        <div>
                            <strong class="text-xs block">Garasi: ${isClosed ? '<span class="text-red-500">TUTUP SEMENTARA</span>' : '<span class="text-emerald-600">BUKA</span>'}</strong>
                            <span class="text-[10px] app-muted block">${escHtml(shelter.operationalHours || "05.30 - 20.00 WITA")}</span>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button type="button" onclick="openGowesShelterOpsModal()" class="px-3 py-2 rounded-xl app-card-soft border text-xs font-bold">
                            <i class="fa-solid fa-store mr-1 text-emerald-600"></i>Buka / Tutup Toko
                        </button>
                        <button type="button" onclick="openMasterGowesBikeModal()" class="gowes-pill-btn px-4 py-2 rounded-xl text-xs shadow">
                            <i class="fa-solid fa-plus mr-1"></i>Tambah Unit Sepeda
                        </button>
                    </div>
                </div>
                <div class="space-y-2.5">
                    ${renderGowesBikesAdminList()}
                </div>
            </div>
        `;
    }

    return `<div class="space-y-4">${tabsHtml}${paneHtml}</div>`;
}

// ================= BANNER 16:5 & KATEGORI HANDLERS =================
function pickCroppedGowesBanner(inp) {
    const file = inp.files && inp.files[0];
    if (!file) return;
    inp.value = "";
    if (typeof openImageCropper === "function") {
        openImageCropper(file, 16 / 5, "Crop Banner Titik Gowes (16 : 5)", 1280, 400, (dataUrl) => {
            gwBannerTempImg = dataUrl;
            const prev = document.getElementById("gwb-preview-img");
            const urlInp = document.getElementById("gwb-img-url");
            if (prev) prev.src = dataUrl;
            if (urlInp) urlInp.value = dataUrl;
            showToast("Foto banner siap disimpan!");
        });
    }
}

function resetGowesBannerForm() {
    gwBannerTempImg = "";
    ["gwb-id", "gwb-badge", "gwb-cta", "gwb-title", "gwb-sub", "gwb-img-url"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

function editGowesBannerItem(i) {
    const list = Array.isArray(db.gowesBanners) && db.gowesBanners.length ? db.gowesBanners : DEFAULT_GOWES_BANNERS;
    const b = list[i];
    if (!b) return;
    gwBannerTempImg = "";
    document.getElementById("gwb-id").value = b.id || "";
    document.getElementById("gwb-badge").value = b.badge || "";
    document.getElementById("gwb-cta").value = b.ctaText || "";
    document.getElementById("gwb-title").value = b.title || "";
    document.getElementById("gwb-sub").value = b.subtitle || "";
    document.getElementById("gwb-target").value = b.targetSection || "gowes-showcase-track";
    document.getElementById("gwb-img-url").value = b.img || "";
    document.getElementById("gwb-preview-img").src = b.img || "";
    showToast(`Mengedit banner "${b.title}"`, "info");
}

async function saveGowesBannerForm(e) {
    e.preventDefault();
    setBtnLoading("btn-save-gwb", true, "Menyimpan...");
    const idVal = document.getElementById("gwb-id").value.trim();
    const img = gwBannerTempImg || document.getElementById("gwb-img-url").value.trim() || document.getElementById("gwb-preview-img").src;
    const item = {
        id: idVal || ("gb_" + Date.now()),
        badge: document.getElementById("gwb-badge").value.trim() || "PROMO GOWES",
        ctaText: document.getElementById("gwb-cta").value.trim() || "Lihat Armada",
        title: document.getElementById("gwb-title").value.trim(),
        subtitle: document.getElementById("gwb-sub").value.trim(),
        targetSection: document.getElementById("gwb-target").value || "gowes-showcase-track",
        img
    };

    const list = [...(Array.isArray(db.gowesBanners) && db.gowesBanners.length ? db.gowesBanners : DEFAULT_GOWES_BANNERS)];
    const idx = list.findIndex(x => String(x.id) === String(item.id));
    if (idx >= 0) list[idx] = item; else list.push(item);

    const res = await apiAction({ action: "gowes_update_banners", banners: list });
    setBtnLoading("btn-save-gwb", false);
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal menyimpan banner.", "error");

    db.gowesBanners = res.banners || list;
    gwBannerTempImg = "";
    if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();
    if (typeof renderGowesBannerSlider === "function") renderGowesBannerSlider();
    showToast("Banner Titik Gowes tersimpan!");
}

async function deleteGowesBannerItem(i) {
    const list = [...(Array.isArray(db.gowesBanners) && db.gowesBanners.length ? db.gowesBanners : DEFAULT_GOWES_BANNERS)];
    if (list.length <= 1) return showToast("Minimal harus menyisakan 1 banner.", "info");
    list.splice(i, 1);
    showLoading("Menghapus banner...");
    const res = await apiAction({ action: "gowes_update_banners", banners: list });
    hideLoading();
    if (res && res.ok) {
        db.gowesBanners = res.banners || list;
        if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();
        if (typeof renderGowesBannerSlider === "function") renderGowesBannerSlider();
        showToast("Banner dihapus.", "info");
    }
}

async function toggleGowesCategoryActive(idx, checked) {
    const list = [...(Array.isArray(db.gowesCategories) && db.gowesCategories.length ? db.gowesCategories : DEFAULT_GOWES_CATEGORIES)].map(c => Object.assign({}, c));
    if (!list[idx] || list[idx].id === "all") return;
    list[idx].active = !!checked;
    const res = await apiAction({ action: "gowes_update_categories", categories: list });
    if (res && res.ok) {
        db.gowesCategories = res.categories || list;
        if (typeof renderGowesCategoryFilters === "function") renderGowesCategoryFilters();
        showToast(`Kategori "${list[idx].name}" ${checked ? "diaktifkan" : "disembunyikan"}.`, "info");
    } else {
        showToast("Gagal memperbarui kategori.", "error");
    }
}

// ================= 1. OPERASIONAL SHELTER & SAKELAR TOKO TUTUP =================
function openGowesShelterOpsModal() {
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curU || (curU.role !== "master" && curU.role !== "administrasi")) {
        return showToast("Hanya Founder dan Tim Administrasi yang dapat mengatur operasional garasi.", "error");
    }

    const shelter = db.gowesShelter || DEFAULT_GOWES_SHELTER;
    const isClosed = !!(shelter && shelter.isClosed);

    const toggleEl = document.getElementById("gso-is-closed-toggle");
    const reasonInp = document.getElementById("gso-closed-reason");
    const hoursInp = document.getElementById("gso-hours");
    const phoneInp = document.getElementById("gso-cs-phone");

    if (toggleEl) toggleEl.checked = isClosed;
    if (reasonInp) reasonInp.value = shelter.closedReason || "Garasi Titik Gowes sedang istirahat / tutup sementara. Buka kembali pada jadwal berikutnya.";
    if (hoursInp) hoursInp.value = shelter.operationalHours || "05.30 - 20.00 WITA";
    if (phoneInp) phoneInp.value = shelter.csPhone || "085117488828";

    toggleShelterClosedReasonField(isClosed);

    const modal = document.getElementById("modal-gowes-shelter-ops");
    if (modal) modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-shelter-ops" });
}

function toggleShelterClosedReasonField(isClosed) {
    const indicator = document.getElementById("gso-status-indicator");
    const reasonWrap = document.getElementById("gso-reason-wrap");

    if (indicator) {
        if (isClosed) {
            indicator.className = "text-[11px] font-bold text-red-500 pt-1";
            indicator.innerText = "● Status: Garasi TUTUP SEMENTARA (Beranda dialihkan ke layar tutup)";
        } else {
            indicator.className = "text-[11px] font-bold text-emerald-600 pt-1";
            indicator.innerText = "● Status: Garasi BUKA & Melayani Rental Sepeda";
        }
    }
    if (reasonWrap) reasonWrap.classList.toggle("opacity-50", !isClosed);
}

async function submitGowesShelterOps(e) {
    e.preventDefault();

    const isClosed = !!document.getElementById("gso-is-closed-toggle")?.checked;
    const closedReason = document.getElementById("gso-closed-reason")?.value.trim() || "";
    const operationalHours = document.getElementById("gso-hours")?.value.trim() || "05.30 - 20.00 WITA";
    const csPhone = document.getElementById("gso-cs-phone")?.value.trim() || "085117488828";

    const prevShelter = db.gowesShelter || DEFAULT_GOWES_SHELTER;
    const updatedShelter = Object.assign({}, prevShelter, { isClosed, closedReason, operationalHours, csPhone });

    setBtnLoading("btn-save-gso", true, "Menyimpan Status...");
    const res = await apiAction({ action: "gowes_update_shelter_ops", shelter: updatedShelter });
    setBtnLoading("btn-save-gso", false);

    if (!res || !res.ok) {
        return showToast((res && res.message) || "Gagal memperbarui status operasional garasi.", "error");
    }

    db.gowesShelter = res.shelter || updatedShelter;
    document.getElementById("modal-gowes-shelter-ops")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-shelter-ops");

    if (typeof renderGowesLandingPage === "function" && currentAppMode === "titik_gowes") renderGowesLandingPage();
    if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();

    showToast(isClosed ? "Garasi Titik Gowes ditandai TUTUP sementara." : "Garasi Titik Gowes dibuka kembali & siap melayani!", "info");
}

// ================= 2. KELOLA ARMADA SEPEDA (CRUD FOUNDER & ADMIN) =================
function openMasterGowesBikeModal(bikeId = null) {
    const isEdit = !!bikeId;
    const bikes = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const b = isEdit ? bikes.find(x => String(x.id) === String(bikeId)) : null;

    mgbTempPhotoUrl = (b && b.image) || "";

    const titleEl = document.getElementById("mgb-title");
    if (titleEl) titleEl.innerText = isEdit ? `Edit Unit: ${b.name}` : "Tambah Unit Sepeda Baru";

    document.getElementById("mgb-id").value = isEdit ? b.id : "";
    document.getElementById("mgb-name").value = isEdit ? b.name : "";
    document.getElementById("mgb-type").value = isEdit ? b.type : "MTB (Gunung)";
    document.getElementById("mgb-frame").value = isEdit ? (b.frameSize || "") : "M (165-175 cm)";
    document.getElementById("mgb-gears").value = isEdit ? (b.gears || "") : "1x11 Speed Shimano";
    document.getElementById("mgb-p2h").value = isEdit ? (b.price2Hours || 40000) : 40000;
    document.getElementById("mgb-p6h").value = isEdit ? (b.price6Hours || 75000) : 75000;
    document.getElementById("mgb-pfullday").value = isEdit ? (b.priceFullDay || 120000) : 120000;
    document.getElementById("mgb-status").value = isEdit ? (b.status || "Tersedia") : "Tersedia";
    document.getElementById("mgb-accessories").value = isEdit ? (Array.isArray(b.freeAccessories) ? b.freeAccessories.join(", ") : (b.freeAccessories || "")) : "Helm Sepeda, Kunci Gembok Spiral, Lampu Malam";
    document.getElementById("mgb-desc").value = isEdit ? (b.description || "") : "";

    const fallbackImg = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";
    const prevImg = document.getElementById("mgb-preview-img");
    const urlInp = document.getElementById("mgb-img-url");
    if (prevImg) prevImg.src = mgbTempPhotoUrl || fallbackImg;
    if (urlInp) urlInp.value = mgbTempPhotoUrl || "";

    const modal = document.getElementById("modal-gowes-bike");
    if (modal) modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-bike" });
}

function pickGowesBikePhoto(inp) {
    const file = inp.files && inp.files[0];
    if (!file) return;
    inp.value = "";

    if (typeof openImageCropper === "function") {
        // Disinkronkan ke rasio 4:3 agar presisi sempurna di etalase Pilihan Sepeda
        openImageCropper(file, 4 / 3, "Atur Foto Unit Sepeda (4:3)", 960, 720, (dataUrl) => {
            mgbTempPhotoUrl = dataUrl;
            const prev = document.getElementById("mgb-preview-img");
            const urlInp = document.getElementById("mgb-img-url");
            if (prev) prev.src = dataUrl;
            if (urlInp) urlInp.value = dataUrl;
            if (typeof showToast === "function") showToast("Foto unit sepeda (4:3) siap disimpan.");
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            mgbTempPhotoUrl = e.target.result;
            const prev = document.getElementById("mgb-preview-img");
            const urlInp = document.getElementById("mgb-img-url");
            if (prev) prev.src = mgbTempPhotoUrl;
            if (urlInp) urlInp.value = mgbTempPhotoUrl;
        };
        reader.readAsDataURL(file);
    }
}

async function submitMasterGowesBikeModal(e) {
    e.preventDefault();

    const bikeId = document.getElementById("mgb-id").value.trim();
    const name = document.getElementById("mgb-name").value.trim();
    const type = document.getElementById("mgb-type").value;
    const frameSize = document.getElementById("mgb-frame").value.trim();
    const gears = document.getElementById("mgb-gears").value.trim();
    const price2Hours = Number(document.getElementById("mgb-p2h").value || 40000);
    const price6Hours = Number(document.getElementById("mgb-p6h").value || 75000);
    const priceFullDay = Number(document.getElementById("mgb-pfullday").value || 120000);
    const status = document.getElementById("mgb-status").value;
    const rawAcc = document.getElementById("mgb-accessories").value.trim();
    const description = document.getElementById("mgb-desc").value.trim();
    const urlFromInp = document.getElementById("mgb-img-url")?.value.trim() || "";

    const finalImage = mgbTempPhotoUrl || urlFromInp || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";
    const freeAccessories = rawAcc ? rawAcc.split(",").map(x => x.trim()).filter(Boolean) : ["Helm Sepeda", "Kunci Gembok Spiral", "Lampu Malam"];

    const bikePayload = {
        id: bikeId || ("bike_" + Date.now()),
        name, type, frameSize, gears, price2Hours, price6Hours, priceFullDay, status, freeAccessories, description, image: finalImage
    };

    setBtnLoading("btn-save-mgb", true, "Menyimpan Unit...");
    const res = await apiAction({ action: "gowes_upsert_bike", bike: bikePayload });
    setBtnLoading("btn-save-mgb", false);

    if (!res || !res.ok) {
        return showToast((res && res.message) || "Gagal menyimpan unit sepeda.", "error");
    }

    const savedBike = res.bike || bikePayload;
    if (!Array.isArray(db.gowesBikes)) db.gowesBikes = [];
    const idx = db.gowesBikes.findIndex(x => String(x.id) === String(savedBike.id));
    if (idx >= 0) db.gowesBikes[idx] = Object.assign({}, db.gowesBikes[idx], savedBike);
    else db.gowesBikes.unshift(savedBike);

    document.getElementById("modal-gowes-bike")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-bike");

    if (typeof renderGowesShowcaseTrack === "function") renderGowesShowcaseTrack();
    if (typeof renderMasterWorkspaceContent === "function" && currentMasterWorkspace === "gowes_fleet") {
        renderMasterWorkspaceContent();
    }
    showToast(`Unit ${name} berhasil disimpan!`);
}

async function deleteGowesBike(bikeId) {
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curU || curU.role !== "master") {
        return showToast("Hanya Founder yang memiliki izin menghapus unit sepeda.", "error");
    }

    const bikes = Array.isArray(db.gowesBikes) ? db.gowesBikes : [];
    const bike = bikes.find(b => String(b.id) === String(bikeId));
    const bikeName = bike ? bike.name : "unit ini";

    const ok = await showConfirm("Hapus Unit Armada", `Apakah Anda yakin ingin menghapus "${bikeName}" dari armada Titik Gowes?`, "fa-solid fa-trash", "Ya, Hapus Unit");
    if (!ok) return;

    showLoading("Menghapus unit armada...");
    const res = await apiAction({ action: "gowes_delete_bike", bikeId: String(bikeId) });
    hideLoading();

    if (!res || !res.ok) {
        return showToast((res && res.message) || "Gagal menghapus unit sepeda.", "error");
    }

    db.gowesBikes = (db.gowesBikes || []).filter(b => String(b.id) !== String(bikeId));
    if (typeof renderGowesShowcaseTrack === "function") renderGowesShowcaseTrack();
    if (typeof renderMasterWorkspaceContent === "function" && currentMasterWorkspace === "gowes_fleet") {
        renderMasterWorkspaceContent();
    }
    showToast(`Unit ${bikeName} berhasil dihapus.`);
}

async function toggleGowesBikeStatusQuick(bikeId, nextStatus) {
    const bikes = Array.isArray(db.gowesBikes) ? db.gowesBikes : [];
    const bike = bikes.find(b => String(b.id) === String(bikeId));
    if (!bike) return;

    const updated = Object.assign({}, bike, { status: nextStatus });
    showLoading(`Mengubah status ke ${nextStatus}...`);
    const res = await apiAction({ action: "gowes_upsert_bike", bike: updated });
    hideLoading();

    if (res && res.ok) {
        const idx = bikes.findIndex(b => String(b.id) === String(bikeId));
        if (idx >= 0) bikes[idx].status = nextStatus;
        if (typeof renderGowesShowcaseTrack === "function") renderGowesShowcaseTrack();
        if (typeof renderMasterWorkspaceContent === "function" && currentMasterWorkspace === "gowes_fleet") {
            renderMasterWorkspaceContent();
        }
        showToast(`Status ${bike.name} diubah ke ${nextStatus}.`);
    } else {
        showToast("Gagal memperbarui status unit.", "error");
    }
}

function renderGowesBikesAdminList() {
    const bikes = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const activeBikes = bikes.filter(b => b && b.status !== "Dihapus");

    if (!activeBikes.length) {
        return `
            <div class="app-card border border-dashed rounded-3xl p-8 text-center space-y-2">
                <i class="fa-solid fa-bicycle text-3xl app-muted"></i>
                <h4 class="font-extrabold text-sm">Belum Ada Unit Armada</h4>
                <p class="text-xs app-muted">Klik tombol "Tambah Unit Sepeda" untuk mulai menginput armada garasi Anda.</p>
            </div>
        `;
    }

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isMaster = curU && curU.role === "master";

    return activeBikes.map(b => {
        const isAvail = b.status === "Tersedia";
        const isInUse = b.status === "Sedang Disewa";
        const statusCls = isAvail ? "bg-emerald-500/15 text-emerald-600" : isInUse ? "bg-amber-500/15 text-amber-600" : "bg-zinc-500/15 text-zinc-400";

        return `
            <div class="app-card border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div class="flex items-center gap-3 min-w-0">
                    <img src="${b.image || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-16 h-12 rounded-xl object-cover bg-black border gold-border shrink-0">
                    <div class="min-w-0 space-y-0.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="gowes-brand-tag !text-[8.5px]">${escHtml(b.type || "MTB")}</span>
                            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${statusCls}">● ${escHtml(b.status)}</span>
                        </div>
                        <h4 class="font-extrabold text-xs sm:text-sm truncate pt-0.5">${escHtml(b.name)}</h4>
                        <p class="text-[10px] app-muted truncate">2 Jam: ${fmtRp(b.price2Hours)} • 6 Jam: ${fmtRp(b.price6Hours)} • Full: ${fmtRp(b.priceFullDay)}</p>
                    </div>
                </div>

                <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    ${b.status !== "Servis" ? `
                        <button type="button" onclick="toggleGowesBikeStatusQuick('${esc(b.id)}','Servis')" class="px-2.5 py-1.5 rounded-xl app-card-soft border text-[11px] font-bold text-zinc-500 hover:text-amber-500" title="Tandai Sedang Servis">
                            <i class="fa-solid fa-wrench mr-1"></i>Servis
                        </button>
                    ` : `
                        <button type="button" onclick="toggleGowesBikeStatusQuick('${esc(b.id)}','Tersedia')" class="px-2.5 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-600 border border-emerald-500/30 text-[11px] font-bold" title="Tandai Siap Sewa">
                            <i class="fa-solid fa-check mr-1"></i>Siap
                        </button>
                    `}
                    <button type="button" onclick="openMasterGowesBikeModal('${esc(b.id)}')" class="px-3 py-1.5 rounded-xl app-card-soft border app-accent text-[11px] font-bold">
                        <i class="fa-solid fa-pen mr-1"></i>Edit
                    </button>
                    ${isMaster ? `
                        <button type="button" onclick="deleteGowesBike('${esc(b.id)}')" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-[11px] font-bold" title="Hapus Unit">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join("");
}

// ================= 3. REKAM SERAH TERIMA FISIK SEPEDA (CHECK-IN / OUT) =================
function openGowesHandoverModal(rentalId, stage = "out") {
    const list = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const r = list.find(x => String(x.id) === String(rentalId));
    if (!r) return showToast("Data booking sewa tidak ditemukan.", "error");

    mghTempPhotoUrl = stage === "out" ? (r.handoverOutPhoto || "") : (r.handoverInPhoto || "");

    const titleEl = document.getElementById("mgh-title");
    const subEl = document.getElementById("mgh-subtitle");
    const idInp = document.getElementById("mgh-rental-id");
    const stageInp = document.getElementById("mgh-stage");
    const prevImg = document.getElementById("mgh-preview-img");

    if (idInp) idInp.value = r.id;
    if (stageInp) stageInp.value = stage;
    if (titleEl) titleEl.innerText = stage === "out" ? `Foto Serah Terima: ${r.bikeName}` : `Foto Pengembalian: ${r.bikeName}`;
    if (subEl) {
        subEl.innerText = stage === "out"
            ? `Ambil foto kondisi sepeda saat diserahkan ke @${r.customerUsername} (Mulai Gowes).`
            : `Ambil foto kondisi sepeda saat dikembalikan oleh @${r.customerUsername} (Selesai).`;
    }
    if (prevImg) prevImg.src = mghTempPhotoUrl || r.bikeImage || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";

    const modal = document.getElementById("modal-gowes-handover");
    if (modal) modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-handover" });
}

function handleGowesHandoverPick(inp) {
    const file = inp.files && inp.files[0];
    if (!file) return;
    inp.value = "";

    if (typeof openImageCropper === "function") {
        openImageCropper(file, 4 / 3, "Atur Foto Serah Terima Fisik Sepeda", 800, 600, (dataUrl) => {
            mghTempPhotoUrl = dataUrl;
            const prev = document.getElementById("mgh-preview-img");
            if (prev) prev.src = dataUrl;
            if (typeof showToast === "function") showToast("Foto fisik sepeda siap disimpan.");
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            mghTempPhotoUrl = e.target.result;
            const prev = document.getElementById("mgh-preview-img");
            if (prev) prev.src = mghTempPhotoUrl;
        };
        reader.readAsDataURL(file);
    }
}

async function submitGowesHandoverPhoto() {
    const rentalId = document.getElementById("mgh-rental-id")?.value;
    const stage = document.getElementById("mgh-stage")?.value || "out";

    if (!rentalId) return showToast("Data sewa tidak valid.", "error");
    if (!mghTempPhotoUrl) return showToast("Ambil atau pilih foto fisik sepeda terlebih dahulu.", "error");

    setBtnLoading("btn-save-mgh", true, "Menyimpan Foto...");
    const res = await apiAction({ action: "gowes_record_handover", rentalId, stage, photo: mghTempPhotoUrl });
    setBtnLoading("btn-save-mgh", false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal menyimpan foto serah terima.", "error");
    }

    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const idx = db.gowesRentals.findIndex(x => String(x.id) === String(rentalId));
    if (idx >= 0) db.gowesRentals[idx] = res.rental;

    document.getElementById("modal-gowes-handover")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-handover");

    if (typeof renderSoloStatsModal === "function" && window._soloStatsViewState && window._soloStatsViewState.open) {
        renderSoloStatsModal();
    }
    showToast(`Foto serah terima ${stage === "out" ? "keluar" : "kembali"} tersimpan!`);
}

// ================= 4. KARTU ORDER SEWA SEPEDA DI MENU PROJECT ADMIN =================
function buildGowesOrderCardHtml(rental, options = {}) {
    const closeModalBeforeAction = !!options.closeModalBeforeAction;
    const preCloseJs = closeModalBeforeAction ? "closeSoloStatsModal();closeUserProfileModalCustom();" : "";

    const isPay = rental.status === "Menunggu Pembayaran";
    const isVerif = rental.status === "Menunggu Verifikasi";
    const isConfirmed = rental.status === "Terkonfirmasi";
    const isInUse = rental.status === "Sedang Digunakan";
    const isDone = rental.status === "Selesai";
    const isCanceled = rental.status === "Dibatalkan";

    const statusBadge = isDone
        ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold uppercase">● Selesai</span>`
        : isInUse
            ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 font-extrabold uppercase">● Sedang Digunakan</span>`
            : isConfirmed
                ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 font-extrabold uppercase">● Terkonfirmasi (Siap Ambil)</span>`
                : isVerif
                    ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-extrabold uppercase">● Verifikasi Pembayaran</span>`
                    : isCanceled
                        ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-zinc-500/20 text-zinc-400 font-extrabold uppercase">● Dibatalkan</span>`
                        : `<span class="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-extrabold uppercase">● Menunggu Bayar</span>`;

    const qtyText = rental.quantity ? `${rental.quantity} Unit` : "1 Unit";
    const priceInfo = `${fmtRp(rental.totalPrice)} (Kode unik: ${rental.uniqueCode || 0})`;
    const multiSummaryHtml = (Array.isArray(rental.selectedBikes) && rental.selectedBikes.length > 1)
        ? `<p class="text-[10px] app-muted">${rental.selectedBikes.map((sb, i) => `#${i + 1} ${escHtml(sb.bikeName)}`).join(" • ")}</p>`
        : "";

    return `
        <div class="app-card border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-sm border-l-4 border-l-emerald-500">
            <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="gowes-brand-tag !text-[8.5px]"><i class="fa-solid fa-bicycle"></i> RENTAL TITIK GOWES</span>
                    ${statusBadge}
                </div>
                <h4 class="font-bold text-sm truncate">
                    ${escHtml(rental.bikeName)}
                    <span class="text-xs app-accent font-extrabold">(${qtyText})</span>
                    <span class="text-xs app-muted font-normal">(@${escHtml(rental.customerUsername)} • ${escHtml(rental.customerPhone || "-")})</span>
                </h4>
                ${multiSummaryHtml}
                <p class="text-xs app-muted">Paket: <strong class="app-accent">${escHtml(rental.durationLabel)}</strong> • ${priceInfo}</p>
                <div class="flex flex-wrap items-center gap-2 text-[10px] text-emerald-600 font-semibold pt-0.5">
                    <span><i class="fa-regular fa-calendar-check mr-1"></i>${escHtml(rental.startDate)} (${escHtml(rental.startTime)} WITA)</span>
                    <span>• Pos: ${escHtml(rental.pickupLocation || "Shelter Utama")}</span>
                    ${rental.handoverOutPhoto ? `<span class="text-blue-500"><i class="fa-solid fa-camera mr-0.5"></i>Foto Keluar ✓</span>` : ""}
                    ${rental.handoverInPhoto ? `<span class="text-emerald-500"><i class="fa-solid fa-camera mr-0.5"></i>Foto Kembali ✓</span>` : ""}
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 self-start md:self-center shrink-0">
                ${rental.customerUsername ? `<button type="button" onclick="${preCloseJs}openFullChatOverlay('${esc(rental.customerUsername)}')" class="px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/35 text-emerald-600 text-xs font-bold"><i class="fa-solid fa-comments mr-1"></i>Chat</button>` : ""}
                ${rental.ktpImage ? `<button type="button" onclick="viewGowesKtpModal('${esc(rental.ktpImage)}','${esc(rental.customerName || rental.customerUsername)}')" class="px-3 py-1.5 rounded-xl bg-purple-600/15 border border-purple-500/35 text-purple-600 text-xs font-bold"><i class="fa-solid fa-id-card mr-1"></i>KTP</button>` : ""}
                ${rental.paymentProof ? `<button type="button" onclick="viewOrderProof('gowes_rental','${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/35 text-blue-600 text-xs font-bold"><i class="fa-solid fa-receipt mr-1"></i>Bukti</button>` : ""}
                ${isVerif || isPay ? `<button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Terkonfirmasi',this)" class="gowes-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">✓ ACC Bayar</button>` : ""}
                ${isConfirmed ? `<button type="button" onclick="openGowesHandoverModal('${esc(rental.id)}','out')" class="px-3 py-1.5 rounded-xl app-card-soft border text-blue-600 text-xs font-bold"><i class="fa-solid fa-camera mr-1"></i>Foto Keluar</button><button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Sedang Digunakan',this)" class="gowes-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm"><i class="fa-solid fa-key mr-1"></i>Serahkan Unit</button>` : ""}
                ${isInUse ? `<button type="button" onclick="openGowesHandoverModal('${esc(rental.id)}','in')" class="px-3 py-1.5 rounded-xl app-card-soft border text-emerald-600 text-xs font-bold"><i class="fa-solid fa-camera mr-1"></i>Foto Kembali</button><button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Selesai',this)" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm">✓ Unit Selesai</button>` : ""}
                ${!isDone && !isCanceled ? `<button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Dibatalkan',this)" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-xs font-bold" title="Batalkan Sewa"><i class="fa-solid fa-xmark"></i></button>` : ""}
                <button type="button" onclick="openGowesRentalDetail('${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold">Detail</button>
            </div>
        </div>
    `;
}

// ================= 5. PERUBAHAN STATUS TRANSAKSI SEWA & KTP VIEWER =================
async function setGowesRentalStatus(rentalId, nextStatus, btnEl) {
    if (nextStatus === "Dibatalkan") {
        const ok = await showConfirm("Batalkan Pesanan Sewa", "Batalkan pesanan sewa sepeda ini? Status armada akan otomatis dikembalikan ke status Tersedia.", "fa-solid fa-triangle-exclamation", "Ya, Batalkan");
        if (!ok) return;
    }

    if (btnEl) setBtnLoading(btnEl, true, "...");
    const res = await apiAction({ action: "gowes_update_rental_status", rentalId: String(rentalId), status: nextStatus });
    if (btnEl) setBtnLoading(btnEl, false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal mengubah status sewa sepeda.", "error");
    }

    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const idx = db.gowesRentals.findIndex(r => String(r.id) === String(rentalId));
    if (idx >= 0) db.gowesRentals[idx] = res.rental;

    const affectedIds = (Array.isArray(res.rental.selectedBikes) && res.rental.selectedBikes.length)
        ? res.rental.selectedBikes.map(sb => String(sb.bikeId))
        : [String(res.rental.bikeId)];

    if (Array.isArray(db.gowesBikes)) {
        db.gowesBikes.forEach(b => {
            if (affectedIds.includes(String(b.id))) {
                if (nextStatus === "Sedang Digunakan") b.status = "Sedang Disewa";
                else if (nextStatus === "Selesai" || nextStatus === "Dibatalkan") b.status = "Tersedia";
            }
        });
    }

    if (typeof refreshAfterAdminOrderAction === "function") {
        refreshAfterAdminOrderAction(`Status sewa sepeda: ${nextStatus}`);
    } else {
        if (window._soloStatsViewState && window._soloStatsViewState.open && typeof renderSoloStatsModal === "function") {
            renderSoloStatsModal();
        }
        showToast(`Status sewa diperbarui: ${nextStatus}`);
    }
}

function viewGowesKtpModal(ktpUrl, customerName = "") {
    if (!ktpUrl) return showToast("Foto KTP belum tersedia.", "info");

    const modal = document.getElementById("modal-proof-viewer");
    const imgEl = document.getElementById("proof-viewer-img");
    const titleEl = document.getElementById("proof-viewer-title");
    const openLink = document.getElementById("proof-viewer-open-link");

    if (modal && imgEl) {
        if (titleEl) titleEl.innerText = `KTP / SIM Penjamin — ${customerName || "Penyewa"}`;
        imgEl.src = ktpUrl;
        if (openLink) {
            openLink.href = ktpUrl;
            openLink.classList.toggle("hide", ktpUrl.startsWith("data:"));
        }
        modal.classList.remove("hide");
        if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-proof-viewer" });
        return;
    }

    if (!ktpUrl.startsWith("data:")) window.open(ktpUrl, "_blank", "noopener,noreferrer");
}

// ================= 6. GRAFIK & ANALITIK DETAIL TITIK GOWES =================
function buildGowesAnalyticsDashboardHtml() {
    const rentals = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const bikes = (Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES).filter(b => b.status !== "Dihapus");

    const completedRentals = rentals.filter(r => r.status === "Selesai" || r.status === "Sedang Digunakan" || r.status === "Terkonfirmasi");
    const totalRevenue = completedRentals.reduce((sum, r) => sum + Number(r.totalPrice || 0), 0);

    const activeInUseCount = rentals.filter(r => r.status === "Sedang Digunakan").length;
    const readyBikesCount = bikes.filter(b => b.status === "Tersedia").length;
    const maintenanceCount = bikes.filter(b => b.status === "Servis").length;
    const totalFleet = bikes.length;
    const occupancyRate = totalFleet > 0 ? Math.round((activeInUseCount / totalFleet) * 100) : 0;

    const durationMap = { "2 Jam": 0, "6 Jam": 0, "Full Day": 0 };
    rentals.forEach(r => {
        const d = String(r.durationLabel || r.durationKey || "");
        if (d.includes("2 Jam") || d === "2_hours") durationMap["2 Jam"]++;
        else if (d.includes("6 Jam") || d === "6_hours") durationMap["6 Jam"]++;
        else if (d.includes("Full") || d === "full_day") durationMap["Full Day"]++;
    });
    const maxDur = Math.max(1, durationMap["2 Jam"], durationMap["6 Jam"], durationMap["Full Day"]);

    const now = new Date();
    const months = [];
    for (let k = 5; k >= 0; k--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - k, 1);
        months.push({
            mKey: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`,
            label: dt.toLocaleDateString("id-ID", { month: "short" }),
            bookings: 0,
            revenue: 0
        });
    }

    rentals.forEach(r => {
        const ts = Number(r.createdAt || 0);
        if (!ts) return;
        const dt = new Date(ts);
        const k = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        const bucket = months.find(m => m.mKey === k);
        if (bucket) {
            bucket.bookings++;
            if (r.status === "Selesai" || r.status === "Sedang Digunakan" || r.status === "Terkonfirmasi") {
                bucket.revenue += Number(r.totalPrice || 0);
            }
        }
    });
    const maxMonthlyRev = Math.max(1, ...months.map(m => m.revenue));

    const bikeRentMap = {};
    rentals.forEach(r => {
        if (r.bikeId) bikeRentMap[r.bikeId] = (bikeRentMap[r.bikeId] || 0) + 1;
    });

    const topBikes = bikes.map(b => ({
        name: b.name,
        type: b.type,
        image: b.image || "",
        count: Math.max(Number(b.totalRentedCount || 0), bikeRentMap[b.id] || 0)
    })).sort((a, b) => b.count - a.count).slice(0, 4);

    const shelter = db.gowesShelter || DEFAULT_GOWES_SHELTER;
    const isClosed = !!(shelter && shelter.isClosed);

    return `
        <div class="space-y-4">
            <div class="app-card border rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-2xl ${isClosed ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'} flex items-center justify-center text-lg">
                        <i class="fa-solid ${isClosed ? 'fa-store-slash' : 'fa-store'}"></i>
                    </span>
                    <div>
                        <strong class="text-xs sm:text-sm block">Status Garasi: ${isClosed ? '<span class="text-red-500 font-extrabold">TUTUP SEMENTARA</span>' : '<span class="text-emerald-600 font-extrabold">BUKA &amp; MELAYANI</span>'}</strong>
                        <span class="text-[10px] app-muted block">${isClosed ? escHtml(shelter.closedReason || "Pemberitahuan tutup aktif di beranda") : `Jam operasional: ${escHtml(shelter.operationalHours || "05.30 - 20.00 WITA")}`}</span>
                    </div>
                </div>
                <button type="button" onclick="openGowesShelterOpsModal()" class="px-4 py-2 rounded-xl app-card-soft border gold-border text-xs font-bold app-accent shadow-sm">
                    <i class="fa-solid fa-sliders mr-1.5"></i>Atur Status Garasi
                </button>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm border-l-4 border-l-emerald-500">
                    <span class="text-[10px] app-muted font-bold uppercase block">Omzet Sewa Sepeda</span>
                    <strong class="text-base sm:text-lg font-extrabold text-emerald-600 block truncate">${fmtRp(totalRevenue)}</strong>
                    <span class="text-[10px] app-muted">${completedRentals.length} transaksi selesai</span>
                </div>
                <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm">
                    <span class="text-[10px] app-muted font-bold uppercase block">Tingkat Okupansi</span>
                    <strong class="text-base sm:text-lg font-extrabold text-blue-600 block truncate">${occupancyRate}%</strong>
                    <span class="text-[10px] text-emerald-600 font-semibold">${activeInUseCount} dari ${totalFleet} unit jalan</span>
                </div>
                <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm">
                    <span class="text-[10px] app-muted font-bold uppercase block">Kesiapan Garasi</span>
                    <strong class="text-base sm:text-lg font-extrabold text-emerald-600 block truncate">${readyBikesCount} Siap</strong>
                    <span class="text-[10px] app-muted">${maintenanceCount} unit masa servis</span>
                </div>
                <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm">
                    <span class="text-[10px] app-muted font-bold uppercase block">Total Booking</span>
                    <strong class="text-base sm:text-lg font-extrabold text-amber-500 block truncate">${rentals.length} Booking</strong>
                    <span class="text-[10px] app-muted">Riwayat sewa masuk</span>
                </div>
            </div>

            <div class="grid md:grid-cols-2 gap-4">
                <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-xs font-extrabold uppercase text-emerald-600"><i class="fa-solid fa-chart-simple mr-1.5"></i>Tren Pendapatan Rental</h4>
                            <p class="text-[10px] app-muted">Pendapatan bulanan Titik Gowes (6 Bulan)</p>
                        </div>
                        <span class="text-[10px] font-extrabold text-emerald-600">${fmtRp(totalRevenue)}</span>
                    </div>
                    <div class="h-44 flex items-end justify-between gap-2 pt-4 px-1">
                        ${months.map(m => {
                            const hPct = Math.max(8, Math.round((m.revenue / maxMonthlyRev) * 100));
                            return `<div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                <span class="text-[9px] font-bold text-emerald-600">${m.bookings}</span>
                                <div class="w-full max-w-[34px] rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 shadow-sm" style="height:${hPct}%" title="${m.label}: ${fmtRp(m.revenue)} (${m.bookings} booking)"></div>
                                <span class="text-[10px] app-muted font-semibold">${m.label}</span>
                            </div>`;
                        }).join("")}
                    </div>
                </div>

                <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div>
                        <h4 class="text-xs font-extrabold uppercase text-emerald-600"><i class="fa-solid fa-clock mr-1.5"></i>Paket Durasi Paling Diminati</h4>
                        <p class="text-[10px] app-muted">Pola lama penggunaan sepeda oleh pelanggan</p>
                    </div>
                    <div class="space-y-2.5 text-xs">
                        <div>
                            <div class="flex justify-between text-[11px] font-bold mb-1"><span>Paket 2 Jam (Short Ride)</span><span class="text-emerald-600">${durationMap["2 Jam"]}x</span></div>
                            <div class="w-full h-2 rounded-full app-card-soft overflow-hidden"><div class="h-full bg-emerald-500 rounded-full" style="width:${Math.round((durationMap["2 Jam"] / maxDur) * 100)}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between text-[11px] font-bold mb-1"><span>Paket 6 Jam (Half Day)</span><span class="text-blue-500">${durationMap["6 Jam"]}x</span></div>
                            <div class="w-full h-2 rounded-full app-card-soft overflow-hidden"><div class="h-full bg-blue-500 rounded-full" style="width:${Math.round((durationMap["6 Jam"] / maxDur) * 100)}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between text-[11px] font-bold mb-1"><span>Paket Full Day (Seharian Penuh)</span><span class="text-amber-500">${durationMap["Full Day"]}x</span></div>
                            <div class="w-full h-2 rounded-full app-card-soft overflow-hidden"><div class="h-full bg-amber-500 rounded-full" style="width:${Math.round((durationMap["Full Day"] / maxDur) * 100)}%"></div></div>
                        </div>
                    </div>
                    <div class="pt-3 border-t gold-border space-y-2">
                        <span class="text-[10px] font-bold uppercase app-muted block">Armada Paling Sering Disewa:</span>
                        <div class="grid grid-cols-2 gap-2">
                            ${topBikes.map(tb => `
                                <div class="app-card-soft border rounded-xl p-2 flex items-center gap-2 text-[11px]">
                                    <img src="${tb.image || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-8 h-8 rounded-lg object-cover bg-black shrink-0">
                                    <div class="min-w-0">
                                        <strong class="block truncate">${escHtml(tb.name)}</strong>
                                        <span class="text-[9.5px] text-emerald-600 font-bold">${tb.count}x sewa</span>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
