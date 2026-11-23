// =========================================================================
// MR UNDANGAN — MASTER ADMIN (GRAFIK, INSPEKSI, THEME BUILDER) & STAFF
// File: js/admin.js
// =========================================================================
let masterThemeCatFilter = "Pernikahan", masterThemeSearch = "", masterOrdersFilter = "all";
let tbPhotosDraft = { cover: "", pria: "", wanita: "", couple: "", g1: "", g2: "", g3: "" };
let pbTempUploadedImg = "";

// ================= 1. DASBOR MASTER ADMIN =================
function renderMasterAdmin() {
    renderMasterHeaderStats();
    openMasterWorkspace(currentMasterWorkspace || "overview");
}

function renderMasterHeaderStats() {
    const m = getCurrentUserObj(); if (!m) return;
    document.getElementById("mprof-banner").style.backgroundImage = m.banner ? `url('${m.banner}')` : "";
    document.getElementById("mprof-avatar").src = m.avatar || DEFAULT_AVATAR;
    document.getElementById("mprof-name").innerText = m.name || "Master Admin";
    document.getElementById("mprof-username").innerText = `@${m.username}`;
    document.getElementById("mprof-bio").innerText = m.bio || "Mr Undangan — Powered by Kausar.pictures";

    const setT = (id, v) => { const el = document.getElementById(id); if (el) el.innerText = v; };
    const nonMaster = (db.users || []).filter(u => u.role !== "master");
    const pendingAll = (db.invitations || []).filter(i => i.status !== "Aktif").length
        + (db.portfolios || []).filter(p => p.status !== "Aktif").length
        + nonMaster.filter(u => u.status !== "Aktif").length;
    const activeAll = (db.invitations || []).filter(i => i.status === "Aktif").length
        + (db.portfolios || []).filter(p => p.status === "Aktif").length;
    const proCount = nonMaster.filter(u => u.isPro).length;

    setT("stat-users", nonMaster.length);
    setT("stat-pending", pendingAll);
    setT("stat-active", activeAll);
    setT("stat-pro", proCount);
}

function openMasterWorkspace(name) {
    if (name === "chat") return openFullChatOverlay();
    currentMasterWorkspace = name || "overview";
    pbTempUploadedImg = "";
    const titles = {
        overview: "Grafik & Analitik Bisnis",
        orders: "Verifikasi Konfirmasi, Revisi & Edit Proyek",
        themes: "Kelola Tema Undangan & Harga CV/Lamaran",
        users_cabang: "Kelola Akun User, Cabang, Pro & Tim Administrasi",
        home_editor: "Edit Banner Promosi Beranda (12 : 4.4)",
        media: "Stok Musik & Slideshow Testimoni"
    };
    document.getElementById("master-active-panel-title").innerText = titles[currentMasterWorkspace] || "Panel Master";
    document.getElementById("master-back-overview-btn").classList.toggle("hide", currentMasterWorkspace === "overview");
    renderMasterWorkspaceContent();
}

function buildMasterAnalyticsHtml() {
    const invs = db.invitations || [];
    const pfs = db.portfolios || [];
    const users = (db.users || []).filter(u => u.role !== "master");

    const invActive = invs.filter(i => i.status === "Aktif");
    const cvActive = pfs.filter(p => p.status === "Aktif" && p.docType !== "lamaran");
    const lamActive = pfs.filter(p => p.status === "Aktif" && p.docType === "lamaran");

    const revInv = invActive.reduce((s, i) => s + Number(i.price || 99000), 0);
    const revPf = [...cvActive, ...lamActive].reduce((s, p) => s + Number(p.price || 20000), 0);
    const totalRev = revInv + revPf;

    const now = new Date();
    const months = [];
    for (let k = 5; k >= 0; k--) {
        const dt = new Date(now.getFullYear(), now.getMonth() - k, 1);
        months.push({
            key: `${dt.getFullYear()}-${dt.getMonth()}`,
            label: dt.toLocaleDateString("id-ID", { month: "short" }),
            orders: 0,
            rev: 0
        });
    }
    const allDocs = [...invs, ...pfs];
    allDocs.forEach(doc => {
        const ts = Number(doc.createdAt || doc.id || Date.now());
        const dt = new Date(ts);
        const mk = `${dt.getFullYear()}-${dt.getMonth()}`;
        const bucket = months.find(m => m.key === mk);
        if (bucket) {
            bucket.orders++;
            if (doc.status === "Aktif") bucket.rev += Number(doc.price || (doc.docType ? 20000 : 99000));
        }
    });
    const maxOrders = Math.max(1, ...months.map(m => m.orders));

    const cInv = invs.length, cCv = pfs.filter(p => p.docType !== "lamaran").length, cLam = pfs.filter(p => p.docType === "lamaran").length;
    const totalProd = Math.max(1, cInv + cCv + cLam);
    const circ = 2 * Math.PI * 38;
    const dInv = (cInv / totalProd) * circ;
    const dCv = (cCv / totalProd) * circ;
    const dLam = (cLam / totalProd) * circ;

    const uReg = users.filter(u => u.role === "user" && !u.isPro).length;
    const uPro = users.filter(u => u.isPro).length;
    const uCab = users.filter(u => u.role === "cabang").length;
    const uStaff = users.filter(u => u.role === "administrasi").length;
    const maxU = Math.max(1, uReg, uPro, uCab, uStaff);

    const pendingUsers = users.filter(u => u.status !== "Aktif");
    const logs = (db.adminLogs || []).slice(0, 6);

    return `<div class="space-y-5">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="app-card-soft border rounded-2xl p-3.5 space-y-1">
                <span class="text-[10px] app-muted font-bold uppercase block">Omzet Aktif</span>
                <strong class="text-base sm:text-lg font-extrabold app-accent block truncate">${fmtRp(totalRev)}</strong>
                <span class="text-[10px] app-muted">${invActive.length} Undangan • ${cvActive.length + lamActive.length} CV/Lam</span>
            </div>
            <div class="app-card-soft border rounded-2xl p-3.5 space-y-1">
                <span class="text-[10px] app-muted font-bold uppercase block">Omzet Undangan</span>
                <strong class="text-base sm:text-lg font-extrabold block truncate">${fmtRp(revInv)}</strong>
                <span class="text-[10px] text-emerald-600 font-semibold">${invActive.length} aktif</span>
            </div>
            <div class="app-card-soft border rounded-2xl p-3.5 space-y-1">
                <span class="text-[10px] app-muted font-bold uppercase block">Omzet CV &amp; Lamaran</span>
                <strong class="text-base sm:text-lg font-extrabold block truncate">${fmtRp(revPf)}</strong>
                <span class="text-[10px] text-blue-600 font-semibold">${cvActive.length + lamActive.length} aktif</span>
            </div>
            <div class="app-card-soft border rounded-2xl p-3.5 space-y-1">
                <span class="text-[10px] app-muted font-bold uppercase block">Pendaftar Baru</span>
                <strong class="text-base sm:text-lg font-extrabold text-amber-500 block">${pendingUsers.length} Akun</strong>
                <span class="text-[10px] app-muted">Gunakan titik 3 untuk kelola</span>
            </div>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
            <div class="app-card-soft border rounded-2xl p-4 space-y-3">
                <div class="flex items-center justify-between">
                    <h4 class="text-xs font-extrabold uppercase app-accent">Tren Pesanan (6 Bulan)</h4>
                    <span class="text-[10px] app-muted">Total: ${allDocs.length} berkas</span>
                </div>
                <div class="h-40 flex items-end justify-between gap-2 pt-4 px-1">
                    ${months.map(m => {
                        const hPct = Math.max(8, Math.round((m.orders / maxOrders) * 100));
                        return `<div class="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                            <span class="text-[10px] font-bold">${m.orders}</span>
                            <div class="w-full max-w-[34px] rounded-t-xl gold-gradient transition-all duration-500 shadow-sm" style="height:${hPct}%" title="${m.label}: ${m.orders} pesanan (${fmtRp(m.rev)})"></div>
                            <span class="text-[10px] app-muted font-semibold">${m.label}</span>
                        </div>`;
                    }).join("")}
                </div>
            </div>

            <div class="app-card-soft border rounded-2xl p-4 space-y-4">
                <h4 class="text-xs font-extrabold uppercase app-accent">Komposisi Produk &amp; Akun</h4>
                <div class="flex items-center gap-5">
                    <svg width="96" height="96" viewBox="0 0 96 96" class="shrink-0 -rotate-90">
                        <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(148,163,184,0.22)" stroke-width="12"/>
                        <circle cx="48" cy="48" r="38" fill="none" stroke="#eab308" stroke-width="12" stroke-dasharray="${dInv} ${circ}" stroke-dashoffset="0"/>
                        <circle cx="48" cy="48" r="38" fill="none" stroke="#3b82f6" stroke-width="12" stroke-dasharray="${dCv} ${circ}" stroke-dashoffset="${-dInv}"/>
                        <circle cx="48" cy="48" r="38" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="${dLam} ${circ}" stroke-dashoffset="${-(dInv + dCv)}"/>
                    </svg>
                    <div class="flex-1 space-y-1.5 text-xs">
                        <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span>Undangan</span><strong>${cInv}</strong></div>
                        <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Curriculum Vitae</span><strong>${cCv}</strong></div>
                        <div class="flex items-center justify-between"><span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Surat Lamaran</span><strong>${cLam}</strong></div>
                    </div>
                </div>
                <div class="space-y-2 pt-2 border-t gold-border text-[11px]">
                    ${[
                        { lbl: "User Reguler", val: uReg, col: "bg-slate-400" },
                        { lbl: "Akun Pro (Centang Biru)", val: uPro, col: "bg-blue-500" },
                        { lbl: "Admin Cabang", val: uCab, col: "bg-amber-500" },
                        { lbl: "Tim Administrasi", val: uStaff, col: "bg-emerald-500" }
                    ].map(row => `<div class="space-y-0.5"><div class="flex justify-between"><span class="app-muted">${row.lbl}</span><strong>${row.val}</strong></div><div class="w-full h-1.5 rounded-full app-btn-sec overflow-hidden"><div class="h-full ${row.col} rounded-full" style="width:${Math.max(4, Math.round((row.val / maxU) * 100))}%"></div></div></div>`).join("")}
                </div>
            </div>
        </div>

        <div class="app-card-soft border rounded-2xl p-4 space-y-2.5">
            <h4 class="text-xs font-extrabold uppercase app-accent">Aktivitas Verifikasi &amp; Edit Terbaru</h4>
            ${logs.length ? logs.map(l => `<div class="app-card border rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[11px]"><div class="min-w-0"><strong class="app-accent">@${escHtml(l.actor)}</strong> <span class="text-[9px] uppercase px-1.5 py-0.5 rounded app-btn-sec font-bold mr-1">${escHtml(l.role)}</span><span>${escHtml(l.msg)}</span></div><span class="text-[10px] app-muted shrink-0">${escHtml(l.time)}</span></div>`).join("") : '<p class="text-xs app-muted">Belum ada catatan aktivitas verifikasi.</p>'}
        </div>
    </div>`;
}

// ================= 2. HALAMAN ROLE ADMINISTRASI =================
function isCabangOwnedDoc(item) {
    if (!item) return false;
    if (item.brandName && String(item.brandName).trim()) return true;
    const ownerObj = (db.users || []).find(u => String(u.username || "").toLowerCase() === String(item.owner || "").toLowerCase());
    return !!(ownerObj && ownerObj.role === "cabang");
}

function renderStaffAdmin() {
    const st = getCurrentUserObj(); if (!st) return;
    document.getElementById("staff-avatar").src = st.avatar || DEFAULT_AVATAR;
    document.getElementById("staff-name").innerText = st.name || "Tim Administrasi";
    document.getElementById("staff-username").innerText = `@${st.username}`;

    const userInvs = (db.invitations || []).filter(i => !isCabangOwnedDoc(i));
    const userPfs = (db.portfolios || []).filter(p => !isCabangOwnedDoc(p));
    const pendingCnt = userInvs.filter(i => i.status !== "Aktif").length + userPfs.filter(p => p.status !== "Aktif").length;

    document.getElementById("staff-pending-badge").innerText = `${pendingCnt} Menunggu`;
    document.getElementById("staff-orders-body").innerHTML = buildUnifiedOrdersListHtml(true);
    updateChatBadges();
}

function buildUnifiedOrdersListHtml(isStaffMode = false) {
    const invItems = (db.invitations || []).map(i => Object.assign({}, i, { _kind: "inv" }));
    const pfItems = (db.portfolios || []).map(p => Object.assign({}, p, { _kind: "pf" }));
    let list = [...invItems, ...pfItems].sort((a, b) => Number(b.createdAt || b.id || 0) - Number(a.createdAt || a.id || 0));

    if (isStaffMode) {
        list = list.filter(x => !isCabangOwnedDoc(x));
    }

    if (masterOrdersFilter === "pending") list = list.filter(x => x.status !== "Aktif");
    else if (masterOrdersFilter === "inv") list = list.filter(x => x._kind === "inv");
    else if (masterOrdersFilter === "pf") list = list.filter(x => x._kind === "pf");

    const filterBar = `<div class="flex flex-wrap gap-1.5 pb-2">
        ${[["all","Semua"],["pending","Menunggu"],["inv","Undangan"],["pf","CV & Lamaran"]].map(([k, lbl]) =>
            `<button type="button" onclick="masterOrdersFilter='${k}';${isStaffMode ? "renderStaffAdmin()" : "renderMasterWorkspaceContent()"};" class="px-3 py-1.5 rounded-xl text-[11px] font-bold ${masterOrdersFilter===k?"gold-pill-btn":"app-btn-sec"}">${lbl}</button>`
        ).join("")}
    </div>`;

    if (!list.length) return filterBar + `<p class="text-xs app-muted py-6 text-center">Tidak ada data pesanan pada filter ini.</p>`;

    return filterBar + `<div class="space-y-3">` + list.map(item => {
        const isPf = item._kind === "pf";
        const hasRev = !!item.pendingRevision;
        const typeTag = isPf ? (item.docType === "lamaran" ? "SURAT LAMARAN" : "CV") : `UNDANGAN • ${escHtml(item.category)}`;
        const priceInfo = item.totalPay ? `${fmtRp(item.totalPay)} (kode unik)` : (item.price ? fmtRp(item.price) : "");

        return `<div class="app-card-soft border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-1.5">
                    <span class="text-[9px] px-2 py-0.5 rounded-full app-accent-bg app-accent font-extrabold">${typeTag}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${item.status==="Aktif"?"bg-emerald-500/20 text-emerald-600":"bg-amber-500/20 app-accent"}">● ${escHtml(item.status)}</span>
                </div>
                <h4 class="font-bold text-sm mt-1 truncate">${escHtml(item.title)} <span class="text-xs app-muted font-normal">(@${escHtml(item.owner)}${item.brandName ? ` • ${escHtml(item.brandName)}` : ""})</span></h4>
                <p class="text-xs app-muted">${escHtml(isPf ? (item.themeName || item.themeId) : item.theme)} ${priceInfo ? `• <strong class="app-accent">${priceInfo}</strong>` : ""} • Revisi: ${item.editCount || 0}/2</p>
            </div>
            <div class="flex flex-wrap gap-1.5">
                ${item.owner ? `<button onclick="openFullChatOverlay('${esc(item.owner)}')" class="px-3 py-1.5 rounded-xl bg-emerald-600/15 border border-emerald-500/40 text-emerald-600 text-xs font-bold" title="Kirim Pesan ke Pemilik Order"><i class="fa-solid fa-comments mr-1"></i>Chat</button>` : ""}
                ${item.paymentProof ? `<button onclick="viewOrderProof('${item._kind}',${item.id})" class="px-3 py-1.5 rounded-xl bg-blue-600/15 border border-blue-500/40 text-blue-600 text-xs font-bold">Bukti / SS</button>` : ""}
                <button onclick="${isPf ? `openEditPortfolio(${item.id},true)` : `openEditInvitation(${item.id},true)`}" class="px-3 py-1.5 rounded-xl app-card border app-accent text-xs font-bold"><i class="fa-solid fa-pen mr-1"></i>Edit</button>
                ${hasRev ? `
                    <button onclick="${isPf ? `openPortfolioDocPreview(${item.id},true)` : `previewPendingRevision(${item.id})`}" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold">Cek Revisi</button>
                    <button onclick="approveOrderRevision('${item._kind}',${item.id},this)" class="gold-pill-btn px-3.5 py-1.5 rounded-xl text-xs">✓ ACC Revisi</button>
                    <button onclick="rejectOrderRevision('${item._kind}',${item.id},this)" class="px-3 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-xs font-bold">Tolak</button>
                ` : `
                    <button onclick="${isPf ? `openPortfolioDocPreview(${item.id},false)` : `openGuestView(${item.id},'Review Admin')`}" class="px-3 py-1.5 rounded-xl app-btn-sec text-xs font-bold">Lihat</button>
                    ${item.status !== "Aktif"
                        ? `<button onclick="setOrderStatus('${item._kind}',${item.id},'Aktif',this)" class="gold-pill-btn px-4 py-1.5 rounded-xl text-xs">✓ Konfirmasi</button>`
                        : `<button onclick="setOrderStatus('${item._kind}',${item.id},'Menunggu Verifikasi',this)" class="px-3 py-1.5 rounded-xl bg-amber-600/15 app-accent text-xs font-bold">Tangguhkan</button>`}
                `}
                ${!isStaffMode ? `<button onclick="deleteOrderItem('${item._kind}',${item.id})" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>` : ""}
            </div>
        </div>`;
    }).join("") + `</div>`;
}

// Penampil Bukti Pembayaran Aman (Tanpa document.write & bebas blokir popup HP)
function viewOrderProof(kind, id) {
    const item = kind === "pf"
        ? (db.portfolios || []).find(p => String(p.id) === String(id))
        : (db.invitations || []).find(i => String(i.id) === String(id));
    if (!item || !item.paymentProof) return showToast("Bukti pembayaran belum tersedia.", "info");

    const rawUrl = String(item.paymentProof || "").trim();
    const isSafeUrl = /^(https?:\/\/|data:image\/)/i.test(rawUrl);
    if (!isSafeUrl) return showToast("Format bukti pembayaran tidak valid.", "error");

    const modal = document.getElementById("modal-proof-viewer");
    const imgEl = document.getElementById("proof-viewer-img");
    const titleEl = document.getElementById("proof-viewer-title");
    const openLink = document.getElementById("proof-viewer-open-link");

    if (modal && imgEl) {
        if (titleEl) titleEl.innerText = `Bukti — ${item.title || "Pesanan"} (@${item.owner || "-"})`;
        imgEl.src = rawUrl;
        if (openLink) {
            openLink.href = rawUrl;
            openLink.classList.toggle("hide", rawUrl.startsWith("data:"));
        }
        modal.classList.remove("hide");
        if (typeof pushBackGuard === "function") pushBackGuard();
        return;
    }

    if (!rawUrl.startsWith("data:")) window.open(rawUrl, "_blank", "noopener,noreferrer");
}

function previewPendingRevision(id) {
    const inv = db.invitations.find(i => String(i.id) === String(id));
    if (inv && inv.pendingRevision) openGuestViewWithObject(Object.assign({}, inv, inv.pendingRevision), "Review Revisi");
}
async function setOrderStatus(kind, id, status, btn) {
    setBtnLoading(btn, true, "...");
    if (kind === "pf") {
        const pf = (db.portfolios || []).find(p => String(p.id) === String(id));
        if (pf) await apiAction({ action: "upsert_portfolio", portfolio: Object.assign({}, pf, { status }), adminActionLog: `Mengubah status ${pf.docType === "lamaran" ? "Lamaran" : "CV"} "${pf.title}" menjadi ${status}` });
    } else {
        const inv = (db.invitations || []).find(i => String(i.id) === String(id));
        if (inv) await apiAction({ action: "upsert_invitation", invitation: Object.assign({}, inv, { status }), adminActionLog: `Mengubah status undangan "${inv.title}" menjadi ${status}` });
    }
    refreshAfterAdminOrderAction(`Status berkas diperbarui: ${status}`);
}
async function approveOrderRevision(kind, id, btn) {
    if (!(await showConfirm("Setujui Revisi", "Versi lama otomatis digantikan versi revisi terbaru. Lanjutkan?", "fa-solid fa-check-double", "Ya, Setujui"))) return;
    setBtnLoading(btn, true, "...");
    await apiAction({ action: kind === "pf" ? "approve_portfolio_revision" : "approve_revision", id });
    refreshAfterAdminOrderAction("Revisi disetujui & aktif!");
}
async function rejectOrderRevision(kind, id, btn) {
    setBtnLoading(btn, true, "...");
    await apiAction({ action: kind === "pf" ? "reject_portfolio_revision" : "reject_revision", id });
    refreshAfterAdminOrderAction("Revisi ditolak, kembali ke versi aktif.");
}
async function deleteOrderItem(kind, id) {
    if (!(await showConfirm("Hapus Proyek", "Hapus berkas ini secara permanen?", "fa-solid fa-trash", "Ya, Hapus"))) return;
    showLoading("Menghapus...");
    await apiAction({ action: kind === "pf" ? "delete_portfolio" : "delete_invitation", id });
    hideLoading();
    refreshAfterAdminOrderAction("Proyek dihapus.");
}
function refreshAfterAdminOrderAction(msg) {
    const u = getCurrentUserObj();
    if (u && u.role === "administrasi") renderStaffAdmin();
    else { renderMasterHeaderStats(); renderMasterWorkspaceContent(); }
    showToast(msg);
}

// ================= 3. WORKSPACE MASTER: TEMA, HARGA CV, AKUN, BANNER & MEDIA =================
function renderMasterThemesGridOnly() {
    const grid = document.getElementById("master-themes-grid");
    const countEl = document.getElementById("master-themes-count");
    if (!grid) return;

    let list = getMergedThemes(masterThemeCatFilter, true);
    if (masterThemeSearch.trim()) {
        const q = masterThemeSearch.trim().toLowerCase();
        list = list.filter(t => String(t.name || "").toLowerCase().includes(q));
    }

    if (countEl) countEl.innerText = String(list.length);

    if (!list.length) {
        grid.innerHTML = `<p class="text-xs app-muted text-center py-8 sm:col-span-2 lg:col-span-3 app-card-soft rounded-2xl border border-dashed">Tidak ada tema yang cocok dengan pencarian "${escHtml(masterThemeSearch)}".</p>`;
        return;
    }

    grid.innerHTML = list.map(t => {
        const cov = getThemeCoverPair(t.cat, t), pr = getThemePricing(t);
        return `<div class="app-card-soft border rounded-2xl overflow-hidden flex flex-col justify-between ${t.isHidden ? "opacity-55 border-dashed" : ""}">
            <div class="flex gap-3 p-3">
                <img src="${cov.src}" ${imgFbAttr(cov.fb)} loading="lazy" class="w-16 h-24 rounded-xl object-cover border gold-border shrink-0 bg-black">
                <div class="flex-1 min-w-0 space-y-1">
                    <div class="flex items-center gap-1 flex-wrap">
                        ${t.isCustom ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-500 font-bold">KUSTOM</span>` : ""}
                        ${t.badge ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold">${escHtml(t.badge)}</span>` : ""}
                        ${t.isHidden ? `<span class="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-500 font-bold">DISEMBUNYIKAN</span>` : ""}
                    </div>
                    <h4 class="font-bold text-xs truncate">${escHtml(t.name)}</h4>
                    <p class="text-[11px] font-extrabold app-accent">${pr.hasDisc ? `<span class="line-through app-muted font-normal mr-1">${fmtRp(pr.origPrice)}</span>` : ""}${fmtRp(pr.price)}</p>
                    <p class="text-[10px] app-muted truncate">${(t.demoData && t.demoData.title) ? `Contoh: ${escHtml(t.demoData.title)}` : "Contoh bawaan"}</p>
                </div>
            </div>
            <div class="grid grid-cols-5 gap-1 p-2 border-t gold-border text-[10px] font-bold">
                <button onclick="openThemeLivePreview('${esc(t.cat)}','${esc(t.name)}')" class="py-1.5 rounded-lg app-btn-sec" title="Preview"><i class="fa-regular fa-eye"></i></button>
                <button onclick="openThemeBuilderModal('${esc(t.cat)}','${esc(t.name)}',false)" class="py-1.5 rounded-lg gold-pill-btn col-span-2"><i class="fa-solid fa-pen mr-1"></i>Edit</button>
                <button onclick="openThemeBuilderModal('${esc(t.cat)}','${esc(t.name)}',true)" class="py-1.5 rounded-lg bg-blue-500/15 text-blue-600" title="Duplikat"><i class="fa-regular fa-copy"></i></button>
                <button onclick="copyThemeDemoLink('${esc(t.cat)}','${esc(t.name)}')" class="py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600" title="Salin Link Demo"><i class="fa-solid fa-link"></i></button>
            </div>
            <div class="px-2 pb-2">
                ${t.isCustom
                    ? `<button onclick="deleteCustomTheme('${esc(t.id)}','${esc(t.name)}')" class="w-full py-1.5 rounded-lg bg-red-600/15 text-red-500 text-[10px] font-bold"><i class="fa-solid fa-trash mr-1"></i>Hapus Permanen</button>`
                    : t.isHidden
                        ? `<button onclick="toggleHideBuiltInTheme('${esc(t.key)}',false)" class="w-full py-1.5 rounded-lg bg-emerald-600/15 text-emerald-600 text-[10px] font-bold">Pulihkan Tema</button>`
                        : `<button onclick="toggleHideBuiltInTheme('${esc(t.key)}',true)" class="w-full py-1.5 rounded-lg bg-red-600/10 text-red-500 text-[10px] font-bold">Sembunyikan</button>`}
            </div>
        </div>`;
    }).join("");
}

function renderMasterWorkspaceContent() {
    const box = document.getElementById("master-workspace-body"); if (!box) return;

    if (currentMasterWorkspace === "overview") {
        box.innerHTML = buildMasterAnalyticsHtml();
        return;
    }

    if (currentMasterWorkspace === "orders") {
        box.innerHTML = buildUnifiedOrdersListHtml(false);
        return;
    }

    if (currentMasterWorkspace === "themes") {
        const cats = [...Object.keys(THEME_CATALOG), "CV & Lamaran"];
        if (masterThemeCatFilter === "CV & Lamaran") {
            const allPf = [
                ...PORTFOLIO_CATALOG.cv.map(x => Object.assign({}, getPortfolioThemeObj("cv", x.id), { _dt: "cv" })),
                ...PORTFOLIO_CATALOG.lamaran.map(x => Object.assign({}, getPortfolioThemeObj("lamaran", x.id), { _dt: "lamaran" }))
            ];
            box.innerHTML = `<div class="space-y-4">
                <div class="flex flex-wrap gap-1.5">${cats.map(c => `<button type="button" onclick="masterThemeCatFilter='${c}';renderMasterWorkspaceContent();" class="px-3 py-1.5 rounded-xl text-[11px] font-bold ${masterThemeCatFilter===c?"gold-pill-btn":"app-btn-sec"}">${c}</button>`).join("")}</div>
                <p class="text-xs app-muted">Atur harga normal (coret) dan harga jual untuk 9 tema CV &amp; 3 tema Surat Lamaran:</p>
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">${allPf.map(p => `
                    <div class="app-card-soft border rounded-2xl p-3.5 space-y-2.5">
                        <div class="flex items-center justify-between gap-2">
                            <div><span class="text-[9px] px-2 py-0.5 rounded-full app-accent-bg app-accent font-extrabold uppercase">${p._dt === "lamaran" ? "Lamaran" : "CV"}</span><h4 class="font-bold text-xs mt-1">${escHtml(p.name)}</h4></div>
                            <button type="button" onclick="openPortfolioDemoPreview('${p._dt}','${p.id}')" class="px-2.5 py-1 rounded-lg app-btn-sec text-[10px] font-bold"><i class="fa-regular fa-eye"></i></button>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div><label class="text-[10px] app-muted block">Harga Coret</label><input type="number" id="cvp-orig-${p.id}" value="${p.origPrice||35000}" step="1000" class="app-input !py-1.5 text-xs"></div>
                            <div><label class="text-[10px] app-muted block">Harga Jual</label><input type="number" id="cvp-sell-${p.id}" value="${p.price||20000}" step="1000" class="app-input !py-1.5 text-xs font-bold"></div>
                        </div>
                        <button type="button" onclick="saveCvThemePrice('${p.id}',this)" class="w-full gold-pill-btn py-1.5 rounded-xl text-[11px]">Simpan Harga</button>
                    </div>
                `).join("")}</div>
            </div>`;
            return;
        }

        box.innerHTML = `<div class="space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2.5">
                <div class="flex flex-wrap gap-1.5">${cats.map(c => `<button type="button" onclick="masterThemeCatFilter='${c}';renderMasterWorkspaceContent();" class="px-3 py-1.5 rounded-xl text-[11px] font-bold ${masterThemeCatFilter===c?"gold-pill-btn":"app-btn-sec"}">${c}</button>`).join("")}</div>
                <button type="button" onclick="openThemeBuilderModal(null,null,false)" class="gold-pill-btn px-4 py-2 rounded-xl text-xs shadow"><i class="fa-solid fa-plus mr-1"></i>Buat Tema Baru</button>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <input type="text" id="master-theme-search-inp" value="${esc(masterThemeSearch)}" oninput="masterThemeSearch=this.value;renderMasterThemesGridOnly();" placeholder="Cari nama tema..." class="app-input !py-2 sm:max-w-xs">
                <span class="text-[11px] app-muted"><strong id="master-themes-count">0</strong> tema di ${escHtml(masterThemeCatFilter)} • Klik <strong>Edit</strong> untuk ganti foto template, nama contoh &amp; harga.</span>
            </div>
            <div id="master-themes-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5"></div>
        </div>`;
        renderMasterThemesGridOnly();
        return;
    }

    if (currentMasterWorkspace === "users_cabang") {
        const list = (db.users || []).filter(u => u.role !== "master");
        box.innerHTML = `<div class="flex flex-wrap justify-between items-center gap-2 mb-4">
            <p class="text-xs app-muted">Buka profil publik pengguna untuk melihat statistik, followers &amp; following, atau ubah status Akun Pro.</p>
            <div class="flex flex-wrap gap-1.5">
                <button onclick="openMasterUserModal(null,'user')" class="px-3 py-1.5 rounded-xl app-card-soft border app-accent text-xs font-bold">+ User</button>
                <button onclick="openMasterUserModal(null,'cabang')" class="px-3 py-1.5 rounded-xl app-card-soft border text-blue-600 text-xs font-bold">+ Cabang</button>
                <button onclick="openMasterUserModal(null,'administrasi')" class="gold-pill-btn px-3 py-1.5 rounded-xl text-xs">+ Administrasi</button>
            </div>
        </div>
        <div class="grid md:grid-cols-2 gap-3">${list.length ? list.map(u => {
            const roleCol = u.role === "cabang" ? "bg-blue-500/20 text-blue-600" : u.role === "administrasi" ? "bg-emerald-500/20 text-emerald-600" : "bg-zinc-500/20 app-muted";
            return `<div class="app-card-soft border rounded-2xl p-4 space-y-3">
                <div class="flex items-center gap-3">
                    <img src="${u.avatar || DEFAULT_AVATAR}" class="w-11 h-11 rounded-full object-cover bg-zinc-800 border gold-border cursor-pointer" onclick="viewUserProfileModal('${esc(u.username)}')">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5">
                            <strong class="text-xs truncate cursor-pointer hover:underline" onclick="viewUserProfileModal('${esc(u.username)}')">${escHtml(u.name)}</strong>
                            ${u.isPro ? '<i class="fa-solid fa-circle-check text-blue-500 text-xs" title="Akun Pro"></i>' : ""}
                            <span class="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${roleCol}">${escHtml(u.role)}</span>
                        </div>
                        <p class="text-[11px] app-accent">@${escHtml(u.username)} • <span class="${u.status==="Aktif"?"text-emerald-600":"text-amber-600"}">${escHtml(u.status)}</span></p>
                        ${u.role === "cabang" && u.brandName ? `<p class="text-[10px] text-blue-600 font-semibold truncate"><i class="fa-solid fa-tag mr-1"></i>${escHtml(u.brandName)}</p>` : ""}
                    </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t gold-border">
                    <div class="flex items-center gap-1 text-[11px]">
                        ${u.role === "cabang" ? `<span class="app-accent font-bold mr-1">Kuota: ${u.quota || 0}</span><button onclick="topUpCabangRealTime('${esc(u.username)}',5,this)" class="px-2 py-1 rounded bg-emerald-600 text-white font-bold">+5</button><button onclick="topUpCabangRealTime('${esc(u.username)}',10,this)" class="px-2 py-1 rounded gold-pill-btn">+10</button>` : ""}
                        ${u.status !== "Aktif" ? `<button onclick="approveUserRealTime('${esc(u.username)}',this)" class="gold-pill-btn px-2.5 py-1 rounded-lg text-[10px]">✓ ACC</button>` : ""}
                        ${u.role !== "administrasi" ? `<button onclick="toggleUserProQuick('${esc(u.username)}',this)" class="px-2 py-1 rounded-lg ${u.isPro ? "bg-blue-600 text-white" : "app-btn-sec"} text-[10px] font-bold" title="Ubah Status Akun Pro">${u.isPro ? "PRO ✓" : "+Pro"}</button>` : ""}
                    </div>
                    <div class="flex gap-1.5">
                        <button onclick="viewUserProfileModal('${esc(u.username)}')" class="px-2.5 py-1 rounded-lg app-accent-bg app-accent border gold-border text-[11px] font-bold"><i class="fa-regular fa-user mr-1"></i>Profil</button>
                        <button onclick="openMasterUserModal('${esc(u.username)}')" class="px-2.5 py-1 rounded-lg app-btn-sec text-[11px] font-bold">Edit</button>
                        <button onclick="deleteUserRealTime('${esc(u.username)}')" class="px-2.5 py-1 rounded-lg bg-red-600/15 text-red-500 text-[11px]"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            </div>`;
        }).join("") : '<p class="text-xs app-muted md:col-span-2">Belum ada akun terdaftar.</p>'}</div>`;
        return;
    }

    if (currentMasterWorkspace === "home_editor") {
        const banners = db.promoBanners || [];
        box.innerHTML = `<div class="grid md:grid-cols-2 gap-6">
            <form onsubmit="savePromoBannerForm(event)" class="app-card-soft p-4 rounded-2xl border space-y-2.5">
                <div class="flex justify-between items-center">
                    <h4 class="font-bold text-sm app-accent">Edit Banner Promosi (Rasio 12 : 4.4 Full)</h4>
                    <button type="button" onclick="resetPromoBannerForm()" class="text-[11px] app-muted hover:underline">Reset</button>
                </div>
                <input type="hidden" id="pb-id">
                <div class="w-full rounded-xl overflow-hidden border gold-border bg-black" style="aspect-ratio:12/4.4;">
                    <img id="pb-preview-img" src="${(banners[0] && banners[0].img) || IMG("1519741497674-611481863552")}" class="w-full h-full object-cover">
                </div>
                <label class="block gold-pill-btn py-2 rounded-xl text-center cursor-pointer text-xs"><i class="fa-solid fa-crop-simple mr-1"></i>Pilih &amp; Crop Foto Banner (12 : 4.4)<input type="file" accept="image/*" class="hide" onchange="pickCroppedPromoBanner(this)"></label>
                <div class="grid grid-cols-2 gap-2">
                    <input type="text" id="pb-badge" placeholder="Label (PROMO SPESIAL)" class="app-input">
                    <input type="text" id="pb-cta" placeholder="Teks Tombol (Lihat Promo)" class="app-input">
                </div>
                <input type="text" id="pb-title" placeholder="Judul Promosi Menarik" class="app-input" required>
                <input type="text" id="pb-sub" placeholder="Penjelasan singkat promosi..." class="app-input" required>
                <select id="pb-target" class="app-input">
                    <option value="sec-undangan">Arahkan ke Etalase Undangan</option>
                    <option value="sec-portofolio">Arahkan ke Etalase CV &amp; Lamaran</option>
                    <option value="sec-sertifikat">Arahkan ke Etalase Sertifikat</option>
                    <option value="login">Arahkan ke Popup Daftar / Masuk</option>
                    <option value="chat">Arahkan ke Live Chat Admin</option>
                </select>
                <input type="url" id="pb-img-url" oninput="if(this.value.startsWith('http'))document.getElementById('pb-preview-img').src=this.value;" placeholder="Atau tempel URL foto banner (https://...)" class="app-input">
                <button type="submit" id="btn-save-pb" class="w-full gold-pill-btn py-2.5 rounded-xl text-xs">Simpan Banner Promosi</button>
            </form>
            <div class="space-y-2.5">
                <h4 class="font-bold text-xs app-accent uppercase">Daftar Slide Banner Aktif (${banners.length})</h4>
                ${banners.map((b, i) => `<div class="app-card-soft border rounded-xl p-2.5 flex items-center gap-3">
                    <img src="${b.img}" class="w-24 h-10 rounded-lg object-cover bg-black shrink-0">
                    <div class="flex-1 min-w-0"><strong class="text-xs block truncate">${escHtml(b.title)}</strong><span class="text-[10px] app-muted block truncate">${escHtml(b.badge || "Promo")} • ${escHtml(b.subtitle || "")}</span></div>
                    <button type="button" onclick="editPromoBannerItem(${i})" class="px-2.5 py-1 rounded app-btn-sec text-[10px] font-bold">Edit</button>
                    <button type="button" onclick="deletePromoBannerItem(${i})" class="px-2 py-1 rounded bg-red-600/15 text-[10px] text-red-500"><i class="fa-solid fa-trash"></i></button>
                </div>`).join("")}
            </div>
        </div>`;
        return;
    }

    if (currentMasterWorkspace === "media") {
        box.innerHTML = `<div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4">
                <form onsubmit="addStockSong(event)" class="app-card-soft p-4 rounded-2xl border space-y-2.5">
                    <h4 class="font-bold text-sm app-accent">Stok Lagu Website</h4>
                    <input type="text" id="song-title" placeholder="Judul Lagu" class="app-input" required>
                    <input type="text" id="song-cat" placeholder="Kategori (Pernikahan / Islami / Ultah)" class="app-input" required>
                    <input type="url" id="song-url" placeholder="Link MP3 (https://.../lagu.mp3)" class="app-input" required>
                    <button id="btn-add-song" class="w-full gold-pill-btn py-2.5 rounded-xl text-xs">+ Tambah Link Lagu</button>
                </form>
                <div class="space-y-2 max-h-56 overflow-y-auto">${(db.musicLibrary||[]).map((m,i)=>`<div class="app-card-soft border rounded-xl p-3 flex justify-between items-center text-xs"><div><strong>${escHtml(m.title)}</strong><span class="block text-[10px] app-accent">${escHtml(m.category)}</span></div><button onclick="delStockSong(${i})" class="text-red-500 px-2"><i class="fa-solid fa-trash"></i></button></div>`).join("") || '<p class="text-xs app-muted">Belum ada stok lagu.</p>'}</div>
            </div>
            <div class="space-y-4">
                <form onsubmit="addTestimonial(event)" class="app-card-soft p-4 rounded-2xl border space-y-2.5">
                    <h4 class="font-bold text-sm app-accent">Tambah Testimoni Beranda</h4>
                    <input type="text" id="t-name" placeholder="Nama Pelanggan" class="app-input" required>
                    <input type="text" id="t-cat" placeholder="Kategori (Undangan / CV & Lamaran)" class="app-input" required>
                    <textarea id="t-text" placeholder="Isi testimoni..." class="app-input h-16" required></textarea>
                    <button id="btn-add-testi" class="w-full gold-pill-btn py-2.5 rounded-xl text-xs">+ Tampilkan di Slideshow</button>
                </form>
                <div class="space-y-2 max-h-56 overflow-y-auto">${(db.testimonials||[]).map((t,i)=>`<div class="app-card-soft border rounded-xl p-3 flex justify-between items-center text-xs gap-2"><div><strong>${escHtml(t.name)}</strong> <span class="text-[10px] app-accent">(${escHtml(t.category)})</span><p class="text-[11px] app-muted">${escHtml(t.text)}</p></div><button onclick="delTestimonial(${i})" class="text-red-500 px-2"><i class="fa-solid fa-trash"></i></button></div>`).join("")}</div>
            </div>
        </div>`;
    }
}

// ================= 4. BERANDA PROFIL PUBLIK PENGGUNA (RINGAN & PRIVAT) =================
function viewUserProfileModal(username) {
    const cleanU = String(username || "").trim().toLowerCase();
    const u = (db.users || []).find(x => String(x.username || "").toLowerCase() === cleanU);
    if (!u) return showToast("Akun tidak ditemukan.", "error");

    const modal = document.getElementById("modal-view-user-profile");
    if (!modal) return;

    modal.style.cssText = "display:flex !important;position:fixed !important;inset:0 !important;width:100vw !important;height:100vh !important;max-width:100vw !important;max-height:100vh !important;padding:0 !important;margin:0 !important;z-index:135 !important;background:var(--app-bg,#f2f2f7) !important;opacity:1 !important;visibility:visible !important;";

    const cardBox = modal.querySelector(".app-card");
    if (cardBox) {
        cardBox.style.cssText = "display:flex !important;flex-direction:column !important;width:100% !important;height:100% !important;max-width:100% !important;max-height:100% !important;border-radius:0 !important;border:none !important;padding:0 !important;margin:0 !important;background:var(--app-bg,#f2f2f7) !important;";
    }

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isSelf = !!(curU && String(curU.username || "").toLowerCase() === cleanU);
    const isMasterProfile = u.role === "master";

    let followersCount = 0;
    if (isMasterProfile) {
        const allUsers = Array.isArray(db.users) ? db.users : [];
        const realCount = allUsers.filter(x => x && x.role !== "master").length;
        followersCount = `18.3k + ${realCount}`;
    } else if (typeof _getFollowersListForUser === "function") {
        followersCount = _getFollowersListForUser(u).length;
    } else {
        followersCount = Array.isArray(u.followers) ? u.followers.length : 0;
    }

    const followingCount = (typeof _getFollowingListForUser === "function")
        ? _getFollowingListForUser(u).length
        : (Array.isArray(u.following) ? u.following.length : 0);

    const canFollowThis = !isSelf && curU && (
        isMasterProfile
            ? (curU.role === "user" || curU.role === "administrasi")
            : true
    );
    const curFollowingList = (curU && typeof _getFollowingListForUser === "function")
        ? _getFollowingListForUser(curU)
        : (curU && Array.isArray(curU.following) ? curU.following.map(x => String(x).toLowerCase()) : []);
    const isFollowingThis = canFollowThis && curFollowingList.includes(cleanU);

    const bannerStyle = u.banner ? `background-image:url('${u.banner}');` : "";
    const proBadgeHtml = u.isPro ? `<i class="fa-solid fa-circle-check text-blue-500 text-sm"></i>` : "";
    const roleBadgeHtml = u.role === "master"
        ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-extrabold uppercase">MASTER</span>`
        : u.role === "administrasi"
            ? `<span class="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-extrabold uppercase">ADMINISTRASI</span>`
            : "";

    const followBtnHtml = canFollowThis
        ? `<button type="button" onclick="toggleFollowTargetUser('${esc(cleanU)}')" class="w-full py-2.5 rounded-2xl text-xs font-extrabold transition shadow-sm ${isFollowingThis ? "app-btn-sec border" : "gold-pill-btn"}">
            <i class="fa-solid ${isFollowingThis ? "fa-user-check" : "fa-user-plus"} mr-1.5"></i>${isFollowingThis ? "Following" : "Follow"}
           </button>`
        : "";

    const followersClick = (isMasterProfile && !isSelf)
        ? `onclick="showToast('Daftar followers akun Master bersifat privat.','info')"`
        : `onclick="openIgProfileStatsModal('${esc(cleanU)}','followers')"`;

    const bodyEl = document.getElementById("mvp-body");
    if (bodyEl) {
        bodyEl.className = "flex-1 overflow-y-auto";
        bodyEl.innerHTML = `
            <div class="w-full max-w-xl mx-auto p-4 space-y-4">
                <div class="app-card rounded-3xl border overflow-hidden shadow-sm relative">
                    <div class="h-32 md:h-40 bg-gradient-to-r from-zinc-700 to-zinc-900 bg-cover bg-center relative" style="${bannerStyle}">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15"></div>
                    </div>
                    <div class="px-5 pb-5 relative text-center md:text-left">
                        <div class="flex flex-col md:flex-row items-center md:items-end gap-3 -mt-11 relative z-10">
                            <img src="${u.avatar || DEFAULT_AVATAR}" class="w-20 h-20 rounded-full object-cover border-4 border-[var(--app-card)] shadow-lg bg-zinc-800" alt="Avatar">
                            <div class="min-w-0">
                                <h2 class="text-lg font-extrabold flex items-center justify-center md:justify-start gap-1.5 mt-1">
                                    <span>${escHtml(u.name || u.username)}</span>
                                    ${proBadgeHtml}
                                    ${roleBadgeHtml}
                                </h2>
                                <p class="text-xs app-accent font-semibold">@${escHtml(u.username)}</p>
                                ${u.bio ? `<p class="text-xs app-muted mt-1 leading-relaxed max-w-md">${escHtml(u.bio)}</p>` : ""}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="app-card border rounded-2xl p-3 shadow-sm space-y-3">
                    <div class="flex items-center justify-around divide-x divide-black/10">
                        <button type="button" ${followersClick} class="flex-1 py-2 px-2 text-center rounded-xl hover:bg-black/5 active:scale-98 transition">
                            <span class="block text-base font-extrabold tracking-tight">${escHtml(String(followersCount))}</span>
                            <span class="block text-[11px] app-muted font-medium">Followers</span>
                        </button>
                        <button type="button" onclick="openIgProfileStatsModal('${esc(cleanU)}','following')" class="flex-1 py-2 px-2 text-center rounded-xl hover:bg-black/5 active:scale-98 transition">
                            <span class="block text-base font-extrabold tracking-tight">${followingCount}</span>
                            <span class="block text-[11px] app-muted font-medium">Following</span>
                        </button>
                    </div>
                    ${followBtnHtml}
                </div>

                <div class="pt-2">
                    <button type="button" onclick="closeUserProfileModalCustom();if(typeof openFullChatOverlay==='function')openFullChatOverlay('${esc(cleanU)}');" class="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2">
                        <i class="fa-solid fa-comments"></i> Kirim Pesan ke @${escHtml(u.username)}
                    </button>
                </div>
            </div>
        `;
    }

    const headerBar = modal.querySelector(".border-b");
    if (headerBar) {
        headerBar.innerHTML = `
            <div class="flex items-center gap-2.5">
                <button type="button" onclick="closeUserProfileModalCustom()" class="w-8 h-8 rounded-full app-btn-sec flex items-center justify-center text-xs">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                <h3 class="font-extrabold text-sm truncate">Profil @${escHtml(u.username)}</h3>
            </div>
            <button type="button" onclick="closeUserProfileModalCustom()" class="px-3 py-1.5 rounded-full app-btn-sec text-xs font-bold">Tutup</button>
        `;
    }

    modal.classList.remove("hide");
    if (typeof pushBackGuard === "function") pushBackGuard();
}

function closeUserProfileModalCustom() {
    const modal = document.getElementById("modal-view-user-profile");
    if (modal) {
        modal.style.cssText = "";
        modal.classList.add("hide");
    }
}

async function toggleUserProQuick(uname, btn, reopenModal = false) {
    const u = (db.users || []).find(x => x.username === uname); if (!u) return;
    setBtnLoading(btn, true, "...");
    const nextPro = !u.isPro;
    await apiAction({ action: "upsert_user", oldUsername: uname, user: Object.assign({}, u, { isPro: nextPro }) });
    renderMasterHeaderStats();
    renderMasterWorkspaceContent();
    if (reopenModal) viewUserProfileModal(uname);
    showToast(nextPro ? `@${uname} ditingkatkan ke Akun PRO (Centang Biru)!` : `Status Pro @${uname} dinonaktifkan.`, "info");
}

function openMasterUserModal(username = null, defaultRole = "user") {
    const isEdit = !!username, u = isEdit ? db.users.find(x => x.username === username) : null;
    document.getElementById("mmu-title").innerText = isEdit ? `Edit Akun @${u.username}` : `Tambah ${defaultRole === "cabang" ? "Admin Cabang" : defaultRole === "administrasi" ? "Tim Administrasi" : "User"}`;
    document.getElementById("mmu-old-username").value = isEdit ? u.username : "";
    document.getElementById("mmu-role").value = isEdit ? u.role : defaultRole;
    document.getElementById("mmu-status").value = isEdit ? u.status : "Aktif";
    document.getElementById("mmu-name").value = isEdit ? u.name : "";
    document.getElementById("mmu-username").value = isEdit ? u.username : "";
    document.getElementById("mmu-password").value = isEdit ? u.password : "";
    document.getElementById("mmu-phone").value = isEdit ? (u.phone || "") : "";
    document.getElementById("mmu-address").value = isEdit ? (u.address || "") : "";
    document.getElementById("mmu-is-pro").checked = isEdit ? !!u.isPro : false;
    document.getElementById("mmu-brand").value = isEdit ? (u.brandName || "") : "";
    document.getElementById("mmu-quota").value = isEdit ? (u.quota || 0) : 5;
    document.getElementById("mmu-quota-wrap").classList.toggle("hide", document.getElementById("mmu-role").value !== "cabang");
    document.getElementById("modal-master-user").classList.remove("hide");
    pushBackGuard();
}
async function submitMasterUserModal(e) {
    e.preventDefault(); setBtnLoading("btn-mmu-save", true, "Menyimpan...");
    const oldU = document.getElementById("mmu-old-username").value;
    const roleVal = document.getElementById("mmu-role").value;
    const payload = {
        role: roleVal, status: document.getElementById("mmu-status").value,
        isPro: document.getElementById("mmu-is-pro").checked,
        name: document.getElementById("mmu-name").value.trim(),
        username: document.getElementById("mmu-username").value.trim().toLowerCase(),
        password: document.getElementById("mmu-password").value.trim(),
        phone: document.getElementById("mmu-phone").value.trim(),
        address: document.getElementById("mmu-address").value.trim(),
        brandName: roleVal === "cabang" ? document.getElementById("mmu-brand").value.trim() : "",
        quota: parseInt(document.getElementById("mmu-quota").value) || 0
    };
    const res = await apiAction({ action: "upsert_user", oldUsername: oldU || payload.username, user: payload });
    setBtnLoading("btn-mmu-save", false);
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal menyimpan akun.", "error");
    document.getElementById("modal-master-user").classList.add("hide");
    renderMasterHeaderStats(); renderMasterWorkspaceContent(); showToast("Akun berhasil disimpan!");
}
async function approveUserRealTime(uname, btn) { const u = db.users.find(x => x.username === uname); if (!u) return; setBtnLoading(btn, true, "..."); await apiAction({ action: "upsert_user", oldUsername: uname, user: Object.assign({}, u, { status: "Aktif" }) }); renderMasterHeaderStats(); renderMasterWorkspaceContent(); showToast(`Akun @${uname} aktif!`); }
async function deleteUserRealTime(uname) { if (!(await showConfirm("Hapus Akun", `Hapus akun @${uname} secara permanen?`, "fa-solid fa-trash", "Ya, Hapus"))) return; showLoading("Menghapus..."); await apiAction({ action: "delete_user", username: uname }); hideLoading(); renderMasterHeaderStats(); renderMasterWorkspaceContent(); showToast("Akun dihapus.", "info"); }
async function topUpCabangRealTime(uname, amt, btn, reopenModal = false) {
    setBtnLoading(btn, true, "...");
    await apiAction({ action: "topup_quota", username: uname, amount: amt });
    renderMasterHeaderStats();
    renderMasterWorkspaceContent();
    if (reopenModal) viewUserProfileModal(uname);
    showToast(`+${amt} kuota ditambahkan!`);
}

// ================= 5. EDIT BANNER PROMOSI 12 : 4.4 & HARGA CV =================
function pickCroppedPromoBanner(inp) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    openImageCropper(file, 12 / 4.4, "Crop Banner Promosi (12 : 4.4)", 1200, 440, async (dataUrl) => {
        showLoading("Mengunggah banner promosi...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: "promo_banner" });
        hideLoading();
        if (up && up.ok && up.url) {
            pbTempUploadedImg = up.url;
            document.getElementById("pb-preview-img").src = up.url;
            document.getElementById("pb-img-url").value = up.url;
            showToast("Foto banner siap disimpan!");
        } else showToast("Gagal mengunggah foto.", "error");
    });
}
function resetPromoBannerForm() {
    pbTempUploadedImg = "";
    ["pb-id","pb-badge","pb-cta","pb-title","pb-sub","pb-img-url"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    document.getElementById("pb-preview-img").src = IMG("1519741497674-611481863552");
}
async function savePromoBannerForm(e) {
    e.preventDefault(); setBtnLoading("btn-save-pb", true, "Menyimpan...");
    const idVal = document.getElementById("pb-id").value;
    const tgt = document.getElementById("pb-target").value;
    const img = pbTempUploadedImg || document.getElementById("pb-img-url").value.trim() || document.getElementById("pb-preview-img").src || IMG("1519741497674-611481863552");
    const slide = {
        id: idVal ? Number(idVal) : Date.now(),
        badge: document.getElementById("pb-badge").value.trim() || "PROMO",
        ctaText: document.getElementById("pb-cta").value.trim() || "Lihat Promo",
        title: document.getElementById("pb-title").value.trim(),
        subtitle: document.getElementById("pb-sub").value.trim(),
        targetType: (tgt === "login" || tgt === "chat") ? tgt : "section",
        targetSection: (tgt === "login" || tgt === "chat") ? "" : tgt,
        img
    };
    const list = [...(db.promoBanners || [])];
    const idx = list.findIndex(x => String(x.id) === String(slide.id));
    if (idx >= 0) list[idx] = slide; else list.push(slide);
    db.promoBanners = list;
    idbSet("db_snapshot", db);
    const res = await apiAction({ action: "update_section", section: "promoBanners", value: list });
    setBtnLoading("btn-save-pb", false);
    if (res && res.ok) { pbTempUploadedImg = ""; renderMasterWorkspaceContent(); showToast("Banner promosi beranda tersimpan permanen!"); }
    else showToast("Gagal menyimpan banner.", "error");
}
function editPromoBannerItem(i) {
    const b = (db.promoBanners || [])[i]; if (!b) return;
    pbTempUploadedImg = "";
    document.getElementById("pb-id").value = b.id;
    document.getElementById("pb-badge").value = b.badge || "";
    document.getElementById("pb-cta").value = b.ctaText || "";
    document.getElementById("pb-title").value = b.title || "";
    document.getElementById("pb-sub").value = b.subtitle || "";
    document.getElementById("pb-target").value = (b.targetType === "login" || b.targetType === "chat") ? b.targetType : (b.targetSection || "sec-undangan");
    document.getElementById("pb-img-url").value = b.img || "";
    document.getElementById("pb-preview-img").src = b.img || IMG("1519741497674-611481863552");
    showToast(`Mengedit banner "${b.title}"`, "info");
}
async function deletePromoBannerItem(i) {
    if ((db.promoBanners || []).length <= 1) return showToast("Minimal harus menyisakan 1 banner promosi.", "info");
    const list = [...(db.promoBanners || [])]; list.splice(i, 1);
    db.promoBanners = list;
    showLoading("Menghapus banner..."); await apiAction({ action: "update_section", section: "promoBanners", value: list });
    hideLoading(); renderMasterWorkspaceContent();
}

async function saveCvThemePrice(themeId, btn) {
    const origPrice = Number(document.getElementById(`cvp-orig-${themeId}`)?.value || 0);
    const price = Number(document.getElementById(`cvp-sell-${themeId}`)?.value || 20000);
    setBtnLoading(btn, true, "...");
    const ov = Object.assign({}, db.cvPriceOverrides || {});
    ov[themeId] = { origPrice, price };
    db.cvPriceOverrides = ov;
    idbSet("db_snapshot", db);
    await apiAction({ action: "update_section", section: "cvPriceOverrides", value: ov });
    setBtnLoading(btn, false);
    showToast("Harga desain CV / Lamaran diperbarui permanen!");
}

// ================= 6. VISUAL THEME BUILDER 3 TAB =================
function copyThemeDemoLink(cat, themeName) {
    navigator.clipboard.writeText(`${getCleanBaseUrl()}?demo=${encodeURIComponent(cat)}&theme=${encodeURIComponent(themeName)}`);
    showToast(`Link Demo "${themeName}" disalin!`);
}
function switchThemeBuilderTab(tab) {
    ["design", "photos", "demo"].forEach(k => document.getElementById(`tb-pane-${k}`)?.classList.toggle("hide", k !== tab));
    document.querySelectorAll(".tb-tab-btn").forEach(b => b.className = `tb-tab-btn px-3.5 py-1.5 rounded-xl text-xs font-bold ${b.dataset.tbt === tab ? "gold-pill-btn" : "app-btn-sec"}`);
    if (tab === "photos") renderThemeBuilderPhotoSlots();
}
function renderThemeBuilderPhotoSlots() {
    const slots = [
        { key:"cover", label:"★ Sampul Utama (9:16)", fb:IMG("1519741497674-611481863552") },
        { key:"pria", label:"Mempelai Pria (4:5)", fb:"./assets/model-pria.jpg" },
        { key:"wanita", label:"Mempelai Wanita (4:5)", fb:"./assets/model-wanita.jpg" },
        { key:"couple", label:"Foto Berdua Digabung (4:5)", fb:IMG("1515934751635-c81c6bc9a2d8") },
        { key:"g1", label:"Galeri Polaroid #1", fb:IMG("1519741497674-611481863552") },
        { key:"g2", label:"Galeri Polaroid #2", fb:IMG("1511285560929-80b456fea0bc") },
        { key:"g3", label:"Galeri Polaroid #3", fb:IMG("1522673607200-164d1b6ce486") }
    ];
    const grid = document.getElementById("tb-photo-slots-grid"); if (!grid) return;
    grid.innerHTML = slots.map(s => {
        const cur = tbPhotosDraft[s.key] || "";
        return `<div class="app-card-soft border rounded-2xl p-2.5 text-center space-y-2 relative">
            ${cur ? `<button type="button" onclick="clearThemeBuilderPhoto('${s.key}')" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-600 text-white text-[10px]" title="Reset"><i class="fa-solid fa-rotate-left"></i></button>` : ""}
            <span class="text-[10px] font-bold app-accent block truncate">${s.label}</span>
            <img src="${cur || s.fb}" ${imgFbAttr(IMG("1519741497674-611481863552"))} class="w-full h-28 object-cover rounded-xl bg-black border gold-border">
            <label class="block gold-pill-btn py-1.5 rounded-lg text-[10px] cursor-pointer"><i class="fa-solid fa-crop-simple mr-1"></i>${cur?"Ganti Foto":"Upload Foto"}<input type="file" accept="image/*" class="hide" onchange="pickThemeBuilderPhoto(this,'${s.key}')"></label>
        </div>`;
    }).join("");
}
function clearThemeBuilderPhoto(slotKey) {
    tbPhotosDraft[slotKey] = "";
    renderThemeBuilderPhotoSlots();
    if (slotKey === "cover") document.getElementById("tb-live-img").src = IMG("1519741497674-611481863552");
}
function pickThemeBuilderPhoto(inp, slotKey) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    const isCover = slotKey === "cover";
    openImageCropper(file, isCover ? 9 / 16 : 4 / 5, isCover ? "Sampul Utama Tema (9:16)" : `Foto Template (${slotKey})`, isCover ? 720 : 640, isCover ? 1280 : 800, async (dataUrl) => {
        showLoading("Mengunggah foto template...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: `tpl_${slotKey}` });
        hideLoading();
        if (up && up.ok && up.url) {
            tbPhotosDraft[slotKey] = up.url;
            if (isCover) document.getElementById("tb-live-img").src = up.url;
            renderThemeBuilderPhotoSlots();
            showToast("Foto template siap! Klik Simpan Tema.");
        } else showToast("Gagal mengunggah foto.", "error");
    });
}
function openThemeBuilderModal(cat = null, themeName = null, isDuplicate = false) {
    const isEdit = !!(cat && themeName), tObj = isEdit ? findThemeObject(cat, themeName) : null;
    const preset = (tObj && VISUAL_PRESETS[tObj.preset]) || VISUAL_PRESETS["dark-gold"];
    const c = (tObj && tObj.customColors) || {}, dp = (tObj && tObj.demoPhotos) || {}, dm = (tObj && tObj.demoData) || {};
    const activeCat = (tObj && tObj.cat) || (THEME_CATALOG[masterThemeCatFilter] ? masterThemeCatFilter : "Pernikahan");
    const baseDemo = typeof buildDemoInvitation === "function" ? buildDemoInvitation(activeCat, (tObj && tObj.name) || "") : {};

    tbPhotosDraft = { cover: dp.cover || (tObj && tObj.customCover) || (tObj && tObj.isCustom && tObj.img ? tObj.img : ""), pria: dp.pria || "", wanita: dp.wanita || "", couple: dp.couple || "", g1: dp.g1 || "", g2: dp.g2 || "", g3: dp.g3 || "" };

    document.getElementById("tb-modal-title").innerText = isDuplicate ? `Duplikat Tema: ${themeName}` : isEdit ? `Edit Tema: ${themeName}` : "Buat Tema Baru";
    document.getElementById("tb-id").value = (!isDuplicate && tObj && tObj.isCustom) ? tObj.id : "";
    document.getElementById("tb-orig-key").value = (!isDuplicate && tObj && !tObj.isCustom) ? tObj.key : "";
    document.getElementById("tb-cat").value = activeCat;
    document.getElementById("tb-cat").disabled = (!isDuplicate && isEdit && tObj && !tObj.isCustom);
    document.getElementById("tb-name").value = isDuplicate ? `${tObj.name} (Copy)` : (tObj ? tObj.name : "");
    document.getElementById("tb-name").readOnly = (!isDuplicate && isEdit && tObj && !tObj.isCustom);
    document.getElementById("tb-badge").value = (tObj && tObj.badge) || "";
    document.getElementById("tb-orig-price").value = (tObj && tObj.origPrice) ? tObj.origPrice : 175000;
    document.getElementById("tb-price").value = (tObj && tObj.price) ? tObj.price : 99000;

    const layoutVal = (tObj && (tObj.layout || tObj.style || tObj.coupleMode)) || "kalimantan_story";
    document.getElementById("tb-layout").value = ["kalimantan_story","premium_black","split","combined","sulawesi","classic_card"].includes(layoutVal) ? layoutVal : "kalimantan_story";
    document.getElementById("tb-frame").value = (tObj && tObj.frame) || "arch";
    document.getElementById("tb-transition").value = (tObj && tObj.transition) || "random";
    document.getElementById("tb-ornament").value = (tObj && tObj.ornament) || "leaf";
    document.getElementById("tb-photo-filter").value = (tObj && tObj.photoFilter) || "none";
    document.getElementById("tb-font").value = (tObj && tObj.font) || preset.vars["--th-font-heading"] || "'Playfair Display',serif";

    const cleanHex = (val, fb) => (val && /^#[0-9a-f]{6}$/i.test(val)) ? val : fb;
    document.getElementById("tb-c-bg").value = cleanHex(c.bg || preset.vars["--th-bg"], "#0a0a0a");
    document.getElementById("tb-c-card").value = cleanHex(c.card, "#18181b");
    document.getElementById("tb-c-text").value = cleanHex(c.text || preset.vars["--th-text"], "#f8fafc");
    document.getElementById("tb-c-accent").value = cleanHex(c.accent || preset.vars["--th-accent"], "#eab308");

    document.getElementById("tb-demo-title").value = dm.title || baseDemo.title || "Aqila & Fauzi";
    document.getElementById("tb-demo-groom").value = dm.groom || baseDemo.groomName || baseDemo.subTitle || "Fauzi Ramadhan, S.T.";
    document.getElementById("tb-demo-gparents").value = dm.gparents || baseDemo.groomParents || "Putra Bapak H. Hendra & Ibu Hj. Aminah";
    document.getElementById("tb-demo-bride").value = dm.bride || baseDemo.brideName || "Aqila Putri, S.E.";
    document.getElementById("tb-demo-bparents").value = dm.bparents || baseDemo.brideParents || "Putri Bapak H. Syamsul & Ibu Hj. Rahmawati";
    document.getElementById("tb-demo-date").value = dm.date || baseDemo.akadDate || "2027-02-21";
    document.getElementById("tb-demo-venue").value = dm.venue || baseDemo.akadVenue || "Gedung Serbaguna";
    document.getElementById("tb-demo-address").value = dm.address || baseDemo.akadAddress || "Jl. Mulawarman No. 171, Samarinda";

    document.getElementById("tb-default-audio").innerHTML = `<option value="">-- Tanpa Lagu Bawaan --</option>` + (db.musicLibrary || []).map(m => `<option value="${esc(m.url)}" ${(tObj && tObj.defaultAudio === m.url) ? "selected" : ""}>🎵 [${escHtml(m.category)}] ${escHtml(m.title)}</option>`).join("");

    const cov = tObj ? getThemeCoverPair(tObj.cat, tObj) : { src: IMG("1519741497674-611481863552"), fb: IMG("1519741497674-611481863552") };
    const liveImg = document.getElementById("tb-live-img");
    liveImg.dataset.fb = cov.fb;
    liveImg.onerror = function() { if (this.dataset.fb && this.src !== this.dataset.fb) { this.src = this.dataset.fb; this.dataset.fb = ""; } };
    liveImg.src = tbPhotosDraft.cover || cov.src;

    switchThemeBuilderTab("design"); updateThemeBuilderPreview();
    document.getElementById("modal-theme-builder").classList.remove("hide");
    pushBackGuard();
}
function closeThemeBuilderModal() { document.getElementById("modal-theme-builder").classList.add("hide"); }
function applyQuickColorPalette(key) {
    const map = { maroon:{bg:"#5c0a12",card:"#4a080f",text:"#fdf6ec",accent:"#f3d285"}, black:{bg:"#070709",card:"#121216",text:"#f4f4f5",accent:"#ffffff"}, emerald:{bg:"#04362a",card:"#074738",text:"#ecfdf5",accent:"#facc15"}, ivory:{bg:"#f7f4ef",card:"#ffffff",text:"#3b352f",accent:"#8c7658"}, navy:{bg:"#172433",card:"#1f3146",text:"#f1f5f9",accent:"#dbeafe"} };
    const p = map[key]; if (!p) return;
    document.getElementById("tb-c-bg").value = p.bg; document.getElementById("tb-c-card").value = p.card; document.getElementById("tb-c-text").value = p.text; document.getElementById("tb-c-accent").value = p.accent;
    updateThemeBuilderPreview();
}
function updateThemeBuilderPreview() {
    const demoTitle = document.getElementById("tb-demo-title").value.trim() || "Aqila & Fauzi";
    const badge = document.getElementById("tb-badge").value, font = document.getElementById("tb-font").value;
    const bg = document.getElementById("tb-c-bg").value, accent = document.getElementById("tb-c-accent").value;
    const filter = document.getElementById("tb-photo-filter").value;
    const origP = Number(document.getElementById("tb-orig-price").value || 0), price = Number(document.getElementById("tb-price").value || 0);
    document.getElementById("tb-live-card").style.backgroundColor = bg;
    document.getElementById("tb-live-img").style.filter = filter === "mono" ? "grayscale(100%) contrast(1.08)" : filter === "vintage" ? "sepia(24%)" : "none";
    const bEl = document.getElementById("tb-live-badge"); bEl.innerText = badge; bEl.classList.toggle("hide", !badge);
    const tEl = document.getElementById("tb-live-title"); tEl.innerText = demoTitle; tEl.style.fontFamily = font; tEl.style.color = accent;
    const btnEl = document.getElementById("tb-live-btn"); btnEl.style.background = accent; btnEl.style.color = (["#ffffff","#f3d285","#eab308","#facc15","#dbeafe"].includes(accent.toLowerCase())) ? "#111" : "#fff";
    const hasDisc = origP > price && price > 0;
    document.getElementById("tb-live-price-row").innerHTML = hasDisc ? `<span class="line-through opacity-65 text-[9px] mr-1">${fmtRp(origP)}</span><span>${fmtRp(price)}</span>` : `<span>${fmtRp(price || 99000)}</span>`;
}
async function submitVisualThemeBuilder(e) {
    e.preventDefault();
    const idVal = document.getElementById("tb-id").value, origKey = document.getElementById("tb-orig-key").value;
    const cat = document.getElementById("tb-cat").value, name = document.getElementById("tb-name").value.trim();
    if (!name) return showToast("Nama tema wajib diisi.", "error");
    const layout = document.getElementById("tb-layout").value;
    const cleanDemoPhotos = {}; Object.keys(tbPhotosDraft).forEach(k => { if (tbPhotosDraft[k]) cleanDemoPhotos[k] = tbPhotosDraft[k]; });
    const demoData = { title:document.getElementById("tb-demo-title").value.trim(), groom:document.getElementById("tb-demo-groom").value.trim(), gparents:document.getElementById("tb-demo-gparents").value.trim(), bride:document.getElementById("tb-demo-bride").value.trim(), bparents:document.getElementById("tb-demo-bparents").value.trim(), date:document.getElementById("tb-demo-date").value.trim(), venue:document.getElementById("tb-demo-venue").value.trim(), address:document.getElementById("tb-demo-address").value.trim() };
    const themeData = {
        category: cat, name, badge: document.getElementById("tb-badge").value,
        origPrice: Number(document.getElementById("tb-orig-price").value || 0), price: Number(document.getElementById("tb-price").value || 99000),
        layout, style: layout, coupleMode: (layout === "combined") ? "combined" : "split",
        frame: document.getElementById("tb-frame").value, transition: document.getElementById("tb-transition").value,
        ornament: document.getElementById("tb-ornament").value, photoFilter: document.getElementById("tb-photo-filter").value,
        font: document.getElementById("tb-font").value, defaultAudio: document.getElementById("tb-default-audio").value,
        customColors: { bg: document.getElementById("tb-c-bg").value, card: document.getElementById("tb-c-card").value, text: document.getElementById("tb-c-text").value, accent: document.getElementById("tb-c-accent").value },
        demoPhotos: cleanDemoPhotos, demoData, customCover: cleanDemoPhotos.cover || ""
    };
    setBtnLoading("btn-tb-save", true, "Menyimpan...");
    if (origKey) {
        const ov = Object.assign({}, db.themeOverrides || {});
        ov[origKey] = Object.assign({}, deepCloneSafe(ov[origKey] || {}), themeData);
        db.themeOverrides = ov;
        idbSet("db_snapshot", db);
        await apiAction({ action: "update_section", section: "themeOverrides", value: ov });
    } else {
        const list = [...(db.customThemes || [])];
        themeData.img = cleanDemoPhotos.cover || IMG("1519741497674-611481863552");
        if (idVal) { const idx = list.findIndex(x => String(x.id) === String(idVal)); if (idx >= 0) list[idx] = Object.assign({}, list[idx], themeData, { id: list[idx].id }); else list.unshift(Object.assign({ id: Date.now() }, themeData)); }
        else list.unshift(Object.assign({ id: Date.now() }, themeData));
        db.customThemes = list;
        idbSet("db_snapshot", db);
        await apiAction({ action: "update_section", section: "customThemes", value: list });
    }
    setBtnLoading("btn-tb-save", false); closeThemeBuilderModal(); renderMasterHeaderStats(); renderMasterWorkspaceContent();
    showToast(`Tema "${name}" tersimpan permanen!`);
}
async function deleteCustomTheme(id, name) {
    if (!(await showConfirm("Hapus Tema", `Hapus permanen tema "${name}"?`, "fa-solid fa-trash", "Ya, Hapus"))) return;
    showLoading("Menghapus..."); await apiAction({ action: "update_section", section: "customThemes", value: (db.customThemes || []).filter(t => String(t.id) !== String(id)) });
    hideLoading(); renderMasterWorkspaceContent(); showToast("Tema dihapus.", "info");
}
async function toggleHideBuiltInTheme(key, hideIt) {
    showLoading("Memperbarui...");
    let hid = [...(db.hiddenThemes || [])];
    if (hideIt && !hid.includes(key)) hid.push(key);
    if (!hideIt) hid = hid.filter(k => k !== key);
    await apiAction({ action: "update_section", section: "hiddenThemes", value: hid });
    hideLoading(); renderMasterWorkspaceContent(); showToast(hideIt ? "Tema disembunyikan." : "Tema dipulihkan!");
}

// ================= 7. REKENING, QRIS DANA, MUSIK & TESTIMONI =================
function addMasterBankRow(bk = "BCA", no = "", holder = "") {
    const box = document.getElementById("ms-banks-container"); if (!box) return;
    const div = document.createElement("div"); div.className = "app-card-soft border rounded-xl p-2.5 space-y-2 ms-bank-row";
    div.innerHTML = `<div class="flex gap-1.5 items-center"><select class="ms-bk app-input !py-1.5 font-bold flex-1">${Object.keys(BANK_LOGOS).map(k => `<option value="${k}" ${k===bk?"selected":""}>${k}</option>`).join("")}</select><button type="button" onclick="removeMasterBankRow(this)" class="px-2.5 py-1.5 rounded-lg bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button></div><input type="text" value="${esc(no)}" placeholder="No. Rekening / DANA" class="ms-no app-input !py-1.5"><input type="text" value="${esc(holder)}" placeholder="Atas Nama" class="ms-ho app-input !py-1.5">`;
    box.appendChild(div);
}
function removeMasterBankRow(btn) {
    if (document.querySelectorAll(".ms-bank-row").length <= 1) return showToast("Minimal harus menyisakan 1 rekening.", "info");
    btn.closest(".ms-bank-row").remove();
}
async function uploadMasterQRIS(inp) {
    if (!inp.files[0]) return;
    showLoading("Mengunggah QRIS...");
    const b64 = await quickResizeImage(inp.files[0], 540);
    const up = await apiAction({ action: "upload_media", dataUrl: b64, prefix: "qris" });
    if (up && up.ok && up.url) {
        await apiAction({ action: "update_section", section: "masterSettings", value: Object.assign({}, db.masterSettings, { qrisImage: up.url }) });
        document.getElementById("ms-qris-prev").src = up.url;
        showToast("Gambar QRIS Tetap diperbarui!");
    } else showToast("Gagal mengunggah QRIS.", "error");
    hideLoading();
}
async function saveMasterSettings() {
    const banks = Array.from(document.querySelectorAll(".ms-bank-row")).map(r => ({
        bank: r.querySelector(".ms-bk").value, no: r.querySelector(".ms-no").value.trim(), holder: r.querySelector(".ms-ho").value.trim()
    })).filter(b => b.no);
    if (!banks.length) return showToast("Isi minimal 1 nomor rekening.", "error");
    const qrisMode = document.getElementById("ms-qris-mode").value;
    const qrisDynamicString = document.getElementById("ms-qris-dyn-str").value.trim();
    if (qrisMode === "dynamic" && !qrisDynamicString.startsWith("000201")) {
        return showToast("Untuk QRIS Dinamis, unggah foto QRIS DANA Bisnis atau tempel teks datanya dulu.", "error");
    }
    setBtnLoading("btn-save-qris", true, "Menyimpan...");
    await apiAction({
        action: "update_section", section: "masterSettings",
        value: Object.assign({}, db.masterSettings, {
            banks, bankName: banks[0].bank, bankNo: banks[0].no, bankHolder: banks[0].holder,
            priceText: document.getElementById("ms-p").value.trim(),
            qrisMode, qrisDynamicString, qrisUniqueCode: document.getElementById("ms-qris-unique").checked
        })
    });
    setBtnLoading("btn-save-qris", false);
    toggleSlideMenu(false);
    showToast(`Pembayaran tersimpan (Mode: ${qrisMode === "dynamic" ? "QRIS Dinamis DANA" : "QRIS Tetap"})!`);
}
function exportDB() { const a = document.createElement("a"); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2)); a.download = "backup_mr_undangan.json"; a.click(); }
async function addStockSong(e) { e.preventDefault(); setBtnLoading("btn-add-song", true, "Menyimpan..."); const list = [...(db.musicLibrary||[]), { id:Date.now(), title:document.getElementById("song-title").value.trim(), category:document.getElementById("song-cat").value.trim(), url:document.getElementById("song-url").value.trim() }]; db.musicLibrary = list; await apiAction({ action:"update_section", section:"musicLibrary", value:list }); setBtnLoading("btn-add-song", false); renderMasterWorkspaceContent(); showToast("Lagu ditambahkan!"); }
async function delStockSong(i) { const list = [...db.musicLibrary]; list.splice(i, 1); db.musicLibrary = list; showLoading("Menghapus..."); await apiAction({ action:"update_section", section:"musicLibrary", value:list }); hideLoading(); renderMasterWorkspaceContent(); }
async function addTestimonial(e) { e.preventDefault(); setBtnLoading("btn-add-testi", true, "Menyimpan..."); const list = [{ id:Date.now(), name:document.getElementById("t-name").value.trim(), category:document.getElementById("t-cat").value.trim(), rating:5, text:document.getElementById("t-text").value.trim() }, ...(db.testimonials||[])]; db.testimonials = list; await apiAction({ action:"update_section", section:"testimonials", value:list }); setBtnLoading("btn-add-testi", false); renderMasterWorkspaceContent(); showToast("Testimoni ditambahkan!"); }
async function delTestimonial(i) { const list = [...db.testimonials]; list.splice(i, 1); db.testimonials = list; showLoading("Menghapus..."); await apiAction({ action:"update_section", section:"testimonials", value:list }); hideLoading(); renderMasterWorkspaceContent(); }
