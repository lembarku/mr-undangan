// =========================================================================
// TITIK GOWES — FRONTEND RENTAL & SHOWCASE CONTROLLER (js/gowes.js)
// Versi: V14.4 (Foto 4:3 Elegan, Tanpa Badge Sewa, Multi-Sepeda & QRIS)
// =========================================================================

let gowesFilterType = "all";
let activeBookingBike = null;
let bookingSelectedBikeIds = [];
let gowesKtpDraft = "";
let gowesBannerIdx = 0;
let gowesShowcaseIdx = 0;
let gowesBannerTimer = null;
let gowesShowcaseTimer = null;

// ================= 1. INISIALISASI & BERANDA TITIK GOWES =================
function renderGowesLandingPage() {
    const vGws = document.getElementById("view-gowes");
    if (!vGws || vGws.classList.contains("hide")) return;

    const shelter = db.gowesShelter || DEFAULT_GOWES_SHELTER;
    const isClosed = !!(shelter && shelter.isClosed);

    const closedNotice = document.getElementById("gowes-closed-notice");
    const openContent = document.getElementById("gowes-open-content");
    const closedDesc = document.getElementById("gowes-closed-desc");
    const closedWaBtn = document.getElementById("gowes-closed-wa-btn");

    if (isClosed) {
        if (closedNotice) closedNotice.classList.remove("hide");
        if (openContent) openContent.classList.add("hide");
        if (closedDesc) {
            closedDesc.innerText = shelter.closedReason || "Garasi Titik Gowes sedang istirahat / tutup sementara. Kami siap melayani kembali pada jadwal operasional berikutnya.";
        }
        if (closedWaBtn) {
            const rawPhone = String(shelter.csPhone || "085117488828").replace(/\D/g, "");
            closedWaBtn.href = `https://wa.me/${rawPhone}?text=${encodeURIComponent("Halo Admin Titik Gowes, saya ingin menanyakan jadwal buka rental sepeda.")}`;
        }
        return;
    }

    if (closedNotice) closedNotice.classList.add("hide");
    if (openContent) openContent.classList.remove("hide");

    renderGowesBannerSlider();
    renderGowesCategoryFilters();
    renderGowesShowcaseTrack();
    renderGowesShelterInfo();
    startGowesAutoSlides();
}

function renderGowesShelterInfo() {
    const shelter = db.gowesShelter || DEFAULT_GOWES_SHELTER;
    const nameEl = document.getElementById("gowes-shelter-name");
    const addrEl = document.getElementById("gowes-shelter-address");
    const mapBtn = document.getElementById("gowes-shelter-map-btn");
    const hoursEl = document.getElementById("gowes-hours-lbl");

    if (nameEl) nameEl.innerText = shelter.name || "Titik Gowes Shelter Utama";
    if (addrEl) addrEl.innerText = shelter.address || "Jl. Mulawarman No. 88, Samarinda";
    if (mapBtn && shelter.mapsUrl) mapBtn.href = shelter.mapsUrl;
    if (hoursEl) hoursEl.innerText = `Buka: ${shelter.operationalHours || "05.30 - 20.00 WITA"}`;
}

// ================= 2. BANNER MEMANJANG RAMPING 16 : 5 =================
function _getGowesBannersList() {
    if (Array.isArray(db.gowesBanners) && db.gowesBanners.length) return db.gowesBanners;
    return DEFAULT_GOWES_BANNERS;
}

function renderGowesBannerSlider() {
    const track = document.getElementById("gowes-banner-track");
    if (!track) return;
    const slides = _getGowesBannersList();
    if (gowesBannerIdx >= slides.length) gowesBannerIdx = 0;

    track.innerHTML = slides.map((s, idx) => `
        <div onclick="handleGowesBannerClick(${idx})" class="min-w-full h-full relative flex items-center px-4 sm:px-8 cursor-pointer select-none overflow-hidden">
            <img src="${s.img || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=75'}" class="absolute inset-0 w-full h-full object-cover opacity-75">
            <div class="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-emerald-900/60 to-black/35"></div>
            <div class="relative z-10 max-w-md space-y-0.5 sm:space-y-1 text-white">
                <span class="inline-block px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-extrabold text-[8px] uppercase tracking-wider shadow">${escHtml(s.badge || "PROMO GOWES")}</span>
                <h3 class="text-xs sm:text-base font-extrabold leading-tight drop-shadow truncate">${escHtml(s.title || "Titik Gowes")}</h3>
                <p class="text-[9.5px] sm:text-xs text-zinc-200 line-clamp-1 opacity-90">${escHtml(s.subtitle || "")}</p>
                ${s.ctaText ? `<span class="inline-block mt-0.5 px-3 py-1 rounded-lg bg-white/20 backdrop-blur-sm text-[9.5px] font-bold text-white border border-white/30">${escHtml(s.ctaText)} <i class="fa-solid fa-arrow-right ml-1 text-[8px]"></i></span>` : ""}
            </div>
        </div>
    `).join("");

    updateGowesBannerPos();
}

function updateGowesBannerPos() {
    const track = document.getElementById("gowes-banner-track");
    if (track) track.style.transform = `translateX(-${gowesBannerIdx * 100}%)`;
}

function handleGowesBannerClick(idx) {
    const s = _getGowesBannersList()[idx];
    if (!s) return;
    if (s.targetSection) {
        document.getElementById(s.targetSection)?.scrollIntoView({ behavior: "smooth" });
    } else {
        openGowesBookingModal();
    }
}

// ================= 3. FILTER TIPE SEPEDA DINAMIS =================
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

// ================= 4. SHOWCASE PILIHAN SEPEDA (FOTO 4:3 ELEGAN & DOTS) =================
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
        countBadge.innerText = `${bikes.length} Unit Siap Gowes`;
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
        const isAvailable = b.status === "Tersedia";
        const isInUse = b.status === "Sedang Disewa";

        const statusBadge = isAvailable
            ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider shadow">● Siap Gowes</span>`
            : isInUse
                ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-500/90 backdrop-blur-md text-black font-extrabold text-[9px] uppercase tracking-wider shadow">● Sedang Digunakan</span>`
                : `<span class="px-2.5 py-0.5 rounded-full bg-zinc-700/90 backdrop-blur-md text-white font-extrabold text-[9px] uppercase tracking-wider shadow">✕ Masa Servis</span>`;

        const actionBtn = isAvailable
            ? `<button type="button" onclick="openGowesBookingModal('${esc(b.id)}')" class="w-full gowes-pill-btn py-3 rounded-2xl text-xs uppercase tracking-wider font-extrabold shadow-xl flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-bicycle"></i> Sewa Unit Ini
               </button>`
            : `<button type="button" disabled class="w-full py-3 rounded-2xl bg-white/15 text-white/60 text-xs font-bold text-center cursor-not-allowed">
                ${isInUse ? 'Sedang Digunakan' : 'Dalam Masa Servis'}
               </button>`;

        return `
            <div class="gowes-showcase-slide" data-slide-idx="${idx}">
                <div class="gowes-showcase-photo-box">
                    <img src="${b.image || fallbackImg}" alt="${escHtml(b.name)}" loading="lazy">
                    <div class="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/55 to-transparent pointer-events-none"></div>
                    <div class="absolute top-3 left-3 z-10 flex items-center gap-1.5 flex-wrap">
                        ${statusBadge}
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
                        <span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold">
                            <i class="fa-solid fa-ruler-combined text-emerald-400 mr-1"></i>${escHtml(b.frameSize || "All Size")}
                        </span>
                        <span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold">
                            <i class="fa-solid fa-gear text-emerald-400 mr-1"></i>${escHtml(b.gears || "Standar")}
                        </span>
                        ${b.brakes ? `
                            <span class="px-2.5 py-1 rounded-xl bg-white/10 border border-white/15 text-zinc-100 font-semibold">
                                <i class="fa-solid fa-circle-stop text-emerald-400 mr-1"></i>${escHtml(b.brakes)}
                            </span>
                        ` : ''}
                    </div>

                    <div class="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-white/5 border border-white/15 text-center">
                        <div class="p-1">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block">2 Jam</span>
                            <strong class="text-xs font-extrabold text-emerald-400 block">${fmtRp(b.price2Hours || 40000)}</strong>
                        </div>
                        <div class="p-1 border-x border-white/15">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block">6 Jam</span>
                            <strong class="text-xs font-extrabold text-emerald-400 block">${fmtRp(b.price6Hours || 75000)}</strong>
                        </div>
                        <div class="p-1">
                            <span class="text-[8.5px] uppercase font-bold text-zinc-400 block">Full Day</span>
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

// ================= 5. FORMULIR SEWA MULTI-SEPEDA & KALKULASI OTOMATIS =================
function getSelectedBookingBikesObjects() {
    const bikes = getAvailableGowesBikes();
    if (!bikes.length) return [];
    const fallbackBike = bikes.find(b => b.status === "Tersedia") || bikes[0];
    return bookingSelectedBikeIds.map(id => {
        return bikes.find(b => String(b.id) === String(id)) || fallbackBike;
    });
}

function renderBookingBikeSelectors() {
    const box = document.getElementById("gw-book-bikes-container");
    if (!box) return;
    const bikes = getAvailableGowesBikes();

    if (!bikes.length) {
        box.innerHTML = `<p class="text-xs text-red-500 font-bold">Belum ada unit sepeda tersedia.</p>`;
        return;
    }

    const totalUnits = bookingSelectedBikeIds.length || 1;
    box.innerHTML = bookingSelectedBikeIds.map((selId, idx) => {
        const labelTxt = totalUnits > 1 ? `Pilih Unit Sepeda #${idx + 1}` : "Pilih Unit Sepeda";
        const optionsHtml = bikes.map(b => {
            const isSel = String(b.id) === String(selId);
            const disAttr = b.status !== "Tersedia" ? "disabled" : "";
            return `<option value="${esc(b.id)}" ${isSel ? "selected" : ""} ${disAttr}>${escHtml(b.name)} — ${escHtml(b.type)} (${fmtRp(b.price2Hours || 40000)}/2j • ${escHtml(b.status)})</option>`;
        }).join("");

        return `
            <div class="space-y-1">
                <label class="app-label">${labelTxt}</label>
                <select id="gw-book-bike-select-${idx}" onchange="onBookingBikeSlotChange(${idx}, this.value)" class="app-input font-bold" required>
                    ${optionsHtml}
                </select>
            </div>
        `;
    }).join("");
}

function onBookingBikeSlotChange(slotIdx, bikeId) {
    bookingSelectedBikeIds[slotIdx] = bikeId;
    const bikes = getAvailableGowesBikes();
    if (slotIdx === 0) {
        activeBookingBike = bikes.find(b => String(b.id) === String(bikeId)) || activeBookingBike;
    }
    updateGowesBookingPriceCalc();
}

function changeBookingBikeQty(delta) {
    const inp = document.getElementById("gw-book-qty");
    const lbl = document.getElementById("gw-book-qty-lbl");
    if (!inp || !lbl) return;

    const bikes = getAvailableGowesBikes();
    const readyBikes = bikes.filter(b => b.status === "Tersedia");
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
        textEl.innerHTML = `Batas kembali: <strong>Pukul ${String(returnHh).padStart(2, "0")}:${String(mm).padStart(2, "0")} WITA${dayNote}</strong> (Paket 2 Jam)`;
    } else if (durVal === "6_hours") {
        let returnHh = hh + 6;
        let dayNote = "";
        if (returnHh >= 24) { returnHh %= 24; dayNote = " (Besok)"; }
        textEl.innerHTML = `Batas kembali: <strong>Pukul ${String(returnHh).padStart(2, "0")}:${String(mm).padStart(2, "0")} WITA${dayNote}</strong> (Paket 6 Jam)`;
    } else {
        textEl.innerHTML = `Batas kembali: <strong>Pukul 20.00 WITA</strong> hari yang sama (Garasi Tutup)`;
    }
}

function updateGowesBookingPriceCalc() {
    const selectedObjs = getSelectedBookingBikesObjects();
    if (!selectedObjs.length) return;

    const sum2h = selectedObjs.reduce((s, b) => s + Number(b.price2Hours || 40000), 0);
    const sum6h = selectedObjs.reduce((s, b) => s + Number(b.price6Hours || 75000), 0);
    const sumFull = selectedObjs.reduce((s, b) => s + Number(b.priceFullDay || 120000), 0);

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
    const readyFirst = bikes.find(b => b.status === "Tersedia") || bikes[0];
    activeBookingBike = bikeId ? (bikes.find(b => String(b.id) === String(bikeId)) || readyFirst) : readyFirst;
    bookingSelectedBikeIds = [activeBookingBike.id];
    gowesKtpDraft = "";

    const nameInp = document.getElementById("gw-book-name");
    const phInp = document.getElementById("gw-book-phone");
    const addrInp = document.getElementById("gw-book-address");
    if (nameInp) nameInp.value = (curU && (curU.name || curU.username)) || "";
    if (phInp) phInp.value = (curU && curU.phone) || "";
    if (addrInp) addrInp.value = (curU && curU.address) || "";

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

    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durationKey = durRadio ? durRadio.value : "2_hours";
    const durLabel = durationKey === "6_hours" ? "Paket 6 Jam" : durationKey === "full_day" ? "Full Day" : "Paket 2 Jam";

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

    const firstBike = selectedObjs[0];
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

// ================= 6. PEMBAYARAN QRIS TERPADU TITIK GOWES =================
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
        itemName.innerHTML = `<strong>${escHtml(rental.bikeName)}</strong> (${rental.quantity || 1} Unit) • ${escHtml(rental.durationLabel)}${multiHtml}<span class="block text-[10px] app-muted mt-0.5">Jadwal: ${escHtml(rental.startDate)} pukul ${escHtml(rental.startTime)} WITA</span>`;
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

// ================= 7. KARTU RIWAYAT SEWA PELANGGAN & DETAIL =================
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
                    <p class="text-[9.5px] text-emerald-600 font-semibold"><i class="fa-regular fa-clock mr-1"></i>Jadwal: ${escHtml(rental.startDate)} pukul ${escHtml(rental.startTime)} WITA</p>
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
                    <div class="flex justify-between"><span class="app-muted">Shelter Ambil:</span><strong class="font-bold">${escHtml(r.pickupLocation || "Shelter Utama")}</strong></div>
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
