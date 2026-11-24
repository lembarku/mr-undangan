// =========================================================================
// TITIK GOWES — ADMIN FLEET & HANDOVER CONTROLLER (js/gowes-admin.js)
// Versi: V14.3 (Modular Super-App Ekosistem)
// =========================================================================

let mgbTempPhotoUrl = "";
let mghTempPhotoUrl = "";

// ================= 1. KELOLA ARMADA SEPEDA (FOUNDER CRUD) =================
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
    document.getElementById("mgb-accessories").value = isEdit ? (Array.isArray(b.freeAccessories) ? b.freeAccessories.join(", ") : (b.freeAccessories || "")) : "Helm Sepeda, Kunci Gembok Spiral, Lampu";
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
        openImageCropper(file, 16 / 10, "Atur Foto Unit Sepeda (16:10)", 960, 600, (dataUrl) => {
            mgbTempPhotoUrl = dataUrl;
            const prev = document.getElementById("mgb-preview-img");
            const urlInp = document.getElementById("mgb-img-url");
            if (prev) prev.src = dataUrl;
            if (urlInp) urlInp.value = dataUrl;
            if (typeof showToast === "function") showToast("Foto unit sepeda siap disimpan.");
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

    const freeAccessories = rawAcc
        ? rawAcc.split(",").map(x => x.trim()).filter(Boolean)
        : ["Helm Sepeda", "Kunci Gembok"];

    const bikePayload = {
        id: bikeId || ("bike_" + Date.now()),
        name,
        type,
        frameSize,
        gears,
        price2Hours,
        price6Hours,
        priceFullDay,
        status,
        freeAccessories,
        description,
        image: finalImage
    };

    setBtnLoading("btn-save-mgb", true, "Menyimpan Unit...");

    const res = await apiAction({
        action: "gowes_upsert_bike",
        bike: bikePayload
    });

    setBtnLoading("btn-save-mgb", false);

    if (!res || !res.ok) {
        return showToast((res && res.message) || "Gagal menyimpan unit sepeda.", "error");
    }

    if (!Array.isArray(db.gowesBikes)) db.gowesBikes = [];
    const idx = db.gowesBikes.findIndex(x => String(x.id) === String(bikePayload.id));
    if (idx >= 0) db.gowesBikes[idx] = Object.assign({}, db.gowesBikes[idx], bikePayload);
    else db.gowesBikes.unshift(bikePayload);

    document.getElementById("modal-gowes-bike")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-gowes-bike");

    // Perbarui etalase beranda jika sedang di Titik Gowes
    if (typeof renderGowesBikesGrid === "function") renderGowesBikesGrid();
    if (typeof renderSoloStatsModal === "function" && window._soloStatsViewState && window._soloStatsViewState.open) {
        renderSoloStatsModal();
    }
    showToast(`Unit ${name} berhasil disimpan!`);
}

async function deleteGowesBike(bikeId) {
    const bikes = Array.isArray(db.gowesBikes) ? db.gowesBikes : [];
    const bike = bikes.find(b => String(b.id) === String(bikeId));
    const bikeName = bike ? bike.name : "unit ini";

    const ok = await showConfirm(
        "Hapus Unit Armada",
        `Apakah Anda yakin ingin menghapus "${bikeName}" dari armada Titik Gowes?`,
        "fa-solid fa-trash",
        "Ya, Hapus Unit"
    );
    if (!ok) return;

    showLoading("Menghapus unit armada...");
    const res = await apiAction({
        action: "gowes_delete_bike",
        bikeId: String(bikeId)
    });
    hideLoading();

    if (!res || !res.ok) {
        return showToast((res && res.message) || "Gagal menghapus unit sepeda.", "error");
    }

    db.gowesBikes = (db.gowesBikes || []).filter(b => String(b.id) !== String(bikeId));
    if (typeof renderGowesBikesGrid === "function") renderGowesBikesGrid();
    if (typeof renderSoloStatsModal === "function" && window._soloStatsViewState && window._soloStatsViewState.open) {
        renderSoloStatsModal();
    }
    showToast(`Unit ${bikeName} berhasil dihapus.`);
}

async function toggleGowesBikeStatusQuick(bikeId, nextStatus) {
    const bikes = Array.isArray(db.gowesBikes) ? db.gowesBikes : [];
    const bike = bikes.find(b => String(b.id) === String(bikeId));
    if (!bike) return;

    const updated = Object.assign({}, bike, { status: nextStatus });
    showLoading(`Mengubah status ke ${nextStatus}...`);
    const res = await apiAction({
        action: "gowes_upsert_bike",
        bike: updated
    });
    hideLoading();

    if (res && res.ok) {
        const idx = bikes.findIndex(b => String(b.id) === String(bikeId));
        if (idx >= 0) bikes[idx].status = nextStatus;
        if (typeof renderGowesBikesGrid === "function") renderGowesBikesGrid();
        if (typeof renderSoloStatsModal === "function" && window._soloStatsViewState && window._soloStatsViewState.open) {
            renderSoloStatsModal();
        }
        showToast(`Status ${bike.name} diubah ke ${nextStatus}.`);
    } else {
        showToast("Gagal memperbarui status unit.", "error");
    }
}

// ================= 2. DAFTAR ARMADA UNTUK WORKSPACE ADMIN =================
function renderGowesBikesAdminList() {
    const bikes = Array.isArray(db.gowesBikes) && db.gowesBikes.length ? db.gowesBikes : DEFAULT_GOWES_BIKES;
    const activeBikes = bikes.filter(b => b && b.status !== "Dihapus");

    if (!activeBikes.length) {
        return `
            <div class="app-card border border-dashed rounded-3xl p-8 text-center space-y-2">
                <i class="fa-solid fa-bicycle text-3xl app-muted"></i>
                <h4 class="font-extrabold text-sm">Belum Ada Unit Armada</h4>
                <p class="text-xs app-muted">Klik tombol "+ Tambah Unit Sepeda" untuk mulai menginput armada garasi Anda.</p>
            </div>
        `;
    }

    return activeBikes.map(b => {
        const isAvail = b.status === "Tersedia";
        const isInUse = b.status === "Sedang Disewa";

        const statusCls = isAvail
            ? "bg-emerald-500/15 text-emerald-600"
            : isInUse
                ? "bg-amber-500/15 text-amber-600"
                : "bg-zinc-500/15 text-zinc-400";

        return `
            <div class="app-card border rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div class="flex items-center gap-3 min-w-0">
                    <img src="${b.image || 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75'}" class="w-14 h-14 rounded-xl object-cover bg-black border gold-border shrink-0">
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
                    <button type="button" onclick="deleteGowesBike('${esc(b.id)}')" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-[11px] font-bold" title="Hapus Unit">
                        <i class="fa-solid fa-trash"></i>
                    </button>
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

    if (titleEl) {
        titleEl.innerText = stage === "out"
            ? `Foto Serah Terima: ${r.bikeName}`
            : `Foto Pengembalian: ${r.bikeName}`;
    }
    if (subEl) {
        subEl.innerText = stage === "out"
            ? `Ambil foto kondisi sepeda saat diserahkan ke @${r.customerUsername} (Mulai Gowes).`
            : `Ambil foto kondisi sepeda saat dikembalikan oleh @${r.customerUsername} (Selesai).`;
    }

    if (prevImg) {
        prevImg.src = mghTempPhotoUrl || r.bikeImage || "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75";
    }

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
    if (!mghTempPhotoUrl) {
        return showToast("Ambil atau pilih foto fisik sepeda terlebih dahulu.", "error");
    }

    setBtnLoading("btn-save-mgh", true, "Menyimpan Foto...");

    const res = await apiAction({
        action: "gowes_record_handover",
        rentalId: rentalId,
        stage: stage,
        photo: mghTempPhotoUrl
    });

    setBtnLoading("btn-save-mgh", false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal menyimpan foto serah terima.", "error");
    }

    // Perbarui data sewa lokal
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
    const isStaffMode = !!options.isStaffMode;
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

    const priceInfo = `${fmtRp(rental.totalPrice)} (Kode unik: ${rental.uniqueCode || 0})`;

    return `
        <div class="app-card border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 shadow-sm border-l-4 border-l-emerald-500">
            <div class="min-w-0 space-y-1">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="gowes-brand-tag !text-[8.5px]"><i class="fa-solid fa-bicycle"></i> RENTAL TITIK GOWES</span>
                    ${statusBadge}
                </div>
                <h4 class="font-bold text-sm truncate">
                    ${escHtml(rental.bikeName)} 
                    <span class="text-xs app-muted font-normal">(@${escHtml(rental.customerUsername)} • ${escHtml(rental.customerPhone || "-")})</span>
                </h4>
                <p class="text-xs app-muted">
                    Paket: <strong class="app-accent">${escHtml(rental.durationLabel)}</strong> • ${priceInfo}
                </p>
                <div class="flex flex-wrap items-center gap-2 text-[10px] text-emerald-600 font-semibold pt-0.5">
                    <span><i class="fa-regular fa-calendar-check mr-1"></i>${escHtml(rental.startDate)} (${escHtml(rental.startTime)} WITA)</span>
                    <span>• Pos: ${escHtml(rental.pickupLocation || "Shelter Utama")}</span>
                    ${rental.handoverOutPhoto ? `<span class="text-blue-500"><i class="fa-solid fa-camera mr-0.5"></i>Foto Keluar ✓</span>` : ""}
                    ${rental.handoverInPhoto ? `<span class="text-emerald-500"><i class="fa-solid fa-camera mr-0.5"></i>Foto Kembali ✓</span>` : ""}
                </div>
            </div>

            <!-- Tombol Kendali Verifikasi & Operasional Sewa -->
            <div class="flex flex-wrap items-center gap-1.5 self-start md:self-center shrink-0">
                ${rental.customerUsername ? `
                    <button type="button" onclick="${preCloseJs}openFullChatOverlay('${esc(rental.customerUsername)}')" class="px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/35 text-emerald-600 text-xs font-bold" title="Kirim Pesan ke Penyewa">
                        <i class="fa-solid fa-comments mr-1"></i>Chat
                    </button>
                ` : ""}

                ${rental.ktpImage ? `
                    <button type="button" onclick="viewGowesKtpModal('${esc(rental.ktpImage)}','${esc(rental.customerName || rental.customerUsername)}')" class="px-3 py-1.5 rounded-xl bg-purple-600/15 border border-purple-500/35 text-purple-600 text-xs font-bold" title="Periksa Identitas KTP Penjamin">
                        <i class="fa-solid fa-id-card mr-1"></i>KTP
                    </button>
                ` : ""}

                ${rental.paymentProof ? `
                    <button type="button" onclick="viewOrderProof('gowes_rental','${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/35 text-blue-600 text-xs font-bold">
                        <i class="fa-solid fa-receipt mr-1"></i>Bukti
                    </button>
                ` : ""}

                <!-- Aksi Status Berdasarkan Siklus Rental -->
                ${isVerif || isPay ? `
                    <button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Terkonfirmasi',this)" class="gowes-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                        ✓ ACC Bayar
                    </button>
                ` : ""}

                ${isConfirmed ? `
                    <button type="button" onclick="openGowesHandoverModal('${esc(rental.id)}','out')" class="px-3 py-1.5 rounded-xl app-card-soft border text-blue-600 text-xs font-bold">
                        <i class="fa-solid fa-camera mr-1"></i>Foto Keluar
                    </button>
                    <button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Sedang Digunakan',this)" class="gowes-pill-btn px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-sm">
                        <i class="fa-solid fa-key mr-1"></i>Serahkan Unit
                    </button>
                ` : ""}

                ${isInUse ? `
                    <button type="button" onclick="openGowesHandoverModal('${esc(rental.id)}','in')" class="px-3 py-1.5 rounded-xl app-card-soft border text-emerald-600 text-xs font-bold">
                        <i class="fa-solid fa-camera mr-1"></i>Foto Kembali
                    </button>
                    <button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Selesai',this)" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm">
                        ✓ Unit Selesai
                    </button>
                ` : ""}

                ${!isDone && !isCanceled ? `
                    <button type="button" onclick="setGowesRentalStatus('${esc(rental.id)}','Dibatalkan',this)" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-xs font-bold" title="Batalkan Sewa">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                ` : ""}

                <button type="button" onclick="openGowesRentalDetail('${esc(rental.id)}')" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold">
                    Detail
                </button>
            </div>
        </div>
    `;
}

// ================= 5. PERUBAHAN STATUS TRANSAKSI SEWA & KTP VIEWER =================
async function setGowesRentalStatus(rentalId, nextStatus, btnEl) {
    if (nextStatus === "Dibatalkan") {
        const ok = await showConfirm(
            "Batalkan Pesanan Sewa",
            "Batalkan pesanan sewa sepeda ini? Status armada akan otomatis dikembalikan ke status Tersedia.",
            "fa-solid fa-triangle-exclamation",
            "Ya, Batalkan"
        );
        if (!ok) return;
    }

    if (btnEl) setBtnLoading(btnEl, true, "...");

    const res = await apiAction({
        action: "gowes_update_rental_status",
        rentalId: String(rentalId),
        status: nextStatus
    });

    if (btnEl) setBtnLoading(btnEl, false);

    if (!res || !res.ok || !res.rental) {
        return showToast((res && res.message) || "Gagal mengubah status sewa sepeda.", "error");
    }

    // Perbarui data lokal
    if (!Array.isArray(db.gowesRentals)) db.gowesRentals = [];
    const idx = db.gowesRentals.findIndex(r => String(r.id) === String(rentalId));
    if (idx >= 0) db.gowesRentals[idx] = res.rental;

    // Perbarui ketersediaan armada lokal
    const bikeId = res.rental.bikeId;
    if (Array.isArray(db.gowesBikes)) {
        const bIdx = db.gowesBikes.findIndex(b => String(b.id) === String(bikeId));
        if (bIdx >= 0) {
            if (nextStatus === "Sedang Digunakan") db.gowesBikes[bIdx].status = "Sedang Disewa";
            else if (nextStatus === "Selesai" || nextStatus === "Dibatalkan") db.gowesBikes[bIdx].status = "Tersedia";
        }
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

    // Breakdown Durasi Sewa
    const durationMap = { "2 Jam": 0, "6 Jam": 0, "Full Day": 0 };
    rentals.forEach(r => {
        const d = String(r.durationLabel || r.durationKey || "");
        if (d.includes("2 Jam") || d === "2_hours") durationMap["2 Jam"]++;
        else if (d.includes("6 Jam") || d === "6_hours") durationMap["6 Jam"]++;
        else if (d.includes("Full") || d === "full_day") durationMap["Full Day"]++;
    });
    const maxDur = Math.max(1, durationMap["2 Jam"], durationMap["6 Jam"], durationMap["Full Day"]);

    // Tren 6 Bulan Terakhir
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

    // Unit Terlaris
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

    return `
        <div class="space-y-4">
            <!-- Header Ringkasan Metrik Utama -->
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

            <!-- Grafik Tren Pendapatan Sewa (6 Bulan) -->
            <div class="grid md:grid-cols-2 gap-4">
                <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-xs font-extrabold uppercase text-emerald-600"><i class="fa-solid fa-chart-simple mr-1.5"></i>Tren Pendapatan Rental Sepeda</h4>
                            <p class="text-[10px] app-muted">Pendapatan bulanan Titik Gowes (6 Bulan)</p>
                        </div>
                        <span class="text-[10px] font-extrabold text-emerald-600">${fmtRp(totalRevenue)}</span>
                    </div>

                    <div class="h-44 flex items-end justify-between gap-2 pt-4 px-1">
                        ${months.map(m => {
                            const hPct = Math.max(8, Math.round((m.revenue / maxMonthlyRev) * 100));
                            return `
                                <div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                    <span class="text-[9px] font-bold text-emerald-600">${m.bookings}</span>
                                    <div class="w-full max-w-[34px] rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-500 shadow-sm" style="height:${hPct}%" title="${m.label}: ${fmtRp(m.revenue)} (${m.bookings} booking)"></div>
                                    <span class="text-[10px] app-muted font-semibold">${m.label}</span>
                                </div>
                            `;
                        }).join("")}
                    </div>
                </div>

                <!-- Durasi Favorit & Unit Terlaris -->
                <div class="app-card border rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
                    <div>
                        <h4 class="text-xs font-extrabold uppercase text-emerald-600"><i class="fa-solid fa-clock mr-1.5"></i>Paket Durasi Paling Diminati</h4>
                        <p class="text-[10px] app-muted">Pola lama penggunaan sepeda oleh pelanggan</p>
                    </div>

                    <div class="space-y-2.5 text-xs">
                        <div>
                            <div class="flex justify-between text-[11px] font-bold mb-1">
                                <span>Paket 2 Jam (Short Ride)</span>
                                <span class="text-emerald-600">${durationMap["2 Jam"]}x</span>
                            </div>
                            <div class="w-full h-2 rounded-full app-card-soft overflow-hidden">
                                <div class="h-full bg-emerald-500 rounded-full" style="width:${Math.round((durationMap["2 Jam"] / maxDur) * 100)}%"></div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between text-[11px] font-bold mb-1">
                                <span>Paket 6 Jam (Half Day)</span>
                                <span class="text-blue-500">${durationMap["6 Jam"]}x</span>
                            </div>
                            <div class="w-full h-2 rounded-full app-card-soft overflow-hidden">
                                <div class="h-full bg-blue-500 rounded-full" style="width:${Math.round((durationMap["6 Jam"] / maxDur) * 100)}%"></div>
                            </div>
                        </div>

                        <div>
                            <div class="flex justify-between text-[11px] font-bold mb-1">
                                <span>Paket Full Day (Seharian Penuh)</span>
                                <span class="text-amber-500">${durationMap["Full Day"]}x</span>
                            </div>
                            <div class="w-full h-2 rounded-full app-card-soft overflow-hidden">
                                <div class="h-full bg-amber-500 rounded-full" style="width:${Math.round((durationMap["Full Day"] / maxDur) * 100)}%"></div>
                            </div>
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