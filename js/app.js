// =========================================================================
// MR UNDANGAN — MAIN CONTROLLER (SPLASH HALO, BERANDA, PROFIL, MENU)
// File: js/app.js
// =========================================================================
const USER_CACHE_KEY = "MR_UNDANGAN_USER_OBJ";
let deferredPwaPrompt = null;
let promoBannerIdx = 0, testiIdx = 0;
let createChoiceIsCabang = false;
let activeInvShelfCat = "Pernikahan", activePfShelfCat = "cv";
let invShelfLock = false, pfShelfLock = false;
window.pendingActionAfterLogin = null;
window._igProfileSheetState = { open: false, targetUsername: "", tab: "followers", masterCat: "user", projectCat: "proses" };

// ================= 1. PWA INSTALL WELCOME MODAL & ANIMASI PEMASANGAN =================
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});

const isAppInstalled = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    localStorage.getItem("MR_PWA_INSTALLED") === "true";

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
});

window.addEventListener("appinstalled", () => {
    localStorage.setItem("MR_PWA_INSTALLED", "true");
    deferredPwaPrompt = null;
    completeInstallAnimationUI();
});

function openWelcomeInstallModal(force = false) {
    if (!force && isAppInstalled()) return;
    if (!force && sessionStorage.getItem("MR_INSTALL_PROMPTED_SESSION") === "1") return;
    const gOv = document.getElementById("guest-invitation-overlay");
    if (gOv && !gOv.classList.contains("hide")) return;
    sessionStorage.setItem("MR_INSTALL_PROMPTED_SESSION", "1");

    document.getElementById("install-offer-state")?.classList.remove("hide");
    document.getElementById("install-progress-state")?.classList.add("hide");
    document.getElementById("install-done-state")?.classList.add("hide");
    document.getElementById("modal-install-welcome")?.classList.remove("hide");
    pushBackGuard();
}

function dismissWelcomeInstall() {
    if (typeof PWA_REMIND_KEY !== "undefined") {
        localStorage.setItem(PWA_REMIND_KEY, String(Date.now()));
    }
    document.getElementById("modal-install-welcome")?.classList.add("hide");
}

async function acceptWelcomeInstall() {
    document.getElementById("install-offer-state")?.classList.add("hide");
    document.getElementById("install-progress-state")?.classList.remove("hide");
    const bar = document.getElementById("install-progress-bar");
    const lbl = document.getElementById("install-progress-label");
    if (bar) bar.style.width = "22%";
    if (lbl) lbl.innerText = "Menyiapkan paket aplikasi ringan (< 2 MB)...";

    if (deferredPwaPrompt) {
        try {
            if (bar) bar.style.width = "50%";
            deferredPwaPrompt.prompt();
            const choice = await deferredPwaPrompt.userChoice;
            deferredPwaPrompt = null;
            if (choice && choice.outcome === "accepted") {
                if (lbl) lbl.innerText = "Memasang ikon ke layar utama HP Anda...";
                if (bar) bar.style.width = "82%";
                localStorage.setItem("MR_PWA_INSTALLED", "true");
                setTimeout(() => completeInstallAnimationUI(), 1300);
            } else {
                document.getElementById("modal-install-welcome")?.classList.add("hide");
                showToast("Pemasangan dibatalkan. Anda tetap bisa pasang kapan saja lewat menu titik 3.", "info");
            }
        } catch {
            document.getElementById("modal-install-welcome")?.classList.add("hide");
        }
        return;
    }

    setTimeout(() => {
        if (bar) bar.style.width = "65%";
        if (lbl) lbl.innerText = "Memeriksa dukungan instalasi browser...";
    }, 450);
    setTimeout(() => {
        if (bar) bar.style.width = "100%";
        document.getElementById("install-progress-state")?.classList.add("hide");
        document.getElementById("install-done-state")?.classList.remove("hide");
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const descEl = document.querySelector("#install-done-state p");
        const headEl = document.querySelector("#install-done-state h4");
        if (headEl) headEl.innerText = "1 Langkah Lagi untuk Memasang";
        if (descEl) {
            descEl.innerHTML = isIOS
                ? 'Ketuk tombol <strong>Bagikan (ikon kotak panah atas)</strong> di Safari lalu pilih <strong>"Tambah ke Layar Utama"</strong>.'
                : 'Ketuk menu <strong>titik tiga (⋮)</strong> di pojok kanan atas browser lalu pilih <strong>"Tambahkan ke layar utama / Install aplikasi"</strong>.';
        }
    }, 1100);
}

function completeInstallAnimationUI() {
    const bar = document.getElementById("install-progress-bar");
    if (bar) bar.style.width = "100%";
    document.getElementById("install-offer-state")?.classList.add("hide");
    document.getElementById("install-progress-state")?.classList.add("hide");
    document.getElementById("install-done-state")?.classList.remove("hide");
}

function finishAndLaunchApp() {
    document.getElementById("modal-install-welcome")?.classList.add("hide");
    try { if (typeof getCleanBaseUrl === "function") window.open(getCleanBaseUrl(), "_self"); } catch {}
    showToast("Selamat menggunakan Mr Undangan!");
}

// ================= 2. POPUP LOGIN TENGAH & PENGINGAT LOGIN =================
function openAuthModal() {
    document.getElementById("modal-auth")?.classList.remove("hide");
    setTimeout(() => document.getElementById("auth-username")?.focus(), 120);
    pushBackGuard();
}
function closeAuthModal() { document.getElementById("modal-auth")?.classList.add("hide"); }

function maybeShowLoginReminder() {
    if (currentSessionUser || (typeof clientPortalState !== "undefined" && clientPortalState.active)) return;
    if (!document.getElementById("modal-auth")?.classList.contains("hide")) return;
    if (!document.getElementById("modal-install-welcome")?.classList.contains("hide")) return;
    if (typeof LOGIN_REMIND_KEY === "undefined") return;
    const last = Number(localStorage.getItem(LOGIN_REMIND_KEY) || 0);
    if (Date.now() - last < 1000 * 60 * 5) return;
    localStorage.setItem(LOGIN_REMIND_KEY, String(Date.now()));
    document.getElementById("login-reminder-pill")?.classList.remove("hide");
}
function dismissLoginReminder() {
    if (typeof LOGIN_REMIND_KEY !== "undefined") {
        localStorage.setItem(LOGIN_REMIND_KEY, String(Date.now()));
    }
    document.getElementById("login-reminder-pill")?.classList.add("hide");
}

function ensureUserInLocalDb(userObj) {
    if (!userObj || !userObj.username) return;
    if (!Array.isArray(db.users)) db.users = [];
    const idx = db.users.findIndex(x => String(x.username || "").toLowerCase() === String(userObj.username).toLowerCase());
    if (idx >= 0) db.users[idx] = Object.assign({}, db.users[idx], userObj);
    else db.users.push(userObj);
    try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userObj)); } catch {}
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const u = document.getElementById("auth-username").value.trim().toLowerCase();
    const p = document.getElementById("auth-password").value.trim();
    if (!u || !p) return;
    setBtnLoading("auth-submit-btn", true, "Masuk...");
    const res = await apiAction({ action: "login", username: u, password: p });
    if (res && res.ok && res.user) {
        currentSessionUser = res.user.username;
        currentSessionToken = res.token || "";
        localStorage.setItem(SESSION_KEY, currentSessionUser);
        if (currentSessionToken) localStorage.setItem(SESSION_TOKEN_KEY, currentSessionToken);
        else localStorage.removeItem(SESSION_TOKEN_KEY);
        localStorage.setItem(DISPLAY_NAME_KEY, (res.user.name || res.user.username).split(" ")[0]);
        ensureUserInLocalDb(res.user);
        setBtnLoading("auth-submit-btn", false);
        document.getElementById("auth-password").value = "";
        closeAuthModal();
        dismissLoginReminder();
        showToast(`Halo, ${res.user.name}! Selamat datang kembali.`);
        routeDashboard();
        if (typeof scheduleAdaptivePoll === "function") scheduleAdaptivePoll();
        return;
    }
    if (res && res.code === "NOT_FOUND") {
        setBtnLoading("auth-submit-btn", true, "Mendaftarkan...");
        const reg = await apiAction({ action: "register", username: u, password: p });
        setBtnLoading("auth-submit-btn", false);
        if (reg && reg.ok) {
            document.getElementById("auth-password").value = "";
            closeAuthModal();
            showToast("Pendaftaran berhasil! Tinggal tunggu konfirmasi Admin.", "info");
        } else showToast((reg && reg.message) || "Gagal mendaftar.", "error");
        return;
    }
    setBtnLoading("auth-submit-btn", false);
    showToast((res && res.message) || "Gagal masuk. Periksa koneksi Anda.", "error");
}

async function confirmLogout() {
    if (await showConfirm("Keluar Akun", "Apakah Anda yakin ingin keluar dari akun ini?", "fa-solid fa-right-from-bracket", "Ya, Keluar")) {
        logoutSession();
    }
}
function logoutSession() {
    currentSessionUser = null;
    currentSessionToken = "";
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(DISPLAY_NAME_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    if (typeof idbRemove === "function") idbRemove("db_snapshot");
    db.users = []; db.invitations = []; db.portfolios = []; db.chats = [];
    toggleSlideMenu(false);
    if (typeof closeFullChatOverlay === "function") closeFullChatOverlay();
    goToLanding();
    if (typeof fetchPublicCloud === "function") fetchPublicCloud().then(renderLandingPage);
    showToast("Anda telah keluar.", "info");
}

// ================= 3. NAVIGASI & TOMBOL BACK HP BERTAHAP =================
let lastBackPressTs = 0, historyGuardReady = false, _backStepSeq = 0;

function initBackNavigationGuard() {
    if (historyGuardReady) return;
    historyGuardReady = true;
    try {
        history.replaceState({ mrBase: true, s: 0 }, "");
        history.pushState({ mrActive: true, s: ++_backStepSeq }, "");
        history.pushState({ mrActive: true, s: ++_backStepSeq }, "");
    } catch {}
}

function pushBackGuard() {
    try {
        history.pushState({ mrActive: true, s: ++_backStepSeq }, "");
    } catch {}
}

function pushStepBackGuard(stepTag) {
    try {
        history.pushState({ mrActive: true, stepTag: stepTag, s: ++_backStepSeq }, "");
    } catch {}
}

function closeIgProfileFullscreen() {
    window._igProfileSheetState.open = false;
    const el = document.getElementById("ig-profile-stats-modal");
    if (el) el.classList.add("hide");
}

window.addEventListener("popstate", () => {
    const isVis = (id) => { const el = document.getElementById(id); return el && !el.classList.contains("hide"); };
    const drawerOpen = document.getElementById("drawer-main")?.classList.contains("open");

    if (isVis("expanded-avatar-overlay")) { if (typeof closeExpandedAvatarLightbox === "function") closeExpandedAvatarLightbox(); pushBackGuard(); return; }
    if (isVis("solo-profile-stats-modal")) { if (typeof closeSoloStatsModal === "function") closeSoloStatsModal(); pushBackGuard(); return; }
    if (isVis("ig-profile-stats-modal")) { closeIgProfileFullscreen(); pushBackGuard(); return; }
    if (isVis("ios-vault-lightbox")) { if (typeof closeSecretPhotoLightbox === "function") closeSecretPhotoLightbox(); pushBackGuard(); return; }
    if (isVis("modal-image-cropper")) { if (typeof closeImageCropper === "function") closeImageCropper(); pushBackGuard(); return; }
    if (isVis("modal-audio-cropper")) { if (typeof closeAudioCropper === "function") closeAudioCropper(); pushBackGuard(); return; }
    if (isVis("modal-proof-viewer")) { document.getElementById("modal-proof-viewer")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-theme-builder")) { if (typeof closeThemeBuilderModal === "function") closeThemeBuilderModal(); pushBackGuard(); return; }
    if (isVis("app-confirm-modal")) { document.getElementById("app-confirm-cancel")?.click(); pushBackGuard(); return; }
    if (isVis("modal-install-welcome")) { dismissWelcomeInstall(); pushBackGuard(); return; }
    if (isVis("modal-auth")) { closeAuthModal(); pushBackGuard(); return; }
    if (isVis("modal-chat-contacts")) { document.getElementById("modal-chat-contacts")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-sempurnakan")) { document.getElementById("modal-sempurnakan")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-portfolio-preview")) { document.getElementById("modal-portfolio-preview")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-drive-album-actions")) { document.getElementById("modal-drive-album-actions")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-pin-gate")) { document.getElementById("modal-pin-gate")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-album-form")) { document.getElementById("modal-album-form")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-add-album-choice")) { document.getElementById("modal-add-album-choice")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-secret-album")) { document.getElementById("modal-secret-album")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-create-choice")) { document.getElementById("modal-create-choice")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("modal-client-portal")) { document.getElementById("modal-client-portal")?.classList.add("hide"); pushBackGuard(); return; }

    // Biarkan listener capture di js/chat.js mengurus tahapan Profil -> Isi Chat -> Daftar Chat -> Keluar
    if (isVis("full-chat-overlay") || isVis("modal-view-user-profile")) {
        return;
    }

    if (isVis("modal-master-user")) { document.getElementById("modal-master-user")?.classList.add("hide"); pushBackGuard(); return; }
    if (isVis("guest-invitation-overlay") && isVis("gv-close-btn")) { if (typeof closeGuestInvitation === "function") closeGuestInvitation(); pushBackGuard(); return; }
    if (drawerOpen) { toggleSlideMenu(false); pushBackGuard(); return; }
    if (isVis("modal-share-sosmed")) { if (typeof cancelSocialShareModal === "function") cancelSocialShareModal(); pushBackGuard(); return; }

    if (typeof clientPortalState !== "undefined" && clientPortalState.active) {
        const now = Date.now();
        if (now - lastBackPressTs < 2400) { history.back(); return; }
        lastBackPressTs = now;
        showToast("Tekan kembali sekali lagi untuk keluar.", "info");
        pushBackGuard();
        return;
    }

    if (["wizard", "portfolio_wizard", "payment", "guestlist"].includes(currentViewName)) {
        if (typeof stopPreviewAudio === "function") stopPreviewAudio();
        routeDashboard(true);
        pushBackGuard();
        return;
    }

    if (currentViewName === "master" && typeof currentMasterWorkspace !== "undefined" && currentMasterWorkspace !== "overview") {
        if (typeof openMasterWorkspace === "function") openMasterWorkspace("overview");
        pushBackGuard();
        return;
    }

    if (["profile", "master", "cabang", "staff"].includes(currentViewName)) {
        goToLanding(true);
        pushBackGuard();
        return;
    }

    const now = Date.now();
    if (now - lastBackPressTs < 2400) { history.back(); return; }
    lastBackPressTs = now;
    showToast("Tekan kembali sekali lagi untuk keluar aplikasi.", "info");
    pushBackGuard();
});

function handleHeaderBrandClick() {
    if (typeof clientPortalState !== "undefined" && clientPortalState.active) { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    goToLanding();
}

function hideAllViews() {
    ["view-landing", "view-profile", "view-cabang-admin", "view-master-admin", "view-staff-admin", "view-wizard", "view-portfolio-wizard", "view-payment", "view-guestlist"]
        .forEach(id => document.getElementById(id)?.classList.add("hide"));
}

function goToLanding(fromBack = false) {
    currentViewName = "landing";
    document.body.classList.add("in-home");
    hideAllViews();
    document.getElementById("view-landing")?.classList.remove("hide");
    renderHeaderActions();
    renderLandingPage();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function routeDashboard(fromBack = false) {
    if (typeof clientPortalState !== "undefined" && clientPortalState.active) return;
    if (!currentSessionUser) return goToLanding(fromBack);
    let u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) {
        try {
            const cachedU = JSON.parse(localStorage.getItem(USER_CACHE_KEY) || "null");
            if (cachedU && String(cachedU.username).toLowerCase() === String(currentSessionUser).toLowerCase()) {
                ensureUserInLocalDb(cachedU);
                u = cachedU;
            }
        } catch {}
    }
    if (!u) return goToLanding(fromBack);

    if (window.pendingActionAfterLogin) {
        const act = window.pendingActionAfterLogin;
        window.pendingActionAfterLogin = null;
        if (act.type === "inv" && typeof startCreateInvitation === "function") return startCreateInvitation(u.role === "cabang", act.cat, act.theme);
        if (act.type === "portfolio" && typeof startCreatePortfolio === "function") return startCreatePortfolio(u.role === "cabang", act.docType, act.themeId);
    }

    hideAllViews();
    if (u.role === "master") {
        currentViewName = "master";
        document.body.classList.remove("in-home");
        document.getElementById("view-master-admin")?.classList.remove("hide");
        if (typeof renderMasterAdmin === "function") renderMasterAdmin();
    } else if (u.role === "administrasi") {
        currentViewName = "staff";
        document.body.classList.remove("in-home");
        document.getElementById("view-staff-admin")?.classList.remove("hide");
        if (typeof renderStaffAdmin === "function") renderStaffAdmin();
    } else if (u.role === "cabang") {
        currentViewName = "cabang";
        document.body.classList.remove("in-home");
        document.getElementById("view-cabang-admin")?.classList.remove("hide");
        renderCabangAdmin();
    } else {
        currentViewName = "profile";
        document.body.classList.remove("in-home");
        document.getElementById("view-profile")?.classList.remove("hide");
        renderUserProfile();
    }
    renderHeaderActions();
    if (!fromBack) pushBackGuard();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderHeaderActions() {
    const box = document.getElementById("header-actions");
    const dotsBtn = document.getElementById("header-dots-btn");
    const mainEl = document.getElementById("header-brand-main");
    const subEl = document.getElementById("header-brand-sub");
    const footLoginBtn = document.getElementById("footer-login-cta");
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./logo.png";

    if (typeof clientPortalState !== "undefined" && clientPortalState.active) {
        document.body.classList.add("in-home");
        if (mainEl) mainEl.innerText = clientPortalState.brandName || "Mitra Cabang";
        if (subEl) subEl.innerText = "Powered by Mr Undangan";
        document.getElementById("floating-chat-wrap")?.classList.add("hide");
        if (dotsBtn) {
            dotsBtn.classList.add("hide");
            dotsBtn.style.setProperty("display", "none", "important");
        }
        if (box) box.innerHTML = `<button onclick="cycleAppThemeQuick()" class="w-9 h-9 rounded-full app-card-soft border gold-border app-accent flex items-center justify-center text-xs" title="Ubah Warna Tampilan"><i class="fa-solid fa-palette"></i></button>`;
        return;
    }

    const isProfileMenu = ["profile", "master", "cabang", "staff"].includes(currentViewName);
    document.body.classList.toggle("in-home", !isProfileMenu);

    if (mainEl) mainEl.innerText = "Mr Undangan";
    if (subEl) subEl.innerText = "Powered by Kausar.pictures";
    document.getElementById("floating-chat-wrap")?.classList.remove("hide");
    if (dotsBtn) {
        if (isProfileMenu) {
            dotsBtn.classList.remove("hide");
            dotsBtn.style.setProperty("display", "inline-flex", "important");
        } else {
            dotsBtn.classList.add("hide");
            dotsBtn.style.setProperty("display", "none", "important");
        }
    }

    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (footLoginBtn) footLoginBtn.classList.toggle("hide", !!u);

    if (!u) {
        if (box) box.innerHTML = `<button onclick="openAuthModal()" class="gold-pill-btn px-3.5 py-1.5 rounded-xl text-xs">Masuk / Daftar</button>`;
        return;
    }

    const onDashboard = ["profile", "master", "cabang", "staff"].includes(currentViewName);
    if (box) {
        box.innerHTML = onDashboard
            ? ``
            : `<button onclick="routeDashboard()" class="w-9 h-9 rounded-full overflow-hidden border-2 gold-border shadow-sm hover:scale-105 transition bg-zinc-800 shrink-0" title="Buka Profil"><img src="${u.avatar || defAv}" alt="Profil" class="w-full h-full object-cover"></button>`;
    }
    if (typeof updateChatBadges === "function") updateChatBadges();
}

// ================= INSTAGRAM-STYLE STATS BAR & FULLSCREEN LIST =================
function _normKey(s) {
    return String(s || "").trim().toLowerCase();
}

function _getFollowersListForUser(uObj) {
    if (!uObj || !uObj.username) return [];
    const targetKey = _normKey(uObj.username);
    const allUsers = Array.isArray(db.users) ? db.users : [];
    const fromUsers = allUsers
        .filter(other => {
            if (!other || !other.username) return false;
            if (_normKey(other.username) === targetKey) return false;
            const fList = Array.isArray(other.following) ? other.following : [];
            return fList.some(x => _normKey(x) === targetKey);
        })
        .map(x => _normKey(x.username));
    const direct = Array.isArray(uObj.followers) ? uObj.followers.map(_normKey).filter(Boolean) : [];
    return Array.from(new Set([...fromUsers, ...direct]));
}

function _getFollowingListForUser(uObj) {
    if (!uObj || !uObj.following || !Array.isArray(uObj.following)) return [];
    return Array.from(new Set(uObj.following.map(_normKey).filter(Boolean)));
}

function _getProjectsForUser(uObj) {
    const invs = Array.isArray(db.invitations) ? db.invitations.map(i => Object.assign({}, i, { _kind: "inv" })) : [];
    const pfs = Array.isArray(db.portfolios) ? db.portfolios.map(p => Object.assign({}, p, { _kind: "pf" })) : [];
    const combined = [...invs, ...pfs];
    if (!uObj) return [];
    if (uObj.role === "master" || uObj.role === "administrasi") {
        return combined;
    }
    const uKey = _normKey(uObj.username);
    return combined.filter(d => _normKey(d.owner) === uKey);
}

function _formatMasterFollowersDisplay() {
    const allUsers = Array.isArray(db.users) ? db.users : [];
    const realUserCount = allUsers.filter(u => u && u.role !== "master").length;
    return `18.3k + ${realUserCount}`;
}

function _buildIgStatsRowHtml(targetUserObj) {
    if (!targetUserObj || !targetUserObj.username) return "";
    const role = targetUserObj.role || "user";
    const uname = _normKey(targetUserObj.username);
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isSelf = !!(curU && _normKey(curU.username) === uname);
    const isMasterProfile = role === "master";
    const isCabangProfile = role === "cabang";

    const followingList = _getFollowingListForUser(targetUserObj);
    const projectsList = _getProjectsForUser(targetUserObj);

    let followersDisplay = "";
    if (isMasterProfile) {
        followersDisplay = _formatMasterFollowersDisplay();
    } else {
        followersDisplay = String(_getFollowersListForUser(targetUserObj).length);
    }

    const canFollowThis = !isSelf && curU && (
        isMasterProfile
            ? (curU.role === "user" || curU.role === "administrasi")
            : true
    );
    const isFollowingThis = canFollowThis && _getFollowingListForUser(curU).includes(uname);

    const followersColHtml = isCabangProfile
        ? ""
        : `<button type="button" onclick="openIgProfileStatsModal('${esc(uname)}','followers')" class="flex-1 py-2 px-1 text-center rounded-xl hover:bg-black/5 active:scale-98 transition">
            <span class="block text-sm sm:text-base font-extrabold tracking-tight">${escHtml(followersDisplay)}</span>
            <span class="block text-[11px] app-muted font-medium">Followers</span>
        </button>`;

    const followingColHtml = isCabangProfile
        ? ""
        : `<button type="button" onclick="openIgProfileStatsModal('${esc(uname)}','following')" class="flex-1 py-2 px-1 text-center rounded-xl hover:bg-black/5 active:scale-98 transition">
            <span class="block text-sm sm:text-base font-extrabold tracking-tight">${followingList.length}</span>
            <span class="block text-[11px] app-muted font-medium">Following</span>
        </button>`;

    const projectColHtml = `<button type="button" onclick="openIgProfileStatsModal('${esc(uname)}','project')" class="flex-1 py-2 px-1 text-center rounded-xl hover:bg-black/5 active:scale-98 transition">
        <span class="block text-sm sm:text-base font-extrabold tracking-tight">${projectsList.length}</span>
        <span class="block text-[11px] app-muted font-medium">Project</span>
    </button>`;

    const followBtnHtml = canFollowThis
        ? `<div class="px-1 pt-2">
            <button type="button" onclick="toggleFollowTargetUser('${esc(uname)}')" class="w-full py-2 rounded-xl text-xs font-extrabold transition ${isFollowingThis ? "app-btn-sec border" : "gold-pill-btn shadow-sm"}">
                <i class="fa-solid ${isFollowingThis ? "fa-user-check" : "fa-user-plus"} mr-1.5"></i>${isFollowingThis ? "Following" : "Follow"}
            </button>
        </div>`
        : "";

    return `
        <div class="ig-stats-strip app-card border rounded-2xl px-2 py-2 shadow-sm">
            <div class="flex items-center justify-around divide-x divide-black/10">
                ${followersColHtml}
                ${followingColHtml}
                ${projectColHtml}
            </div>
            ${followBtnHtml}
        </div>
    `;
}

async function toggleFollowTargetUser(targetUname) {
    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!curU || !curU.username) {
        showToast("Silakan masuk akun terlebih dahulu untuk mengikuti.", "info");
        if (typeof openAuthModal === "function") openAuthModal();
        return;
    }
    const tKey = _normKey(targetUname);
    const targetObj = (db.users || []).find(u => _normKey(u.username) === tKey);
    if (!targetObj) return;
    if (targetObj.role === "master" && curU.role !== "user" && curU.role !== "administrasi") {
        return showToast("Hanya User dan Admin yang dapat mengikuti akun Master.", "info");
    }

    const myKey = _normKey(curU.username);
    if (!Array.isArray(curU.following)) curU.following = [];
    if (!Array.isArray(targetObj.followers)) targetObj.followers = [];

    const idxF = curU.following.map(_normKey).indexOf(tKey);
    const nowFollowing = idxF === -1;
    if (nowFollowing) {
        curU.following.push(tKey);
        if (!targetObj.followers.map(_normKey).includes(myKey)) targetObj.followers.push(myKey);
    } else {
        curU.following.splice(idxF, 1);
        targetObj.followers = targetObj.followers.filter(x => _normKey(x) !== myKey);
    }

    ensureUserInLocalDb(curU);
    ensureUserInLocalDb(targetObj);
    refreshActiveViewSmart();
    if (typeof viewUserProfileModal === "function" && !document.getElementById("modal-view-user-profile")?.classList.contains("hide")) {
        viewUserProfileModal(tKey, true);
    }
    if (window._igProfileSheetState.open) {
        renderIgProfileStatsModalContent();
    }
    showToast(nowFollowing ? `Mengikuti @${tKey}` : `Berhenti mengikuti @${tKey}`, "info");

    try {
        await apiAction({ action: "upsert_user", oldUsername: curU.username, user: curU });
        await apiAction({ action: "upsert_user", oldUsername: targetObj.username, user: targetObj });
    } catch {}
}

function _ensureIgProfileModalElement() {
    let mod = document.getElementById("ig-profile-stats-modal");
    if (!mod) {
        mod = document.createElement("div");
        mod.id = "ig-profile-stats-modal";
        mod.className = "hide fixed inset-0 z-[140] bg-[var(--app-bg)] flex flex-col overflow-hidden";
        mod.innerHTML = `
            <div class="px-4 py-3 app-header border-b flex items-center justify-between gap-3 shrink-0 backdrop-blur-md">
                <div class="flex items-center gap-2.5 min-w-0">
                    <button type="button" onclick="closeIgProfileFullscreen();pushBackGuard();" class="w-9 h-9 rounded-full app-btn-sec flex items-center justify-center text-sm shrink-0" title="Kembali">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <div class="min-w-0">
                        <h3 id="ig-modal-title" class="font-extrabold text-base truncate">Daftar</h3>
                        <p id="ig-modal-sub" class="text-[10px] app-muted truncate"></p>
                    </div>
                </div>
                <button type="button" onclick="closeIgProfileFullscreen();pushBackGuard();" class="px-3 py-1.5 rounded-full app-btn-sec text-xs font-bold shrink-0">Tutup</button>
            </div>
            <div id="ig-modal-tabs" class="px-4 py-2.5 border-b gold-border flex gap-2 overflow-x-auto no-scrollbar shrink-0 app-card"></div>
            <div id="ig-modal-body" class="flex-1 overflow-y-auto p-4 space-y-2.5 max-w-2xl w-full mx-auto"></div>
        `;
        document.body.appendChild(mod);
    }
    return mod;
}

function _renderUserRowIgHtml(uItem) {
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./logo.png";
    const proCheck = uItem.isPro ? `<i class="fa-solid fa-circle-check text-blue-500 text-xs shrink-0" title="Akun Pro"></i>` : "";
    const roleLabel = uItem.role === "cabang" ? "Cabang" : uItem.role === "administrasi" ? "Administrasi" : uItem.role === "master" ? "Master" : "User";
    return `
        <div class="app-card border rounded-2xl p-3 flex items-center gap-3 shadow-sm">
            <img src="${uItem.avatar || defAv}" class="w-11 h-11 rounded-full object-cover border gold-border bg-zinc-800 shrink-0">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 min-w-0">
                    <strong class="text-xs sm:text-sm font-bold truncate">${escHtml(uItem.name || uItem.username)}</strong>
                    ${proCheck}
                </div>
                <p class="text-[11px] app-muted truncate">@${escHtml(uItem.username)} • ${escHtml(roleLabel)}</p>
            </div>
        </div>
    `;
}

function openIgProfileStatsModal(targetUsername, initialTab = "followers") {
    const tKey = _normKey(targetUsername);
    const targetObj = (db.users || []).find(u => _normKey(u.username) === tKey);
    if (!targetObj) return showToast("Data akun tidak ditemukan.", "info");

    if (targetObj.role === "cabang" && initialTab === "followers") {
        initialTab = "project";
    }

    window._igProfileSheetState = {
        open: true,
        targetUsername: tKey,
        tab: initialTab,
        masterCat: "user",
        projectCat: "proses"
    };

    const mod = _ensureIgProfileModalElement();
    renderIgProfileStatsModalContent();
    mod.classList.remove("hide");
    pushBackGuard();
}

function setIgStatsTopTab(tab) {
    const tKey = window._igProfileSheetState.targetUsername;
    const targetObj = (db.users || []).find(u => _normKey(u.username) === tKey);
    if (targetObj && targetObj.role === "cabang" && tab === "followers") return;
    window._igProfileSheetState.tab = tab;
    renderIgProfileStatsModalContent();
}

function setIgMasterFollowerCat(cat) {
    window._igProfileSheetState.masterCat = cat;
    renderIgProfileStatsModalContent();
}

function setIgProjectCat(cat) {
    window._igProfileSheetState.projectCat = cat;
    renderIgProfileStatsModalContent();
}

function renderIgProfileStatsModalContent() {
    const st = window._igProfileSheetState;
    const targetObj = (db.users || []).find(u => _normKey(u.username) === _normKey(st.targetUsername));
    if (!targetObj) return;

    const curU = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const isSelf = !!(curU && _normKey(curU.username) === _normKey(targetObj.username));
    const isMasterProfile = targetObj.role === "master";
    const isCabangProfile = targetObj.role === "cabang";

    const titleEl = document.getElementById("ig-modal-title");
    const subEl = document.getElementById("ig-modal-sub");
    const tabsEl = document.getElementById("ig-modal-tabs");
    const bodyEl = document.getElementById("ig-modal-body");

    if (titleEl) titleEl.innerText = `${targetObj.name || targetObj.username}`;
    if (subEl) subEl.innerText = `@${targetObj.username}`;

    const topTabs = [];
    if (!isCabangProfile) {
        topTabs.push({ id: "followers", label: "Followers" });
        topTabs.push({ id: "following", label: "Following" });
    }
    topTabs.push({ id: "project", label: "Project" });

    if (tabsEl) {
        tabsEl.innerHTML = topTabs.map(t => `<button type="button" onclick="setIgStatsTopTab('${t.id}')" class="px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition ${st.tab === t.id ? "gold-pill-btn shadow-sm" : "app-btn-sec"}">${t.label}</button>`).join("");
    }

    if (!bodyEl) return;

    if (st.tab === "followers") {
        if (isMasterProfile && !isSelf) {
            bodyEl.innerHTML = `
                <div class="app-card border rounded-3xl p-7 text-center space-y-2 my-6">
                    <i class="fa-solid fa-lock text-2xl app-accent"></i>
                    <h4 class="font-extrabold text-sm">Daftar Followers Privat</h4>
                    <p class="text-xs app-muted">Daftar followers akun Master tidak ditampilkan kepada pengguna lain.</p>
                </div>
            `;
            return;
        }

        if (isMasterProfile && isSelf) {
            const allNonMaster = (db.users || []).filter(u => u && u.role !== "master");
            const catMap = {
                user: allNonMaster.filter(u => u.role === "user"),
                administrasi: allNonMaster.filter(u => u.role === "administrasi"),
                cabang: allNonMaster.filter(u => u.role === "cabang")
            };
            const activeCat = catMap[st.masterCat] ? st.masterCat : "user";
            const filteredUsers = catMap[activeCat] || [];

            bodyEl.innerHTML = `
                <div class="flex items-center justify-between gap-2 pb-1">
                    <span class="text-xs font-bold app-muted">Total Followers: <strong class="app-accent">${escHtml(_formatMasterFollowersDisplay())}</strong></span>
                </div>
                <div class="flex gap-2 pb-2">
                    <button type="button" onclick="setIgMasterFollowerCat('user')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold ${activeCat === "user" ? "gold-pill-btn" : "app-btn-sec"}">User (${catMap.user.length})</button>
                    <button type="button" onclick="setIgMasterFollowerCat('administrasi')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold ${activeCat === "administrasi" ? "gold-pill-btn" : "app-btn-sec"}">Administrasi (${catMap.administrasi.length})</button>
                    <button type="button" onclick="setIgMasterFollowerCat('cabang')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold ${activeCat === "cabang" ? "gold-pill-btn" : "app-btn-sec"}">Cabang (${catMap.cabang.length})</button>
                </div>
                <div class="space-y-2.5">
                    ${filteredUsers.length ? filteredUsers.map(_renderUserRowIgHtml).join("") : `<div class="app-card border border-dashed rounded-2xl p-6 text-center text-xs app-muted">Belum ada akun pada kategori ini.</div>`}
                </div>
            `;
            return;
        }

        const fKeys = _getFollowersListForUser(targetObj);
        const followerObjs = fKeys.map(k => (db.users || []).find(u => _normKey(u.username) === k) || { username: k, name: k, role: "user", avatar: DEFAULT_AVATAR });
        bodyEl.innerHTML = followerObjs.length
            ? followerObjs.map(_renderUserRowIgHtml).join("")
            : `<div class="app-card border border-dashed rounded-2xl p-7 text-center text-xs app-muted">Belum ada followers.</div>`;
        return;
    }

    if (st.tab === "following") {
        const gKeys = _getFollowingListForUser(targetObj);
        const followingObjs = gKeys.map(k => (db.users || []).find(u => _normKey(u.username) === k) || { username: k, name: k, role: "user", avatar: DEFAULT_AVATAR });
        bodyEl.innerHTML = followingObjs.length
            ? followingObjs.map(_renderUserRowIgHtml).join("")
            : `<div class="app-card border border-dashed rounded-2xl p-7 text-center text-xs app-muted">Belum mengikuti akun mana pun.</div>`;
        return;
    }

    const allProj = _getProjectsForUser(targetObj);
    const isStaffScope = targetObj.role === "master" || targetObj.role === "administrasi";

    if (isStaffScope) {
        const prosesList = allProj.filter(p => p.status !== "Aktif");
        const aktifList = allProj.filter(p => p.status === "Aktif");
        const pCat = st.projectCat === "aktif" ? "aktif" : "proses";
        const shownList = pCat === "aktif" ? aktifList : prosesList;

        bodyEl.innerHTML = `
            <div class="flex gap-2 pb-2">
                <button type="button" onclick="setIgProjectCat('proses')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold ${pCat === "proses" ? "gold-pill-btn" : "app-btn-sec"}">Proses / Belum Diverifikasi (${prosesList.length})</button>
                <button type="button" onclick="setIgProjectCat('aktif')" class="px-3.5 py-1.5 rounded-xl text-xs font-bold ${pCat === "aktif" ? "gold-pill-btn" : "app-btn-sec"}">Aktif / Sudah Diverifikasi (${aktifList.length})</button>
            </div>
            <div class="space-y-2.5">
                ${shownList.length ? shownList.map(doc => {
                    const kindLbl = doc._kind === "pf" ? (doc.docType === "lamaran" ? "Surat Lamaran" : "CV") : `Undangan • ${doc.category || ""}`;
                    const stBadge = doc.status === "Aktif" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600";
                    return `
                        <div class="app-card border rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
                            <div class="min-w-0">
                                <span class="inline-block text-[9px] px-2 py-0.5 rounded-full font-extrabold ${stBadge}">${escHtml(doc.status || "Proses")}</span>
                                <strong class="block text-sm font-bold truncate mt-1">${escHtml(doc.title || "Project")}</strong>
                                <span class="text-[11px] app-muted truncate block">${escHtml(kindLbl)} ${doc.owner ? `• @${escHtml(doc.owner)}` : ""}</span>
                            </div>
                        </div>
                    `;
                }).join("") : `<div class="app-card border border-dashed rounded-2xl p-6 text-center text-xs app-muted">Belum ada project pada kategori ini.</div>`}
            </div>
        `;
        return;
    }

    bodyEl.innerHTML = allProj.length
        ? allProj.map(doc => {
            const kindLbl = doc._kind === "pf" ? (doc.docType === "lamaran" ? "Surat Lamaran" : "CV") : `Undangan • ${doc.category || ""}`;
            const stBadge = doc.status === "Aktif" ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600";
            return `
                <div class="app-card border rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-sm">
                    <div class="min-w-0">
                        <span class="inline-block text-[9px] px-2 py-0.5 rounded-full font-extrabold ${stBadge}">${escHtml(doc.status || "Draf")}</span>
                        <strong class="block text-sm font-bold truncate mt-1">${escHtml(doc.title || "Project")}</strong>
                        <span class="text-[11px] app-muted truncate block">${escHtml(kindLbl)}</span>
                    </div>
                </div>
            `;
        }).join("")
        : `<div class="app-card border border-dashed rounded-2xl p-7 text-center text-xs app-muted">Belum ada project yang dibuat.</div>`;
}

// ================= 4. MENU TITIK 3 POPUP PENUH =================
function toggleSlideMenu(show) {
    const el = document.getElementById("drawer-main"); if (!el) return;
    if (show) {
        backToMainSlideMenu();
        el.classList.add("open");
        pushBackGuard();
    } else {
        el.classList.remove("open");
    }
}

function backToMainSlideMenu() {
    const tEl = document.getElementById("drawer-main-title");
    if (tEl) tEl.innerText = "Pengaturan";
    document.getElementById("drawer-main-list")?.classList.remove("hide");
    ["drawer-sub-theme", "drawer-sub-about", "drawer-sub-profil", "drawer-sub-akun", "drawer-sub-qris"]
        .forEach(id => document.getElementById(id)?.classList.add("hide"));
    renderMainSlideMenuList();
}

function menuRowItem(icon, title, sub, onclickJs) {
    return `<button type="button" onclick="${onclickJs}" class="menu-row-card">
        <span class="menu-row-ic"><i class="fa-solid ${icon}"></i></span>
        <div class="flex-1 min-w-0">
            <strong class="text-xs block truncate">${title}</strong>
            <span class="text-[10px] app-muted block truncate">${sub}</span>
        </div>
        <i class="fa-solid fa-chevron-right text-[10px] app-muted shrink-0"></i>
    </button>`;
}

function renderMainSlideMenuList() {
    const box = document.getElementById("drawer-main-list"); if (!box) return;
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    let html = "";

    if (!u) {
        html += menuRowItem("fa-right-to-bracket", "Masuk / Daftar Akun", "Buat undangan, CV & simpan favorit", "toggleSlideMenu(false);openAuthModal();");
    } else if (u.role === "master") {
        html += menuRowItem("fa-chart-line", "Grafik & Analitik Bisnis", "Ringkasan omzet, tren & aktivitas", "toggleSlideMenu(false);routeDashboard();openMasterWorkspace('overview');");
        html += menuRowItem("fa-clipboard-check", "Verifikasi Order & Revisi", "Cek bukti konfirmasi & edit proyek klien", "toggleSlideMenu(false);routeDashboard();openMasterWorkspace('orders');");
        html += menuRowItem("fa-palette", "Kelola Tema & Harga", "Foto template, nama contoh & harga CV", "toggleSlideMenu(false);routeDashboard();openMasterWorkspace('themes');");
        html += menuRowItem("fa-users-gear", "Kelola User, Cabang & Pro", "Inspeksi album, PIN, Akun Pro & Staf", "toggleSlideMenu(false);routeDashboard();openMasterWorkspace('users_cabang');");
        html += menuRowItem("fa-rectangle-ad", "Edit Banner Promosi (12:4.4)", "Atur banner promosi utama beranda", "toggleSlideMenu(false);routeDashboard();openMasterWorkspace('home_editor');");
        html += menuRowItem("fa-music", "Stok Musik & Testimoni", "Kelola daftar lagu & ulasan beranda", "toggleSlideMenu(false);routeDashboard();openMasterWorkspace('media');");
        html += menuRowItem("fa-qrcode", "QRIS DANA & Rekening", "Mode QRIS Tetap / Dinamis & rekening", "openSlideSub('qris')");
        html += menuRowItem("fa-comments", "Live Chat Pelanggan", "Balas pesan, mulai chat baru & pengajuan PIN", "toggleSlideMenu(false);openFullChatOverlay();");
        html += menuRowItem("fa-user-pen", "Edit Profil Master", "Foto profil, sampul & bio", "openSlideSub('profil')");
        html += menuRowItem("fa-shield-halved", "Keamanan Akun & Keluar", "Ubah username, sandi atau logout", "openSlideSub('akun')");
    } else if (u.role === "administrasi") {
        html += menuRowItem("fa-clipboard-check", "Antrean Konfirmasi & Edit User", "Konfirmasi berkas, revisi & edit proyek user", "toggleSlideMenu(false);routeDashboard();");
        html += menuRowItem("fa-comments", "Live Chat Pelanggan", "Balas pesan & hubungi kontak user", "toggleSlideMenu(false);openFullChatOverlay();");
        html += menuRowItem("fa-user-pen", "Edit Profil Staf", "Foto profil & informasi kontak", "openSlideSub('profil')");
        html += menuRowItem("fa-right-from-bracket", "Keluar (Logout)", "Akhiri sesi tim administrasi", "confirmLogout()");
    } else {
        html += menuRowItem("fa-user-pen", u.role === "cabang" ? "Profil & Label Brand Cabang" : "Pengaturan Profil", "Foto, sampul, nama & kontak", "openSlideSub('profil')");
        html += menuRowItem("fa-shield-halved", "Pengaturan Akun", "Ubah username, password & keluar", "openSlideSub('akun')");
        html += menuRowItem("fa-headset", "Live Chat Admin", "Bantuan, konfirmasi & upgrade Pro", "toggleSlideMenu(false);openFullChatOverlay();");
    }

    html += menuRowItem("fa-swatchbook", "Tampilan & Warna Aplikasi", "Gaya Pengaturan iOS & nuansa lainnya", "openSlideSub('theme')");
    if (!isAppInstalled()) {
        html += menuRowItem("fa-mobile-screen-button", "Pasang Aplikasi (< 2 MB)", "Akses super cepat dari layar utama HP", "toggleSlideMenu(false);openWelcomeInstallModal(true);");
    }
    html += menuRowItem("fa-circle-info", "Tentang Aplikasi", "Penjelasan singkat & seluruh fitur", "openSlideSub('about')");

    box.innerHTML = html;
}

function openSlideSub(sec) {
    document.getElementById("drawer-main-list")?.classList.add("hide");
    ["drawer-sub-theme", "drawer-sub-about", "drawer-sub-profil", "drawer-sub-akun", "drawer-sub-qris"]
        .forEach(id => document.getElementById(id)?.classList.add("hide"));

    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./logo.png";
    const tKey = typeof APP_THEME_KEY !== "undefined" ? APP_THEME_KEY : "MR_UNDANGAN_APP_THEME";
    const tEl = document.getElementById("drawer-main-title");

    if (sec === "theme") {
        if (tEl) tEl.innerText = "Tampilan & Warna";
        if (typeof applyAppTheme === "function") applyAppTheme(localStorage.getItem(tKey) || "light", false);
        document.getElementById("drawer-sub-theme")?.classList.remove("hide");
    } else if (sec === "about") {
        if (tEl) tEl.innerText = "Tentang Mr Undangan";
        document.getElementById("drawer-sub-about")?.classList.remove("hide");
    } else if (sec === "profil" && u) {
        if (tEl) tEl.innerText = u.role === "cabang" ? "Profil & Label Brand" : "Pengaturan Profil";
        const prevAv = document.getElementById("set-prof-avatar-prev");
        if (prevAv) prevAv.src = u.avatar || defAv;
        const bw = document.getElementById("set-prof-brand-wrap");
        if (bw) { bw.classList.toggle("hide", u.role !== "cabang"); const bInp = document.getElementById("set-prof-brand"); if (bInp) bInp.value = u.brandName || ""; }
        const nInp = document.getElementById("set-prof-name"); if (nInp) nInp.value = u.name || "";
        const bioInp = document.getElementById("set-prof-bio"); if (bioInp) bioInp.value = u.bio || "";
        const phInp = document.getElementById("set-prof-phone"); if (phInp) phInp.value = u.phone || "";
        const adInp = document.getElementById("set-prof-address"); if (adInp) adInp.value = u.address || "";
        document.getElementById("drawer-sub-profil")?.classList.remove("hide");
    } else if (sec === "akun" && u) {
        if (tEl) tEl.innerText = "Pengaturan Akun";
        const uInp = document.getElementById("set-acc-user"); if (uInp) uInp.value = u.username;
        const pInp = document.getElementById("set-acc-pass"); if (pInp) pInp.value = u.password || "";
        document.getElementById("drawer-sub-akun")?.classList.remove("hide");
    } else if (sec === "qris" && u && u.role === "master") {
        if (tEl) tEl.innerText = "QRIS DANA & Rekening";
        const ms = db.masterSettings || {};
        const mSel = document.getElementById("ms-qris-mode"); if (mSel) mSel.value = ms.qrisMode || "static";
        const dInp = document.getElementById("ms-qris-dyn-str"); if (dInp) dInp.value = ms.qrisDynamicString || "";
        const uChk = document.getElementById("ms-qris-unique"); if (uChk) uChk.checked = ms.qrisUniqueCode !== false;
        const qPrev = document.getElementById("ms-qris-prev"); if (qPrev) qPrev.src = ms.qrisImage || "";
        const pInp = document.getElementById("ms-p"); if (pInp) pInp.value = ms.priceText || "Rp 150.000";
        if (typeof toggleQrisModeFields === "function") toggleQrisModeFields();
        const box = document.getElementById("ms-banks-container");
        if (box && typeof getMasterBanksList === "function" && typeof addMasterBankRow === "function") {
            box.innerHTML = "";
            getMasterBanksList().forEach(b => addMasterBankRow(b.bank, b.no, b.holder));
        }
        document.getElementById("drawer-sub-qris")?.classList.remove("hide");
    }
}

function pickCroppedProfileMedia(inp, type) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    const isBanner = type === "banner";
    if (typeof openImageCropper !== "function") return;
    openImageCropper(file, isBanner ? 16 / 6 : 1, isBanner ? "Atur Sampul Profil (16:6)" : "Atur Foto Profil (1:1)", isBanner ? 1000 : 380, isBanner ? 375 : 380, async (dataUrl) => {
        const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null; if (!u) return;
        showLoading("Menyimpan foto...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: `${type}_${u.username}` });
        if (!up || !up.ok || !up.url) { hideLoading(); return showToast("Gagal mengunggah foto.", "error"); }
        const upd = Object.assign({}, u); upd[type] = up.url;
        const res = await apiAction({ action: "upsert_user", oldUsername: u.username, user: upd });
        hideLoading();
        if (res && res.ok) {
            ensureUserInLocalDb(upd);
            if (!isBanner) { const prev = document.getElementById("set-prof-avatar-prev"); if (prev) prev.src = up.url; }
            refreshActiveViewSmart(); renderHeaderActions();
            showToast(isBanner ? "Sampul profil diperbarui & file lama dihapus!" : "Foto profil diperbarui & foto lama dihapus!");
        }
    });
}
async function removeProfileMedia(type) {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null; if (!u) return;
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./logo.png";
    if (!u[type]) return showToast("Foto sudah kosong.", "info");
    if (!(await showConfirm("Hapus Foto", `Hapus ${type === "avatar" ? "foto profil" : "sampul profil"} ini?`, "fa-solid fa-trash", "Ya, Hapus"))) return;
    showLoading("Menghapus...");
    const upd = Object.assign({}, u); upd[type] = "";
    const res = await apiAction({ action: "upsert_user", oldUsername: u.username, user: upd });
    hideLoading();
    if (res && res.ok) {
        ensureUserInLocalDb(upd);
        if (type === "avatar") { const prev = document.getElementById("set-prof-avatar-prev"); if (prev) prev.src = defAv; }
        refreshActiveViewSmart(); renderHeaderActions(); showToast("Foto dihapus.", "info");
    }
}
async function saveProfileInfo() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null; if (!u) return;
    setBtnLoading("btn-save-prof", true, "Menyimpan...");
    const updatedUser = Object.assign({}, u, {
        name: document.getElementById("set-prof-name").value.trim() || u.name,
        bio: document.getElementById("set-prof-bio").value.trim(),
        phone: document.getElementById("set-prof-phone").value.trim(),
        address: document.getElementById("set-prof-address").value.trim()
    });
    if (u.role === "cabang") updatedUser.brandName = (document.getElementById("set-prof-brand")?.value || "").trim();
    const res = await apiAction({ action: "upsert_user", oldUsername: u.username, user: updatedUser });
    setBtnLoading("btn-save-prof", false);
    if (res && res.ok) {
        ensureUserInLocalDb(updatedUser);
        if (typeof DISPLAY_NAME_KEY !== "undefined") localStorage.setItem(DISPLAY_NAME_KEY, updatedUser.name.split(" ")[0]);
        toggleSlideMenu(false); refreshActiveViewSmart(); renderHeaderActions();
        showToast("Profil berhasil disimpan!");
    } else showToast("Gagal menyimpan profil.", "error");
}
async function changeUserCredentials() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null; if (!u) return;
    const newU = document.getElementById("set-acc-user").value.trim().toLowerCase();
    const newP = document.getElementById("set-acc-pass").value.trim();
    if (!newU || !newP) return showToast("Isi username dan password baru.", "error");
    if (!(await showConfirm("Ubah Kredensial", "Yakin ingin memperbarui username atau password Anda?"))) return;
    setBtnLoading("btn-save-acc", true, "Menyimpan...");
    const updated = Object.assign({}, u, { username: newU, password: newP });
    const res = await apiAction({ action: "upsert_user", oldUsername: u.username, user: updated });
    setBtnLoading("btn-save-acc", false);
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal memperbarui akun.", "error");
    currentSessionUser = newU;
    localStorage.setItem(SESSION_KEY, newU);
    ensureUserInLocalDb(updated);
    toggleSlideMenu(false); refreshActiveViewSmart(); showToast("Username & password diperbarui!");
}

// ================= 5. BERANDA (BANNER + ETALASE RINGAN + CV + 6 SERTIFIKAT BERKELAS) =================
function renderLandingPage() {
    renderPromoBannerSlider();
    renderInfiniteInvShelf();
    renderPortfolioShelf();
    renderCertificateShowcaseShelf();
    renderTestimonials();
}

function _getSafeBanners() {
    if (Array.isArray(db.promoBanners) && db.promoBanners.length) return db.promoBanners;
    if (typeof getLocalFallbackDB === "function") {
        const fb = getLocalFallbackDB();
        if (fb && Array.isArray(fb.promoBanners) && fb.promoBanners.length) return fb.promoBanners;
    }
    return [{
        badge: "PROMO",
        title: "Buat Undangan Digital, CV & Lamaran Praktis",
        subtitle: "Pilih desain, isi data, dan bagikan tautan undangan atau unduh PDF langsung dari HP.",
        ctaText: "Mulai Buat",
        img: "./logo.png",
        targetSection: "sec-undangan"
    }];
}

function renderPromoBannerSlider() {
    const slides = _getSafeBanners();
    if (promoBannerIdx >= slides.length) promoBannerIdx = 0;
    const track = document.getElementById("promo-banner-track");
    const dots = document.getElementById("promo-banner-dots");
    if (!track) return;

    track.innerHTML = slides.map((s, idx) => `
        <div onclick="handlePromoBannerClick(${idx})" class="min-w-full h-full relative flex items-end sm:items-center px-4 py-3.5 md:px-14 cursor-pointer select-none">
            <img src="${s.img || "./logo.png"}" class="absolute inset-0 w-full h-full object-cover opacity-75">
            <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20"></div>
            <div class="relative z-10 max-w-xl space-y-1 sm:space-y-2 text-white">
                <span class="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[9px] uppercase tracking-wider">${escHtml(s.badge || "PROMO")}</span>
                <h2 class="text-sm sm:text-2xl md:text-3xl font-extrabold leading-tight drop-shadow">${escHtml(s.title || "Mr Undangan")}</h2>
                <p class="text-[10px] sm:text-xs text-zinc-200 line-clamp-2 max-w-md">${escHtml(s.subtitle || "")}</p>
                ${s.ctaText ? `<span class="inline-block mt-1 gold-pill-btn px-3.5 py-1.5 rounded-lg text-[10px] sm:text-xs shadow">${escHtml(s.ctaText)} <i class="fa-solid fa-arrow-right ml-1"></i></span>` : ""}
            </div>
        </div>
    `).join("");

    if (dots) {
        dots.innerHTML = slides.map((_, i) => `<button type="button" data-pb-dot="${i}" onclick="event.stopPropagation();promoBannerIdx=${i};updatePromoBannerPos();" class="h-1.5 rounded-full transition-all ${i === promoBannerIdx ? "w-6 bg-amber-400" : "w-2 bg-white/45"}"></button>`).join("");
    }
    updatePromoBannerPos();
}
function updatePromoBannerPos() {
    const tr = document.getElementById("promo-banner-track");
    if (tr) tr.style.transform = `translateX(-${promoBannerIdx * 100}%)`;
    document.querySelectorAll("#promo-banner-dots [data-pb-dot]").forEach((btn) => {
        const active = Number(btn.dataset.pbDot) === promoBannerIdx;
        btn.className = `h-1.5 rounded-full transition-all ${active ? "w-6 bg-amber-400" : "w-2 bg-white/45"}`;
    });
}
function handlePromoBannerClick(idx) {
    const s = _getSafeBanners()[idx];
    if (!s) return;
    if (s.targetType === "login") { if (currentSessionUser) routeDashboard(); else openAuthModal(); }
    else if (s.targetType === "chat" && typeof openFullChatOverlay === "function") openFullChatOverlay();
    else document.getElementById(s.targetSection || "sec-undangan")?.scrollIntoView({ behavior: "smooth" });
}

function renderInvCategoryPills() {
    if (typeof THEME_CATALOG === "undefined") return;
    const cats = Object.keys(THEME_CATALOG);
    const box = document.getElementById("landing-inv-cat-tabs"); if (!box) return;
    box.innerHTML = cats.map(c =>
        `<button type="button" onclick="scrollInvShelfToCat('${esc(c)}')" class="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${activeInvShelfCat === c ? "gold-pill-btn shadow" : "app-card border app-muted"}">${escHtml(c)}</button>`
    ).join("");
}

function renderInfiniteInvShelf() {
    const shelf = document.getElementById("landing-inv-shelf"); if (!shelf) return;
    if (typeof THEME_CATALOG === "undefined" || typeof getMergedThemes !== "function") return;
    const cats = Object.keys(THEME_CATALOG);
    const flat = [];
    cats.forEach(cat => getMergedThemes(cat, false).forEach(t => flat.push(t)));

    shelf.innerHTML = flat.map(t => {
        const targetId = (db.themeOverrides && db.themeOverrides[`${t.cat}::${t.name}`]?.targetInvId) || "";
        const coverHtml = typeof buildMiniCoverCardHtml === "function" ? buildMiniCoverCardHtml(t.cat, t, true) : "";
        const priceHtml = typeof buildPriceStripHtml === "function" ? buildPriceStripHtml(t, true) : "";
        return `<div data-inv-cat="${esc(t.cat)}" onclick="openBannerOrCardTarget('${esc(t.cat)}','${esc(t.name)}','${esc(targetId)}')" class="h-shelf-card group rounded-2xl overflow-hidden border gold-border bg-black shadow-md cursor-pointer flex flex-col">
            ${coverHtml}
            ${priceHtml}
        </div>`;
    }).join("");
    renderInvCategoryPills();

    if (!shelf.dataset.catScrollBound) {
        shelf.dataset.catScrollBound = "1";
        let raf = null;
        shelf.addEventListener("scroll", () => {
            if (raf || invShelfLock) return;
            raf = requestAnimationFrame(() => {
                raf = null;
                if (invShelfLock) return;
                const shelfLeft = shelf.getBoundingClientRect().left + 28;
                const cards = shelf.children;
                for (let i = 0; i < cards.length; i++) {
                    const r = cards[i].getBoundingClientRect();
                    if (r.right > shelfLeft) {
                        const detectedCat = cards[i].dataset.invCat;
                        if (detectedCat && detectedCat !== activeInvShelfCat) {
                            activeInvShelfCat = detectedCat;
                            renderInvCategoryPills();
                        }
                        break;
                    }
                }
            });
        }, { passive: true });
    }
}

function scrollInvShelfToCat(cat) {
    activeInvShelfCat = cat;
    renderInvCategoryPills();
    const shelf = document.getElementById("landing-inv-shelf"); if (!shelf) return;
    const target = shelf.querySelector(`[data-inv-cat="${CSS.escape(cat)}"]`);
    if (target) {
        invShelfLock = true;
        shelf.scrollTo({ left: Math.max(0, target.offsetLeft - 6), behavior: "smooth" });
        setTimeout(() => { invShelfLock = false; }, 550);
    }
}

function openBannerOrCardTarget(cat, themeName, targetInvId) {
    if (targetInvId && Array.isArray(db.invitations) && db.invitations.some(i => String(i.id) === String(targetInvId)) && typeof openGuestView === "function") {
        return openGuestView(targetInvId, "Tamu Kehormatan");
    }
    if (typeof openThemeLivePreview === "function") openThemeLivePreview(cat || "Pernikahan", themeName || "Adat Kalimantan");
}

function renderPfCategoryPills() {
    const box = document.getElementById("landing-pf-cat-tabs"); if (!box) return;
    box.innerHTML = [
        { key: "cv", lbl: "Curriculum Vitae (9)" },
        { key: "lamaran", lbl: "Lamaran Kerja (3)" }
    ].map(c => `<button type="button" onclick="scrollPfShelfToCat('${c.key}')" class="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${activePfShelfCat === c.key ? "gold-pill-btn shadow" : "app-card border app-muted"}">${c.lbl}</button>`).join("");
}

function renderPortfolioShelf() {
    const shelf = document.getElementById("landing-pf-shelf"); if (!shelf) return;
    if (typeof PORTFOLIO_CATALOG === "undefined" || typeof getPortfolioThemeObj !== "function") return;
    const items = [
        ...PORTFOLIO_CATALOG.cv.map(x => ({ docType: "cv", obj: getPortfolioThemeObj("cv", x.id) })),
        ...PORTFOLIO_CATALOG.lamaran.map(x => ({ docType: "lamaran", obj: getPortfolioThemeObj("lamaran", x.id) }))
    ];
    shelf.innerHTML = items.map(it => {
        const cardHtml = typeof buildPortfolioMiniCardHtml === "function" ? buildPortfolioMiniCardHtml(it.docType, it.obj, true) : "";
        const priceHtml = typeof buildPriceStripHtml === "function" ? buildPriceStripHtml(it.obj, true) : "";
        return `
            <div data-pf-cat="${it.docType}" onclick="openPortfolioDemoPreview('${it.docType}','${it.obj.id}')" class="h-shelf-card group rounded-2xl overflow-hidden border gold-border bg-black shadow-md cursor-pointer flex flex-col">
                ${cardHtml}
                ${priceHtml}
            </div>
        `;
    }).join("");
    renderPfCategoryPills();

    if (!shelf.dataset.pfBound) {
        shelf.dataset.pfBound = "1";
        shelf.addEventListener("scroll", () => {
            if (pfShelfLock) return;
            const shelfLeft = shelf.getBoundingClientRect().left + 28;
            for (const card of shelf.children) {
                if (card.getBoundingClientRect().right > shelfLeft) {
                    const c = card.dataset.pfCat;
                    if (c && c !== activePfShelfCat) { activePfShelfCat = c; renderPfCategoryPills(); }
                    break;
                }
            }
        }, { passive: true });
    }
}

function scrollPfShelfToCat(cat) {
    activePfShelfCat = cat; renderPfCategoryPills();
    const shelf = document.getElementById("landing-pf-shelf"); if (!shelf) return;
    const target = shelf.querySelector(`[data-pf-cat="${cat}"]`);
    if (target) {
        pfShelfLock = true;
        shelf.scrollTo({ left: Math.max(0, target.offsetLeft - 6), behavior: "smooth" });
        setTimeout(() => { pfShelfLock = false; }, 500);
    }
}

function renderCertificateShowcaseShelf() {
    const shelf = document.getElementById("landing-cert-shelf"); if (!shelf) return;
    if (typeof CERT_SHOWCASE === "undefined" || !Array.isArray(CERT_SHOWCASE)) return;
    shelf.innerHTML = CERT_SHOWCASE.map(c => {
        const isPortrait = c.orientation === "portrait";
        const sizeCls = isPortrait ? "cert-card-portrait" : "cert-card-landscape";

        let decorLayer = "";
        if (c.styleVariant === "navy_ornament_qr") {
            decorLayer = `
                <div class="absolute inset-1.5 border-2 border-[#16324f] pointer-events-none"></div>
                <div class="absolute inset-2.5 border border-[#b45309]/60 pointer-events-none"></div>
                <div class="absolute bottom-2.5 left-3.5 w-7 h-7 border border-[#16324f]/40 bg-zinc-100 grid grid-cols-3 gap-0.5 p-0.5 opacity-80">
                    <span class="bg-[#16324f]"></span><span></span><span class="bg-[#16324f]"></span>
                    <span></span><span class="bg-[#16324f]"></span><span></span>
                    <span class="bg-[#16324f]"></span><span></span><span class="bg-[#16324f]"></span>
                </div>`;
        } else if (c.styleVariant === "champagne_mandala") {
            decorLayer = `
                <div class="absolute inset-2 border border-amber-700/45 pointer-events-none"></div>
                <svg viewBox="0 0 100 100" class="absolute -bottom-6 -right-6 w-28 h-28 text-amber-800/20 pointer-events-none" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="50" cy="50" r="42"/><circle cx="50" cy="50" r="30"/><circle cx="50" cy="50" r="18"/><path d="M50 8v84M8 50h84M20 20l60 60M80 20L20 80"/></svg>`;
        } else if (c.styleVariant === "rose_gold_glitter") {
            decorLayer = `
                <div class="absolute inset-1.5 border border-[#be185d]/30 rounded-xl pointer-events-none"></div>
                <div class="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-gradient-to-br from-rose-300/35 to-amber-200/35 blur-sm pointer-events-none"></div>
                <div class="absolute -bottom-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-tl from-rose-300/40 to-amber-200/30 blur-sm pointer-events-none"></div>`;
        } else if (c.styleVariant === "geometric_ribbon") {
            decorLayer = `
                <div class="absolute top-0 right-0 w-24 h-24 pointer-events-none overflow-hidden">
                    <div class="w-32 h-5 bg-[#0f294a] rotate-45 translate-x-6 -translate-y-1"></div>
                    <div class="w-32 h-2 bg-[#d97706] rotate-45 translate-x-5 translate-y-0.5"></div>
                </div>
                <div class="absolute bottom-0 left-0 w-20 h-20 pointer-events-none overflow-hidden">
                    <div class="w-28 h-4 bg-[#0f294a] rotate-45 -translate-x-8 translate-y-6"></div>
                </div>`;
        } else if (c.styleVariant === "wave_round_seal") {
            decorLayer = `
                <svg viewBox="0 0 300 60" preserveAspectRatio="none" class="absolute top-0 inset-x-0 w-full h-9 pointer-events-none"><path d="M0,0 L300,0 L300,26 Q210,55 120,24 T0,34 Z" fill="#0f4c5c" opacity="0.16"/><path d="M0,0 L300,0 L300,16 Q190,42 90,14 T0,22 Z" fill="#eab308" opacity="0.32"/></svg>
                <div class="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full border-2 border-amber-500/80 bg-amber-100/80 flex items-center justify-center text-[8px] font-extrabold text-amber-800">★</div>`;
        } else {
            decorLayer = `
                <div class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-[#1d4ed8] via-[#38bdf8] to-[#0f172a]"></div>
                <div class="absolute top-2.5 right-3 w-7 h-7 rounded-full bg-blue-600/12 border border-blue-600/40 flex items-center justify-center text-blue-700 text-[10px] font-black">+</div>`;
        }

        return `
            <div onclick="showToast('Fitur Sertifikat & Piagam Otomatis segera hadir! Bebas isi nama asli, perusahaan & institusi apa pun.','info')" class="${sizeCls} rounded-2xl overflow-hidden border border-black/15 shadow-md cursor-pointer select-none relative flex flex-col justify-between p-4 text-zinc-900 shrink-0" style="background:${c.bg};">
                ${decorLayer}
                <div class="relative z-10 flex items-center justify-between gap-1">
                    <span class="text-[8px] uppercase font-extrabold px-2 py-0.5 rounded-full text-white" style="background:${c.accent};">${escHtml(c.cat)}</span>
                    <span class="text-[8px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-black">SOON</span>
                </div>
                <div class="relative z-10 my-auto text-center space-y-1 py-1.5">
                    <span class="text-[7.5px] font-mono text-zinc-500 block tracking-wider">${escHtml(c.code)}</span>
                    <p class="font-serif-ed text-xs font-extrabold uppercase tracking-[0.12em]" style="color:${c.accent};">${escHtml(c.title)}</p>
                    <p class="font-script text-2xl text-zinc-900 leading-none py-0.5">${escHtml(c.holder)}</p>
                    <p class="text-[9px] font-semibold text-zinc-700 line-clamp-2 px-1">${escHtml(c.course)}</p>
                </div>
                <div class="relative z-10 flex items-end justify-between text-[8px] text-zinc-600 pt-1 border-t border-black/10">
                    <span class="font-bold truncate max-w-[54%]">${escHtml(c.org)}</span>
                    <div class="text-right leading-tight">
                        <span class="font-script text-sm block text-zinc-800">${escHtml(c.signer)}</span>
                        <span class="text-[7px] text-zinc-500">${escHtml(c.role)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

function renderTestimonials() {
    const list = db.testimonials || [], tr = document.getElementById("testimonial-track"), dt = document.getElementById("testimonial-dots");
    if (!tr) return;
    if (!list.length) { tr.innerHTML = `<div class="min-w-full text-center text-xs app-muted py-5">Belum ada testimoni.</div>`; if (dt) dt.innerHTML = ""; return; }
    if (testiIdx >= list.length) testiIdx = 0;
    tr.innerHTML = list.map(t => `<div class="min-w-full px-1"><div class="app-card-soft border rounded-2xl p-4 space-y-2 text-center max-w-2xl mx-auto"><div class="text-amber-500 text-xs">${'<i class="fa-solid fa-star mx-0.5"></i>'.repeat(t.rating || 5)}</div><p class="text-xs italic">"${escHtml(t.text)}"</p><div><h4 class="font-bold text-xs">${escHtml(t.name)}</h4><span class="text-[10px] app-accent uppercase font-semibold">${escHtml(t.category)}</span></div></div></div>`).join("");
    if (dt) dt.innerHTML = list.map((_, i) => `<button onclick="testiIdx=${i};renderTestimonials()" class="h-1.5 rounded-full transition-all ${i===testiIdx?"w-6 bg-blue-600":"w-2 bg-zinc-500/40"}"></button>`).join("");
    tr.style.transform = `translateX(-${testiIdx * 100}%)`;
}
function slideTestimonial(d) { const n = (db.testimonials || []).length; if (!n) return; testiIdx = (testiIdx + d + n) % n; renderTestimonials(); }

setInterval(() => {
    if (document.hidden || currentViewName !== "landing") return;
    const guestOpen = !document.getElementById("guest-invitation-overlay")?.classList.contains("hide");
    const chatOpen = !document.getElementById("full-chat-overlay")?.classList.contains("hide");
    if (guestOpen || chatOpen) return;

    const s = _getSafeBanners();
    if (s.length > 1) {
        promoBannerIdx = (promoBannerIdx + 1) % s.length;
        updatePromoBannerPos();
    }
    if ((db.testimonials || []).length > 1) slideTestimonial(1);
}, 4500);

// ================= 6. BUAT BERKASMU & PROFIL USER / CABANG =================
function openCreateChoiceModal(isCabang = false) {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) {
        showToast("Masuk atau daftar akun dulu untuk membuat berkasmu!", "info");
        return openAuthModal();
    }
    createChoiceIsCabang = isCabang || (u.role === "cabang");
    document.getElementById("modal-create-choice")?.classList.remove("hide");
    pushBackGuard();
}
function chooseCreateDoc(kind) {
    document.getElementById("modal-create-choice")?.classList.add("hide");
    if (kind === "undangan" && typeof startCreateInvitation === "function") startCreateInvitation(createChoiceIsCabang);
    else if (kind === "cv" && typeof startCreatePortfolio === "function") startCreatePortfolio(createChoiceIsCabang, "cv");
    else if (kind === "lamaran" && typeof startCreatePortfolio === "function") startCreatePortfolio(createChoiceIsCabang, "lamaran");
}

function buildFilmPosterDocCardHtml(doc, isCabang = false) {
    const isPf = doc._kind === "pf";
    const isAktif = doc.status === "Aktif";
    const isPay = doc.status === "Menunggu Pembayaran";
    const edLeft = Math.max(0, 2 - Number(doc.editCount || 0));
    const canEdit = isCabang ? true : (isAktif && edLeft > 0);
    const editLabel = isCabang ? "Edit Berkas" : `Edit (${edLeft}x)`;
    const statusCls = isAktif ? "bg-emerald-500/18 text-emerald-600" : isPay ? "app-accent-bg app-accent" : "bg-blue-500/18 text-blue-600";

    let leftCoverHtml = "";
    if (isPf) {
        const tObj = getPortfolioThemeObj(doc.docType, doc.themeId);
        const userPhoto = doc.photo || "";
        const userFullName = doc.fullName || doc.title || "Berkas";
        const userHeadline = doc.headline || (doc.lamaran && doc.lamaran.position) || tObj.name;
        leftCoverHtml = `
            <div class="w-[108px] shrink-0 rounded-2xl overflow-hidden border gold-border relative flex flex-col justify-between p-2.5 text-white shadow" style="background:linear-gradient(160deg,${tObj.accent},#111827);">
                <span class="text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-black/45 self-start">${doc.docType === "lamaran" ? "Lamaran" : "CV"}</span>
                <div class="my-auto flex flex-col items-center text-center gap-1 py-1">
                    ${userPhoto
                        ? `<img src="${userPhoto}" class="w-11 h-11 rounded-xl object-cover border border-white/80 shadow">`
                        : `<div class="w-10 h-10 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center text-xs font-extrabold">${escHtml(userFullName.slice(0, 2).toUpperCase())}</div>`}
                    <strong class="text-[9.5px] leading-tight line-clamp-2 font-extrabold">${escHtml(userFullName)}</strong>
                </div>
                <span class="text-[8px] font-semibold leading-tight line-clamp-1 opacity-90 text-center bg-black/35 rounded px-1 py-0.5">${escHtml(userHeadline)}</span>
            </div>
        `;
    } else {
        const tObj = findThemeObject(doc.category, doc.theme);
        const cov = getThemeCoverPair(doc.category, tObj);
        const userCoverImg = (Array.isArray(doc.photos) && doc.photos.find(p => p && String(p).trim()))
            || doc.couplePhoto
            || doc.bridePhoto
            || doc.groomPhoto
            || cov.src;
        leftCoverHtml = `
            <div class="w-[108px] shrink-0 rounded-2xl overflow-hidden border gold-border relative bg-black shadow">
                <img src="${userCoverImg}" ${imgFbAttr(cov.fb)} class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20"></div>
                <div class="absolute bottom-1.5 inset-x-1.5 text-center space-y-0.5">
                    <span class="block text-[9px] font-extrabold text-white leading-tight truncate drop-shadow">${escHtml(doc.title)}</span>
                    <span class="block text-[7.5px] font-bold uppercase px-1 py-0.5 rounded bg-black/70 text-amber-300 truncate">${escHtml(doc.category)}</span>
                </div>
            </div>
        `;
    }

    let actionsHtml = "";
    if (isPf) {
        actionsHtml = `
            <button onclick="openPortfolioDocPreview(${doc.id},false)" class="w-full py-1.5 rounded-xl app-btn-sec text-[11px] font-bold text-left px-3"><i class="fa-regular fa-eye w-4 mr-1"></i>Lihat Ini</button>
            ${canEdit ? `<button onclick="openEditPortfolio(${doc.id},${isCabang})" class="w-full py-1.5 rounded-xl app-card-soft border text-[11px] font-bold text-left px-3"><i class="fa-solid fa-pen w-4 mr-1"></i>${editLabel}</button>` : `<button disabled class="w-full py-1.5 rounded-xl app-btn-sec opacity-45 text-[11px] font-bold text-left px-3"><i class="fa-solid fa-lock w-4 mr-1"></i>Edit</button>`}
            ${isPay ? `<button onclick="openUnifiedPayment('portfolio',${doc.id})" class="w-full py-1.5 rounded-xl gold-pill-btn text-[11px] text-left px-3"><i class="fa-solid fa-qrcode w-4 mr-1"></i>Konfirmasi Sekarang</button>`
                : isAktif ? `<button onclick="openSempurnakanModal(${doc.id})" class="w-full py-1.5 rounded-xl gold-pill-btn text-[11px] text-left px-3"><i class="fa-solid fa-file-pdf w-4 mr-1"></i>Sempurnakan / PDF</button>`
                : `<button disabled class="w-full py-1.5 rounded-xl app-btn-sec opacity-60 text-[11px] font-bold text-left px-3"><i class="fa-solid fa-clock w-4 mr-1"></i>Menunggu ACC</button>`}
        `;
    } else {
        actionsHtml = `
            ${isAktif ? `<button onclick="openGuestView(${doc.id},'Tamu Kehormatan')" class="w-full py-1.5 rounded-xl app-btn-sec text-[11px] font-bold text-left px-3"><i class="fa-regular fa-eye w-4 mr-1"></i>Lihat Ini</button>` : `<button disabled class="w-full py-1.5 rounded-xl app-btn-sec opacity-45 text-[11px] font-bold text-left px-3"><i class="fa-solid fa-lock w-4 mr-1"></i>Lihat Ini</button>`}
            ${canEdit ? `<button onclick="openEditInvitation(${doc.id},${isCabang})" class="w-full py-1.5 rounded-xl app-card-soft border text-[11px] font-bold text-left px-3"><i class="fa-solid fa-pen w-4 mr-1"></i>${editLabel}</button>` : `<button disabled class="w-full py-1.5 rounded-xl app-btn-sec opacity-45 text-[11px] font-bold text-left px-3"><i class="fa-solid fa-lock w-4 mr-1"></i>Edit</button>`}
            ${isPay ? `<button onclick="openUnifiedPayment('inv',${doc.id})" class="w-full py-1.5 rounded-xl gold-pill-btn text-[11px] text-left px-3"><i class="fa-solid fa-qrcode w-4 mr-1"></i>Konfirmasi Sekarang</button>`
                : isAktif ? (isCabang
                    ? `<div class="grid grid-cols-2 gap-1.5"><button onclick="openGuestListManager(${doc.id})" class="py-1.5 rounded-xl app-card-soft border app-accent text-[10px] font-bold">Tamu</button><button onclick="openClientPortalShareModal(${doc.id})" class="py-1.5 rounded-xl gold-pill-btn text-[10px]">Link Klien</button></div>`
                    : `<button onclick="openGuestListManager(${doc.id})" class="w-full py-1.5 rounded-xl gold-pill-btn text-[11px] text-left px-3"><i class="fa-solid fa-share-nodes w-4 mr-1"></i>Bagikan (${(doc.guests||[]).length})</button>`)
                : `<button disabled class="w-full py-1.5 rounded-xl app-btn-sec opacity-60 text-[11px] font-bold text-left px-3"><i class="fa-solid fa-clock w-4 mr-1"></i>Menunggu ACC</button>`}
        `;
    }

    return `
        <div class="h-doc-poster-card app-card border rounded-3xl p-3.5 shadow-md flex gap-3.5 items-stretch">
            ${leftCoverHtml}
            <div class="flex-1 min-w-0 flex flex-col justify-between gap-2">
                <div class="space-y-0.5">
                    <span class="inline-block text-[9px] px-2 py-0.5 rounded-full font-extrabold ${statusCls}">● ${escHtml(doc.status)}</span>
                    <h4 class="font-extrabold text-sm leading-tight truncate pt-0.5">${escHtml(doc.title)}</h4>
                    <p class="text-[10px] app-muted truncate">${escHtml(isPf ? (doc.themeName || doc.themeId) : doc.theme)}</p>
                </div>
                <div class="space-y-1.5">${actionsHtml}</div>
            </div>
        </div>
    `;
}

function getUserCombinedDocs(username) {
    const uname = String(username || "").toLowerCase();
    const invs = (db.invitations || []).filter(i => String(i.owner || "").toLowerCase() === uname).map(i => Object.assign({}, i, { _kind: "inv" }));
    const pfs = (db.portfolios || []).filter(p => String(p.owner || "").toLowerCase() === uname).map(p => Object.assign({}, p, { _kind: "pf" }));
    return [...invs, ...pfs].sort((a, b) => Number(b.createdAt || b.id || 0) - Number(a.createdAt || a.id || 0));
}

function renderProfileFavoritesShelf() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null; if (!u) return;
    const favs = u.favorites || [];
    const html = !favs.length
        ? `<div class="w-full app-card border border-dashed rounded-2xl p-7 text-center text-xs app-muted">Belum ada produk favorit. Ketuk ikon <i class="fa-solid fa-heart text-red-500"></i> pada kartu di Beranda untuk menyimpannya di sini.</div>`
        : favs.map(f => {
            if (f.kind === "pf") {
                const obj = getPortfolioThemeObj(f.docType, f.id);
                return `<div onclick="openPortfolioDemoPreview('${f.docType}','${obj.id}')" class="h-shelf-card group rounded-2xl overflow-hidden border gold-border bg-black shadow cursor-pointer flex flex-col">${buildPortfolioMiniCardHtml(f.docType, obj, true)}${buildPriceStripHtml(obj, true)}</div>`;
            }
            const tObj = findThemeObject(f.cat, f.name);
            return `<div onclick="openThemeLivePreview('${esc(f.cat)}','${esc(tObj.name)}')" class="h-shelf-card group rounded-2xl overflow-hidden border gold-border bg-black shadow cursor-pointer flex flex-col">${buildMiniCoverCardHtml(f.cat, tObj, true)}${buildPriceStripHtml(tObj, true)}</div>`;
        }).join("");

    ["user-favs-shelf", "cabang-favs-shelf"].forEach(id => { const el = document.getElementById(id); if (el) el.innerHTML = html; });
    ["prof-fav-count", "cabang-fav-count"].forEach(id => { const el = document.getElementById(id); if (el) el.innerText = favs.length; });
}

function switchProfileDocsTab(tab) {
    const isDocs = tab === "docs";
    document.getElementById("prof-docs-panel")?.classList.toggle("hide", !isDocs);
    document.getElementById("prof-favs-panel")?.classList.toggle("hide", isDocs);
    const td = document.getElementById("tab-prof-docs"); if (td) td.className = `px-4 py-1.5 rounded-full text-xs font-extrabold ${isDocs ? "gold-pill-btn" : "app-btn-sec"}`;
    const tf = document.getElementById("tab-prof-favs"); if (tf) tf.className = `px-4 py-1.5 rounded-full text-xs font-bold ${!isDocs ? "gold-pill-btn" : "app-btn-sec"}`;
}
function switchCabangDocsTab(tab) {
    const isDocs = tab === "docs";
    document.getElementById("cab-docs-panel")?.classList.toggle("hide", !isDocs);
    document.getElementById("cab-favs-panel")?.classList.toggle("hide", isDocs);
    const td = document.getElementById("tab-cab-docs"); if (td) td.className = `px-4 py-1.5 rounded-full text-xs font-extrabold ${isDocs ? "gold-pill-btn" : "app-btn-sec"}`;
    const tf = document.getElementById("tab-cab-favs"); if (tf) tf.className = `px-4 py-1.5 rounded-full text-xs font-bold ${!isDocs ? "gold-pill-btn" : "app-btn-sec"}`;
}

function renderUserProfile() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null; if (!u) return;
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./logo.png";
    const bEl = document.getElementById("prof-banner"); if (bEl) bEl.style.backgroundImage = u.banner ? `url('${u.banner}')` : "";
    const aEl = document.getElementById("prof-avatar"); if (aEl) aEl.src = u.avatar || defAv;
    const caEl = document.getElementById("prof-composer-avatar"); if (caEl) caEl.src = u.avatar || defAv;
    const nEl = document.getElementById("prof-name"); if (nEl) nEl.innerText = u.name;
    document.getElementById("prof-pro-badge")?.classList.toggle("hide", !u.isPro);
    const uEl = document.getElementById("prof-username"); if (uEl) uEl.innerText = `@${u.username}`;
    const bioEl = document.getElementById("prof-bio"); if (bioEl) bioEl.innerText = u.bio || "";
    const cEl = document.getElementById("prof-contact"); if (cEl) cEl.innerHTML = `${u.phone ? `<span><i class="fa-solid fa-phone app-accent mr-1"></i>${escHtml(u.phone)}</span>` : ""}${u.address ? `<span><i class="fa-solid fa-location-dot app-accent mr-1"></i>${escHtml(u.address)}</span>` : ""}`;

    if (typeof renderProfileAlbumHighlights === "function") renderProfileAlbumHighlights("prof-album-highlights", "prof-album-count-lbl", u.username);

    const docs = getUserCombinedDocs(u.username);
    const dcEl = document.getElementById("prof-doc-count"); if (dcEl) dcEl.innerText = docs.length;
    const shelf = document.getElementById("user-docs-shelf");
    if (shelf) {
        shelf.innerHTML = !docs.length
            ? `<div class="w-full app-card border border-dashed rounded-3xl p-8 text-center space-y-3"><p class="text-xs app-muted">Belum ada berkas yang dibuat.</p><button onclick="openCreateChoiceModal(false)" class="gold-pill-btn px-5 py-2.5 rounded-xl text-xs">+ Buat Berkas Pertamamu</button></div>`
            : docs.map(d => buildFilmPosterDocCardHtml(d, false)).join("");
    }

    renderProfileFavoritesShelf();
}

function renderCabangAdmin() {
    const cab = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null; if (!cab) return;
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./logo.png";
    const bEl = document.getElementById("cprof-banner"); if (bEl) bEl.style.backgroundImage = cab.banner ? `url('${cab.banner}')` : "";
    const aEl = document.getElementById("cprof-avatar"); if (aEl) aEl.src = cab.avatar || defAv;
    const caEl = document.getElementById("cabang-composer-avatar"); if (caEl) caEl.src = cab.avatar || defAv;
    const nEl = document.getElementById("cabang-title-name"); if (nEl) nEl.innerText = cab.name;
    document.getElementById("cabang-pro-badge")?.classList.toggle("hide", !cab.isPro);
    const uEl = document.getElementById("cabang-username"); if (uEl) uEl.innerText = `@${cab.username}`;
    const qEl = document.getElementById("cabang-quota-badge"); if (qEl) qEl.innerText = cab.quota || 0;
    const brandLbl = (cab.brandName && cab.brandName.trim()) ? cab.brandName.trim() : cab.name;
    const brEl = document.getElementById("cabang-brand-badge"); if (brEl) brEl.innerHTML = `<i class="fa-solid fa-tag app-accent mr-1"></i>Label: <strong>${escHtml(brandLbl)}</strong> • Powered by Mr Undangan`;

    if (typeof renderProfileAlbumHighlights === "function") renderProfileAlbumHighlights("cabang-album-highlights", "cabang-album-count-lbl", cab.username);

    const docs = getUserCombinedDocs(cab.username);
    const dcEl = document.getElementById("cabang-doc-count"); if (dcEl) dcEl.innerText = docs.length;
    const shelf = document.getElementById("cabang-docs-shelf");
    if (shelf) {
        shelf.innerHTML = !docs.length
            ? `<div class="w-full app-card border border-dashed rounded-3xl p-8 text-center space-y-3"><p class="text-xs app-muted">Belum ada berkas klien.</p><button onclick="openCreateChoiceModal(true)" class="gold-pill-btn px-5 py-2.5 rounded-xl text-xs">+ Buat Berkas Klien (-1 Kuota)</button></div>`
            : docs.map(d => buildFilmPosterDocCardHtml(d, true)).join("");
    }

    renderProfileFavoritesShelf();
}

// ================= 7. SMART REFRESH & INITIALIZATION =================
function isUserTypingIn(id) {
    const el = document.activeElement;
    if (!el || !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return false;
    const wrap = document.getElementById(id);
    return wrap ? wrap.contains(el) : false;
}

function refreshActiveViewSmart() {
    if (typeof updateChatBadges === "function") updateChatBadges();
    const chatOv = document.getElementById("full-chat-overlay");
    if (chatOv && !chatOv.classList.contains("hide") && typeof renderFullChatContentSmart === "function") renderFullChatContentSmart();
    if (currentViewName === "landing" && !isUserTypingIn("view-landing")) renderLandingPage();
    else if (currentViewName === "profile") renderUserProfile();
    else if (currentViewName === "cabang") renderCabangAdmin();
    else if (currentViewName === "staff" && typeof renderStaffAdmin === "function") renderStaffAdmin();
    else if (currentViewName === "guestlist" && !isUserTypingIn("view-guestlist") && typeof renderGuestListStatsAndRows === "function") renderGuestListStatsAndRows();
    else if (currentViewName === "master" && typeof renderMasterHeaderStats === "function") {
        renderMasterHeaderStats();
        if (currentMasterWorkspace !== "home_editor" && currentMasterWorkspace !== "media" && !isUserTypingIn("master-workspace-body") && typeof renderMasterWorkspaceContent === "function") {
            renderMasterWorkspaceContent();
        }
    }
    const gOv = document.getElementById("guest-invitation-overlay");
    if (gOv && !gOv.classList.contains("hide") && typeof activeGuestInv !== "undefined" && activeGuestInv && activeGuestInv.id !== "demo") {
        const fresh = (db.invitations || []).find(i => String(i.id) === String(activeGuestInv.id));
        if (fresh) {
            activeGuestInv = fresh;
            if (!isUserTypingIn("guest-invitation-overlay") && typeof renderGuestWishes === "function") {
                renderGuestWishes();
            }
        }
    }
}

async function bootMrUndanganApp() {
    if (window.__MR_APP_BOOTED__) return;
    window.__MR_APP_BOOTED__ = true;

    const splashStartedAt = Date.now();
    const finishSplash = (minMs = 1100) => {
        const left = Math.max(0, minMs - (Date.now() - splashStartedAt));
        setTimeout(() => { if (typeof hideHelloSplash === "function") hideHelloSplash(); }, left);
    };

    try {
        const tKey = typeof APP_THEME_KEY !== "undefined" ? APP_THEME_KEY : "MR_UNDANGAN_APP_THEME";
        if (typeof applyAppTheme === "function") applyAppTheme(localStorage.getItem(tKey) || "light", false);
        initBackNavigationGuard();
        const p = new URLSearchParams(window.location.search);

        if (p.has("client") && typeof fetchClientPortalData === "function") {
            if (typeof hideHelloSplash === "function") hideHelloSplash();
            showLoading("Membuka Portal Tamu Mandiri...");
            const res = await fetchClientPortalData(p.get("client"), p.get("key") || "");
            hideLoading();
            if (res && res.ok && res.invitation && typeof openClientPortalView === "function") {
                openClientPortalView(res.invitation, res.brandName || "");
                return;
            }
            showToast((res && res.message) || "Tautan portal tamu tidak valid.", "error");
            goToLanding(true);
            return;
        }

        if (p.has("demo") && p.has("theme") && typeof fetchPublicCloud === "function") {
            if (typeof hideHelloSplash === "function") hideHelloSplash();
            if (typeof showEnvelopeLoader === "function") showEnvelopeLoader("Menyiapkan Contoh Tema...");
            await fetchPublicCloud();
            if (typeof openThemeLivePreview === "function") openThemeLivePreview(p.get("demo"), p.get("theme"), false);
            if (typeof hideEnvelopeLoader === "function") hideEnvelopeLoader();
            goToLanding(true);
            return;
        }

        if ((p.has("inv") || p.has("to")) && typeof fetchSingleInvitationFast === "function") {
            if (typeof hideHelloSplash === "function") hideHelloSplash();
            if (typeof showEnvelopeLoader === "function") showEnvelopeLoader("Membuka Undangan...");
            document.getElementById("gv-close-btn")?.classList.add("hide");
            const id = p.get("inv"), g = p.get("to") || "Tamu Kehormatan";
            let invObj = id ? await fetchSingleInvitationFast(id) : null;
            if (!invObj && id && typeof fetchFullCloud === "function") {
                await fetchFullCloud();
                invObj = (db.invitations || []).find(x => String(x.id) === String(id)) || null;
            }
            if (invObj && typeof openGuestViewWithObject === "function") {
                openGuestViewWithObject(invObj, g, true);
            } else {
                if (typeof hideEnvelopeLoader === "function") hideEnvelopeLoader();
                showToast("Undangan tidak ditemukan atau tautan sudah kedaluwarsa.", "error");
                goToLanding(true);
                return;
            }
            if (typeof hideEnvelopeLoader === "function") hideEnvelopeLoader();
            if (typeof fetchPublicCloud === "function") fetchPublicCloud();
            return;
        }

        if (typeof currentSessionUser !== "undefined" && currentSessionUser) {
            const cached = typeof idbGet === "function" ? await idbGet("db_snapshot") : null;
            if (cached && typeof applyServerDb === "function") applyServerDb(cached);

            try {
                const savedU = JSON.parse(localStorage.getItem(USER_CACHE_KEY) || "null");
                if (savedU && String(savedU.username).toLowerCase() === String(currentSessionUser).toLowerCase()) {
                    ensureUserInLocalDb(savedU);
                }
            } catch {}

            const uCached = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
            if (uCached) {
                const nmEl = document.getElementById("ios-hello-name");
                if (nmEl && uCached.name) nmEl.innerText = uCached.name.split(" ")[0];
                routeDashboard(true);
            } else {
                goToLanding(true);
            }
            finishSplash(1150);

            if (typeof fetchFullCloud === "function") {
                fetchFullCloud().then((synced) => {
                    if (!synced) return;
                    const uNow = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
                    if (uNow) {
                        ensureUserInLocalDb(uNow);
                        if (currentViewName === "landing") renderLandingPage();
                        else refreshActiveViewSmart();
                    }
                    if (typeof updateChatBadges === "function") updateChatBadges();
                });
            }
        } else {
            const pubCached = typeof idbGet === "function" ? await idbGet("public_snapshot") : null;
            if (pubCached && typeof applyPublicDb === "function") applyPublicDb(pubCached);
            goToLanding(true);
            finishSplash(1100);

            if (typeof fetchPublicCloud === "function") {
                fetchPublicCloud().then((syncedPub) => {
                    if (syncedPub) refreshActiveViewSmart();
                    if (typeof updateChatBadges === "function") updateChatBadges();
                });
            }

            setTimeout(() => {
                if (!currentSessionUser && currentViewName === "landing") openWelcomeInstallModal(false);
            }, 1900);
            setTimeout(() => maybeShowLoginReminder(), 35000);
        }

        if (typeof updateChatBadges === "function") updateChatBadges();
        if (typeof scheduleAdaptivePoll === "function") scheduleAdaptivePoll();
    } catch (err) {
        console.error("Boot error:", err);
        if (typeof hideHelloSplash === "function") hideHelloSplash();
        try { goToLanding(true); } catch {}
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMrUndanganApp);
} else {
    bootMrUndanganApp();
}
