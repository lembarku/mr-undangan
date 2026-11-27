// =========================================================================
// TITIK GOWES — FRONTEND RENTAL, MULTI-CABANG & SHOWCASE CONTROLLER (js/gowes.js)
// Versi: V14.7 (Banner Full, Dropdown Lokasi Memanjang & Pemilih Sepeda Bergambar)
// =========================================================================

let gowesFilterType = "all";
let activeBookingBike = null;
let bookingSelectedBikeIds = [];
let gowesKtpDraft = "";
let gowesBannerIdx = 0;
let gowesShowcaseIdx = 0;
let gowesBannerTimer = null;
let gowesShowcaseTimer = null;
let activeGowesShelterId = "";
let openBookingBikePickerIdx = -1;

// ================= 1. DETEKSI & MANAJEMEN CABANG AKTIF OTOMATIS =================
function getGowesSheltersList() {
    if (Array.isArray(db.gowesShelters) && db.gowesShelters.length) return db.gowesShelters;
    if (typeof DEFAULT_GOWES_SHELTERS !== "undefined" && Array.isArray(DEFAULT_GOWES_SHELTERS) && DEFAULT_GOWES_SHELTERS.length) {
        return DEFAULT_GOWES_SHELTERS;
    }
    const single = db.gowesShelter || DEFAULT_GOWES_SHELTER;
    return [Object.assign({ id: "sh_smd_1", city: "Samarinda" }, single)];
}

function _matchBranchByKeyword(keyword) {
    const k = String(keyword || "").trim().toLowerCase().replace(/[_-]+/g, " ");
    if (!k) return null;
    const list = getGowesSheltersList();
    return list.find(s =>
        String(s.id || "").toLowerCase() === k ||
        String(s.city || "").toLowerCase().includes(k) ||
        String(s.name || "").toLowerCase().includes(k) ||
        k.includes(String(s.city || "").toLowerCase())
    ) || null;
}

function resolveInitialGowesBranch() {
    const list = getGowesSheltersList();
    if (!list.length) return DEFAULT_GOWES_SHELTER;

    // 1. Cek parameter URL (?branch=muara-jawa / ?cabang=samarinda / ?gerai=sanga-sanga)
    try {
        const q = new URLSearchParams(window.location.search);
        const qBranch = q.get("branch") || q.get("cabang") || q.get("gerai") || q.get("daerah") || "";
        if (qBranch) {
            const matchedUrl = _matchBranchByKeyword(qBranch);
            if (matchedUrl) {
                activeGowesShelterId = matchedUrl.id;
                localStorage.setItem(typeof GOWES_BRANCH_KEY !== "undefined" ? GOWES_BRANCH_KEY : "GOWES_ACTIVE_BRANCH_ID", matchedUrl.id);
                return matchedUrl;
            }
        }
    } catch {}

    // 2. Cek pilihan cabang yang aktif saat ini
    if (activeGowesShelterId) {
        const foundCur = list.find(s => String(s.id) === String(activeGowesShelterId));
        if (foundCur) return foundCur;
    }

    // 3. Cek simpanan localStorage terakhir di halaman/HP ini
    const savedId = localStorage.getItem(typeof GOWES_BRANCH_KEY !== "undefined" ? GOWES_BRANCH_KEY : "GOWES_ACTIVE_BRANCH_ID") || "";
    if (savedId) {
        const foundSaved = list.find(s => String(s.id) === String(savedId));
        if (foundSaved) {
            activeGowesShelterId = foundSaved.id;
            return foundSaved;
        }
    }

    // 4. Cek alamat profil pengguna yang sedang login (auto-match Muara Jawa / Sanga-Sanga / Samarinda)
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (curU && curU.address) {
        const matchedAddr = _matchBranchByKeyword(curU.address);
        if (matchedAddr) {
            activeGowesShelterId = matchedAddr.id;
            return matchedAddr;
        }
    }

    activeGowesShelterId = list[0].id;
    return list[0];
}

function getActiveShelterObject() {
    return resolveInitialGowesBranch();
}

function switchGowesActiveBranch(branchId) {
    const list = getGowesSheltersList();
    const target = list.find(s => String(s.id) === String(branchId));
    if (!target) return;
    activeGowesShelterId = target.id;
    localStorage.setItem(typeof GOWES_BRANCH_KEY !== "undefined" ? GOWES_BRANCH_KEY : "GOWES_ACTIVE_BRANCH_ID", target.id);
    renderGowesLandingPage();
    showToast(`Cabang aktif: ${target.city || target.name}`, "info");
}

// ================= 2. INISIALISASI & BERANDA TITIK GOWES =================
function renderGowesLandingPage() {
    const vGws = document.getElementById("view-gowes");
    if (!vGws || vGws.classList.contains("hide")) return;

    const shelter = getActiveShelterObject();
    const isClosed = !!(shelter && shelter.isClosed);

    const closedNotice = document.getElementById("gowes-closed-notice");
    const openContent = document.getElementById("gowes-open-content");
    const closedDesc = document.getElementById("gowes-closed-desc");
    const closedWaBtn = document.getElementById("gowes-closed-wa-btn");

    if (isClosed) {
        if (closedNotice) closedNotice.classList.remove("hide");
        if (openContent) openContent.classList.add("hide");
        if (closedDesc) {
            closedDesc.innerText = shelter.closedReason || `Garasi ${shelter.name} sedang istirahat / tutup sementara. Kami siap melayani kembali pada jadwal operasional berikutnya.`;
        }
        if (closedWaBtn) {
            const rawPhone = String(shelter.csPhone || "085117488828").replace(/\D/g, "");
            closedWaBtn.href = `https://wa.me/${rawPhone}?text=${encodeURIComponent("Halo Admin " + (shelter.name || "Titik Gowes") + ", saya ingin menanyakan jadwal buka rental sepeda.")}`;
        }
        return;
    }

    if (closedNotice) closedNotice.classList.add("hide");
    if (openContent) openContent.classList.remove("hide");

    renderGowesBannerSlider();
    renderGowesCategoryFilters();
    renderGowesShowcaseTrack();
    renderGowesShelterSection();
    startGowesAutoSlides();
}

// ================= 3. PETA GOOGLE MAPS ELEGAN & PILIHAN GERAI DAERAH =================
function _buildGoogleMapsEmbedUrl(shelter) {
    if (!shelter) return "https://maps.google.com/maps?q=Samarinda&t=&z=14&ie=UTF8&iwloc=&output=embed";
    let q = String(shelter.mapsQuery || "").trim();
    if (!q && shelter.mapsUrl) {
        const mCoords = String(shelter.mapsUrl).match(/[?&](?:q|ll)=([^&]+)/i);
        if (mCoords) {
            try { q = decodeURIComponent(mCoords[1]); } catch { q = mCoords[1]; }
        } else {
            const mAt = String(shelter.mapsUrl).match(/@(-?\d+\.\d+,-?\d+\.\d+)/);
            if (mAt) q = mAt[1];
        }
    }
    if (!q) q = [shelter.name, shelter.address, shelter.city].filter(Boolean).join(", ");
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
}

function toggleGowesBranchDropdown(forceState = null) {
    const menu = document.getElementById("gowes-branch-dropdown-menu");
    const btn = document.getElementById("gowes-branch-dropdown-btn");
    const chev = document.getElementById("gowes-branch-dd-chevron");
    if (!menu || !btn) return;
    const willOpen = forceState !== null ? !!forceState : menu.classList.contains("hide");
    menu.classList.toggle("hide", !willOpen);
    btn.classList.toggle("is-open", willOpen);
    if (chev) chev.style.transform = willOpen ? "rotate(180deg)" : "rotate(0deg)";
}

function selectGowesBranchFromDropdown(branchId) {
    toggleGowesBranchDropdown(false);
    switchGowesActiveBranch(branchId);
}

function renderGowesShelterSection() {
    const container = document.getElementById("sec-gowes-shelter");
    if (!container) return;

    const shelters = getGowesSheltersList();
    const current = getActiveShelterObject();
    const mapsHref = current.mapsUrl || `https://maps.google.com/?q=${encodeURIComponent(current.address || current.city || "Samarinda")}`;
    const embedUrl = _buildGoogleMapsEmbedUrl(current);

    const dropdownItemsHtml = shelters.map(s => {
        const isSel = String(s.id) === String(current.id);
        return `
            <button type="button" onclick="selectGowesBranchFromDropdown('${esc(s.id)}')" class="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left transition hover:bg-emerald-500/10 ${isSel ? 'bg-emerald-500/10' : ''}">
                <div class="flex items-center gap-2.5 min-w-0 flex-1">
                    <span class="w-8 h-8 rounded-xl ${isSel ? 'bg-emerald-500 text-white' : 'app-card-soft border text-emerald-600'} flex items-center justify-center text-xs shrink-0">
                        <i class="fa-solid fa-location-dot"></i>
                    </span>
                    <div class="min-w-0">
                        <div class="flex items-center gap-1.5">
                            <strong class="text-xs sm:text-sm font-extrabold truncate">${escHtml(s.city || s.name)}</strong>
                            ${s.isClosed ? `<span class="text-[8.5px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-500 font-extrabold uppercase shrink-0">Tutup</span>` : ""}
                        </div>
                        <p class="text-[10px] app-muted truncate">${escHtml(s.address || s.name)}</p>
                    </div>
                </div>
                ${isSel ? `<i class="fa-solid fa-circle-check text-emerald-600 text-base shrink-0"></i>` : `<i class="fa-regular fa-circle app-muted text-sm opacity-45 shrink-0"></i>`}
            </button>
        `;
    }).join("");

    container.innerHTML = `
        <div class="space-y-3">
            <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <div>
                        <span class="gowes-brand-tag">GERAI &amp; POS GARASI</span>
                        <h4 class="text-xs font-extrabold uppercase app-muted tracking-wider mt-1">Pilih Cabang Daerah</h4>
                    </div>
                    <span class="text-[10px] font-bold text-emerald-600">${shelters.length} Lokasi</span>
                </div>

                <!-- Tombol Dropdown Lokasi Memanjang Profesional -->
                <div id="gowes-branch-dropdown-wrap" class="relative">
                    <button type="button" id="gowes-branch-dropdown-btn" onclick="toggleGowesBranchDropdown()" class="gowes-branch-select-btn" aria-haspopup="listbox">
                        <span class="flex items-center gap-2.5 min-w-0 flex-1">
                            <span class="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs shadow-sm shrink-0">
                                <i class="fa-solid fa-location-dot"></i>
                            </span>
                            <span class="min-w-0 flex-1">
                                <span class="block text-xs sm:text-sm font-extrabold truncate leading-tight">${escHtml(current.city || current.name)}</span>
                                <span class="block text-[10px] app-muted truncate">${escHtml(current.name)}</span>
                            </span>
                        </span>
                        <span class="flex items-center gap-1.5 shrink-0">
                            <span class="text-[9.5px] font-extrabold text-emerald-600 uppercase hidden sm:inline">Ganti Lokasi</span>
                            <i id="gowes-branch-dd-chevron" class="fa-solid fa-chevron-down text-xs text-emerald-600 transition-transform duration-200"></i>
                        </span>
                    </button>

                    <div id="gowes-branch-dropdown-menu" class="hide gowes-branch-dropdown-menu divide-y divide-black/10">
                        ${dropdownItemsHtml}
                    </div>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div class="flex items-center gap-3 min-w-0 flex-1">
                    <div class="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 flex items-center justify-center text-lg shrink-0">
                        <i class="fa-solid fa-store"></i>
                    </div>
                    <div class="min-w-0">
                        <h3 id="gowes-shelter-name" class="font-extrabold text-sm sm:text-base truncate">${escHtml(current.name)}</h3>
                        <p id="gowes-shelter-address" class="text-[11px] app-muted line-clamp-2">${escHtml(current.address)}</p>
                    </div>
                </div>
                <a id="gowes-shelter-map-btn" href="${esc(mapsHref)}" target="_blank" rel="noopener noreferrer" class="gowes-pill-btn px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow shrink-0">
                    <i class="fa-solid fa-diamond-turn-right"></i> Rute Maps
                </a>
            </div>

            <!-- Tampilan Maps Elegan Mengacu Google Maps (Klik untuk Navigasi Langsung) -->
            <div class="gowes-map-card-frame shadow-sm">
                <iframe src="${esc(embedUrl)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Peta ${escHtml(current.name)}"></iframe>
                <a href="${esc(mapsHref)}" target="_blank" rel="noopener noreferrer" class="gowes-map-click-overlay" title="Buka rute di Google Maps">
                    <div class="flex items-center justify-between gap-2">
                        <div class="min-w-0 text-white">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-extrabold uppercase shadow">
                                <i class="fa-solid fa-map-pin text-[8px]"></i> ${escHtml(current.city || "Lokasi Resmi")}
                            </span>
                            <p class="text-xs font-extrabold truncate mt-1 drop-shadow">${escHtml(current.name)}</p>
                        </div>
                        <span class="px-3 py-1.5 rounded-xl bg-white/95 text-zinc-900 text-[10px] font-extrabold shadow shrink-0 flex items-center gap-1">
                            <i class="fa-solid fa-location-arrow text-emerald-600"></i> Buka Maps
                        </span>
                    </div>
                </a>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t gold-border text-[11px]">
                <div class="flex items-center gap-1.5"><i class="fa-regular fa-clock text-emerald-600"></i><span id="gowes-hours-lbl" class="app-muted font-medium">Buka: ${escHtml(current.operationalHours || "05.30 - 20.00 WITA")}</span></div>
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-shield-halved text-emerald-600"></i><span class="app-muted font-medium">Jaminan: KTP / SIM Asli</span></div>
                <div class="flex items-center gap-1.5"><i class="fa-solid fa-helmet-safety text-emerald-600"></i><span class="app-muted font-medium">Gratis Helm &amp; Kunci</span></div>
            </div>
        </div>
    `;
}

// Tutup dropdown lokasi jika klik di luar area dropdown
if (!window.__gowesBranchOutsideBound) {
    window.__gowesBranchOutsideBound = true;
    document.addEventListener("click", (ev) => {
        const wrap = document.getElementById("gowes-branch-dropdown-wrap");
        if (wrap && !wrap.contains(ev.target)) {
            toggleGowesBranchDropdown(false);
        }
    });
}

// ================= 4. BANNER PROMOSI RAMPING 16 : 5 (GAYA REALISTIS) =================
function _getGowesBannersList() {
    if (Array.isArray(db.gowesBanners) && db.gowesBanners.length) return db.gowesBanners;
    return DEFAULT_GOWES_BANNERS;
}

function renderGowesBannerSlider() {
    const track = document.getElementById("gowes-banner-track");
    if (!track) return;
    const slides = _getGowesBannersList();
    if (gowesBannerIdx >= slides.length) gowesBannerIdx = 0;

    const safeDefaultImg = "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=1200&q=80";
    track.innerHTML = slides.map((s, idx) => {
        const primaryImg = (s.img && String(s.img).trim()) ? s.img : safeDefaultImg;
        return `
            <div onclick="handleGowesBannerClick(${idx})" class="min-w-full h-full relative flex items-center px-5 sm:px-8 cursor-pointer select-none overflow-hidden" style="background:linear-gradient(135deg,#064e3b 0%,#0f172a 55%,#09090b 100%);">
                <img src="${esc(primaryImg)}" alt="" onerror="if(this.dataset.tried!=='1'){this.dataset.tried='1';this.src='${safeDefaultImg}';}else{this.style.display='none';}" class="absolute inset-0 w-full h-full object-cover object-center">
                <div class="absolute inset-0 bg-gradient-to-r from-black/78 via-black/38 to-black/15"></div>
                <div class="relative z-10 max-w-[74%] sm:max-w-md space-y-1 text-white">
                    <h3 class="gowes-banner-headline text-base sm:text-2xl leading-[1.12] text-white">${escHtml(s.title || "SEHAT & BAHAGIA DENGAN BERSEPEDA!")}</h3>
                    <p class="text-[10.5px] sm:text-xs text-white/90 font-semibold italic line-clamp-2 drop-shadow">${escHtml(s.subtitle || "RASAKAN MANFAATNYA!")}</p>
                    ${s.ctaText ? `<span class="inline-block mt-1 px-3 py-1 rounded-lg bg-emerald-500/90 text-[10px] font-extrabold text-white shadow">${escHtml(s.ctaText)} <i class="fa-solid fa-arrow-right ml-1 text-[8px]"></i></span>` : ""}
                </div>
            </div>
        `;
    }).join("");

    updateGowesBannerPos();
}

function updateGowesBannerPos() {
    const track = document.getElementById("gowes-banner-track");
    if (track) track.style.transform = `translateX(-${gowesBannerIdx * 100}%)`;
}

function handleGowesBannerClick(idx) {
    const s = _getGowesBannersList()[idx];
    if (!s) return;
    if (!s.targetSection || s.targetSection === "open_booking" || s.targetSection === "sec-gowes-booking-cta") {
        openGowesBookingModal();
        return;
    }
    const targetEl = document.getElementById(s.targetSection);
    if (targetEl) targetEl.scrollIntoView({ behavior: "smooth" });
    else openGowesBookingModal();
}

// ================= 5. STATUS KETERSEDIAAN HARI INI & JADWAL BOOKED RINGKAS =================
function _formatBookingSlotRange(startTime, durationKey) {
    const cleanTime = String(startTime || "08:00").trim();
    const parts = cleanTime.split(":");
    let hh = parseInt(parts[0], 10);
    let mm = parseInt(parts[1], 10);
    if (isNaN(hh)) hh = 8;
    if (isNaN(mm)) mm = 0;

    let endHh = hh + 2;
    if (durationKey === "6_hours") endHh = hh + 6;
    else if (durationKey === "full_day") endHh = 20;
    if (endHh > 20 && durationKey === "full_day") endHh = 20;
    endHh = endHh % 24;

    const startLbl = `${String(hh).padStart(2, "0")}.${String(mm).padStart(2, "0")}`;
    const endLbl = `${String(endHh).padStart(2, "0")}.${String(mm).padStart(2, "0")}`;
    return `${startLbl}-${endLbl}`;
}

function getBikeTodayBookingSlots(bikeId) {
    const todayStr = new Date().toISOString().split("T")[0];
    const sources = [];
    if (Array.isArray(db.gowesTodayBookings)) sources.push(...db.gowesTodayBookings);
    if (Array.isArray(db.gowesRentals)) sources.push(...db.gowesRentals);

    const seenIds = new Set();
    const slots = [];

    sources.forEach(r => {
        if (!r) return;
        const rid = String(r.id || `${r.bikeId}_${r.startDate}_${r.startTime}`);
        if (seenIds.has(rid)) return;
        seenIds.add(rid);

        const st = String(r.status || "");
        if (st === "Dibatalkan" || st === "Selesai") return;
        if (String(r.startDate || "") !== todayStr) return;

        const matchesBike = (Array.isArray(r.selectedBikes) && r.selectedBikes.length)
            ? r.selectedBikes.some(sb => String(sb.bikeId) === String(bikeId))
            : String(r.bikeId) === String(bikeId);

        if (matchesBike) {
            slots.push({
                startTime: r.startTime || "08:00",
                rangeText: _formatBookingSlotRange(r.startTime, r.durationKey)
            });
        }
    });

    slots.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
    return Array.from(new Set(slots.map(x => x.rangeText)));
}

function buildBikeStatusBadgesHtml(bike) {
    if (bike.status === "Servis") {
        return `<span class="px-2.5 py-0.5 rounded-full bg-zinc-700/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider shadow">✕ Masa Servis</span>`;
    }

    const todaySlots = getBikeTodayBookingSlots(bike.id);
    if (todaySlots.length > 0) {
        const compactRanges = todaySlots.length <= 2
            ? todaySlots.join(" & ")
            : `${todaySlots.slice(0, 2).join(", ")} +${todaySlots.length - 2}`;
        return `
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider shadow">● Ready Hari Ini</span>
            <span class="px-2.5 py-0.5 rounded-full bg-amber-400/95 backdrop-blur-md text-zinc-950 font-extrabold text-[9px] tracking-tight shadow" title="Sudah dibooking hari ini pada jam tersebut">
                <i class="fa-regular fa-clock mr-1"></i>Booked ${escHtml(compactRanges)}
            </span>
        `;
    }

    if (bike.status === "Sedang Disewa") {
        return `<span class="px-2.5 py-0.5 rounded-full bg-amber-400/95 backdrop-blur-md text-zinc-950 font-extrabold text-[9px] uppercase tracking-wider shadow">● Sedang Dipakai</span>`;
    }

    return `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider shadow">● Ready Hari Ini</span>`;
}

// ================= 6. FILTER TIPE & SHOWCASE PILIHAN SEPEDA (4:3 ELEGAN) =================
function renderGowesCategoryFilters() {
    const box = document.getElementById("gowes-category-filters");
    if (!box) return;

    const cats = (Array.isArray(db.gowesCategories) && db.gowesCategories.length)
        ? db.gowesCategories.filter(c => c && c.active !== false)
        : DEFAULT_GOWES_CATEGORIES;

    box.innerHTML = cats.map(c => `
        <button type="button" onclick="filterGowesBikes('${esc(c.id)}')" data-gt="${esc(c.id)}" class="gowes-filter-btn ${gowesFilterType === c.id ? 'active' : ''}">
            ${escHtml(c.name)}
        </button>
    `).join("");
}

function filterGowesBikes(typeId) {
    gowesFilterType = typeId || "all";
    gowesShowcaseIdx = 0;
    document.querySelectorAll(".gowes-filter-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.gt === gowesFilterType);
    });
    renderGowesShowcaseTrack();
}

function getAvailableGowesBikes() {
    const list = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    return list.filter(b => b && b.status !== "Dihapus");
}

function renderGowesShowcaseDots(count) {
    const dotsBox = document.getElementById("gowes-showcase-dots");
    if (!dotsBox) return;
    if (count <= 1) {
        dotsBox.innerHTML = "";
        return;
    }
    dotsBox.innerHTML = Array.from({ length: count }, (_, i) => {
        const active = i === gowesShowcaseIdx;
        return `<button type="button" onclick="jumpToGowesShowcaseSlide(${i})" class="gowes-dot-btn ${active ? 'w-5 bg-emerald-500' : 'w-1.5 bg-zinc-400/50'}" aria-label="Unit ${i + 1}"></button>`;
    }).join("");
}

function jumpToGowesShowcaseSlide(idx) {
    const track = document.getElementById("gowes-showcase-track");
    if (!track || !track.children.length) return;
    gowesShowcaseIdx = Math.max(0, Math.min(track.children.length - 1, idx));
    const targetSlide = track.children[gowesShowcaseIdx];
    if (targetSlide) {
        track.scrollTo({ left: targetSlide.offsetLeft, behavior: "smooth" });
    }
    renderGowesShowcaseDots(track.children.length);
}

function renderGowesShowcaseTrack() {
    const track = document.getElementById("gowes-showcase-track");
    const countBadge = document.getElementById("gowes-bike-count-badge");
    if (!track) return;

    let bikes = getAvailableGowesBikes();
    if (gowesFilterType !== "all") {
        bikes = bikes.filter(b => String(b.type || "").toLowerCase().includes(gowesFilterType.toLowerCase()));
    }

    if (countBadge) {
        const readyCnt = bikes.filter(b => b.status !== "Servis").length;
        countBadge.innerText = `${readyCnt} Unit Ready`;
    }

    if (!bikes.length) {
        track.innerHTML = `
            <div class="w-full py-14 px-4 text-center app-card border border-dashed rounded-3xl space-y-2">
                <i class="fa-solid fa-bicycle text-4xl text-emerald-600/60"></i>
                <h4 class="font-extrabold text-sm">Tidak Ada Unit di Kategori Ini</h4>
                <p class="text-xs app-muted">Silakan pilih kategori sepeda lain atau hubungi petugas kami via Live Chat.</p>
            </div>
        `;
        renderGowesShowcaseDots(0);
        return;
    }

    if (gowesShowcaseIdx >= bikes.length) gowesShowcaseIdx = 0;
    const fallbackImg = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";

    track.innerHTML = bikes.map((b, idx) => {
        const isMaintenance = b.status === "Servis";
        const statusBadgesHtml = buildBikeStatusBadgesHtml(b);
        const l2h = b.label2Hours || "2 Jam";
        const l6h = b.label6Hours || "6 Jam";
        const lFull = b.labelFullDay || "Full Day";

        const actionBtn = !isMaintenance
            ? `<button type="button" onclick="openGowesBookingModal('${esc(b.id)}')" class="w-full gowes-pill-btn py-3 rounded-2xl text-xs uppercase tracking-wider font-extrabold shadow-xl flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-bicycle"></i> Sewa Unit Ini
               </button>`
            : `<button type="button" disabled class="w-full py-3 rounded-2xl bg-white/15 text-white/60 text-xs font-bold text-center cursor-not-allowed">
                Dalam Masa Servis
               </button>`;

        return `
            <div class="gowes-showcase-slide" data-slide-idx="${idx}">
                <div class="gowes-showcase-photo-box">
                    <img src="${b.image || fallbackImg}" alt="${escHtml(b.name)}" loading="lazy">
                    <div class="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none"></div>
                    <div class="absolute top-3 inset-x-3 z-10 flex items-center gap-1.5 flex-wrap">
                        ${statusBadgesHtml}
                        <span class="px-2.5 py-0.5 rounded-full bg-black/55 text-white text-[9px] font-bold backdrop-blur-md border border-white/20">${escHtml(b.type || "Sepeda")}</span>
                    </div>
                    <div class="gowes-showcase-photo-fade"></div>
                </div>

                <div class="gowes-showcase-info">
                    <div>
                        <h3 class="text-lg sm:text-xl font-extrabold leading-tight text-white">${escHtml(b.name)}</h3>
                        <p class="text-[11px] text-zinc-300 line-clamp-2 mt-0.5">${escHtml(b.description || "")}</p>
                    </div>

                    <div class="flex flex-wrap gap-1.5 text-[10px]">
                        ${b.frameSize ? `<span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold"><i class="fa-solid fa-ruler-combined text-emerald-400 mr-1"></i>${escHtml(b.frameSize)}</span>` : ""}
                        ${b.gears ? `<span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold"><i class="fa-solid fa-gear text-emerald-400 mr-1"></i>${escHtml(b.gears)}</span>` : ""}
                        ${b.brakes ? `<span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold"><i class="fa-solid fa-circle-stop text-emerald-400 mr-1"></i>${escHtml(b.brakes)}</span>` : ""}
                    </div>

                    <div class="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-white/5 border border-white/15 text-center">
                        <div class="p-1">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block truncate">${escHtml(l2h)}</span>
                            <strong class="text-xs font-extrabold text-emerald-400 block">${fmtRp(b.price2Hours || 40000)}</strong>
                        </div>
                        <div class="p-1 border-x border-white/15">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block truncate">${escHtml(l6h)}</span>
                            <strong class="text-xs font-extrabold text-emerald-400 block">${fmtRp(b.price6Hours || 75000)}</strong>
                        </div>
                        <div class="p-1">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block truncate">${escHtml(lFull)}</span>
                            <strong class="text-xs font-extrabold text-emerald-400 block">${fmtRp(b.priceFullDay || 120000)}</strong>
                        </div>
                    </div>

                    <div class="pt-0.5">
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
    }).join("");

    renderGowesShowcaseDots(bikes.length);

    if (!track.dataset.dotScrollBound) {
        track.dataset.dotScrollBound = "1";
        let dotRaf = null;
        track.addEventListener("scroll", () => {
            if (dotRaf) return;
            dotRaf = requestAnimationFrame(() => {
                dotRaf = null;
                const slideW = track.clientWidth || window.innerWidth || 1;
                const nextIdx = Math.round(track.scrollLeft / slideW);
                if (nextIdx !== gowesShowcaseIdx && nextIdx >= 0 && nextIdx < track.children.length) {
                    gowesShowcaseIdx = nextIdx;
                    renderGowesShowcaseDots(track.children.length);
                }
            });
        }, { passive: true });
    }
}

function startGowesAutoSlides() {
    clearInterval(gowesBannerTimer);
    clearInterval(gowesShowcaseTimer);

    gowesBannerTimer = setInterval(() => {
        if (document.hidden || currentViewName !== "landing" || currentAppMode !== "titik_gowes") return;
        const banners = _getGowesBannersList();
        if (banners.length > 1) {
            gowesBannerIdx = (gowesBannerIdx + 1) % banners.length;
            updateGowesBannerPos();
        }
    }, 4500);

    gowesShowcaseTimer = setInterval(() => {
        if (document.hidden || currentViewName !== "landing" || currentAppMode !== "titik_gowes") return;
        const track = document.getElementById("gowes-showcase-track");
        if (!track || track.children.length <= 1) return;

        gowesShowcaseIdx = (gowesShowcaseIdx + 1) % track.children.length;
        const targetSlide = track.children[gowesShowcaseIdx];
        if (targetSlide) {
            track.scrollTo({ left: targetSlide.offsetLeft, behavior: "smooth" });
        }
        renderGowesShowcaseDots(track.children.length);
    }, 6500);
}

// ================= 7. FORMULIR SEWA MULTI-SEPEDA & CABANG OTOMATIS =================
function getSelectedBookingBikesObjects() {
    const bikes = getAvailableGowesBikes();
    if (!bikes.length) return [];
    const fallbackBike = bikes.find(b => b.status !== "Servis") || bikes[0];
    return bookingSelectedBikeIds.map(id => {
        return bikes.find(b => String(b.id) === String(id)) || fallbackBike;
    });
}

function toggleBookingBikePicker(slotIdx) {
    openBookingBikePickerIdx = (openBookingBikePickerIdx === slotIdx) ? -1 : slotIdx;
    renderBookingBikeSelectors();
}

function pickBookingBikeVisual(slotIdx, bikeId) {
    openBookingBikePickerIdx = -1;
    onBookingBikeSlotChange(slotIdx, bikeId);
    renderBookingBikeSelectors();
}

function renderBookingBikeSelectors() {
    const box = document.getElementById("gw-book-bikes-container");
    if (!box) return;
    const bikes = getAvailableGowesBikes();
    const fallbackImg = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";

    if (!bikes.length) {
        box.innerHTML = `<p class="text-xs text-red-500 font-bold">Belum ada unit sepeda tersedia.</p>`;
        return;
    }

    const totalUnits = bookingSelectedBikeIds.length || 1;
    box.innerHTML = bookingSelectedBikeIds.map((selId, idx) => {
        const labelTxt = totalUnits > 1 ? `Pilih Unit Sepeda #${idx + 1}` : "Pilih Unit Sepeda";
        const selBike = bikes.find(b => String(b.id) === String(selId)) || bikes.find(b => b.status !== "Servis") || bikes[0];
        const isOpen = openBookingBikePickerIdx === idx;
        const selSlots = getBikeTodayBookingSlots(selBike.id);
        const selBadgeHtml = selBike.status === "Servis"
            ? `<span class="inline-block px-1.5 py-0.5 rounded-md bg-zinc-600/20 text-zinc-500 text-[9px] font-extrabold">Masa Servis</span>`
            : selSlots.length
                ? `<span class="inline-block px-1.5 py-0.5 rounded-md bg-amber-400/25 text-amber-700 text-[9px] font-extrabold">Booked ${escHtml(selSlots[0])}</span>`
                : `<span class="inline-block px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 text-[9px] font-extrabold">● Ready Hari Ini</span>`;

        const listItemsHtml = bikes.map(b => {
            const isSel = String(b.id) === String(selBike.id);
            const isMaint = b.status === "Servis";
            const slots = getBikeTodayBookingSlots(b.id);
            const statusPill = isMaint
                ? `<span class="px-1.5 py-0.5 rounded bg-zinc-500/20 text-zinc-500 text-[8.5px] font-extrabold uppercase">Servis</span>`
                : slots.length
                    ? `<span class="px-1.5 py-0.5 rounded bg-amber-400/30 text-amber-800 text-[8.5px] font-extrabold">Booked ${escHtml(slots[0])}</span>`
                    : `<span class="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 text-[8.5px] font-extrabold">● Ready</span>`;

            const specsLine = [b.type, b.frameSize, b.gears].filter(Boolean).join(" • ");

            return `
                <button type="button" ${isMaint ? "disabled" : `onclick="pickBookingBikeVisual(${idx},'${esc(b.id)}')"`} class="w-full p-2.5 flex items-center gap-3 text-left transition ${isSel ? 'bg-emerald-500/12' : 'hover:bg-black/5'} ${isMaint ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}">
                    <img src="${esc(b.image || fallbackImg)}" alt="${escHtml(b.name)}" onerror="this.src='${fallbackImg}'" class="w-16 h-12 rounded-xl object-cover bg-black border gold-border shrink-0">
                    <div class="min-w-0 flex-1 space-y-0.5">
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <strong class="text-xs font-extrabold truncate">${escHtml(b.name)}</strong>
                            ${statusPill}
                        </div>
                        <p class="text-[10px] app-muted truncate">${escHtml(specsLine || "Sepeda Siap Gowes")}</p>
                        <p class="text-[10.5px] font-extrabold text-emerald-600">${fmtRp(b.price2Hours || 40000)} <span class="font-normal app-muted">/ ${escHtml(b.label2Hours || "2 Jam")}</span></p>
                    </div>
                    <span class="shrink-0 pr-1">
                        ${isSel
                            ? `<i class="fa-solid fa-circle-check text-emerald-600 text-base"></i>`
                            : `<i class="fa-regular fa-circle app-muted text-base opacity-45"></i>`}
                    </span>
                </button>
            `;
        }).join("");

        return `
            <div class="space-y-1">
                <label class="app-label">${labelTxt}</label>
                <input type="hidden" id="gw-book-bike-select-${idx}" value="${esc(selBike.id)}">
                <button type="button" id="gw-bike-picker-btn-${idx}" onclick="toggleBookingBikePicker(${idx})" class="gowes-bike-picker-trigger ${isOpen ? 'is-open' : ''}">
                    <img src="${esc(selBike.image || fallbackImg)}" alt="${escHtml(selBike.name)}" onerror="this.src='${fallbackImg}'" class="w-16 h-12 rounded-xl object-cover bg-black border gold-border shrink-0">
                    <div class="min-w-0 flex-1 space-y-0.5">
                        <strong class="text-xs sm:text-sm font-extrabold block truncate leading-tight">${escHtml(selBike.name)}</strong>
                        <span class="text-[10px] app-muted block truncate">${escHtml(selBike.type || "Sepeda")} • <strong class="text-emerald-600">${fmtRp(selBike.price2Hours || 40000)}</strong></span>
                        <div>${selBadgeHtml}</div>
                    </div>
                    <div class="flex flex-col items-end gap-0.5 shrink-0 pr-0.5">
                        <span class="text-[9px] font-bold text-emerald-600 uppercase">${isOpen ? 'Tutup' : 'Ganti'}</span>
                        <i class="fa-solid fa-chevron-down text-xs text-emerald-600 transition-transform duration-200" style="transform:${isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}"></i>
                    </div>
                </button>
                <div id="gw-bike-picker-list-${idx}" class="${isOpen ? '' : 'hide'} gowes-bike-picker-list divide-y divide-black/10">
                    ${listItemsHtml}
                </div>
            </div>
        `;
    }).join("");
}

function onBookingBikeSlotChange(slotIdx, bikeId) {
    bookingSelectedBikeIds[slotIdx] = bikeId;
    const bikes = getAvailableGowesBikes();
    if (slotIdx === 0) {
        activeBookingBike = bikes.find(b => String(b.id) === String(bikeId)) || activeBookingBike;
        _refreshBookingBranchBadge();
    }
    updateGowesBookingPriceCalc();
}

function _refreshBookingBranchBadge() {
    const branchBadge = document.getElementById("gw-book-branch-badge");
    if (!branchBadge || !activeBookingBike) return;
    const currentBranch = getActiveShelterObject();
    const bookedToday = getBikeTodayBookingSlots(activeBookingBike.id);
    const bookedHint = bookedToday.length
        ? `<span class="block text-[10px] text-amber-600 font-bold mt-1"><i class="fa-regular fa-clock mr-1"></i>Info hari ini: unit #1 terbooking jam ${escHtml(bookedToday.join(" & "))} WITA — pilih jam lain yang kosong.</span>`
        : "";
    branchBadge.innerHTML = `
        <div class="rounded-2xl p-3 bg-emerald-500/10 border border-emerald-500/35 space-y-0.5">
            <div class="flex items-center justify-between gap-2 text-xs">
                <strong class="text-emerald-700 truncate"><i class="fa-solid fa-location-dot mr-1.5"></i>Form Cabang ${escHtml(currentBranch.city || "Utama")}</strong>
                <span class="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold shrink-0">OTOMATIS</span>
            </div>
            <p class="text-[10.5px] app-muted truncate">${escHtml(currentBranch.name)} • ${escHtml(currentBranch.address)}</p>
            ${bookedHint}
        </div>
    `;
}

function changeBookingBikeQty(delta) {
    const inp = document.getElementById("gw-book-qty");
    const lbl = document.getElementById("gw-book-qty-lbl");
    if (!inp || !lbl) return;

    const bikes = getAvailableGowesBikes();
    const readyBikes = bikes.filter(b => b.status !== "Servis");
    const pool = readyBikes.length ? readyBikes : bikes;

    let cur = parseInt(inp.value, 10) || 1;
    cur = Math.max(1, Math.min(10, cur + delta));
    inp.value = cur;
    lbl.innerText = String(cur);

    while (bookingSelectedBikeIds.length < cur) {
        const nextCandidate = pool[bookingSelectedBikeIds.length % pool.length] || pool[0];
        bookingSelectedBikeIds.push(nextCandidate ? nextCandidate.id : "");
    }
    if (bookingSelectedBikeIds.length > cur) {
        bookingSelectedBikeIds = bookingSelectedBikeIds.slice(0, cur);
    }

    renderBookingBikeSelectors();
    updateGowesBookingPriceCalc();
}

function updateGowesReturnEstimate() {
    const timeInp = document.getElementById("gw-book-time");
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const textEl = document.getElementById("gw-return-estimate-text");
    if (!textEl) return;

    const timeVal = timeInp ? timeInp.value : "";
    const durVal = durRadio ? durRadio.value : "2_hours";
    const firstBike = getSelectedBookingBikesObjects()[0];
    const lbl2 = (firstBike && firstBike.label2Hours) || "2 Jam";
    const lbl6 = (firstBike && firstBike.label6Hours) || "6 Jam";
    const lblFull = (firstBike && firstBike.labelFullDay) || "Full Day";

    if (!timeVal) {
        textEl.innerText = "Pilih jam ambil untuk melihat perkiraan batas kembali";
        return;
    }

    const [hhStr, mmStr] = timeVal.split(":");
    let hh = parseInt(hhStr, 10);
    let mm = parseInt(mmStr, 10);
    if (isNaN(hh)) hh = 6;
    if (isNaN(mm)) mm = 0;

    if (durVal === "2_hours") {
        let returnHh = hh + 2;
        let dayNote = "";
        if (returnHh >= 24) { returnHh %= 24; dayNote = " (Besok)"; }
        textEl.innerHTML = `Batas kembali: <strong>Pukul ${String(returnHh).padStart(2, "0")}:${String(mm).padStart(2, "0")} WITA${dayNote}</strong> (${escHtml(lbl2)})`;
    } else if (durVal === "6_hours") {
        let returnHh = hh + 6;
        let dayNote = "";
        if (returnHh >= 24) { returnHh %= 24; dayNote = " (Besok)"; }
        textEl.innerHTML = `Batas kembali: <strong>Pukul ${String(returnHh).padStart(2, "0")}:${String(mm).padStart(2, "0")} WITA${dayNote}</strong> (${escHtml(lbl6)})`;
    } else {
        textEl.innerHTML = `Batas kembali: <strong>Pukul 20.00 WITA</strong> hari yang sama (${escHtml(lblFull)})`;
    }
}

function updateGowesBookingPriceCalc() {
    const selectedObjs = getSelectedBookingBikesObjects();
    if (!selectedObjs.length) return;

    const first = selectedObjs[0];
    const sum2h = selectedObjs.reduce((s, b) => s + Number(b.price2Hours || 40000), 0);
    const sum6h = selectedObjs.reduce((s, b) => s + Number(b.price6Hours || 75000), 0);
    const sumFull = selectedObjs.reduce((s, b) => s + Number(b.priceFullDay || 120000), 0);

    const l2 = document.getElementById("gw-lbl-2h");
    const l6 = document.getElementById("gw-lbl-6h");
    const lf = document.getElementById("gw-lbl-fullday");
    if (l2) l2.innerText = first.label2Hours || "Paket 2 Jam";
    if (l6) l6.innerText = first.label6Hours || "Paket 6 Jam";
    if (lf) lf.innerText = first.labelFullDay || "Full Day";

    const r2 = document.getElementById("gw-rate-2h");
    const r6 = document.getElementById("gw-rate-6h");
    const rf = document.getElementById("gw-rate-fullday");
    if (r2) r2.innerText = fmtRp(sum2h);
    if (r6) r6.innerText = fmtRp(sum6h);
    if (rf) rf.innerText = fmtRp(sumFull);

    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durVal = durRadio ? durRadio.value : "2_hours";
    const total = durVal === "6_hours" ? sum6h : durVal === "full_day" ? sumFull : sum2h;

    const calcEl = document.getElementById("gw-book-total-calc");
    if (calcEl) calcEl.innerText = `${fmtRp(total)} (${selectedObjs.length} Sepeda)`;

    updateGowesReturnEstimate();
}

function openGowesBookingModal(bikeId = null) {
    if (!currentSessionUser) {
        showToast("Silakan masuk / daftar akun terlebih dahulu untuk booking sepeda.", "info");
        if (typeof openAuthModal === "function") openAuthModal();
        return;
    }

    const bikes = getAvailableGowesBikes();
    if (!bikes.length) return showToast("Belum ada unit sepeda yang tersedia.", "info");

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const currentBranch = getActiveShelterObject();
    const readyFirst = bikes.find(b => b.status !== "Servis") || bikes[0];
    activeBookingBike = bikeId ? (bikes.find(b => String(b.id) === String(bikeId)) || readyFirst) : readyFirst;
    bookingSelectedBikeIds = [activeBookingBike.id];
    openBookingBikePickerIdx = -1;
    gowesKtpDraft = "";

    // Otomatis menampilkan formulir cabang sesuai daerah aktif (tanpa dropdown manual)
    const branchBadge = document.getElementById("gw-book-branch-badge");
    if (branchBadge) {
        const bookedToday = getBikeTodayBookingSlots(activeBookingBike.id);
        const bookedHint = bookedToday.length
            ? `<span class="block text-[10px] text-amber-600 font-bold mt-1"><i class="fa-regular fa-clock mr-1"></i>Info hari ini: unit #1 terbooking jam ${escHtml(bookedToday.join(" & "))} WITA — pilih jam lain yang kosong.</span>`
            : "";
        branchBadge.innerHTML = `
            <div class="rounded-2xl p-3 bg-emerald-500/10 border border-emerald-500/35 space-y-0.5">
                <div class="flex items-center justify-between gap-2 text-xs">
                    <strong class="text-emerald-700 truncate"><i class="fa-solid fa-location-dot mr-1.5"></i>Form Cabang ${escHtml(currentBranch.city || "Utama")}</strong>
                    <span class="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold shrink-0">OTOMATIS</span>
                </div>
                <p class="text-[10.5px] app-muted truncate">${escHtml(currentBranch.name)} • ${escHtml(currentBranch.address)}</p>
                ${bookedHint}
            </div>
        `;
    }

    const nameInp = document.getElementById("gw-book-name");
    const phInp = document.getElementById("gw-book-phone");
    const addrInp = document.getElementById("gw-book-address");
    if (nameInp) nameInp.value = (curU && (curU.name || curU.username)) || "";
    if (phInp) phInp.value = (curU && curU.phone) || "";
    if (addrInp) addrInp.value = (curU && curU.address) || currentBranch.city || "";

    const qtyInp = document.getElementById("gw-book-qty");
    const qtyLbl = document.getElementById("gw-book-qty-lbl");
    if (qtyInp) qtyInp.value = "1";
    if (qtyLbl) qtyLbl.innerText = "1";

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dateInp = document.getElementById("gw-book-date");
    if (dateInp) { dateInp.value = todayStr; dateInp.min = todayStr; }

    const timeInp = document.getElementById("gw-book-time");
    if (timeInp) {
        const hh = String(Math.min(19, now.getHours() + 1)).padStart(2, "0");
        timeInp.value = `${hh}:00`;
    }

    const rad2h = document.querySelector('input[name="gw_duration"][value="2_hours"]');
    if (rad2h) rad2h.checked = true;

    const ktpPrev = document.getElementById("gw-ktp-preview");
    if (ktpPrev) { ktpPrev.src = ""; ktpPrev.classList.add("hide"); }
    const ktpInp = document.getElementById("gw-ktp-input");
    if (ktpInp) ktpInp.value = "";

    renderBookingBikeSelectors();
    updateGowesBookingPriceCalc();

    const modal = document.getElementById("modal-gowes-booking");
    if (modal) modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-booking" });
}

function closeGowesBookingModal() {
    activeBookingBike = null;
    bookingSelectedBikeIds = [];
    openBookingBikePickerIdx = -1;
    gowesKtpDraft = "";
    document.getElementById("modal-gowes-booking")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-booking");
}

function handleGowesKtpPick(inp) {
    const file = inp.files && inp.files[0];
    if (!file) return;
    inp.value = "";

    if (typeof openImageCropper === "function") {
        openImageCropper(file, 1.6, "Potong Foto KTP / SIM Penjamin", 800, 500, (dataUrl) => {
            gowesKtpDraft = dataUrl;
            const prev = document.getElementById("gw-ktp-preview");
            if (prev) { prev.src = dataUrl; prev.classList.remove("hide"); }
            if (typeof showToast === "function") showToast("Foto KTP siap dilampirkan.");
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            gowesKtpDraft = e.target.result;
            const prev = document.getElementById("gw-ktp-preview");
            if (prev) { prev.src = gowesKtpDraft; prev.classList.remove("hide"); }
        };
        reader.readAsDataURL(file);
    }
}

async function submitGowesRentalBooking(e) {
    e.preventDefault();
    const selectedObjs = getSelectedBookingBikesObjects();
    if (!selectedObjs.length) return showToast("Pilih minimal 1 unit sepeda terlebih dahulu.", "error");

    const firstBike = selectedObjs[0];
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durationKey = durRadio ? durRadio.value : "2_hours";
    const durLabel = durationKey === "6_hours"
        ? (firstBike.label6Hours || "Paket 6 Jam")
        : durationKey === "full_day"
            ? (firstBike.labelFullDay || "Full Day")
            : (firstBike.label2Hours || "Paket 2 Jam");

    const currentBranch = getActiveShelterObject();
    const customerName = document.getElementById("gw-book-name")?.value.trim() || "";
    const customerPhone = document.getElementById("gw-book-phone")?.value.trim() || "";
    const customerAddress = document.getElementById("gw-book-address")?.value.trim() || "";
    const startDate = document.getElementById("gw-book-date")?.value.trim() || "";
    const startTime = document.getElementById("gw-book-time")?.value.trim() || "";
    const quantity = selectedObjs.length;
    const note = document.getElementById("gw-book-note")?.value.trim() || "";

    if (!customerName) return showToast("Nama pemesan wajib diisi.", "error");
    if (!customerPhone) return showToast("Nomor WhatsApp wajib diisi.", "error");
    if (!customerAddress) return showToast("Alamat domisili wajib diisi.", "error");
    if (!startDate || !startTime) return showToast("Tentukan tanggal dan jam sewa.", "error");
    if (!gowesKtpDraft) return showToast("Silakan unggah foto KTP/SIM penjamin.", "error");

    const uniqueNames = Array.from(new Set(selectedObjs.map(b => b.name)));
    const combinedBikeName = uniqueNames.length === 1 ? uniqueNames[0] : uniqueNames.join(" + ");

    setBtnLoading("btn-submit-gw-booking", true, "Menyimpan Booking...");

    const bookingPayload = {
        bikeId: firstBike.id,
        bikeName: combinedBikeName,
        bikeImage: firstBike.image || "",
        selectedBikes: selectedObjs.map(b => ({
            bikeId: b.id,
            bikeName: b.name,
            bikeType: b.type || "",
            bikeImage: b.image || ""
        })),
        durationKey,
        durationLabel: durLabel,
        quantity,
        customerName,
        customerPhone,
        customerAddress,
        startDate,
        startTime,
        branchId: currentBranch.id || "sh_smd_1",
        branchCity: currentBranch.city || "Samarinda",
        pickupLocation: currentBranch.name || "Titik Gowes Shelter Utama",
        ktpImage: gowesKtpDraft,
        note
    };

    const res = await apiAction({ action: "gowes_create_booking", booking: bookingPayload });
    setBtnLoading("btn-submit-gw-booking", false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal membuat pesanan sewa sepeda.", "error");
    }

    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const existingIdx = db.gowesRentals.findIndex(r => String(r.id) === String(res.rental.id));
    if (existingIdx >= 0) db.gowesRentals[existingIdx] = res.rental;
    else db.gowesRentals.unshift(res.rental);

    closeGowesBookingModal();
    showToast("Pesanan sewa berhasil dibuat! Selesaikan pembayaran melalui QRIS.");
    openGowesRentalPayment(res.rental.id);
}

// ================= 8. PEMBAYARAN QRIS TERPADU TITIK GOWES =================
async function openGowesRentalPayment(rentalId) {
    const list = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const rental = list.find(r => String(r.id) === String(rentalId));
    if (!rental) return showToast("Data pesanan sewa tidak ditemukan.", "error");

    if (typeof hideAllViews === "function") hideAllViews();
    currentViewName = "payment";
    document.body.classList.remove("in-home");

    const viewPay = document.getElementById("view-payment");
    if (viewPay) viewPay.classList.remove("hide");

    if (typeof activePaymentState !== "undefined") {
        activePaymentState.kind = "gowes_rental";
        activePaymentState.id = rental.id;
        activePaymentState.totalPay = Number(rental.totalPrice || 0);
        activePaymentState.uniqueCode = Number(rental.uniqueCode || 0);
        activePaymentState.title = `Sewa Sepeda: ${rental.bikeName}`;
        activePaymentState.qrisDataUrl = "";
    }

    const statusBadge = document.getElementById("pay-status-badge");
    const headingText = document.getElementById("pay-heading-text");
    const itemName = document.getElementById("pay-item-name");
    const finalPrice = document.getElementById("pay-final-price");
    const uniqueHint = document.getElementById("pay-unique-hint");
    const origPrice = document.getElementById("pay-orig-price");
    const discBadge = document.getElementById("pay-disc-badge");

    if (statusBadge) {
        statusBadge.className = "text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold uppercase";
        statusBadge.innerText = `TITIK GOWES: ● ${rental.status.toUpperCase()}`;
    }
    if (headingText) headingText.innerText = "Konfirmasi Sewa Sepeda";
    if (itemName) {
        const multiHtml = (Array.isArray(rental.selectedBikes) && rental.selectedBikes.length > 1)
            ? `<div class="text-[10px] app-muted mt-1">${rental.selectedBikes.map((sb, i) => `Unit #${i + 1}: <strong>${escHtml(sb.bikeName)}</strong>`).join(" • ")}</div>`
            : "";
        itemName.innerHTML = `<strong>${escHtml(rental.bikeName)}</strong> (${rental.quantity || 1} Unit) • ${escHtml(rental.durationLabel)}${multiHtml}<span class="block text-[10px] app-muted mt-0.5">Gerai: ${escHtml(rental.pickupLocation || "Shelter Utama")} • Jadwal: ${escHtml(rental.startDate)} pukul ${escHtml(rental.startTime)} WITA</span>`;
    }
    if (finalPrice) finalPrice.innerText = fmtRp(rental.totalPrice);
    if (uniqueHint) {
        uniqueHint.innerText = `Sudah termasuk kode unik Rp ${rental.uniqueCode || 0} untuk percepatan verifikasi Admin.`;
        uniqueHint.classList.remove("hide");
    }
    if (origPrice) origPrice.classList.add("hide");
    if (discBadge) discBadge.classList.add("hide");

    const ms = db.masterSettings || {};
    if (typeof renderPaymentQrisCode === "function") {
        await renderPaymentQrisCode(ms, Number(rental.totalPrice || 0));
    }

    const banksBox = document.getElementById("pay-banks-list");
    if (banksBox && typeof getMasterBanksList === "function") {
        const banks = getMasterBanksList();
        banksBox.innerHTML = banks.map(b => `
            <div class="app-card-soft border rounded-2xl p-2.5 flex items-center justify-between text-xs">
                <div>
                    <span class="text-[10px] app-muted block font-semibold">${escHtml(b.bank)}</span>
                    <strong class="font-mono text-sm block">${escHtml(b.no)}</strong>
                    <span class="text-[10px] app-muted block">a.n. ${escHtml(b.holder)}</span>
                </div>
                <button type="button" onclick="navigator.clipboard.writeText('${esc(b.no)}');showToast('Nomor rekening disalin!');" class="px-3 py-1.5 rounded-xl app-btn-sec text-[11px] font-bold">Salin</button>
            </div>
        `).join("");
    }

    const proofInput = document.getElementById("pay-proof-input");
    const proofPrev = document.getElementById("pay-proof-preview");
    if (proofInput) proofInput.value = "";
    if (proofPrev) {
        proofPrev.src = rental.paymentProof || "";
        proofPrev.classList.toggle("hide", !rental.paymentProof);
    }

    const sendProofBtn = document.getElementById("btn-send-proof");
    if (sendProofBtn) {
        sendProofBtn.onclick = () => submitGowesPaymentProof(rental.id);
    }

    if (typeof renderHeaderActions === "function") renderHeaderActions();
    if (typeof mrNavPush === "function") mrNavPush({ type: "view", view: "payment" });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function submitGowesPaymentProof(rentalId) {
    const proofInput = document.getElementById("pay-proof-input");
    const file = proofInput && proofInput.files && proofInput.files[0];
    const prevSrc = document.getElementById("pay-proof-preview")?.src || "";

    if (!file && (!prevSrc || prevSrc.startsWith("http"))) {
        return showToast("Pilih file bukti transfer terlebih dahulu.", "error");
    }

    setBtnLoading("btn-send-proof", true, "Mengirim Bukti...");
    let proofDataUrl = prevSrc;
    if (file) proofDataUrl = await quickResizeImage(file, 900, 0.82);

    const res = await apiAction({ action: "gowes_submit_payment", rentalId, paymentProof: proofDataUrl });
    setBtnLoading("btn-send-proof", false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal mengunggah bukti bayar.", "error");
    }

    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const idx = db.gowesRentals.findIndex(r => String(r.id) === String(rentalId));
    if (idx >= 0) db.gowesRentals[idx] = res.rental;

    showToast("Bukti pembayaran berhasil dikirim! Menunggu konfirmasi Admin.");
    if (typeof routeDashboard === "function") routeDashboard();
}

// ================= 9. KARTU RIWAYAT SEWA PELANGGAN & DETAIL =================
function buildUserRentalCardHtml(rental) {
    const isPay = rental.status === "Menunggu Pembayaran";
    const isVerif = rental.status === "Menunggu Verifikasi";
    const isConfirmed = rental.status === "Terkonfirmasi";
    const isInUse = rental.status === "Sedang Digunakan";
    const isDone = rental.status === "Selesai";

    const statusBadge = isDone
        ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold uppercase">● Selesai</span>`
        : isInUse
            ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 font-extrabold uppercase">● Sedang Digunakan</span>`
            : isConfirmed
                ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 font-extrabold uppercase">● Siap Diambil</span>`
                : isVerif
                    ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-extrabold uppercase">● Verifikasi Pembayaran</span>`
                    : `<span class="text-[9px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-500 font-extrabold uppercase">● Menunggu Bayar</span>`;

    const payActionHtml = isPay
        ? `<button type="button" onclick="openGowesRentalPayment('${esc(rental.id)}')" class="gowes-pill-btn px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"><i class="fa-solid fa-qrcode mr-1"></i>Bayar QRIS</button>`
        : "";

    return `
        <div class="app-card border rounded-2xl p-3.5 space-y-3 shadow-sm">
            <div class="flex items-start gap-3">
                <img src="${rental.bikeImage || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-16 h-16 rounded-xl object-cover bg-black border gold-border shrink-0">
                <div class="min-w-0 flex-1 space-y-0.5">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="gowes-brand-tag !text-[8.5px]">TITIK GOWES</span>
                        ${statusBadge}
                    </div>
                    <h4 class="font-extrabold text-xs sm:text-sm truncate pt-0.5">${escHtml(rental.bikeName)} (${rental.quantity || 1} Unit)</h4>
                    <p class="text-[10px] app-muted truncate">${escHtml(rental.durationLabel)} • ${fmtRp(rental.totalPrice)}</p>
                    <p class="text-[9.5px] text-emerald-600 font-semibold"><i class="fa-regular fa-clock mr-1"></i>${escHtml(rental.startDate)} pukul ${escHtml(rental.startTime)} WITA • ${escHtml(rental.pickupLocation || "Shelter Utama")}</p>
                </div>
            </div>
            <div class="flex items-center justify-between gap-2 pt-2 border-t gold-border">
                <button type="button" onclick="openGowesRentalDetail('${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold"><i class="fa-regular fa-eye mr-1"></i>Rincian</button>
                <div class="flex gap-1.5">
                    ${payActionHtml}
                    ${isConfirmed ? `<span class="text-[10px] text-emerald-600 font-bold self-center"><i class="fa-solid fa-circle-check mr-1"></i>Tunjukkan KTP di shelter</span>` : ""}
                </div>
            </div>
        </div>
    `;
}

function openGowesRentalDetail(rentalId) {
    const list = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const r = list.find(x => String(x.id) === String(rentalId));
    if (!r) return showToast("Detail sewa tidak ditemukan.", "error");

    let modal = document.getElementById("modal-gowes-rental-detail");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-gowes-rental-detail";
        modal.className = "hide fixed inset-0 z-[148] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4";
        modal.onclick = (e) => { if (e.target === modal) modal.classList.add("hide"); };
        document.body.appendChild(modal);
    }

    const bikesListHtml = (Array.isArray(r.selectedBikes) && r.selectedBikes.length > 1)
        ? `<div class="app-card-soft border rounded-2xl p-3 space-y-1">
            <span class="text-[10px] font-bold uppercase text-emerald-600 block">Rincian Unit Sepeda (${r.selectedBikes.length} Unit):</span>
            ${r.selectedBikes.map((sb, i) => `<div class="text-[11px]">${i + 1}. <strong>${escHtml(sb.bikeName)}</strong> <span class="app-muted">(${escHtml(sb.bikeType || "Sepeda")})</span></div>`).join("")}
           </div>`
        : "";

    modal.innerHTML = `
        <div class="app-card border rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl" onclick="event.stopPropagation()">
            <div class="px-5 py-3.5 border-b gold-border flex items-center justify-between shrink-0">
                <div>
                    <h3 class="font-extrabold text-sm sm:text-base">Rincian Sewa Sepeda</h3>
                    <p class="text-[10px] app-muted">ID: ${escHtml(r.id)}</p>
                </div>
                <button type="button" onclick="document.getElementById('modal-gowes-rental-detail').classList.add('hide')" class="w-8 h-8 rounded-full app-btn-sec flex items-center justify-center text-xs"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
                <div class="flex items-center gap-3 app-card-soft border rounded-2xl p-3">
                    <img src="${r.bikeImage || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-16 h-16 rounded-xl object-cover bg-black border gold-border shrink-0">
                    <div class="min-w-0 flex-1 space-y-0.5">
                        <strong class="font-extrabold text-sm block truncate">${escHtml(r.bikeName)}</strong>
                        <span class="text-[10px] app-muted block">${escHtml(r.durationLabel)} • ${r.quantity || 1} Unit</span>
                        <span class="text-xs font-bold text-emerald-600 block">${fmtRp(r.totalPrice)}</span>
                    </div>
                </div>
                ${bikesListHtml}
                <div class="app-card-soft border rounded-2xl p-3 space-y-1.5">
                    <div class="flex justify-between"><span class="app-muted">Penyewa:</span><strong class="font-bold">${escHtml(r.customerName || r.customerUsername)} (@${escHtml(r.customerUsername)})</strong></div>
                    <div class="flex justify-between"><span class="app-muted">WhatsApp:</span><strong class="font-bold">${escHtml(r.customerPhone || "-")}</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Jadwal:</span><strong class="font-bold text-emerald-600">${escHtml(r.startDate)} pukul ${escHtml(r.startTime)} WITA</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Gerai Cabang:</span><strong class="font-bold">${escHtml(r.pickupLocation || "Shelter Utama")}</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Status:</span><span class="font-extrabold text-emerald-600">${escHtml(r.status)}</span></div>
                </div>
                ${r.handoverOutPhoto ? `<div class="space-y-1"><span class="text-[10px] font-bold uppercase app-muted block">Foto Fisik Sepeda Saat Diambil:</span><img src="${r.handoverOutPhoto}" class="w-full h-36 object-contain rounded-xl bg-black border gold-border"></div>` : ""}
                ${r.handoverInPhoto ? `<div class="space-y-1"><span class="text-[10px] font-bold uppercase app-muted block">Foto Fisik Sepeda Saat Kembali:</span><img src="${r.handoverInPhoto}" class="w-full h-36 object-contain rounded-xl bg-black border gold-border"></div>` : ""}
                ${r.paymentProof ? `<div class="space-y-1"><span class="text-[10px] font-bold uppercase app-muted block">Bukti Pembayaran QRIS:</span><img src="${r.paymentProof}" class="w-full max-h-48 object-contain rounded-xl bg-black border gold-border"></div>` : ""}
            </div>
            <div class="px-5 py-3 border-t gold-border flex justify-end shrink-0">
                <button type="button" onclick="document.getElementById('modal-gowes-rental-detail').classList.add('hide')" class="gowes-pill-btn px-6 py-2 rounded-xl text-xs">Tutup</button>
            </div>
        </div>
    `;

    modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-rental-detail" });
}
