// =========================================================================
// TITIK GOWES — ADMIN FLEET, CABANG UNIT, BANNER 16:7, OVERDUE & KASIR
// File: js/gowes-admin.js (V14.9 — Armada per Gerai, Cabang & Banner 16:7)
// =========================================================================

let mgbTempPhotoUrl = "";
let mghTempPhotoUrl = "";
let gwBannerTempImg = "";
let _gowesFleetPage = "home"; // 'home' | 'branch' | 'shared' | 'banners' | 'banner_form'
let _gowesSelectedBranchId = "";
let _gowesEditingBannerIdx = -1;

function resetGowesFleetDrillDown() {
    _gowesFleetPage = "home";
    _gowesSelectedBranchId = "";
    _gowesEditingBannerIdx = -1;
}

function openGowesFleetSubPage(page, param = "") {
    _gowesFleetPage = page || "home";
    if (page === "branch") _gowesSelectedBranchId = String(param || "");
    if (page === "banner_form") _gowesEditingBannerIdx = (param === "" || param === null || param === undefined) ? -1 : Number(param);
    if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();
    if (page === "banner_form" && _gowesEditingBannerIdx >= 0) {
        setTimeout(() => editGowesBannerItem(_gowesEditingBannerIdx), 40);
    }
}

function handleGowesFleetStepBack() {
    if (_gowesFleetPage === "banner_form") {
        _gowesFleetPage = "banners";
        _gowesEditingBannerIdx = -1;
        if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();
        return true;
    }
    if (_gowesFleetPage !== "home") {
        _gowesFleetPage = "home";
        _gowesSelectedBranchId = "";
        if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();
        return true;
    }
    return false;
}

function switchGowesFleetAdminTab(tab) {
    if (tab === "banners") openGowesFleetSubPage("banners");
    else openGowesFleetSubPage("home");
}

function _getAdminSheltersList() {
    if (typeof getGowesSheltersList === "function") return getGowesSheltersList();
    if (Array.isArray(db.gowesShelters) && db.gowesShelters.length) return db.gowesShelters;
    return typeof DEFAULT_GOWES_SHELTERS !== "undefined" ? DEFAULT_GOWES_SHELTERS : [db.gowesShelter || DEFAULT_GOWES_SHELTER];
}

function _getBranchLabelById(branchId) {
    if (!branchId || branchId === "all") return "Semua Cabang";
    const found = _getAdminSheltersList().find(s => String(s.id) === String(branchId));
    return found ? (found.city || found.name) : "Cabang Khusus";
}

function getGowesScheduleStatusInfo(rental) {
    if (!rental || !rental.startDate || !rental.startTime) {
        return { state: "upcoming", badge: "Terjadwal", cls: "bg-blue-500/15 text-blue-600 border-blue-500/35", remainingMins: 999, deadlineLabel: "-" };
    }
    const allBikes = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const refBike = allBikes.find(b => String(b.id) === String(rental.bikeId)) || null;
    const iv = typeof getBookingIntervalMinutes === "function"
        ? getBookingIntervalMinutes(rental.startTime, rental.durationKey, refBike, rental.durationLabel)
        : { startMin: 480, endMin: 1200, endColon: "20:00", nextDay: false };

    const dParts = String(rental.startDate).split("-");
    if (dParts.length !== 3) {
        return { state: "upcoming", badge: "Terjadwal", cls: "bg-blue-500/15 text-blue-600 border-blue-500/35", remainingMins: 999, deadlineLabel: iv.endColon };
    }
    const deadlineDt = new Date(parseInt(dParts[0], 10), parseInt(dParts[1], 10) - 1, parseInt(dParts[2], 10), 0, iv.endMin, 0);
    const diffMins = Math.round((deadlineDt.getTime() - Date.now()) / 60000);

    if (rental.status === "Terkonfirmasi") {
        return { state: "upcoming", badge: `Ambil ${rental.startTime}`, cls: "bg-blue-500/15 text-blue-600 border-blue-500/35", remainingMins: diffMins, deadlineLabel: iv.endColon };
    }
    if (rental.status === "Sedang Digunakan") {
        if (diffMins < 0) {
            const over = Math.abs(diffMins);
            const h = Math.floor(over / 60), m = over % 60;
            return {
                state: "overdue",
                badge: h > 0 ? `LEWAT ${h}J ${m}M` : `LEWAT ${m} MNT`,
                cls: "bg-red-600 text-white border-red-500 gowes-overdue-badge",
                remainingMins: diffMins,
                deadlineLabel: iv.endColon
            };
        }
        if (diffMins <= 15) {
            return {
                state: "warning",
                badge: `SISA ${Math.max(1, diffMins)} MNT`,
                cls: "bg-amber-400 text-black border-amber-500 font-extrabold",
                remainingMins: diffMins,
                deadlineLabel: iv.endColon
            };
        }
        const rh = Math.floor(diffMins / 60), rm = diffMins % 60;
        return {
            state: "active",
            badge: rh > 0 ? `Sisa ${rh}j ${rm}m` : `Sisa ${rm} mnt`,
            cls: "bg-emerald-500/18 text-emerald-600 border-emerald-500/35",
            remainingMins: diffMins,
            deadlineLabel: iv.endColon
        };
    }
    return { state: "pending", badge: rental.status || "Proses", cls: "bg-zinc-500/15 app-muted border-zinc-400/30", remainingMins: diffMins, deadlineLabel: iv.endColon };
}

function buildGowesTodayScheduleBoardHtml() {
    const todayStr = new Date().toISOString().split("T")[0];
    const rentals = (Array.isArray(db.gowesRentals) ? db.gowesRentals : []).filter(r => {
        if (!r || r.status === "Selesai" || r.status === "Dibatalkan") return false;
        const isToday = String(r.startDate || "") === todayStr;
        const isInUse = r.status === "Sedang Digunakan";
        return isToday || isInUse;
    });

    const items = rentals.map(r => {
        const info = getGowesScheduleStatusInfo(r);
        const rank = info.state === "overdue" ? 0 : info.state === "warning" ? 1 : info.state === "active" ? 2 : 3;
        return { r, info, rank };
    }).sort((a, b) => (a.rank - b.rank) || String(a.r.startTime || "").localeCompare(String(b.r.startTime || "")));

    if (!items.length) {
        return `
            <div class="app-card border rounded-3xl p-4 shadow-sm flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-base shrink-0"><i class="fa-regular fa-calendar-check"></i></span>
                    <div>
                        <strong class="text-xs sm:text-sm block">Jadwal Sewa Hari Ini</strong>
                        <span class="text-[11px] app-muted block">Belum ada jadwal aktif hari ini — semua unit siap jalan.</span>
                    </div>
                </div>
                <button type="button" onclick="if(typeof openGowesOfflinePosModal==='function')openGowesOfflinePosModal()" class="gowes-pill-btn px-3 py-1.5 rounded-xl text-[11px] shrink-0">+ Kasir</button>
            </div>
        `;
    }

    const alertCnt = items.filter(x => x.info.state === "overdue" || x.info.state === "warning").length;
    return `
        <div class="app-card border rounded-3xl p-4 space-y-3 shadow-sm ${alertCnt > 0 ? "border-amber-500/60" : ""}">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                    <span class="w-8 h-8 rounded-xl ${alertCnt > 0 ? "bg-red-500/15 text-red-500" : "bg-emerald-500/15 text-emerald-600"} flex items-center justify-center text-sm shrink-0"><i class="fa-solid fa-stopwatch"></i></span>
                    <div>
                        <h4 class="text-xs sm:text-sm font-extrabold leading-tight">Jadwal Sewa Hari Ini (${items.length})</h4>
                        <p class="text-[10px] app-muted">Urut jam ambil &amp; pengingat batas kembali otomatis</p>
                    </div>
                </div>
                <button type="button" onclick="if(typeof openGowesOfflinePosModal==='function')openGowesOfflinePosModal()" class="px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/35 text-emerald-700 text-[11px] font-extrabold shrink-0"><i class="fa-solid fa-cash-register mr-1"></i>Kasir</button>
            </div>
            <div class="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                ${items.map(({ r, info }) => `
                    <div class="app-card-soft border rounded-2xl p-2.5 flex items-center justify-between gap-2.5 text-xs">
                        <div class="min-w-0 flex-1 space-y-0.5">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="text-[9px] px-2 py-0.5 rounded-full border font-extrabold ${info.cls}">${escHtml(info.badge)}</span>
                                <span class="text-[10px] font-bold app-muted">${escHtml(r.startTime || "-")} → ${escHtml(info.deadlineLabel)} WITA</span>
                            </div>
                            <strong class="block truncate text-xs">${escHtml(r.bikeName)} • ${escHtml(r.customerName || r.customerUsername)}</strong>
                            <span class="block text-[10px] app-muted truncate">${escHtml(r.branchCity || r.pickupLocation || "Shelter")} • ${escHtml(r.durationLabel || "")}</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            ${(info.state === "overdue" || info.state === "warning")
                                ? `<button type="button" onclick="sendGowesOverdueReminderWA('${esc(r.id)}')" class="px-2.5 py-1.5 rounded-xl bg-red-600 text-white text-[10px] font-bold shadow"><i class="fa-brands fa-whatsapp mr-1"></i>WA</button>`
                                : ""}
                            <button type="button" onclick="openGowesRentalDetail('${esc(r.id)}')" class="px-2.5 py-1.5 rounded-xl app-card border text-[10px] font-bold">Detail</button>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

function _renderSingleBikeAdminRowHtml(b, isMaster, showBranchTag = false) {
    const isAvail = b.status === "Tersedia";
    const isInUse = b.status === "Sedang Disewa";
    const statusCls = isAvail ? "bg-emerald-500/15 text-emerald-600" : isInUse ? "bg-amber-500/15 text-amber-600" : "bg-zinc-500/15 text-zinc-400";
    const brLbl = _getBranchLabelById(b.branchId);

    return `
        <div class="app-card border rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
            <div class="flex items-center gap-3 min-w-0">
                <img src="${b.image || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-16 h-12 rounded-xl object-cover bg-black border gold-border shrink-0">
                <div class="min-w-0 space-y-0.5">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="gowes-brand-tag !text-[8px]">${escHtml(b.type || "MTB")}</span>
                        ${showBranchTag ? `<span class="text-[8px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/12 text-blue-600"><i class="fa-solid fa-globe mr-0.5"></i>${escHtml(brLbl)}</span>` : ""}
                        <span class="text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-full ${statusCls}">● ${escHtml(b.status)}</span>
                    </div>
                    <h5 class="font-extrabold text-xs sm:text-sm truncate pt-0.5">${escHtml(b.name)}</h5>
                    <p class="text-[10px] app-muted truncate">${escHtml(b.label2Hours || "2 Jam")}: ${fmtRp(b.price2Hours)} • ${escHtml(b.label6Hours || "6 Jam")}: ${fmtRp(b.price6Hours)} • ${escHtml(b.labelFullDay || "Full")}: ${fmtRp(b.priceFullDay)}</p>
                </div>
            </div>

            <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                ${b.status !== "Servis" ? `
                    <button type="button" onclick="toggleGowesBikeStatusQuick('${esc(b.id)}','Servis')" class="px-2.5 py-1.5 rounded-xl app-card-soft border text-[10.5px] font-bold text-zinc-500 hover:text-amber-500" title="Tandai Sedang Servis">
                        <i class="fa-solid fa-wrench mr-1"></i>Servis
                    </button>
                ` : `
                    <button type="button" onclick="toggleGowesBikeStatusQuick('${esc(b.id)}','Tersedia')" class="px-2.5 py-1.5 rounded-xl bg-emerald-600/15 text-emerald-600 border border-emerald-500/30 text-[10.5px] font-bold" title="Tandai Siap Sewa">
                        <i class="fa-solid fa-check mr-1"></i>Siap
                    </button>
                `}
                <button type="button" onclick="openMasterGowesBikeModal('${esc(b.id)}')" class="px-3 py-1.5 rounded-xl app-card-soft border app-accent text-[10.5px] font-bold">
                    <i class="fa-solid fa-pen mr-1"></i>Edit
                </button>
                ${isMaster ? `
                    <button type="button" onclick="deleteGowesBike('${esc(b.id)}')" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-[10.5px] font-bold" title="Hapus Unit">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                ` : ""}
            </div>
        </div>
    `;
}

// ================= 0. PUSAT PENGATURAN TITIK GOWES (DRILL-DOWN LEMBAR TERPISAH) =================
function renderGowesFleetWorkspaceHtml() {
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isMaster = !!(curU && curU.role === "master");
    const shelters = _getAdminSheltersList();
    const bikes = (Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES).filter(b => b && b.status !== "Dihapus");
    const banners = Array.isArray(db.gowesBanners) && db.gowesBanners.length ? db.gowesBanners : DEFAULT_GOWES_BANNERS;
    const shelterIdsSet = new Set(shelters.map(s => String(s.id)));
    const sharedBikes = bikes.filter(b => !b.branchId || b.branchId === "all" || !shelterIdsSet.has(String(b.branchId)));

    const titleEl = document.getElementById("master-active-panel-title");
    const subEl = document.getElementById("master-active-panel-sub");

    // LEMBAR ANAK 1: DETAIL 1 GERAI CABANG (HANYA ISI GERAI TERSEBUT)
    if (_gowesFleetPage === "branch") {
        const s = shelters.find(x => String(x.id) === String(_gowesSelectedBranchId)) || shelters[0];
        if (!s) { _gowesFleetPage = "home"; return renderGowesFleetWorkspaceHtml(); }
        const sClosed = !!s.isClosed;
        const branchLink = `${getCleanBaseUrl()}?branch=${encodeURIComponent(s.city || s.id)}`;
        const branchBikes = bikes.filter(b => String(b.branchId || "") === String(s.id));

        if (titleEl) titleEl.innerText = `Gerai ${s.city || s.name}`;
        if (subEl) subEl.innerText = `${branchBikes.length} unit sepeda khusus • ${sClosed ? "TUTUP" : "BUKA"}`;

        return `
            <div class="space-y-4">
                <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <div class="flex items-start gap-3">
                        <span class="w-12 h-12 rounded-2xl ${sClosed ? 'bg-red-500/18 text-red-500 border border-red-500/35' : 'bg-emerald-500/18 text-emerald-600 border border-emerald-500/35'} flex items-center justify-center text-lg shrink-0">
                            <i class="fa-solid ${sClosed ? 'fa-store-slash' : 'fa-store'}"></i>
                        </span>
                        <div class="min-w-0 flex-1 space-y-1">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="gowes-brand-tag !text-[8.5px]">${escHtml(s.city || "Cabang")}</span>
                                <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${sClosed ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-600'}">● ${sClosed ? 'TUTUP' : 'BUKA'}</span>
                            </div>
                            <strong class="text-sm sm:text-base font-extrabold block leading-snug">${escHtml(s.name)}</strong>
                            <p class="text-[11px] app-muted leading-snug">${escHtml(s.address)}</p>
                            <p class="text-[10px] app-muted"><i class="fa-regular fa-clock text-emerald-600 mr-1"></i>${escHtml(s.operationalHours || "05.30 - 20.00 WITA")} • WA: ${escHtml(s.csPhone || "-")}</p>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 pt-3 border-t gold-border">
                        <button type="button" onclick="openMasterGowesBikeModal(null,'${esc(s.id)}')" class="gowes-pill-btn px-3.5 py-2 rounded-xl text-xs shadow-sm">
                            <i class="fa-solid fa-plus mr-1"></i>Tambah Sepeda
                        </button>
                        <button type="button" onclick="openGowesShelterOpsModal('${esc(s.id)}', false)" class="px-3.5 py-2 rounded-xl app-card-soft border app-accent text-xs font-bold">
                            <i class="fa-solid fa-pen mr-1"></i>Edit Gerai &amp; Buka/Tutup
                        </button>
                        <button type="button" onclick="navigator.clipboard.writeText('${esc(branchLink)}');showToast('Link khusus cabang ${esc(s.city || s.name)} disalin!');" class="px-3 py-2 rounded-xl app-card-soft border text-xs font-bold">
                            <i class="fa-solid fa-link mr-1 text-emerald-600"></i>Link Cabang
                        </button>
                        ${isMaster && shelters.length > 1 ? `
                            <button type="button" onclick="deleteGowesShelterBranch('${esc(s.id)}')" class="px-3 py-2 rounded-xl bg-red-600/15 text-red-500 text-xs font-bold ml-auto">
                                <i class="fa-solid fa-trash mr-1"></i>Hapus Gerai
                            </button>
                        ` : ""}
                    </div>
                </div>

                <div class="space-y-2.5">
                    <div class="flex items-center justify-between px-1">
                        <h4 class="text-xs font-extrabold uppercase app-muted tracking-wider">Unit Sepeda Gerai ${escHtml(s.city || "")} (${branchBikes.length})</h4>
                    </div>
                    ${branchBikes.length
                        ? branchBikes.map(b => _renderSingleBikeAdminRowHtml(b, isMaster, false)).join("")
                        : `<div class="app-card border border-dashed rounded-3xl p-7 text-center space-y-2.5">
                            <i class="fa-solid fa-bicycle text-3xl text-emerald-600/50"></i>
                            <p class="text-xs app-muted">Belum ada sepeda khusus di gerai <strong>${escHtml(s.city || s.name)}</strong>.${sharedBikes.length ? ` Saat ini pelanggan memakai ${sharedBikes.length} unit dari Armada Umum.` : ""}</p>
                            <button type="button" onclick="openMasterGowesBikeModal(null,'${esc(s.id)}')" class="gowes-pill-btn px-4 py-2 rounded-xl text-xs shadow">
                                <i class="fa-solid fa-plus mr-1"></i>Tambah Sepeda ke ${escHtml(s.city || "Gerai Ini")}
                            </button>
                           </div>`}
                </div>
            </div>
        `;
    }

    // LEMBAR ANAK 2: ARMADA UMUM (LINTAS CABANG)
    if (_gowesFleetPage === "shared") {
        if (titleEl) titleEl.innerText = "Armada Umum (Lintas Cabang)";
        if (subEl) subEl.innerText = `${sharedBikes.length} unit tampil di semua gerai`;
        return `
            <div class="space-y-3.5">
                <div class="app-card border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
                    <p class="text-xs app-muted flex-1">Unit di bawah ini tampil di semua cabang. Klik <strong>Edit</strong> pada unit jika ingin memindahkannya khusus ke satu gerai.</p>
                    <button type="button" onclick="openMasterGowesBikeModal(null,'all')" class="gowes-pill-btn px-3.5 py-2 rounded-xl text-xs shadow shrink-0"><i class="fa-solid fa-plus mr-1"></i>Tambah Unit Umum</button>
                </div>
                ${sharedBikes.length
                    ? sharedBikes.map(b => _renderSingleBikeAdminRowHtml(b, isMaster, true)).join("")
                    : `<div class="app-card border border-dashed rounded-3xl p-8 text-center text-xs app-muted">Semua sepeda sudah dipisahkan ke gerai masing-masing.</div>`}
            </div>
        `;
    }

    // LEMBAR ANAK 3: DAFTAR BANNER 16:7
    if (_gowesFleetPage === "banners" && isMaster) {
        if (titleEl) titleEl.innerText = "Banner Promosi Gowes (16:7)";
        if (subEl) subEl.innerText = `${banners.length} banner aktif`;
        return `
            <div class="space-y-3.5">
                <div class="flex justify-end">
                    <button type="button" onclick="openGowesFleetSubPage('banner_form', -1)" class="gowes-pill-btn px-4 py-2 rounded-xl text-xs shadow"><i class="fa-solid fa-plus mr-1"></i>Tambah Banner 16:7</button>
                </div>
                <div class="space-y-2.5">
                    ${banners.map((b, i) => `
                        <div class="app-card border rounded-2xl p-3 flex items-center gap-3 shadow-sm">
                            <img src="${b.img}" class="w-24 h-12 rounded-xl object-cover bg-black shrink-0 border gold-border">
                            <div class="flex-1 min-w-0">
                                <strong class="text-xs sm:text-sm block truncate">${escHtml(b.title)}</strong>
                                <span class="text-[10px] app-muted block truncate">${escHtml(b.badge || "Promo")} • ${escHtml(b.subtitle || "")}</span>
                            </div>
                            <button type="button" onclick="openGowesFleetSubPage('banner_form', ${i})" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold">Edit</button>
                            <button type="button" onclick="deleteGowesBannerItem(${i})" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-xs text-red-500"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    `).join("")}
                </div>
            </div>
        `;
    }

    // LEMBAR ANAK 4: FORM TAMBAH / EDIT BANNER 16:7
    if (_gowesFleetPage === "banner_form" && isMaster) {
        if (titleEl) titleEl.innerText = _gowesEditingBannerIdx >= 0 ? "Edit Banner Gowes 16:7" : "Tambah Banner Gowes 16:7";
        if (subEl) subEl.innerText = "Atur gambar, judul & tujuan banner promosi";
        return `
            <form onsubmit="saveGowesBannerForm(event)" class="app-card border rounded-3xl p-5 space-y-3 shadow-sm max-w-xl mx-auto">
                <input type="hidden" id="gwb-id">
                <div class="w-full rounded-xl overflow-hidden border gold-border bg-black" style="aspect-ratio:16/7;">
                    <img id="gwb-preview-img" src="${(banners[0] && banners[0].img) || 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1200&q=80'}" class="w-full h-full object-cover">
                </div>
                <label class="block gowes-pill-btn py-2.5 rounded-xl text-center cursor-pointer text-xs">
                    <i class="fa-solid fa-crop-simple mr-1"></i>Pilih &amp; Crop Foto Banner (16 : 7)
                    <input type="file" accept="image/*" class="hide" onchange="pickCroppedGowesBanner(this)">
                </label>
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="gwb-badge" placeholder="Label (TITIK GOWES)" class="app-input text-xs">
                    <input type="text" id="gwb-cta" placeholder="Tombol (opsional)" class="app-input text-xs">
                </div>
                <input type="text" id="gwb-title" placeholder="Judul Banner Promosi" class="app-input text-xs" required>
                <input type="text" id="gwb-sub" placeholder="Deskripsi singkat banner..." class="app-input text-xs" required>
                <select id="gwb-target" class="app-input text-xs">
                    <option value="gowes-showcase-track">Arahkan ke Pilihan Sepeda</option>
                    <option value="open_booking">Buka Formulir Booking Langsung</option>
                    <option value="sec-gowes-shelter">Arahkan ke Lokasi Garasi</option>
                </select>
                <input type="url" id="gwb-img-url" oninput="if(this.value.startsWith('http'))document.getElementById('gwb-preview-img').src=this.value;" placeholder="Atau tempel URL foto (https://...)" class="app-input text-xs">
                <button type="submit" id="btn-save-gwb" class="w-full gowes-pill-btn py-3 rounded-xl text-xs uppercase shadow">Simpan Banner Gowes</button>
            </form>
        `;
    }

    // LEMBAR UTAMA (HOME): JADWAL HARI INI + DAFTAR GERAI BERSIH (KLIK UNTUK MASUK LEMBAR MASING-MASING)
    if (titleEl) titleEl.innerText = "Kelola Gerai & Armada Gowes";
    if (subEl) subEl.innerText = `${shelters.length} Gerai Cabang • ${bikes.length} Unit Sepeda`;

    const branchRowsHtml = shelters.map(s => {
        const sClosed = !!s.isClosed;
        const cnt = bikes.filter(b => String(b.branchId || "") === String(s.id)).length;
        return `
            <button type="button" onclick="openGowesFleetSubPage('branch','${esc(s.id)}')" class="menu-row-card">
                <span class="menu-row-ic ${sClosed ? '!bg-red-500/15 !text-red-500' : '!bg-emerald-500/15 !text-emerald-600'}">
                    <i class="fa-solid ${sClosed ? 'fa-store-slash' : 'fa-store'}"></i>
                </span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                        <strong class="text-xs sm:text-sm truncate">${escHtml(s.city || s.name)}</strong>
                        <span class="text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${sClosed ? 'bg-red-500/15 text-red-500' : 'bg-emerald-500/15 text-emerald-600'}">${sClosed ? 'TUTUP' : 'BUKA'}</span>
                    </div>
                    <span class="text-[10.5px] app-muted block truncate">${escHtml(s.name)} • ${cnt} unit sepeda khusus</span>
                </div>
                <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
            </button>
        `;
    }).join("");

    return `
        <div class="space-y-4">
            ${buildGowesTodayScheduleBoardHtml()}

            <div class="space-y-2">
                <div class="flex items-center justify-between px-1">
                    <span class="text-[11px] font-extrabold uppercase tracking-wider app-muted">Pilih Gerai Cabang (${shelters.length})</span>
                    <button type="button" onclick="openGowesShelterOpsModal(null, true)" class="text-xs font-extrabold text-emerald-600 hover:underline"><i class="fa-solid fa-plus mr-1"></i>Tambah Gerai</button>
                </div>
                <div class="space-y-2">
                    ${branchRowsHtml}
                </div>
            </div>

            <div class="space-y-2 pt-1">
                <span class="text-[11px] font-extrabold uppercase tracking-wider app-muted px-1 block">Pengaturan Lainnya</span>
                <button type="button" onclick="openGowesFleetSubPage('shared')" class="menu-row-card">
                    <span class="menu-row-ic !bg-blue-500/15 !text-blue-600"><i class="fa-solid fa-globe"></i></span>
                    <div class="flex-1 min-w-0">
                        <strong class="text-xs sm:text-sm block">Armada Umum (Lintas Cabang)</strong>
                        <span class="text-[10.5px] app-muted block">${sharedBikes.length} unit yang tampil di semua gerai</span>
                    </div>
                    <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                </button>
                ${isMaster ? `
                    <button type="button" onclick="openGowesFleetSubPage('banners')" class="menu-row-card">
                        <span class="menu-row-ic !bg-amber-500/15 !text-amber-600"><i class="fa-solid fa-rectangle-ad"></i></span>
                        <div class="flex-1 min-w-0">
                            <strong class="text-xs sm:text-sm block">Banner Promosi Titik Gowes (16:7)</strong>
                            <span class="text-[10.5px] app-muted block">${banners.length} slide banner aktif di beranda Gowes</span>
                        </div>
                        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
                    </button>
                ` : ""}
            </div>
        </div>
    `;
}

// ================= BANNER 16:7 HANDLERS =================
function pickCroppedGowesBanner(inp) {
    const file = inp.files && inp.files[0];
    if (!file) return;
    inp.value = "";
    if (typeof openImageCropper === "function") {
        openImageCropper(file, 16 / 7, "Crop Banner Titik Gowes (16 : 7)", 1280, 560, (dataUrl) => {
            gwBannerTempImg = dataUrl;
            const prev = document.getElementById("gwb-preview-img");
            const urlInp = document.getElementById("gwb-img-url");
            if (prev) prev.src = dataUrl;
            if (urlInp) urlInp.value = dataUrl;
            showToast("Foto banner (16:7) siap disimpan!");
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
        badge: document.getElementById("gwb-badge").value.trim() || "TITIK GOWES",
        ctaText: document.getElementById("gwb-cta").value.trim(),
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
    _gowesFleetPage = "banners";
    _gowesEditingBannerIdx = -1;
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

// ================= 1. KELOLA GERAI CABANG & SAKELAR TOKO TUTUP =================
function openGowesShelterOpsModal(branchId = null, isNew = false) {
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curU || (curU.role !== "master" && curU.role !== "administrasi")) {
        return showToast("Hanya Founder dan Tim Administrasi yang dapat mengatur gerai cabang.", "error");
    }

    const shelters = _getAdminSheltersList();
    let target = null;
    if (!isNew) {
        target = branchId
            ? shelters.find(s => String(s.id) === String(branchId))
            : (typeof getActiveShelterObject === "function" ? getActiveShelterObject() : shelters[0]);
    }

    const isClosed = !!(target && target.isClosed);
    const titleEl = document.getElementById("gso-modal-title");
    if (titleEl) titleEl.innerText = isNew ? "Tambah Gerai / Cabang Baru" : `Edit Gerai: ${(target && target.city) || "Utama"}`;

    document.getElementById("gso-id").value = target ? (target.id || "") : "";
    document.getElementById("gso-city").value = target ? (target.city || "") : "";
    document.getElementById("gso-name").value = target ? (target.name || "") : "";
    document.getElementById("gso-address").value = target ? (target.address || "") : "";
    document.getElementById("gso-maps-url").value = target ? (target.mapsUrl || "") : "";
    document.getElementById("gso-hours").value = target ? (target.operationalHours || "Setiap Hari: 05.30 - 20.00 WITA") : "Setiap Hari: 06.00 - 19.30 WITA";
    document.getElementById("gso-cs-phone").value = target ? (target.csPhone || "085117488828") : "085117488828";
    document.getElementById("gso-closed-reason").value = target ? (target.closedReason || "") : "Garasi cabang sedang istirahat sementara. Buka kembali besok pagi.";

    const toggleEl = document.getElementById("gso-is-closed-toggle");
    if (toggleEl) toggleEl.checked = isClosed;
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
            indicator.innerText = "● Status: Gerai TUTUP SEMENTARA (Pengumuman tutup tampil di cabang ini)";
        } else {
            indicator.className = "text-[11px] font-bold text-emerald-600 pt-1";
            indicator.innerText = "● Status: Gerai BUKA & Melayani Rental Sepeda";
        }
    }
    if (reasonWrap) reasonWrap.classList.toggle("opacity-50", !isClosed);
}

async function submitGowesShelterOps(e) {
    e.preventDefault();

    const idVal = document.getElementById("gso-id")?.value.trim() || "";
    const city = document.getElementById("gso-city")?.value.trim() || "";
    const name = document.getElementById("gso-name")?.value.trim() || "";
    const address = document.getElementById("gso-address")?.value.trim() || "";
    const mapsUrl = document.getElementById("gso-maps-url")?.value.trim() || "";
    const operationalHours = document.getElementById("gso-hours")?.value.trim() || "Setiap Hari: 05.30 - 20.00 WITA";
    const csPhone = document.getElementById("gso-cs-phone")?.value.trim() || "085117488828";
    const isClosed = !!document.getElementById("gso-is-closed-toggle")?.checked;
    const closedReason = document.getElementById("gso-closed-reason")?.value.trim() || "";

    if (!city || !name || !address) return showToast("Kota, nama gerai, dan alamat wajib diisi.", "error");

    const shelterObj = {
        id: idVal || ("sh_" + Date.now()),
        city,
        name,
        address,
        mapsUrl,
        operationalHours,
        csPhone,
        isClosed,
        closedReason
    };

    setBtnLoading("btn-save-gso", true, "Menyimpan Gerai...");
    const res = await apiAction({ action: "gowes_upsert_shelter", shelter: shelterObj });
    setBtnLoading("btn-save-gso", false);

    if (!res || !res.ok) {
        return showToast((res && res.message) || "Gagal menyimpan data gerai.", "error");
    }

    if (Array.isArray(res.shelters) && res.shelters.length) {
        db.gowesShelters = res.shelters;
        db.gowesShelter = res.shelters[0];
    } else {
        const list = [..._getAdminSheltersList()];
        const idx = list.findIndex(x => String(x.id) === String(shelterObj.id));
        if (idx >= 0) list[idx] = shelterObj; else list.push(shelterObj);
        db.gowesShelters = list;
        db.gowesShelter = list[0];
    }

    document.getElementById("modal-gowes-shelter-ops")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-shelter-ops");

    if (typeof renderGowesLandingPage === "function" && currentAppMode === "titik_gowes") renderGowesLandingPage();
    if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();

    showToast(`Gerai ${city} berhasil disimpan!`);
}

async function deleteGowesShelterBranch(branchId) {
    const shelters = _getAdminSheltersList();
    if (shelters.length <= 1) return showToast("Minimal harus menyisakan 1 gerai aktif.", "info");
    const target = shelters.find(s => String(s.id) === String(branchId));
    const ok = await showConfirm("Hapus Gerai Cabang", `Hapus gerai "${(target && target.name) || "cabang ini"}"?`, "fa-solid fa-trash", "Ya, Hapus");
    if (!ok) return;

    showLoading("Menghapus gerai...");
    const res = await apiAction({ action: "gowes_delete_shelter", shelterId: String(branchId) });
    hideLoading();

    if (!res || !res.ok) return showToast((res && res.message) || "Gagal menghapus gerai.", "error");

    db.gowesShelters = Array.isArray(res.shelters) && res.shelters.length
        ? res.shelters
        : shelters.filter(s => String(s.id) !== String(branchId));
    db.gowesShelter = db.gowesShelters[0];
    _gowesFleetPage = "home";
    _gowesSelectedBranchId = "";
    if (typeof renderGowesLandingPage === "function" && currentAppMode === "titik_gowes") renderGowesLandingPage();
    if (typeof renderMasterWorkspaceContent === "function") renderMasterWorkspaceContent();
    showToast("Gerai cabang dihapus.", "info");
}

// ================= 2. KELOLA ARMADA SEPEDA (CABANG GARASI, REM & LABEL TARIF FLEKSIBEL) =================
function openMasterGowesBikeModal(bikeId = null, prefillBranchId = null) {
    const isEdit = !!bikeId;
    const bikes = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const b = isEdit ? bikes.find(x => String(x.id) === String(bikeId)) : null;

    mgbTempPhotoUrl = (b && b.image) || "";

    const shelters = _getAdminSheltersList();
    const prefillBranchObj = prefillBranchId ? shelters.find(s => String(s.id) === String(prefillBranchId)) : null;
    const titleEl = document.getElementById("mgb-title");
    if (titleEl) {
        titleEl.innerText = isEdit
            ? `Edit Unit: ${b.name}`
            : prefillBranchObj
                ? `Tambah Sepeda — Cabang ${prefillBranchObj.city || prefillBranchObj.name}`
                : "Tambah Unit Sepeda Baru";
    }

    const brSel = document.getElementById("mgb-branch-id");
    if (brSel) {
        const curBranchVal = isEdit ? (b.branchId || "all") : (prefillBranchId || "all");
        brSel.innerHTML = `<option value="all" ${curBranchVal === "all" ? "selected" : ""}>Semua Cabang (Tampil di Semua Lokasi)</option>` +
            shelters.map(s => `<option value="${esc(s.id)}" ${String(curBranchVal) === String(s.id) ? "selected" : ""}>Khusus Cabang ${escHtml(s.city || s.name)}</option>`).join("");
    }

    document.getElementById("mgb-id").value = isEdit ? b.id : "";
    document.getElementById("mgb-name").value = isEdit ? b.name : "";
    document.getElementById("mgb-type").value = isEdit ? b.type : "MTB (Gunung)";
    document.getElementById("mgb-frame").value = isEdit ? (b.frameSize || "") : "M (165-175 cm)";
    document.getElementById("mgb-gears").value = isEdit ? (b.gears || "") : "1x11 Speed Shimano";
    const brkEl = document.getElementById("mgb-brakes");
    if (brkEl) brkEl.value = isEdit ? (b.brakes || "") : "Hydraulic Disc Brake Shimano";

    const l2 = document.getElementById("mgb-l2h");
    const l6 = document.getElementById("mgb-l6h");
    const lf = document.getElementById("mgb-lfullday");
    if (l2) l2.value = isEdit ? (b.label2Hours || "2 Jam") : "2 Jam";
    if (l6) l6.value = isEdit ? (b.label6Hours || "6 Jam") : "6 Jam";
    if (lf) lf.value = isEdit ? (b.labelFullDay || "Full Day") : "Full Day";

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
    const branchId = document.getElementById("mgb-branch-id")?.value || "all";
    const name = document.getElementById("mgb-name").value.trim();
    const type = document.getElementById("mgb-type").value;
    const frameSize = document.getElementById("mgb-frame").value.trim();
    const gears = document.getElementById("mgb-gears").value.trim();
    const brakes = (document.getElementById("mgb-brakes")?.value || "").trim();
    const label2Hours = (document.getElementById("mgb-l2h")?.value || "2 Jam").trim();
    const label6Hours = (document.getElementById("mgb-l6h")?.value || "6 Jam").trim();
    const labelFullDay = (document.getElementById("mgb-lfullday")?.value || "Full Day").trim();
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
        branchId, name, type, frameSize, gears, brakes,
        label2Hours, label6Hours, labelFullDay,
        price2Hours, price6Hours, priceFullDay,
        status, freeAccessories, description, image: finalImage
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
        const brLbl = _getBranchLabelById(b.branchId);

        return `
            <div class="app-card border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div class="flex items-center gap-3 min-w-0">
                    <img src="${b.image || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-16 h-12 rounded-xl object-cover bg-black border gold-border shrink-0">
                    <div class="min-w-0 space-y-0.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="gowes-brand-tag !text-[8.5px]">${escHtml(b.type || "MTB")}</span>
                            <span class="text-[8.5px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/12 text-blue-600"><i class="fa-solid fa-location-dot mr-0.5"></i>${escHtml(brLbl)}</span>
                            <span class="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${statusCls}">● ${escHtml(b.status)}</span>
                        </div>
                        <h4 class="font-extrabold text-xs sm:text-sm truncate pt-0.5">${escHtml(b.name)}</h4>
                        <p class="text-[10px] app-muted truncate">${escHtml(b.label2Hours || "2 Jam")}: ${fmtRp(b.price2Hours)} • ${escHtml(b.label6Hours || "6 Jam")}: ${fmtRp(b.price6Hours)} • ${escHtml(b.labelFullDay || "Full")}: ${fmtRp(b.priceFullDay)}</p>
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
            ? `Ambil foto kondisi sepeda saat diserahkan ke ${r.customerName || r.customerUsername} (Mulai Gowes).`
            : `Ambil foto kondisi sepeda saat dikembalikan oleh ${r.customerName || r.customerUsername} (Selesai).`;
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

// ================= 4. DETEKSI LEWAT WAKTU (OVERDUE) & KARTU ORDER ADMIN =================
function getGowesRentalOverdueInfo(rental) {
    if (!rental || rental.status !== "Sedang Digunakan" || !rental.startDate || !rental.startTime) {
        return { isOverdue: false, label: "", deadlineLabel: "" };
    }
    const allBikes = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const refBike = allBikes.find(b => String(b.id) === String(rental.bikeId)) || null;
    const iv = typeof getBookingIntervalMinutes === "function"
        ? getBookingIntervalMinutes(rental.startTime, rental.durationKey, refBike, rental.durationLabel)
        : { endMin: 20 * 60, endColon: "20:00", nextDay: false };

    const dParts = String(rental.startDate).split("-");
    if (dParts.length !== 3) return { isOverdue: false, label: "", deadlineLabel: iv.endColon };

    const deadlineDate = new Date(
        parseInt(dParts[0], 10),
        parseInt(dParts[1], 10) - 1,
        parseInt(dParts[2], 10),
        0,
        iv.endMin,
        0
    );
    const diffMs = Date.now() - deadlineDate.getTime();
    if (diffMs <= 60000) return { isOverdue: false, label: "", deadlineLabel: iv.endColon };

    const overMins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(overMins / 60);
    const mins = overMins % 60;
    const label = hrs > 0 ? `LEWAT ${hrs} JAM ${mins} MNT` : `LEWAT ${mins} MENIT`;
    return { isOverdue: true, label, deadlineLabel: iv.endColon };
}

function sendGowesOverdueReminderWA(rentalId) {
    const r = (db.gowesRentals || []).find(x => String(x.id) === String(rentalId));
    if (!r) return;
    let digits = String(r.customerPhone || "").replace(/\D/g, "");
    if (digits.startsWith("0")) digits = "62" + digits.slice(1);
    else if (digits.startsWith("8")) digits = "62" + digits;
    const od = getGowesRentalOverdueInfo(r);
    const msg = `Halo Kak ${r.customerName || ""}, kami dari *${r.pickupLocation || "Titik Gowes"}*. Mengingatkan bahwa durasi sewa sepeda *${r.bikeName}* (${r.durationLabel}) sudah melewati batas waktu pengembalian (${od.deadlineLabel} WITA). Mohon konfirmasinya ya Kak, terima kasih!`;
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
}

function buildGowesOrderCardHtml(rental, options = {}) {
    const closeModalBeforeAction = !!options.closeModalBeforeAction;
    const preCloseJs = closeModalBeforeAction ? "closeSoloStatsModal();closeUserProfileModalCustom();" : "";

    const isPay = rental.status === "Menunggu Pembayaran";
    const isVerif = rental.status === "Menunggu Verifikasi";
    const isConfirmed = rental.status === "Terkonfirmasi";
    const isInUse = rental.status === "Sedang Digunakan";
    const isDone = rental.status === "Selesai";
    const isCanceled = rental.status === "Dibatalkan";

    const overdue = getGowesRentalOverdueInfo(rental);

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

    const offlineBadge = rental.isOffline
        ? `<span class="text-[9px] px-2 py-0.5 rounded-full ${rental.paymentMethod === 'cash' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'} font-extrabold uppercase">${rental.paymentMethod === 'cash' ? 'OFFLINE • CASH' : 'OFFLINE • QRIS'}</span>`
        : "";

    const overdueBadgeHtml = overdue.isOverdue
        ? `<span class="gowes-overdue-badge"><i class="fa-solid fa-clock mr-1"></i>${escHtml(overdue.label)}</span>`
        : "";

    const qtyText = rental.quantity ? `${rental.quantity} Unit` : "1 Unit";
    const priceInfo = rental.uniqueCode
        ? `${fmtRp(rental.totalPrice)} (Kode unik: ${rental.uniqueCode})`
        : `${fmtRp(rental.totalPrice)} (Tunai Pas)`;
    const multiSummaryHtml = (Array.isArray(rental.selectedBikes) && rental.selectedBikes.length > 1)
        ? `<p class="text-[10px] app-muted">${rental.selectedBikes.map((sb, i) => `#${i + 1} ${escHtml(sb.bikeName)}`).join(" • ")}</p>`
        : "";

    const canChatApp = rental.customerUsername && rental.customerUsername !== "walkin_offline";

    return `
        <div class="app-card border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-sm border-l-4 ${overdue.isOverdue ? 'border-l-red-600' : 'border-l-emerald-500'}">
            <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="gowes-brand-tag !text-[8.5px]"><i class="fa-solid fa-bicycle"></i> TITIK GOWES</span>
                    ${offlineBadge}
                    ${rental.branchCity ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-extrabold uppercase">${escHtml(rental.branchCity)}</span>` : ""}
                    ${statusBadge}
                    ${overdueBadgeHtml}
                </div>
                <h4 class="font-bold text-sm truncate">
                    ${escHtml(rental.bikeName)}
                    <span class="text-xs app-accent font-extrabold">(${qtyText})</span>
                    <span class="text-xs app-muted font-normal">(${escHtml(rental.customerName || rental.customerUsername)} • ${escHtml(rental.customerPhone || "-")})</span>
                </h4>
                ${multiSummaryHtml}
                <p class="text-xs app-muted">Paket: <strong class="app-accent">${escHtml(rental.durationLabel)}</strong> • ${priceInfo}${rental.cashierName ? ` • Kasir: <strong>${escHtml(rental.cashierName)}</strong>` : ""}</p>
                <div class="flex flex-wrap items-center gap-2 text-[10px] text-emerald-600 font-semibold pt-0.5">
                    <span><i class="fa-regular fa-calendar-check mr-1"></i>${escHtml(rental.startDate)} (${escHtml(rental.startTime)} WITA)</span>
                    <span>• Gerai: ${escHtml(rental.pickupLocation || "Shelter Utama")}</span>
                    ${rental.ktpHeldAtShop ? `<span class="text-purple-600"><i class="fa-solid fa-id-card mr-0.5"></i>KTP di Kasir</span>` : ""}
                    ${rental.handoverOutPhoto ? `<span class="text-blue-500"><i class="fa-solid fa-camera mr-0.5"></i>Foto Keluar ✓</span>` : ""}
                    ${rental.handoverInPhoto ? `<span class="text-emerald-500"><i class="fa-solid fa-camera mr-0.5"></i>Foto Kembali ✓</span>` : ""}
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 self-start md:self-center shrink-0">
                ${overdue.isOverdue ? `<button type="button" onclick="sendGowesOverdueReminderWA('${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-sm"><i class="fa-brands fa-whatsapp mr-1"></i>WA Pengingat</button>` : ""}
                ${canChatApp ? `<button type="button" onclick="${preCloseJs}openFullChatOverlay('${esc(rental.customerUsername)}')" class="px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/35 text-emerald-600 text-xs font-bold"><i class="fa-solid fa-comments mr-1"></i>Chat</button>` : ""}
                ${rental.ktpImage ? `<button type="button" onclick="viewGowesKtpModal('${esc(rental.ktpImage)}','${esc(rental.customerName || rental.customerUsername)}')" class="px-3 py-1.5 rounded-xl bg-purple-600/15 border border-purple-500/35 text-purple-600 text-xs font-bold"><i class="fa-solid fa-id-card mr-1"></i>KTP</button>` : ""}
                ${rental.paymentProof ? `<button type="button" onclick="viewOrderProof('gowes_rental','${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/35 text-blue-600 text-xs font-bold"><i class="fa-solid fa-receipt mr-1"></i>Bukti</button>` : ""}
                ${rental.isOffline && isPay && rental.paymentMethod === "qris" ? `<button type="button" onclick="openGowesOfflineQrisModal((db.gowesRentals||[]).find(x=>String(x.id)==='${esc(rental.id)}'))" class="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm"><i class="fa-solid fa-qrcode mr-1"></i>Scan QRIS</button>` : ""}
                ${(isVerif || (isPay && !rental.isOffline)) ? `<button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Terkonfirmasi',this)" class="gowes-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">✓ ACC Bayar</button>` : ""}
                ${isConfirmed ? `<button type="button" onclick="openGowesHandoverModal('${esc(rental.id)}','out')" class="px-3 py-1.5 rounded-xl app-card-soft border text-blue-600 text-xs font-bold"><i class="fa-solid fa-camera mr-1"></i>Foto Keluar</button><button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Sedang Digunakan',this)" class="gowes-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm"><i class="fa-solid fa-key mr-1"></i>Serahkan Unit</button>` : ""}
                ${isInUse ? `<button type="button" onclick="openGowesHandoverModal('${esc(rental.id)}','in')" class="px-3 py-1.5 rounded-xl app-card-soft border text-emerald-600 text-xs font-bold"><i class="fa-solid fa-camera mr-1"></i>Foto Kembali</button><button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Selesai',this)" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm">✓ Unit Selesai</button>` : ""}
                ${!isCanceled ? `<button type="button" onclick="openGowesReceiptModal('${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl app-card-soft border text-emerald-700 text-xs font-bold" title="Struk & Kirim WA"><i class="fa-solid fa-receipt mr-1"></i>Struk</button>` : ""}
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

    if (Array.isArray(res.upcomingBookings)) {
        db.gowesUpcomingBookings = res.upcomingBookings;
        db.gowesTodayBookings = res.upcomingBookings;
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
    const offlineCashRev = completedRentals.filter(r => r.isOffline && r.paymentMethod === "cash").reduce((s, r) => s + Number(r.totalPrice || 0), 0);
    const qrisRev = totalRevenue - offlineCashRev;

    const activeInUseCount = rentals.filter(r => r.status === "Sedang Digunakan").length;
    const readyBikesCount = bikes.filter(b => b.status === "Tersedia").length;
    const maintenanceCount = bikes.filter(b => b.status === "Servis").length;
    const totalFleet = bikes.length;
    const occupancyRate = totalFleet > 0 ? Math.round((activeInUseCount / totalFleet) * 100) : 0;

    const durationMap = { "Paket 1": 0, "Paket 2": 0, "Full Day": 0 };
    rentals.forEach(r => {
        const k = String(r.durationKey || "");
        if (k === "6_hours") durationMap["Paket 2"]++;
        else if (k === "full_day") durationMap["Full Day"]++;
        else durationMap["Paket 1"]++;
    });
    const maxDur = Math.max(1, durationMap["Paket 1"], durationMap["Paket 2"], durationMap["Full Day"]);

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

    const shelters = _getAdminSheltersList();
    const activeSh = typeof getActiveShelterObject === "function" ? getActiveShelterObject() : shelters[0];
    const isClosed = !!(activeSh && activeSh.isClosed);

    return `
        <div class="space-y-4">
            <div class="app-card border rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-2xl ${isClosed ? 'bg-red-500/20 text-red-500 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'} flex items-center justify-center text-lg">
                        <i class="fa-solid ${isClosed ? 'fa-store-slash' : 'fa-store'}"></i>
                    </span>
                    <div>
                        <strong class="text-xs sm:text-sm block">${shelters.length} Gerai Cabang Terdaftar (${escHtml(activeSh.city || "Utama")}: ${isClosed ? '<span class="text-red-500 font-extrabold">TUTUP</span>' : '<span class="text-emerald-600 font-extrabold">BUKA</span>'})</strong>
                        <span class="text-[10px] app-muted block">Cash Offline: ${fmtRp(offlineCashRev)} • QRIS: ${fmtRp(qrisRev)}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button type="button" onclick="if(typeof openGowesOfflinePosModal==='function')openGowesOfflinePosModal()" class="gowes-pill-btn px-3.5 py-2 rounded-xl text-xs shadow-sm">
                        <i class="fa-solid fa-cash-register mr-1"></i>Kasir Offline
                    </button>
                    <button type="button" onclick="openMasterWorkspace('gowes_fleet');switchGowesFleetAdminTab('shelters');" class="px-3.5 py-2 rounded-xl app-card-soft border gold-border text-xs font-bold app-accent shadow-sm">
                        <i class="fa-solid fa-sliders mr-1"></i>Gerai
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="app-card border rounded-2xl p-3.5 space-y-1 shadow-sm border-l-4 border-l-emerald-500">
                    <span class="text-[10px] app-muted font-bold uppercase block">Omzet Sewa Sepeda</span>
                    <strong class="text-base sm:text-lg font-extrabold text-emerald-600 block truncate">${fmtRp(totalRevenue)}</strong>
                    <span class="text-[10px] app-muted">${completedRentals.length} transaksi aktif/selesai</span>
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
                    <span class="text-[10px] app-muted">Online &amp; Walk-in</span>
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
                            <div class="flex justify-between text-[11px] font-bold mb-1"><span>Paket Singkat (Tarif 1)</span><span class="text-emerald-600">${durationMap["Paket 1"]}x</span></div>
                            <div class="w-full h-2 rounded-full app-card-soft overflow-hidden"><div class="h-full bg-emerald-500 rounded-full" style="width:${Math.round((durationMap["Paket 1"] / maxDur) * 100)}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between text-[11px] font-bold mb-1"><span>Paket Menengah (Tarif 2)</span><span class="text-blue-500">${durationMap["Paket 2"]}x</span></div>
                            <div class="w-full h-2 rounded-full app-card-soft overflow-hidden"><div class="h-full bg-blue-500 rounded-full" style="width:${Math.round((durationMap["Paket 2"] / maxDur) * 100)}%"></div></div>
                        </div>
                        <div>
                            <div class="flex justify-between text-[11px] font-bold mb-1"><span>Paket Full Day (Tarif 3)</span><span class="text-amber-500">${durationMap["Full Day"]}x</span></div>
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
