// =========================================================================
// TITIK GOWES — FRONTEND RENTAL & SHOWCASE CONTROLLER (js/gowes.js)
// Versi: V14.3 (Update: 5 Banner 16:5, Showcase 3:4, Stepper & Toko Tutup)
// =========================================================================

let gowesFilterType = "all";
let activeBookingBike = null;
let gowesKtpDraft = "";
let gowesBannerIdx = 0;
let gowesShowcaseIdx = 0;
let gowesBannerTimer = null;
let gowesShowcaseTimer = null;

// ================= 1. INISIALISASI & BERANDA TITIK GOWES =================
function renderGowesLandingPage() {
    const vGws = document.getElementById("view-gowes");
    if (!vGws || vGws.classList.contains("hide")) return;

    // Periksa apakah garasi/toko sedang ditutup sementara
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

// ================= 2. BANNER MEMANJANG RAMPING 16 : 5 (5 SLIDE OTOMATIS) =================
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
    document.querySelectorAll(".gowes-filter-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.gt === gowesFilterType);
    });
    renderGowesShowcaseTrack();
}

function getAvailableGowesBikes() {
    const list = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    return list.filter(b => b && b.status !== "Dihapus");
}

// ================= 4. SHOWCASE SEPEDA FULL-BLEED 3 : 4 (POSTER SINEMATIK) =================
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
            <div class="w-full py-16 px-4 text-center app-card border border-dashed rounded-3xl space-y-2">
                <i class="fa-solid fa-bicycle text-4xl text-emerald-600/60"></i>
                <h4 class="font-extrabold text-sm">Tidak Ada Unit di Kategori Ini</h4>
                <p class="text-xs app-muted">Silakan pilih kategori sepeda lain atau hubungi petugas kami via Live Chat.</p>
            </div>
        `;
        return;
    }

    const fallbackImg = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";

    track.innerHTML = bikes.map((b, idx) => {
        const isAvailable = b.status === "Tersedia";
        const isInUse = b.status === "Sedang Disewa";

        const statusBadge = isAvailable
            ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider shadow">● Siap Gowes</span>`
            : isInUse
                ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-extrabold text-[9px] uppercase tracking-wider shadow">● Sedang Digunakan</span>`
                : `<span class="px-2.5 py-0.5 rounded-full bg-zinc-600 text-white font-extrabold text-[9px] uppercase tracking-wider shadow">✕ Masa Servis</span>`;

        const actionBtn = isAvailable
            ? `<button type="button" onclick="openGowesBookingModal('${esc(b.id)}')" class="w-full gowes-pill-btn py-3 rounded-2xl text-xs uppercase tracking-wider font-extrabold shadow-xl flex items-center justify-center gap-1.5">
                <i class="fa-solid fa-bicycle"></i> Sewa Unit Ini
               </button>`
            : `<button type="button" disabled class="w-full py-3 rounded-2xl bg-white/20 text-white/60 text-xs font-bold text-center cursor-not-allowed">
                ${isInUse ? 'Sedang Digunakan' : 'Dalam Masa Servis'}
               </button>`;

        return `
            <div class="gowes-showcase-slide" data-slide-idx="${idx}">
                <!-- Foto Unit Resolusi Tinggi -->
                <img src="${b.image || fallbackImg}" alt="${escHtml(b.name)}" loading="lazy" class="absolute inset-0 w-full h-full object-cover object-center">
                
                <!-- Lapisan Gradien Gelap Bawah -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent"></div>

                <!-- Bagian Atas: Badges Status & Tipe -->
                <div class="absolute top-4 inset-x-4 z-10 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-1.5 flex-wrap">
                        ${statusBadge}
                        <span class="bike-type-pill">${escHtml(b.type || "Sepeda")}</span>
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[9.5px] font-bold backdrop-blur-sm border border-white/20">
                        <i class="fa-solid fa-person-biking mr-1 text-emerald-400"></i>${b.totalRentedCount || 0}x Sewa
                    </span>
                </div>

                <!-- Bagian Bawah: Info Spesifikasi & Harga -->
                <div class="absolute bottom-4 inset-x-4 z-10 text-white space-y-2.5">
                    <div>
                        <h3 class="text-xl sm:text-2xl font-extrabold leading-tight text-white drop-shadow">${escHtml(b.name)}</h3>
                        <p class="text-[11px] text-zinc-300 line-clamp-1 mt-0.5">${escHtml(b.description || "")}</p>
                    </div>

                    <!-- Spesifikasi Mini -->
                    <div class="flex flex-wrap gap-1.5 text-[10px]">
                        <span class="px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-zinc-100 font-semibold">
                            <i class="fa-solid fa-ruler-combined text-emerald-400 mr-1"></i>${escHtml(b.frameSize || "All Size")}
                        </span>
                        <span class="px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-zinc-100 font-semibold">
                            <i class="fa-solid fa-gear text-emerald-400 mr-1"></i>${escHtml(b.gears || "Standar")}
                        </span>
                        ${b.brakes ? `
                            <span class="px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-zinc-100 font-semibold">
                                <i class="fa-solid fa-circle-stop text-emerald-400 mr-1"></i>${escHtml(b.brakes)}
                            </span>
                        ` : ''}
                    </div>

                    <!-- Tarif 3 Durasi -->
                    <div class="grid grid-cols-3 gap-1.5 p-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-center">
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

                    <!-- Tombol Aksi -->
                    <div class="pt-0.5">
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

// Auto-slide beranda Titik Gowes
function startGowesAutoSlides() {
    clearInterval(gowesBannerTimer);
    clearInterval(gowesShowcaseTimer);

    // Auto rotate banner 16:5
    gowesBannerTimer = setInterval(() => {
        if (document.hidden || currentViewName !== "landing" || currentAppMode !== "titik_gowes") return;
        const banners = _getGowesBannersList();
        if (banners.length > 1) {
            gowesBannerIdx = (gowesBannerIdx + 1) % banners.length;
            updateGowesBannerPos();
        }
    }, 4500);

    // Auto advance showcase 3:4 bila tidak disentuh
    gowesShowcaseTimer = setInterval(() => {
        if (document.hidden || currentViewName !== "landing" || currentAppMode !== "titik_gowes") return;
        const track = document.getElementById("gowes-showcase-track");
        if (!track || track.children.length <= 1) return;
        
        gowesShowcaseIdx = (gowesShowcaseIdx + 1) % track.children.length;
        const targetSlide = track.children[gowesShowcaseIdx];
        if (targetSlide) {
            track.scrollTo({ left: targetSlide.offsetLeft, behavior: "smooth" });
        }
    }, 6000);
}

// ================= 5. FORMULIR SEWA SEPEDA, STEPPER & ESTIMASI KEMBALI =================
function populateBookingBikesDropdown(selectedBikeId = null) {
    const sel = document.getElementById("gw-book-bike-select");
    if (!sel) return;
    const bikes = getAvailableGowesBikes();

    sel.innerHTML = !bikes.length
        ? `<option value="">-- Tidak ada sepeda tersedia --</option>`
        : bikes.map(b => `<option value="${esc(b.id)}" ${(selectedBikeId && String(b.id) === String(selectedBikeId)) ? 'selected' : ''}>${escHtml(b.name)} — ${escHtml(b.type)} (${b.status})</option>`).join("");
}

function onBookingBikeSelectChange(bikeId) {
    const bikes = getAvailableGowesBikes();
    const found = bikes.find(b => String(b.id) === String(bikeId));
    if (found) {
        activeBookingBike = found;
        document.getElementById("gw-rate-2h").innerText = fmtRp(found.price2Hours || 40000);
        document.getElementById("gw-rate-6h").innerText = fmtRp(found.price6Hours || 75000);
        document.getElementById("gw-rate-fullday").innerText = fmtRp(found.priceFullDay || 120000);
        updateGowesBookingPriceCalc();
    }
}

function changeBookingBikeQty(delta) {
    const inp = document.getElementById("gw-book-qty");
    const lbl = document.getElementById("gw-book-qty-lbl");
    if (!inp || !lbl) return;

    let cur = parseInt(inp.value, 10) || 1;
    cur = Math.max(1, Math.min(10, cur + delta));
    inp.value = cur;
    lbl.innerText = String(cur);
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

    let returnTimeStr = "";
    if (durVal === "2_hours") {
        let returnHh = hh + 2;
        let dayNote = "";
        if (returnHh >= 24) {
            returnHh %= 24;
            dayNote = " (Besok)";
        }
        returnTimeStr = `${String(returnHh).padStart(2, "0")}:${String(mm).padStart(2, "0")} WITA${dayNote}`;
        textEl.innerHTML = `Batas kembali: <strong>Pukul ${returnTimeStr}</strong> (Paket 2 Jam)`;
    } else if (durVal === "6_hours") {
        let returnHh = hh + 6;
        let dayNote = "";
        if (returnHh >= 24) {
            returnHh %= 24;
            dayNote = " (Besok)";
        }
        returnTimeStr = `${String(returnHh).padStart(2, "0")}:${String(mm).padStart(2, "0")} WITA${dayNote}`;
        textEl.innerHTML = `Batas kembali: <strong>Pukul ${returnTimeStr}</strong> (Paket 6 Jam)`;
    } else {
        textEl.innerHTML = `Batas kembali: <strong>Pukul 20.00 WITA</strong> hari yang sama (Garasi Tutup)`;
    }
}

function updateGowesBookingPriceCalc() {
    if (!activeBookingBike) return;
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durVal = durRadio ? durRadio.value : "2_hours";
    const qtyInp = document.getElementById("gw-book-qty");
    const qty = parseInt((qtyInp && qtyInp.value) || "1", 10) || 1;

    let baseRate = Number(activeBookingBike.price2Hours || 40000);
    if (durVal === "6_hours") baseRate = Number(activeBookingBike.price6Hours || 75000);
    else if (durVal === "full_day") baseRate = Number(activeBookingBike.priceFullDay || 120000);

    const total = baseRate * qty;
    const calcEl = document.getElementById("gw-book-total-calc");
    if (calcEl) calcEl.innerText = `${fmtRp(total)} (${qty} Sepeda)`;

    updateGowesReturnEstimate();
}

function openGowesBookingModal(bikeId = null) {
    const bikes = getAvailableGowesBikes();
    if (!bikes.length) return showToast("Belum ada unit sepeda yang tersedia.", "info");

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    activeBookingBike = bikeId ? (bikes.find(b => String(b.id) === String(bikeId)) || bikes[0]) : bikes[0];
    gowesKtpDraft = "";

    // Isi dropdown sepeda
    populateBookingBikesDropdown(activeBookingBike.id);

    // Prefill data pengguna
    const nameInp = document.getElementById("gw-book-name");
    const phInp = document.getElementById("gw-book-phone");
    const addrInp = document.getElementById("gw-book-address");

    if (nameInp) nameInp.value = (curU && (curU.name || curU.username)) || "";
    if (phInp) phInp.value = (curU && curU.phone) || "";
    if (addrInp) addrInp.value = (curU && curU.address) || "";

    // Reset Stepper ke 1
    const qtyInp = document.getElementById("gw-book-qty");
    const qtyLbl = document.getElementById("gw-book-qty-lbl");
    if (qtyInp) qtyInp.value = "1";
    if (qtyLbl) qtyLbl.innerText = "1";

    // Set tanggal hari ini & jam sewa default
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dateInp = document.getElementById("gw-book-date");
    if (dateInp) {
        dateInp.value = todayStr;
        dateInp.min = todayStr;
    }

    const timeInp = document.getElementById("gw-book-time");
    if (timeInp) {
        const hh = String(Math.min(19, now.getHours() + 1)).padStart(2, "0");
        timeInp.value = `${hh}:00`;
    }

    // Reset durasi ke 2 jam
    const rad2h = document.querySelector('input[name="gw_duration"][value="2_hours"]');
    if (rad2h) rad2h.checked = true;

    // Reset pratinjau KTP
    const ktpPrev = document.getElementById("gw-ktp-preview");
    if (ktpPrev) {
        ktpPrev.src = "";
        ktpPrev.classList.add("hide");
    }
    const ktpInp = document.getElementById("gw-ktp-input");
    if (ktpInp) ktpInp.value = "";

    onBookingBikeSelectChange(activeBookingBike.id);

    const modal = document.getElementById("modal-gowes-booking");
    if (modal) modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-booking" });
}

function closeGowesBookingModal() {
    activeBookingBike = null;
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
            if (prev) {
                prev.src = dataUrl;
                prev.classList.remove("hide");
            }
            if (typeof showToast === "function") showToast("Foto KTP siap dilampirkan.");
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            gowesKtpDraft = e.target.result;
            const prev = document.getElementById("gw-ktp-preview");
            if (prev) {
                prev.src = gowesKtpDraft;
                prev.classList.remove("hide");
            }
        };
        reader.readAsDataURL(file);
    }
}

async function submitGowesRentalBooking(e) {
    e.preventDefault();
    if (!activeBookingBike) return showToast("Pilih unit sepeda terlebih dahulu.", "error");

    const bikeId = document.getElementById("gw-book-bike-select")?.value || activeBookingBike.id;
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durationKey = durRadio ? durRadio.value : "2_hours";
    const durLabel = durationKey === "6_hours" ? "Paket 6 Jam" : durationKey === "full_day" ? "Full Day" : "Paket 2 Jam";

    const customerName = document.getElementById("gw-book-name")?.value.trim() || "";
    const customerPhone = document.getElementById("gw-book-phone")?.value.trim() || "";
    const customerAddress = document.getElementById("gw-book-address")?.value.trim() || "";
    const startDate = document.getElementById("gw-book-date")?.value.trim() || "";
    const startTime = document.getElementById("gw-book-time")?.value.trim() || "";
    const quantity = parseInt(document.getElementById("gw-book-qty")?.value || "1", 10) || 1;
    const note = document.getElementById("gw-book-note")?.value.trim() || "";

    if (!customerName) return showToast("Nama pemesan wajib diisi.", "error");
    if (!customerPhone) return showToast("Nomor WhatsApp wajib diisi.", "error");
    if (!customerAddress) return showToast("Alamat domisili wajib diisi.", "error");
    if (!startDate || !startTime) return showToast("Tentukan tanggal dan jam sewa.", "error");
    if (!gowesKtpDraft) return showToast("Silakan unggah foto KTP/SIM penjamin.", "error");

    setBtnLoading("btn-submit-gw-booking", true, "Menyimpan Booking...");

    const bookingPayload = {
        bikeId,
        bikeName: activeBookingBike.name,
        bikeImage: activeBookingBike.image || "",
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

    const res = await apiAction({
        action: "gowes_create_booking",
        booking: bookingPayload
    });

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
function openGowesRentalPayment(rentalId) {
    const list = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const rental = list.find(r => String(r.id) === String(rentalId));
    if (!rental) return showToast("Data pesanan sewa tidak ditemukan.", "error");

    if (typeof hideAllViews === "function") hideAllViews();
    currentViewName = "payment";
    document.body.classList.remove("in-home");

    const viewPay = document.getElementById("view-payment");
    if (viewPay) viewPay.classList.remove("hide");

    window.currentPaymentContext = {
        kind: "gowes_rental",
        id: rental.id,
        totalPay: rental.totalPrice,
        title: `Sewa Sepeda: ${rental.bikeName} (${rental.quantity || 1} Unit • ${rental.durationLabel})`
    };

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
        itemName.innerHTML = `<strong>${escHtml(rental.bikeName)}</strong> (${rental.quantity || 1} Unit) • ${escHtml(rental.durationLabel)}<br><span class="text-[10px] app-muted">Jadwal: ${escHtml(rental.startDate)} pukul ${escHtml(rental.startTime)} WITA</span>`;
    }
    if (finalPrice) finalPrice.innerText = fmtRp(rental.totalPrice);
    if (uniqueHint) {
        uniqueHint.innerText = `Sudah termasuk kode unik Rp ${rental.uniqueCode || 0} untuk percepatan verifikasi Admin.`;
        uniqueHint.classList.remove("hide");
    }
    if (origPrice) origPrice.classList.add("hide");
    if (discBadge) discBadge.classList.add("hide");

    const ms = db.masterSettings || {};
    const qrisModeBadge = document.getElementById("pay-qris-mode-badge");
    const qrisWrap = document.getElementById("pay-qris-canvas-wrap");
    const qrisImg = document.getElementById("pay-qris-img");

    if (ms.qrisMode === "dynamic" && ms.qrisDynamicString && typeof generateQrisCanvas === "function") {
        if (qrisModeBadge) qrisModeBadge.innerText = "QRIS Dinamis DANA";
        if (qrisImg) qrisImg.classList.add("hide");
        let cvs = qrisWrap ? qrisWrap.querySelector("canvas") : null;
        if (!cvs && qrisWrap) {
            cvs = document.createElement("canvas");
            cvs.className = "w-48 h-48";
            qrisWrap.appendChild(cvs);
        }
        if (cvs) {
            cvs.classList.remove("hide");
            generateQrisCanvas(cvs, ms.qrisDynamicString, rental.totalPrice);
        }
    } else {
        if (qrisModeBadge) qrisModeBadge.innerText = "QRIS Resmi Titik Gowes";
        if (qrisWrap) {
            const cvs = qrisWrap.querySelector("canvas");
            if (cvs) cvs.classList.add("hide");
        }
        if (qrisImg) {
            qrisImg.classList.remove("hide");
            qrisImg.src = ms.qrisImage || GOWES_LOGO_PATH;
        }
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
                <button type="button" onclick="navigator.clipboard.writeText('${esc(b.no)}');showToast('Nomor rekening disalin!');" class="px-3 py-1.5 rounded-xl app-btn-sec text-[11px] font-bold">
                    Salin
                </button>
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
    if (file) {
        proofDataUrl = await quickResizeImage(file, 900, 0.82);
    }

    const res = await apiAction({
        action: "gowes_submit_payment",
        rentalId: rentalId,
        paymentProof: proofDataUrl
    });

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
        ? `<button type="button" onclick="openGowesRentalPayment('${esc(rental.id)}')" class="gowes-pill-btn px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm">
            <i class="fa-solid fa-qrcode mr-1"></i>Bayar QRIS
           </button>`
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
                <button type="button" onclick="openGowesRentalDetail('${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold">
                    <i class="fa-regular fa-eye mr-1"></i>Rincian
                </button>
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

                <div class="app-card-soft border rounded-2xl p-3 space-y-1.5">
                    <div class="flex justify-between"><span class="app-muted">Penyewa:</span><strong class="font-bold">${escHtml(r.customerName || r.customerUsername)} (@${escHtml(r.customerUsername)})</strong></div>
                    <div class="flex justify-between"><span class="app-muted">WhatsApp:</span><strong class="font-bold">${escHtml(r.customerPhone || "-")}</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Jadwal:</span><strong class="font-bold text-emerald-600">${escHtml(r.startDate)} pukul ${escHtml(r.startTime)} WITA</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Shelter Ambil:</span><strong class="font-bold">${escHtml(r.pickupLocation || "Shelter Utama")}</strong></div>
                    <div class="flex justify-between"><span class="app-muted">Status:</span><span class="font-extrabold text-emerald-600">${escHtml(r.status)}</span></div>
                </div>

                ${r.handoverOutPhoto ? `
                    <div class="space-y-1">
                        <span class="text-[10px] font-bold uppercase app-muted block">Foto Fisik Sepeda Saat Diambil:</span>
                        <img src="${r.handoverOutPhoto}" class="w-full h-36 object-contain rounded-xl bg-black border gold-border">
                    </div>
                ` : ""}

                ${r.handoverInPhoto ? `
                    <div class="space-y-1">
                        <span class="text-[10px] font-bold uppercase app-muted block">Foto Fisik Sepeda Saat Kembali:</span>
                        <img src="${r.handoverInPhoto}" class="w-full h-36 object-contain rounded-xl bg-black border gold-border">
                    </div>
                ` : ""}

                ${r.paymentProof ? `
                    <div class="space-y-1">
                        <span class="text-[10px] font-bold uppercase app-muted block">Bukti Pembayaran QRIS:</span>
                        <img src="${r.paymentProof}" class="w-full max-h-48 object-contain rounded-xl bg-black border gold-border">
                    </div>
                ` : ""}
            </div>
            <div class="px-5 py-3 border-t gold-border flex justify-end shrink-0">
                <button type="button" onclick="document.getElementById('modal-gowes-rental-detail').classList.add('hide')" class="gowes-pill-btn px-6 py-2 rounded-xl text-xs">Tutup</button>
            </div>
        </div>
    `;

    modal.classList.remove("hide");
    if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-gowes-rental-detail" });
}
