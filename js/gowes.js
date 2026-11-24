// =========================================================================
// TITIK GOWES — FRONTEND RENTAL & BOOKING CONTROLLER (js/gowes.js)
// Versi: V14.3 (Modular Super-App Ekosistem)
// =========================================================================

let gowesFilterType = "all";
let activeBookingBike = null;
let gowesKtpDraft = "";

// ================= 1. INISIALISASI & BERANDA TITIK GOWES =================
function renderGowesLandingPage() {
    const vGws = document.getElementById("view-gowes");
    if (!vGws || vGws.classList.contains("hide")) return;

    renderGowesShelterInfo();
    renderGowesBikesGrid();
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

// ================= 2. FILTER & ETALASE KARTU ARMADA SEPEDA =================
function filterGowesBikes(type) {
    gowesFilterType = type || "all";
    document.querySelectorAll(".gowes-filter-btn").forEach(btn => {
        const isMatch = btn.dataset.gt === gowesFilterType;
        btn.classList.toggle("active", isMatch);
    });
    renderGowesBikesGrid();
}

function getAvailableGowesBikes() {
    const list = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    return list.filter(b => b && b.status !== "Dihapus");
}

function renderGowesBikesGrid() {
    const box = document.getElementById("gowes-bikes-container");
    if (!box) return;

    let bikes = getAvailableGowesBikes();
    if (gowesFilterType !== "all") {
        bikes = bikes.filter(b => String(b.type || "").toLowerCase().includes(gowesFilterType.toLowerCase()));
    }

    if (!bikes.length) {
        box.innerHTML = `
            <div class="col-span-full app-card border border-dashed rounded-3xl p-8 text-center space-y-2">
                <i class="fa-solid fa-bicycle text-3xl app-muted"></i>
                <h4 class="font-extrabold text-sm">Belum Ada Sepeda di Kategori Ini</h4>
                <p class="text-xs app-muted">Silakan pilih kategori armada lain atau hubungi Admin via Live Chat.</p>
            </div>
        `;
        return;
    }

    box.innerHTML = bikes.map(b => buildBikeCardHtml(b)).join("");
}

function buildBikeCardHtml(bike) {
    const isAvailable = bike.status === "Tersedia";
    const isInUse = bike.status === "Sedang Disewa";
    const isService = bike.status === "Servis";

    const statusBadge = isAvailable
        ? `<span class="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow">● Tersedia</span>`
        : isInUse
            ? `<span class="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-black shadow">● Sedang Disewa</span>`
            : `<span class="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-zinc-600 text-white shadow">✕ Servis</span>`;

    const freeAccList = Array.isArray(bike.freeAccessories) ? bike.freeAccessories : ["Helm", "Kunci Pengaman"];
    const fallbackImg = "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";

    const actionButton = isAvailable
        ? `<button type="button" onclick="openGowesBookingModal('${esc(bike.id)}')" class="w-full gowes-pill-btn py-2.5 rounded-2xl text-xs uppercase shadow-md flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-bicycle"></i> Sewa Sepeda Ini
           </button>`
        : isInUse
            ? `<button type="button" disabled class="w-full py-2.5 rounded-2xl app-btn-sec opacity-60 text-xs font-bold text-center cursor-not-allowed">
                Unit Sedang Disewa
               </button>`
            : `<button type="button" disabled class="w-full py-2.5 rounded-2xl app-btn-sec opacity-60 text-xs font-bold text-center cursor-not-allowed">
                Dalam Masa Perawatan
               </button>`;

    return `
        <div class="bike-card flex flex-col justify-between">
            <div>
                <!-- Foto Unit & Badges -->
                <div class="relative w-full aspect-[16/10] bg-black overflow-hidden">
                    <img src="${bike.image || fallbackImg}" alt="${escHtml(bike.name)}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                    <div class="absolute top-2.5 left-2.5 z-10 flex gap-1.5 flex-wrap">
                        ${statusBadge}
                        <span class="bike-type-pill">${escHtml(bike.type || "Sepeda")}</span>
                    </div>
                    <div class="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[10px]">
                        <span class="font-bold drop-shadow"><i class="fa-solid fa-person-biking mr-1"></i>${bike.totalRentedCount || 0}x Disewa</span>
                    </div>
                </div>

                <!-- Info Spesifikasi -->
                <div class="p-4 space-y-2.5">
                    <div>
                        <h3 class="font-extrabold text-base leading-tight">${escHtml(bike.name)}</h3>
                        <p class="text-[11px] app-muted mt-0.5 line-clamp-2">${escHtml(bike.description || "")}</p>
                    </div>

                    <div class="flex flex-wrap gap-1.5">
                        <span class="bike-spec-badge"><i class="fa-solid fa-ruler-combined text-emerald-600"></i>Frame: ${escHtml(bike.frameSize || "All Size")}</span>
                        <span class="bike-spec-badge"><i class="fa-solid fa-gear text-emerald-600"></i>${escHtml(bike.gears || "Standar")}</span>
                    </div>

                    <!-- Aksesoris Gratis -->
                    <div class="text-[10px] app-muted space-x-1">
                        <span class="font-bold text-emerald-600">Gratis:</span>
                        <span>${escHtml(freeAccList.join(" • "))}</span>
                    </div>

                    <!-- Tarif Sewa Box -->
                    <div class="app-card-soft border rounded-2xl p-2.5 space-y-1">
                        <span class="text-[9.5px] uppercase font-bold app-muted block">Pilihan Paket Tarif:</span>
                        <div class="grid grid-cols-3 gap-1 text-center">
                            <div class="p-1 rounded-xl bg-black/5 dark:bg-white/5">
                                <span class="text-[9px] app-muted block font-semibold">2 Jam</span>
                                <strong class="text-[11px] font-extrabold text-emerald-600 block">${fmtRp(bike.price2Hours || 40000)}</strong>
                            </div>
                            <div class="p-1 rounded-xl bg-black/5 dark:bg-white/5">
                                <span class="text-[9px] app-muted block font-semibold">6 Jam</span>
                                <strong class="text-[11px] font-extrabold text-emerald-600 block">${fmtRp(bike.price6Hours || 75000)}</strong>
                            </div>
                            <div class="p-1 rounded-xl bg-black/5 dark:bg-white/5">
                                <span class="text-[9px] app-muted block font-semibold">Full Day</span>
                                <strong class="text-[11px] font-extrabold text-emerald-600 block">${fmtRp(bike.priceFullDay || 120000)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tombol Aksi -->
            <div class="p-4 pt-0">
                ${actionButton}
            </div>
        </div>
    `;
}

// ================= 3. MODAL FORMULIR SEWA SEPEDA & KALKULASI =================
function openGowesBookingModal(bikeId) {
    const bikes = getAvailableGowesBikes();
    const bike = bikes.find(b => String(b.id) === String(bikeId));
    if (!bike) return showToast("Unit sepeda tidak ditemukan.", "error");

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curU) {
        showToast("Silakan masuk akun terlebih dahulu untuk menyewa sepeda.", "info");
        if (typeof openAuthModal === "function") openAuthModal();
        return;
    }

    activeBookingBike = bike;
    gowesKtpDraft = "";

    document.getElementById("gw-book-bike-id").value = bike.id;
    document.getElementById("gw-modal-bike-title").innerText = `Booking: ${bike.name} (${bike.type})`;

    const imgEl = document.getElementById("gw-book-bike-img");
    const nameEl = document.getElementById("gw-book-bike-name");
    const typeEl = document.getElementById("gw-book-bike-type");
    const specsEl = document.getElementById("gw-book-bike-specs");

    if (imgEl) imgEl.src = bike.image || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";
    if (nameEl) nameEl.innerText = bike.name;
    if (typeEl) typeEl.innerText = bike.type;
    if (specsEl) specsEl.innerText = `Frame: ${bike.frameSize || "All Size"} • Gear: ${bike.gears || "Standar"}`;

    document.getElementById("gw-rate-2h").innerText = fmtRp(bike.price2Hours || 40000);
    document.getElementById("gw-rate-6h").innerText = fmtRp(bike.price6Hours || 75000);
    document.getElementById("gw-rate-fullday").innerText = fmtRp(bike.priceFullDay || 120000);

    const rad2h = document.querySelector('input[name="gw_duration"][value="2_hours"]');
    if (rad2h) rad2h.checked = true;

    // Prefill data pengguna
    const phInp = document.getElementById("gw-book-phone");
    const addrInp = document.getElementById("gw-book-address");
    if (phInp) phInp.value = curU.phone || "";
    if (addrInp) addrInp.value = curU.address || "";

    // Tanggal hari ini sebagai nilai awal
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const dateInp = document.getElementById("gw-book-date");
    if (dateInp) {
        dateInp.value = todayStr;
        dateInp.min = todayStr;
    }

    const timeInp = document.getElementById("gw-book-time");
    if (timeInp) {
        const hh = String(now.getHours() + 1).padStart(2, "0");
        timeInp.value = `${hh}:00`;
    }

    const ktpPrev = document.getElementById("gw-ktp-preview");
    if (ktpPrev) {
        ktpPrev.src = "";
        ktpPrev.classList.add("hide");
    }
    const ktpInp = document.getElementById("gw-ktp-input");
    if (ktpInp) ktpInp.value = "";

    updateGowesBookingPriceCalc();

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

function updateGowesBookingPriceCalc() {
    if (!activeBookingBike) return;
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durVal = durRadio ? durRadio.value : "2_hours";

    let price = Number(activeBookingBike.price2Hours || 40000);
    if (durVal === "6_hours") price = Number(activeBookingBike.price6Hours || 75000);
    else if (durVal === "full_day") price = Number(activeBookingBike.priceFullDay || 120000);

    const calcEl = document.getElementById("gw-book-total-calc");
    if (calcEl) calcEl.innerText = fmtRp(price);
}

// ================= 4. PENANGANAN UPLOAD KTP & PENGIRIMAN BOOKING =================
function handleGowesKtpPick(inp) {
    const file = inp.files && inp.files[0];
    if (!file) return;
    inp.value = "";

    // Buka pemotong gambar berasio KTP/SIM (1.6 : 1) agar foto identitas jelas & tegak
    if (typeof openImageCropper === "function") {
        openImageCropper(file, 1.6, "Atur & Potong Foto KTP Penjamin", 800, 500, (dataUrl) => {
            gowesKtpDraft = dataUrl;
            const prev = document.getElementById("gw-ktp-preview");
            if (prev) {
                prev.src = dataUrl;
                prev.classList.remove("hide");
            }
            if (typeof showToast === "function") showToast("Foto KTP berhasil dipilih.");
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

    const bikeId = document.getElementById("gw-book-bike-id").value;
    const durRadio = document.querySelector('input[name="gw_duration"]:checked');
    const durationKey = durRadio ? durRadio.value : "2_hours";
    const startDate = document.getElementById("gw-book-date").value.trim();
    const startTime = document.getElementById("gw-book-time").value.trim();
    const customerPhone = document.getElementById("gw-book-phone").value.trim();
    const customerAddress = document.getElementById("gw-book-address").value.trim();
    const note = document.getElementById("gw-book-note").value.trim();

    if (!startDate || !startTime) {
        return showToast("Tentukan tanggal dan jam sewa terlebih dahulu.", "error");
    }
    if (!customerPhone) {
        return showToast("Masukkan nomor WhatsApp aktif Anda.", "error");
    }
    if (!customerAddress) {
        return showToast("Masukkan alamat domisili Anda saat ini.", "error");
    }
    if (!gowesKtpDraft) {
        return showToast("Silakan unggah foto KTP/SIM penjamin untuk verifikasi.", "error");
    }

    setBtnLoading("btn-submit-gw-booking", true, "Menyimpan Booking...");

    const bookingPayload = {
        bikeId,
        durationKey,
        startDate,
        startTime,
        customerPhone,
        customerAddress,
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

    // Perbarui penampung lokal
    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const existingIdx = db.gowesRentals.findIndex(r => String(r.id) === String(res.rental.id));
    if (existingIdx >= 0) db.gowesRentals[existingIdx] = res.rental;
    else db.gowesRentals.unshift(res.rental);

    closeGowesBookingModal();
    showToast("Pesanan sewa berhasil dibuat! Selesaikan pembayaran melalui QRIS.");

    // Buka antarmuka pembayaran QRIS terpadu
    openGowesRentalPayment(res.rental.id);
}

// ================= 5. INTEGRASI PEMBAYARAN QRIS TITIK GOWES =================
function openGowesRentalPayment(rentalId) {
    const list = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];
    const rental = list.find(r => String(r.id) === String(rentalId));
    if (!rental) return showToast("Data pesanan sewa tidak ditemukan.", "error");

    if (typeof hideAllViews === "function") hideAllViews();
    currentViewName = "payment";
    document.body.classList.remove("in-home");

    const viewPay = document.getElementById("view-payment");
    if (viewPay) viewPay.classList.remove("hide");

    // Pasang metadata sewa sepeda ke layar pembayaran
    window.currentPaymentContext = {
        kind: "gowes_rental",
        id: rental.id,
        totalPay: rental.totalPrice,
        title: `Sewa Sepeda: ${rental.bikeName} (${rental.durationLabel})`
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
        itemName.innerHTML = `<strong>${escHtml(rental.bikeName)}</strong> • ${escHtml(rental.durationLabel)}<br><span class="text-[10px] app-muted">Jadwal: ${escHtml(rental.startDate)} pukul ${escHtml(rental.startTime)} WITA</span>`;
    }
    if (finalPrice) finalPrice.innerText = fmtRp(rental.totalPrice);
    if (uniqueHint) {
        uniqueHint.innerText = `Sudah termasuk kode unik Rp ${rental.uniqueCode || 0} untuk percepatan verifikasi Admin.`;
        uniqueHint.classList.remove("hide");
    }
    if (origPrice) origPrice.classList.add("hide");
    if (discBadge) discBadge.classList.add("hide");

    // Tampilkan QRIS Dinamis atau Statis
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

    // Tampilkan daftar rekening
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

    // Bersihkan pratinjau bukti sebelumnya
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

    // Perbarui data lokal
    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const idx = db.gowesRentals.findIndex(r => String(r.id) === String(rentalId));
    if (idx >= 0) db.gowesRentals[idx] = res.rental;

    showToast("Bukti pembayaran berhasil dikirim! Menunggu konfirmasi Admin.");
    if (typeof routeDashboard === "function") routeDashboard();
}

// ================= 6. KARTU RIWAYAT RENTAL PELANGGAN =================
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
                    <h4 class="font-extrabold text-xs sm:text-sm truncate pt-0.5">${escHtml(rental.bikeName)}</h4>
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

// ================= 7. MODAL DETAIL & BUKTI BOOKING RENTAL =================
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
                        <span class="text-[10px] app-muted block">${escHtml(r.durationLabel)}</span>
                        <span class="text-xs font-bold text-emerald-600 block">${fmtRp(r.totalPrice)}</span>
                    </div>
                </div>

                <div class="app-card-soft border rounded-2xl p-3 space-y-1.5">
                    <div class="flex justify-between"><span class="app-muted">Penyewa:</span><strong class="font-bold">@${escHtml(r.customerUsername)}</strong></div>
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
                        <span class="text-[10px] font-bold uppercase app-muted block">Bukti Pembayaran QRIS / Transfer:</span>
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