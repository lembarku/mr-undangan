// =========================================================================
// LEMBARKU & TITIK GOWES — APP CONTROLLER & NOTIFICATIONS (js/app.js)
// Versi: V14.3 (Modular Super-App Ekosistem)
// =========================================================================
const USER_CACHE_KEY = "MR_UNDANGAN_USER_OBJ";
let deferredPwaPrompt = null;
let promoBannerIdx = 0, testiIdx = 0;
let createChoiceIsCabang = false;
let activeInvShelfCat = "Pernikahan", activePfShelfCat = "cv";
let invShelfLock = false, pfShelfLock = false;
let _currentDrawerSub = "";
window.pendingActionAfterLogin = null;
window._igProfileSheetState = { open: false, targetUsername: "", tab: "followers", masterCat: "user", projectCat: "proses" };

function _normAppUserKey(uname) {
    const k = String(uname || "").trim().toLowerCase();
    const founderU = (typeof FOUNDER_USERNAME !== "undefined" && FOUNDER_USERNAME) ? FOUNDER_USERNAME : "kausar.af";
    return k === "master" ? founderU : k;
}

// ================= 1. PWA INSTALL / UNINSTALL TRACKING & WELCOME MODAL =================
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});

const isStandaloneRunning = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

const isAppInstalled = () =>
    isStandaloneRunning() ||
    localStorage.getItem("MR_PWA_INSTALLED") === "true";

window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    const prevMarked = localStorage.getItem("MR_PWA_INSTALLED") === "true" ||
        (typeof APP_INSTALLED_REPORTED_KEY !== "undefined" && localStorage.getItem(APP_INSTALLED_REPORTED_KEY) === "installed");
    if (prevMarked && !isStandaloneRunning()) {
        localStorage.removeItem("MR_PWA_INSTALLED");
        if (typeof reportAppInstallState === "function") reportAppInstallState("uninstalled");
    }
});

window.addEventListener("appinstalled", () => {
    localStorage.setItem("MR_PWA_INSTALLED", "true");
    deferredPwaPrompt = null;
    if (typeof reportAppInstallState === "function") reportAppInstallState("installed");
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
    mrNavPush({ type: "modal", id: "modal-install-welcome" });
}

function dismissWelcomeInstall() {
    if (typeof PWA_REMIND_KEY !== "undefined") {
        localStorage.setItem(PWA_REMIND_KEY, String(Date.now()));
    }
    document.getElementById("modal-install-welcome")?.classList.add("hide");
    _mrDropTopModalById("modal-install-welcome");
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
                if (typeof reportAppInstallState === "function") reportAppInstallState("installed");
                setTimeout(() => completeInstallAnimationUI(), 1300);
            } else {
                document.getElementById("modal-install-welcome")?.classList.add("hide");
                showToast("Pemasangan dibatalkan. Anda tetap bisa pasang kapan saja lewat menu Pengaturan.", "info");
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
    _mrDropTopModalById("modal-install-welcome");
    try { if (typeof getCleanBaseUrl === "function") window.open(getCleanBaseUrl(), "_self"); } catch {}
    showToast("Selamat menggunakan Lembarku & Titik Gowes!");
}

// ================= 2. POPUP LOGIN & PENGINGAT MASUK AKUN =================
function openAuthModal() {
    document.getElementById("modal-auth")?.classList.remove("hide");
    setTimeout(() => document.getElementById("auth-username")?.focus(), 120);
    mrNavPush({ type: "modal", id: "modal-auth" });
}

function closeAuthModal() {
    document.getElementById("modal-auth")?.classList.add("hide");
    _mrDropTopModalById("modal-auth");
}

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
    const normU = _normAppUserKey(userObj.username);
    const cleanObj = Object.assign({}, userObj, { username: normU });
    const idx = db.users.findIndex(x => _normAppUserKey(x.username) === normU);
    if (idx >= 0) db.users[idx] = Object.assign({}, db.users[idx], cleanObj);
    else db.users.push(cleanObj);
    try { localStorage.setItem(USER_CACHE_KEY, JSON.stringify(cleanObj)); } catch {}
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const rawU = document.getElementById("auth-username").value.trim().toLowerCase();
    const u = _normAppUserKey(rawU);
    const p = document.getElementById("auth-password").value.trim();
    if (!u || !p) return;

    setBtnLoading("auth-submit-btn", true, "Masuk...");
    const res = await apiAction({ action: "login", username: u, password: p });

    if (res && res.ok && res.user) {
        currentSessionUser = _normAppUserKey(res.user.username);
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
            showToast("Pendaftaran berhasil! Akun otomatis aktif setelah disetujui Admin.", "info");
        } else showToast((reg && reg.message) || "Gagal mendaftar.", "error");
        return;
    }

    setBtnLoading("auth-submit-btn", false);
    showToast((res && res.message) || "Gagal masuk. Periksa password Anda.", "error");
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
    db.users = []; db.invitations = []; db.portfolios = []; db.chats = []; db.gowesRentals = [];
    toggleSlideMenu(false);
    toggleEcosystemDrawer(false);
    closeNotificationsFullscreen(true);
    if (typeof closeMasterWorkspaceFullscreen === "function") closeMasterWorkspaceFullscreen(true);
    if (typeof closeFullChatOverlay === "function") closeFullChatOverlay(true);
    _mrResetNavToLanding();
    goToLanding(true);
    if (typeof fetchPublicCloud === "function") fetchPublicCloud().then(renderLandingPage);
    showToast("Anda telah keluar.", "info");
}

// ================= 3. MESIN NAVIGASI BERTAHAP TERPUSAT (mrNav) =================
let lastBackPressTs = 0;
let historyGuardReady = false;
let _mrHistoryDepth = 0;
let _mrHomeGuardArmed = false;
window._mrNavStack = [{ type: "landing" }];

function _isElVis(id) {
    const el = document.getElementById(id);
    return !!(el && !el.classList.contains("hide"));
}

function _mrPushBrowserHistory(meta = {}) {
    try {
        _mrHistoryDepth++;
        history.pushState(Object.assign({ mrNav: true, depth: _mrHistoryDepth, ts: Date.now() }, meta), "");
    } catch {}
}

function _mrResetNavToLanding() {
    window._mrNavStack = [{ type: "landing" }];
}

function initBackNavigationGuard() {
    if (historyGuardReady) return;
    historyGuardReady = true;
    try {
        history.replaceState({ mrRoot: true, depth: 0 }, "");
    } catch {}
    window._mrNavStack = [{ type: "landing" }];
    _mrHistoryDepth = 0;
    _mrHomeGuardArmed = false;

    window.addEventListener("pointerdown", () => {
        if (!_mrHomeGuardArmed && _mrHistoryDepth === 0) {
            _mrHomeGuardArmed = true;
            _mrPushBrowserHistory({ mrHomeGuard: true });
        }
    }, { capture: true, passive: true });
}

function mrNavPush(stepObj) {
    if (!stepObj || !stepObj.type) stepObj = { type: "auto" };

    if (!_mrHomeGuardArmed && _mrHistoryDepth === 0) {
        _mrHomeGuardArmed = true;
        _mrPushBrowserHistory({ mrHomeGuard: true });
    }

    const stack = window._mrNavStack;
    const top = stack[stack.length - 1];
    if (top && top.type === stepObj.type) {
        if (stepObj.type === "landing") return;
        if (stepObj.type === "view" && top.view === stepObj.view) return;
        if (stepObj.type === "workspace" && top.name === stepObj.name) return;
        if (stepObj.type === "chat_list") return;
        if (stepObj.type === "chat_thread" && top.threadUser === stepObj.threadUser) return;
        if (stepObj.type === "user_profile" && top.username === stepObj.username) return;
        if (stepObj.type === "solo_stats" && top.targetUsername === stepObj.targetUsername && top.mode === stepObj.mode) return;
        if (stepObj.type === "modal" && top.id === stepObj.id) return;
        if (stepObj.type === "drawer_sub" && top.sec === stepObj.sec) return;
    }

    stack.push(stepObj);
    _mrPushBrowserHistory({ stepType: stepObj.type });
}

function pushBackGuard() {
    mrNavPush({ type: "auto" });
}

function pushStepBackGuard(stepTag) {
    mrNavPush({ type: "auto", stepTag: stepTag || "" });
}

function _mrDropTopModalById(id) {
    const stack = window._mrNavStack;
    while (stack.length > 1) {
        const top = stack[stack.length - 1];
        if ((top.type === "modal" && top.id === id) || (id === "drawer-main" && top.type === "drawer_sub")) {
            stack.pop();
        } else {
            break;
        }
    }
}

function _mrDropTopTransientToken(closedId) {
    const stack = window._mrNavStack;
    if (stack.length <= 1) return;
    const top = stack[stack.length - 1];
    if (top.type === "auto") { stack.pop(); return; }
    if (top.type === "drawer_sub" && closedId === "drawer-sub") { stack.pop(); return; }
    if (top.type === "workspace" && closedId === "modal-master-workspace") { stack.pop(); return; }
    if (top.type === "modal" && top.id === closedId) { stack.pop(); return; }
    if (top.type === "avatar_lightbox" && closedId === "expanded-avatar-overlay") { stack.pop(); return; }
}

function _mrHasVisibleDrawerSub() {
    return ["drawer-sub-theme", "drawer-sub-privacy", "drawer-sub-about", "drawer-sub-profil", "drawer-sub-akun", "drawer-sub-password", "drawer-sub-qris"]
        .some(id => _isElVis(id));
}

function _mrHideStackableOverlaysOnly() {
    const solo = document.getElementById("solo-profile-stats-modal");
    if (solo) solo.classList.add("hide");
    if (window._soloStatsViewState) window._soloStatsViewState.open = false;

    const av = document.getElementById("expanded-avatar-overlay");
    if (av) av.classList.add("hide");

    const profMod = document.getElementById("modal-view-user-profile");
    if (profMod) { profMod.style.cssText = ""; profMod.classList.add("hide"); }

    const notifMod = document.getElementById("modal-notifications");
    if (notifMod) notifMod.classList.add("hide");

    const wsMod = document.getElementById("modal-master-workspace");
    if (wsMod) wsMod.classList.add("hide");

    const chatOv = document.getElementById("full-chat-overlay");
    if (chatOv) { chatOv.style.cssText = ""; chatOv.classList.add("hide"); }

    // Modal Titik Gowes
    ["modal-gowes-booking", "modal-gowes-bike", "modal-gowes-handover", "modal-gowes-rental-detail"].forEach(id => {
        document.getElementById(id)?.classList.add("hide");
    });
    toggleEcosystemDrawer(false);

    document.body.style.overflow = "";
}

function _mrCloseTransientOverlayIfAny() {
    if (_isElVis("expanded-avatar-overlay")) {
        if (typeof closeExpandedAvatarLightbox === "function") closeExpandedAvatarLightbox();
        else document.getElementById("expanded-avatar-overlay")?.classList.add("hide");
        return "expanded-avatar-overlay";
    }
    if (_isElVis("app-confirm-modal")) {
        document.getElementById("app-confirm-cancel")?.click();
        return "app-confirm-modal";
    }
    if (_isElVis("modal-gowes-booking")) {
        if (typeof closeGowesBookingModal === "function") closeGowesBookingModal();
        else document.getElementById("modal-gowes-booking")?.classList.add("hide");
        return "modal-gowes-booking";
    }
    if (_isElVis("modal-gowes-bike")) {
        document.getElementById("modal-gowes-bike")?.classList.add("hide");
        return "modal-gowes-bike";
    }
    if (_isElVis("modal-gowes-handover")) {
        document.getElementById("modal-gowes-handover")?.classList.add("hide");
        return "modal-gowes-handover";
    }
    if (_isElVis("modal-gowes-rental-detail")) {
        document.getElementById("modal-gowes-rental-detail")?.classList.add("hide");
        return "modal-gowes-rental-detail";
    }
    if (document.getElementById("drawer-ecosystem")?.classList.contains("open")) {
        toggleEcosystemDrawer(false);
        return "drawer-ecosystem";
    }
    if (_isElVis("modal-image-cropper")) {
        if (typeof closeImageCropper === "function") closeImageCropper();
        return "modal-image-cropper";
    }
    if (_isElVis("modal-audio-cropper")) {
        if (typeof closeAudioCropper === "function") closeAudioCropper();
        return "modal-audio-cropper";
    }
    if (_isElVis("modal-proof-viewer")) {
        document.getElementById("modal-proof-viewer")?.classList.add("hide");
        return "modal-proof-viewer";
    }
    if (_isElVis("modal-portfolio-preview")) {
        document.getElementById("modal-portfolio-preview")?.classList.add("hide");
        return "modal-portfolio-preview";
    }
    if (_isElVis("modal-album-form")) {
        document.getElementById("modal-album-form")?.classList.add("hide");
        return "modal-album-form";
    }
    if (_isElVis("modal-install-welcome")) {
        dismissWelcomeInstall();
        return "modal-install-welcome";
    }
    if (_isElVis("modal-secret-album")) {
        document.getElementById("modal-secret-album")?.classList.add("hide");
        return "modal-secret-album";
    }
    if (_isElVis("modal-chat-contacts")) {
        document.getElementById("modal-chat-contacts")?.classList.add("hide");
        return "modal-chat-contacts";
    }
    if (_isElVis("modal-auth")) {
        closeAuthModal();
        return "modal-auth";
    }
    if (_isElVis("modal-sempurnakan")) {
        document.getElementById("modal-sempurnakan")?.classList.add("hide");
        return "modal-sempurnakan";
    }
    if (_isElVis("modal-pin-gate")) {
        document.getElementById("modal-pin-gate")?.classList.add("hide");
        return "modal-pin-gate";
    }
    if (_isElVis("modal-drive-album-actions")) {
        document.getElementById("modal-drive-album-actions")?.classList.add("hide");
        return "modal-drive-album-actions";
    }
    if (_isElVis("modal-theme-builder")) {
        if (typeof closeThemeBuilderModal === "function") closeThemeBuilderModal();
        return "modal-theme-builder";
    }
    if (_isElVis("modal-client-portal")) {
        document.getElementById("modal-client-portal")?.classList.add("hide");
        return "modal-client-portal";
    }
    if (_isElVis("modal-master-user")) {
        document.getElementById("modal-master-user")?.classList.add("hide");
        return "modal-master-user";
    }
    if (_isElVis("modal-create-choice")) {
        document.getElementById("modal-create-choice")?.classList.add("hide");
        return "modal-create-choice";
    }
    if (_isElVis("modal-add-album-choice")) {
        document.getElementById("modal-add-album-choice")?.classList.add("hide");
        return "modal-add-album-choice";
    }
    if (_isElVis("modal-share-sosmed")) {
        if (typeof cancelSocialShareModal === "function") cancelSocialShareModal();
        return "modal-share-sosmed";
    }
    if (_isElVis("modal-notifications")) {
        closeNotificationsFullscreen(true);
        return "modal-notifications";
    }
    if (document.getElementById("drawer-main")?.classList.contains("open")) {
        if (_mrHasVisibleDrawerSub()) {
            handleDrawerBackBtn(true);
            return "drawer-sub";
        }
        toggleSlideMenu(false);
        return "drawer-main";
    }
    if (_isElVis("modal-master-workspace")) {
        if (typeof closeMasterWorkspaceFullscreen === "function") closeMasterWorkspaceFullscreen(true);
        else document.getElementById("modal-master-workspace")?.classList.add("hide");
        return "modal-master-workspace";
    }
    if (_isElVis("guest-invitation-overlay") && _isElVis("gv-close-btn")) {
        if (typeof closeGuestInvitation === "function") closeGuestInvitation();
        return "guest-invitation-overlay";
    }
    return "";
}

function _mrRestoreNavStep(step) {
    if (!step || step.type === "landing") {
        _mrHideStackableOverlaysOnly();
        if (typeof stopPreviewAudio === "function") stopPreviewAudio();
        if (typeof closeFullChatOverlay === "function") closeFullChatOverlay(true);
        goToLanding(true);
        return;
    }

    if (step.type === "solo_stats") {
        _mrHideStackableOverlaysOnly();
        if (typeof window._restoreSoloStatsFromNav === "function") {
            window._restoreSoloStatsFromNav(step);
        } else if (typeof openSoloFollowersModal === "function") {
            if (step.mode === "following") openSoloFollowingModal(step.targetUsername, true);
            else if (step.mode === "project") openSoloProjectModal(step.targetUsername, true);
            else openSoloFollowersModal(step.targetUsername, true);
        }
        return;
    }

    if (step.type === "user_profile") {
        _mrHideStackableOverlaysOnly();
        if (typeof viewUserProfileModal === "function") {
            viewUserProfileModal(step.username, true);
        }
        return;
    }

    if (step.type === "chat_thread" || step.type === "chat_list") {
        _mrHideStackableOverlaysOnly();
        if (typeof window._restoreChatFromNav === "function") {
            window._restoreChatFromNav(step);
        }
        return;
    }

    if (step.type === "workspace") {
        _mrHideStackableOverlaysOnly();
        if (typeof closeFullChatOverlay === "function") closeFullChatOverlay(true);
        if (typeof openMasterWorkspace === "function") openMasterWorkspace(step.name || "overview", true);
        return;
    }

    if (step.type === "view") {
        _mrHideStackableOverlaysOnly();
        if (typeof closeFullChatOverlay === "function") closeFullChatOverlay(true);
        if (typeof stopPreviewAudio === "function") stopPreviewAudio();
        if (step.view === "landing") {
            goToLanding(true);
        } else if (["profile", "master", "cabang", "staff"].includes(step.view)) {
            routeDashboard(true);
        } else if (step.view === "guestlist") {
            hideAllViews();
            currentViewName = "guestlist";
            document.getElementById("view-guestlist")?.classList.remove("hide");
            renderHeaderActions();
        } else {
            routeDashboard(true);
        }
        return;
    }

    _mrHideStackableOverlaysOnly();
    goToLanding(true);
}

function _mrHandleFallbackBackStep() {
    if (_isElVis("solo-profile-stats-modal")) {
        if (typeof closeSoloStatsModal === "function") closeSoloStatsModal();
        return true;
    }
    if (_isElVis("modal-view-user-profile")) {
        if (typeof closeUserProfileModalCustom === "function") closeUserProfileModalCustom();
        else document.getElementById("modal-view-user-profile")?.classList.add("hide");
        return true;
    }
    if (_isElVis("full-chat-overlay")) {
        if (typeof activeMasterChatThread !== "undefined" && activeMasterChatThread) {
            activeMasterChatThread = null;
            if (typeof renderFullChatOverlay === "function") renderFullChatOverlay();
        } else if (typeof closeFullChatOverlay === "function") {
            closeFullChatOverlay(true);
        }
        return true;
    }
    if (["wizard", "portfolio_wizard", "payment", "guestlist"].includes(currentViewName)) {
        if (typeof stopPreviewAudio === "function") stopPreviewAudio();
        routeDashboard(true);
        return true;
    }
    if (["profile", "master", "cabang", "staff"].includes(currentViewName)) {
        goToLanding(true);
        return true;
    }
    return false;
}

window.addEventListener("popstate", (e) => {
    const stateDepth = (e && e.state && typeof e.state.depth === "number")
        ? e.state.depth
        : Math.max(0, _mrHistoryDepth - 1);
    _mrHistoryDepth = Math.max(0, stateDepth);

    if (typeof clientPortalState !== "undefined" && clientPortalState.active) {
        const closedT = _mrCloseTransientOverlayIfAny();
        if (closedT) {
            _mrDropTopTransientToken(closedT);
            return;
        }
        const now = Date.now();
        if (now - lastBackPressTs < 2400) {
            if (_mrHistoryDepth > 0) {
                try { history.go(-(_mrHistoryDepth + 1)); } catch {}
            }
            return;
        }
        lastBackPressTs = now;
        showToast("Tekan kembali sekali lagi untuk keluar.", "info");
        return;
    }

    const closedTransient = _mrCloseTransientOverlayIfAny();
    if (closedTransient) {
        _mrDropTopTransientToken(closedTransient);
        return;
    }

    const stack = window._mrNavStack;
    while (stack.length > 1) {
        const top = stack[stack.length - 1];
        if (top.type === "auto" || top.type === "modal" || top.type === "drawer_sub" || top.type === "avatar_lightbox") {
            stack.pop();
            if (_mrHandleFallbackBackStep()) return;
        } else {
            break;
        }
    }

    if (stack.length > 1) {
        stack.pop();
        const prevStep = stack[stack.length - 1];
        _mrRestoreNavStep(prevStep);
        return;
    }

    if (_mrHandleFallbackBackStep()) {
        return;
    }

    const now = Date.now();
    if (now - lastBackPressTs < 2400) {
        if (_mrHistoryDepth > 0) {
            try { history.go(-(_mrHistoryDepth + 1)); } catch {}
        }
        return;
    }
    lastBackPressTs = now;
    showToast("Tekan kembali sekali lagi untuk keluar aplikasi.", "info");
});

function handleHeaderBrandClick() {
    if (typeof clientPortalState !== "undefined" && clientPortalState.active) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }
    _mrHideStackableOverlaysOnly();
    _mrResetNavToLanding();
    goToLanding(true);
}

function hideAllViews() {
    ["view-landing", "view-gowes", "view-profile", "view-cabang-admin", "view-master-admin", "view-staff-admin", "view-wizard", "view-portfolio-wizard", "view-payment", "view-guestlist"]
        .forEach(id => document.getElementById(id)?.classList.add("hide"));
}

function goToLanding(fromBack = false) {
    currentViewName = "landing";
    document.body.classList.add("in-home");
    hideAllViews();

    const isGowes = currentAppMode === "titik_gowes";
    if (isGowes) {
        document.getElementById("view-gowes")?.classList.remove("hide");
        if (typeof renderGowesLandingPage === "function") renderGowesLandingPage();
    } else {
        document.getElementById("view-landing")?.classList.remove("hide");
        renderLandingPage();
    }

    renderHeaderActions();
    if (typeof updateAppModeUI === "function") updateAppModeUI();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function routeDashboard(fromBack = false) {
    if (typeof clientPortalState !== "undefined" && clientPortalState.active) return;
    if (!currentSessionUser) return goToLanding(fromBack);

    let u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) {
        try {
            const cachedU = JSON.parse(localStorage.getItem(USER_CACHE_KEY) || "null");
            if (cachedU && _normAppUserKey(cachedU.username) === _normAppUserKey(currentSessionUser)) {
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
    if (typeof updateAppModeUI === "function") updateAppModeUI();
    if (!fromBack) mrNavPush({ type: "view", view: currentViewName });
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ================= 4. PENATAAN HEADER (LONCENG DI KIRI FOTO PROFIL) =================
function renderHeaderActions() {
    const box = document.getElementById("header-actions");
    const dotsBtn = document.getElementById("header-dots-btn");
    const notifBtn = document.getElementById("header-notif-btn");
    const footLoginBtn = document.getElementById("footer-login-cta");
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";

    if (typeof clientPortalState !== "undefined" && clientPortalState.active) {
        document.body.classList.add("in-home");
        const mainEl = document.getElementById("header-brand-main");
        const subEl = document.getElementById("header-brand-sub");
        if (mainEl) mainEl.innerText = clientPortalState.brandName || "Mitra Cabang";
        if (subEl) {
            subEl.innerText = "Powered by Lembarku";
            subEl.classList.remove("hide");
        }
        document.getElementById("floating-chat-wrap")?.classList.add("hide");
        if (notifBtn) notifBtn.classList.add("hide");
        if (dotsBtn) {
            dotsBtn.classList.add("hide");
            dotsBtn.style.setProperty("display", "none", "important");
        }
        if (box) box.innerHTML = `<button onclick="cycleAppThemeQuick()" class="w-9 h-9 rounded-full app-card-soft border gold-border app-accent flex items-center justify-center text-xs" title="Ubah Warna Tampilan"><i class="fa-solid fa-palette"></i></button>`;
        return;
    }

    const isProfileMenu = ["profile", "master", "cabang", "staff"].includes(currentViewName);
    document.body.classList.toggle("in-home", !isProfileMenu);

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

    // Lonceng notifikasi diposisikan tepat di sebelah kiri avatar
    if (notifBtn) {
        notifBtn.classList.toggle("hide", !u);
    }

    if (!u) {
        if (box) box.innerHTML = `<button onclick="openAuthModal()" class="gold-pill-btn px-3.5 py-1.5 rounded-xl text-xs">Masuk / Daftar</button>`;
        return;
    }

    const onDashboard = ["profile", "master", "cabang", "staff"].includes(currentViewName);
    if (box) {
        box.innerHTML = onDashboard
            ? ``
            : `<button onclick="routeDashboard()" class="w-9 h-9 rounded-full overflow-hidden border-2 gold-border shadow-sm hover:scale-105 transition bg-zinc-800 shrink-0" title="Buka Profil">
                <img src="${u.avatar || defAv}" alt="Profil" class="w-full h-full object-cover">
               </button>`;
    }

    if (typeof updateChatBadges === "function") updateChatBadges();
    updateNotificationBellBadge();
}

// ================= 5. MESIN NOTIFIKASI LONCENG TERPADU (LEMBARKU & GOWES) =================
function _getNotifReadTs(username) {
    const k = `${typeof NOTIF_READ_TS_KEY !== "undefined" ? NOTIF_READ_TS_KEY : "LBK_NOTIF_LAST_READ_TS"}_${_normAppUserKey(username)}`;
    return Number(localStorage.getItem(k) || 0);
}

function _setNotifReadTs(username, ts) {
    const k = `${typeof NOTIF_READ_TS_KEY !== "undefined" ? NOTIF_READ_TS_KEY : "LBK_NOTIF_LAST_READ_TS"}_${_normAppUserKey(username)}`;
    localStorage.setItem(k, String(ts || Date.now()));
}

function _fmtNotifTime(ts) {
    if (!ts) return "Baru saja";
    const d = new Date(Number(ts));
    if (isNaN(d.getTime())) return "Baru saja";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function buildNotificationsForCurrentUser() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) return [];
    const role = u.role || "user";
    const myKey = _normAppUserKey(u.username);
    const lastRead = _getNotifReadTs(myKey);
    const items = [];

    const isCabDoc = (doc) => {
        if (!doc) return false;
        if (doc.brandName && String(doc.brandName).trim()) return true;
        const ownerObj = (db.users || []).find(x => _normAppUserKey(x.username) === _normAppUserKey(doc.owner));
        return !!(ownerObj && ownerObj.role === "cabang");
    };

    const allInvs = Array.isArray(db.invitations) ? db.invitations : [];
    const allPfs = Array.isArray(db.portfolios) ? db.portfolios : [];
    const allChats = Array.isArray(db.chats) ? db.chats : [];
    const allRentals = Array.isArray(db.gowesRentals) ? db.gowesRentals : [];

    // NOTIFIKASI FOUNDER & TIM ADMINISTRASI
    if (role === "master" || role === "administrasi") {
        const isAdminOnly = role === "administrasi";

        // 1. Pesanan Berkas Lembarku
        const scopedDocs = [
            ...allInvs.map(i => Object.assign({}, i, { _kind: "inv" })),
            ...allPfs.map(p => Object.assign({}, p, { _kind: "pf" }))
        ].filter(d => !isAdminOnly || !isCabDoc(d));

        scopedDocs.forEach(doc => {
            const ts = Number(doc.createdAt || doc.id || 0);
            if (doc.pendingRevision) {
                items.push({
                    id: `rev_${doc._kind}_${doc.id}`,
                    ts,
                    unread: true,
                    priority: true,
                    icon: "fa-solid fa-pen-to-square",
                    accent: "text-amber-500",
                    title: `[Lembarku] Pengajuan Revisi — ${doc.title}`,
                    desc: `@${doc.owner} mengajukan revisi berkas. Ketuk untuk ACC di Project.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openSoloProjectModal==='function'){if(typeof setSoloProjectDomainFilter==='function')setSoloProjectDomainFilter('lembarku');openSoloProjectModal('${esc(myKey)}');}`
                });
            } else if (doc.status === "Menunggu Verifikasi") {
                items.push({
                    id: `ver_${doc._kind}_${doc.id}`,
                    ts,
                    unread: true,
                    priority: true,
                    icon: "fa-solid fa-receipt",
                    accent: "text-emerald-500",
                    title: `[Lembarku] Transaksi Masuk — ${doc.title}`,
                    desc: `@${doc.owner} mengirim bukti pembayaran${doc.totalPay ? ` (${fmtRp(doc.totalPay)})` : ""}. Cek di Project.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openSoloProjectModal==='function'){if(typeof setSoloProjectDomainFilter==='function')setSoloProjectDomainFilter('lembarku');openSoloProjectModal('${esc(myKey)}');}`
                });
            } else if (doc.status === "Menunggu Pembayaran") {
                items.push({
                    id: `ord_${doc._kind}_${doc.id}`,
                    ts,
                    unread: ts > lastRead,
                    icon: "fa-solid fa-bag-shopping",
                    accent: "app-accent",
                    title: `[Lembarku] Pesanan Draf — ${doc.title}`,
                    desc: `@${doc.owner} membuat draf baru (menunggu pembayaran).`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openSoloProjectModal==='function'){if(typeof setSoloProjectDomainFilter==='function')setSoloProjectDomainFilter('lembarku');openSoloProjectModal('${esc(myKey)}');}`
                });
            }
        });

        // 2. Transaksi Sewa Sepeda Titik Gowes
        allRentals.forEach(r => {
            const ts = Number(r.createdAt || 0);
            if (r.status === "Menunggu Verifikasi") {
                items.push({
                    id: `gw_ver_${r.id}`,
                    ts,
                    unread: true,
                    priority: true,
                    icon: "fa-solid fa-bicycle",
                    accent: "text-emerald-500",
                    title: `[Titik Gowes] Pembayaran Sewa Masuk — ${r.bikeName}`,
                    desc: `@${r.customerUsername} mengirim bukti sewa ${r.durationLabel} (${fmtRp(r.totalPrice)}). Ketuk untuk ACC.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openSoloProjectModal==='function'){if(typeof setSoloProjectDomainFilter==='function')setSoloProjectDomainFilter('gowes');openSoloProjectModal('${esc(myKey)}');}`
                });
            } else if (r.status === "Menunggu Pembayaran") {
                items.push({
                    id: `gw_pay_${r.id}`,
                    ts,
                    unread: ts > lastRead,
                    icon: "fa-solid fa-clock",
                    accent: "text-amber-500",
                    title: `[Titik Gowes] Booking Baru — ${r.bikeName}`,
                    desc: `@${r.customerUsername} memesan paket ${r.durationLabel} untuk ${r.startDate} ${r.startTime} WITA.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openSoloProjectModal==='function'){if(typeof setSoloProjectDomainFilter==='function')setSoloProjectDomainFilter('gowes');openSoloProjectModal('${esc(myKey)}');}`
                });
            } else if (r.status === "Sedang Digunakan") {
                items.push({
                    id: `gw_use_${r.id}`,
                    ts: Number(r.startedAt || ts),
                    unread: false,
                    icon: "fa-solid fa-person-biking",
                    accent: "text-blue-500",
                    title: `[Titik Gowes] Sepeda Digunakan — ${r.bikeName}`,
                    desc: `Penyewa: @${r.customerUsername}. Pastikan unit kembali aman di shelter garasi.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openSoloProjectModal==='function'){if(typeof setSoloProjectDomainFilter==='function')setSoloProjectDomainFilter('gowes');openSoloProjectModal('${esc(myKey)}');}`
                });
            }
        });

        // 3. Pendaftar Baru (Khusus Founder)
        if (role === "master") {
            (db.users || []).filter(x => x.role !== "master" && x.status !== "Aktif").forEach(pu => {
                const ts = Number(pu.createdAt || Date.now());
                items.push({
                    id: `reg_${pu.username}`,
                    ts,
                    unread: true,
                    priority: true,
                    icon: "fa-solid fa-user-clock",
                    accent: "text-amber-500",
                    title: `Pendaftar Akun Baru: @${pu.username}`,
                    desc: `${pu.name || pu.username} menunggu persetujuan aktif di Followers Founder.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openSoloFollowersModal==='function')openSoloFollowersModal('${esc(myKey)}');`
                });
            });
        }

        // 4. Pesan Chat Pelanggan Masuk
        const unreadThreadMap = {};
        allChats.forEach(c => {
            if (c.readByMaster || c.role === "master" || c.role === "administrasi") return;
            const key = _normAppUserKey(c.threadUser || c.sender || "");
            if (!key) return;
            if (isAdminOnly) {
                const owner = (db.users || []).find(x => _normAppUserKey(x.username) === key);
                if (owner && (owner.role === "cabang" || owner.role === "master")) return;
            }
            if (!unreadThreadMap[key] || (c.ts || 0) > unreadThreadMap[key].ts) {
                unreadThreadMap[key] = c;
            }
        });
        Object.keys(unreadThreadMap).forEach(tKey => {
            const m = unreadThreadMap[tKey];
            items.push({
                id: `chat_${tKey}_${m.ts || 0}`,
                ts: Number(m.ts || Date.now()),
                unread: true,
                priority: true,
                icon: "fa-solid fa-comments",
                accent: "text-blue-500",
                title: `Pesan Baru dari ${m.senderName || "@" + tKey}`,
                desc: m.text ? m.text.slice(0, 90) : "Mengirim lampiran foto.",
                actionJs: `closeNotificationsFullscreen(true);if(typeof openFullChatOverlay==='function')openFullChatOverlay('${esc(tKey)}');`
            });
        });

    } else if (role === "cabang") {
        // NOTIFIKASI MITRA CABANG
        const quota = Number(u.quota || 0);
        if (quota <= 2) {
            items.push({
                id: `cab_q_${quota}`,
                ts: Date.now(),
                unread: quota === 0,
                icon: "fa-solid fa-coins",
                accent: "text-amber-500",
                title: quota === 0 ? "Kuota Deposit Habis" : `Sisa Kuota Cabang: ${quota}`,
                desc: "Hubungi Founder melalui Live Chat untuk top-up kuota deposit cabang.",
                actionJs: `closeNotificationsFullscreen(true);if(typeof openFullChatOverlay==='function')openFullChatOverlay();`
            });
        }
        allInvs.filter(i => _normAppUserKey(i.owner) === myKey).forEach(inv => {
            (inv.wishes || []).slice(0, 3).forEach(w => {
                const ts = Number(w.id || inv.createdAt || 0);
                items.push({
                    id: `wish_${inv.id}_${w.id}`,
                    ts,
                    unread: ts > lastRead,
                    icon: "fa-solid fa-envelope-open-text",
                    accent: "text-emerald-500",
                    title: `RSVP & Ucapan Baru (${inv.title})`,
                    desc: `${w.name} (${w.rsvp || "Hadir"}): "${String(w.msg || "").slice(0, 70)}"`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openGuestListManager==='function')openGuestListManager(${inv.id});`
                });
            });
        });
        const unreadStaffChats = allChats.filter(c => _normAppUserKey(c.threadUser) === myKey && !c.readByUser && (c.role === "master" || c.role === "administrasi"));
        if (unreadStaffChats.length) {
            const last = unreadStaffChats[unreadStaffChats.length - 1];
            items.push({
                id: `cchat_${last.ts || 0}`,
                ts: Number(last.ts || Date.now()),
                unread: true,
                priority: true,
                icon: "fa-solid fa-headset",
                accent: "text-blue-500",
                title: "Balasan Baru dari Founder",
                desc: last.text ? last.text.slice(0, 85) : "Mengirim lampiran foto.",
                actionJs: `closeNotificationsFullscreen(true);if(typeof openFullChatOverlay==='function')openFullChatOverlay();`
            });
        }

    } else {
        // NOTIFIKASI PENGGUNA BIASA (USER)
        // 1. Dokumen Lembarku
        const myDocs = [
            ...allInvs.filter(i => _normAppUserKey(i.owner) === myKey).map(i => Object.assign({}, i, { _kind: "inv" })),
            ...allPfs.filter(p => _normAppUserKey(p.owner) === myKey).map(p => Object.assign({}, p, { _kind: "pf" }))
        ];
        myDocs.forEach(doc => {
            const ts = Number(doc.createdAt || doc.id || 0);
            if (doc.status === "Menunggu Pembayaran") {
                items.push({
                    id: `upay_${doc._kind}_${doc.id}`,
                    ts,
                    unread: true,
                    icon: "fa-solid fa-qrcode",
                    accent: "text-amber-500",
                    title: `Selesaikan Pembayaran — ${doc.title}`,
                    desc: "Pesanan tersimpan. Ketuk untuk bayar QRIS atau lampirkan bukti.",
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openUnifiedPayment==='function')openUnifiedPayment('${doc._kind === "pf" ? "portfolio" : "inv"}',${doc.id});`
                });
            } else if (doc.status === "Menunggu Verifikasi") {
                items.push({
                    id: `uver_${doc._kind}_${doc.id}`,
                    ts,
                    unread: ts > lastRead,
                    icon: "fa-solid fa-clock",
                    accent: "text-blue-500",
                    title: `Menunggu ACC Admin — ${doc.title}`,
                    desc: doc.pendingRevision ? "Pengajuan revisi Anda sedang diperiksa Admin." : "Bukti pembayaran sudah diterima, sedang dikonfirmasi Admin.",
                    actionJs: `closeNotificationsFullscreen(true);routeDashboard();`
                });
            } else if (doc.status === "Aktif") {
                items.push({
                    id: `uact_${doc._kind}_${doc.id}`,
                    ts,
                    unread: ts > lastRead,
                    icon: "fa-solid fa-circle-check",
                    accent: "text-emerald-500",
                    title: `Berkas Aktif — ${doc.title}`,
                    desc: doc._kind === "pf" ? "CV/Lamaran siap disempurnakan & unduh PDF." : "Undangan siap dibagikan ke daftar tamu Anda.",
                    actionJs: doc._kind === "pf"
                        ? `closeNotificationsFullscreen(true);if(typeof openSempurnakanModal==='function')openSempurnakanModal(${doc.id});`
                        : `closeNotificationsFullscreen(true);if(typeof openGuestListManager==='function')openGuestListManager(${doc.id});`
                });
            }

            if (doc._kind === "inv" && Array.isArray(doc.wishes)) {
                doc.wishes.slice(0, 3).forEach(w => {
                    const wts = Number(w.id || ts);
                    items.push({
                        id: `uwish_${doc.id}_${w.id}`,
                        ts: wts,
                        unread: wts > lastRead,
                        icon: "fa-solid fa-heart",
                        accent: "text-pink-500",
                        title: `Ucapan Baru di ${doc.title}`,
                        desc: `${w.name} (${w.rsvp || "Hadir"}): "${String(w.msg || "").slice(0, 75)}"`,
                        actionJs: `closeNotificationsFullscreen(true);if(typeof openGuestListManager==='function')openGuestListManager(${doc.id});`
                    });
                });
            }
        });

        // 2. Transaksi Sewa Titik Gowes Pelanggan
        const myRentals = allRentals.filter(r => _normAppUserKey(r.customerUsername) === myKey);
        myRentals.forEach(r => {
            const ts = Number(r.createdAt || 0);
            if (r.status === "Menunggu Pembayaran") {
                items.push({
                    id: `gupay_${r.id}`,
                    ts,
                    unread: true,
                    icon: "fa-solid fa-qrcode",
                    accent: "text-emerald-500",
                    title: `Bayar Sewa Sepeda — ${r.bikeName}`,
                    desc: `Paket ${r.durationLabel} (${fmtRp(r.totalPrice)}). Ketuk untuk bayar via QRIS DANA.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openGowesRentalPayment==='function')openGowesRentalPayment('${esc(r.id)}');`
                });
            } else if (r.status === "Menunggu Verifikasi") {
                items.push({
                    id: `guver_${r.id}`,
                    ts,
                    unread: ts > lastRead,
                    icon: "fa-solid fa-clock",
                    accent: "text-amber-500",
                    title: `Verifikasi Sewa — ${r.bikeName}`,
                    desc: "Bukti pembayaran diterima. Admin sedang memverifikasi pesanan Anda.",
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openGowesRentalDetail==='function')openGowesRentalDetail('${esc(r.id)}');`
                });
            } else if (r.status === "Terkonfirmasi") {
                items.push({
                    id: `guconf_${r.id}`,
                    ts: Number(r.confirmedAt || ts),
                    unread: true,
                    priority: true,
                    icon: "fa-solid fa-circle-check",
                    accent: "text-emerald-600",
                    title: `Sewa Dikonfirmasi: Siap Ambil — ${r.bikeName}`,
                    desc: `Jadwal: ${r.startDate} ${r.startTime} WITA di ${r.pickupLocation || "Shelter Utama"}. Tunjukkan KTP asli saat ambil unit.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openGowesRentalDetail==='function')openGowesRentalDetail('${esc(r.id)}');`
                });
            } else if (r.status === "Sedang Digunakan") {
                items.push({
                    id: `guin_${r.id}`,
                    ts: Number(r.startedAt || ts),
                    unread: false,
                    icon: "fa-solid fa-person-biking",
                    accent: "text-blue-500",
                    title: `Gowes Sedang Berlangsung — ${r.bikeName}`,
                    desc: `Paket ${r.durationLabel}. Pastikan kembali tepat waktu di garasi shelter.`,
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openGowesRentalDetail==='function')openGowesRentalDetail('${esc(r.id)}');`
                });
            } else if (r.status === "Selesai") {
                items.push({
                    id: `gudone_${r.id}`,
                    ts: Number(r.completedAt || ts),
                    unread: ts > lastRead,
                    icon: "fa-solid fa-flag-checkered",
                    accent: "text-emerald-500",
                    title: `Rental Selesai — ${r.bikeName}`,
                    desc: "Terima kasih telah menyewa sepeda di Titik Gowes! Jaminan KTP telah dikembalikan.",
                    actionJs: `closeNotificationsFullscreen(true);if(typeof openGowesRentalDetail==='function')openGowesRentalDetail('${esc(r.id)}');`
                });
            }
        });

        // 3. Pesan Chat Admin
        const unreadStaffChats = allChats.filter(c => _normAppUserKey(c.threadUser) === myKey && !c.readByUser && (c.role === "master" || c.role === "administrasi"));
        if (unreadStaffChats.length) {
            const last = unreadStaffChats[unreadStaffChats.length - 1];
            items.push({
                id: `uchat_${last.ts || 0}`,
                ts: Number(last.ts || Date.now()),
                unread: true,
                priority: true,
                icon: "fa-solid fa-headset",
                accent: "text-blue-500",
                title: "Balasan Baru dari Admin",
                desc: last.text ? last.text.slice(0, 85) : "Mengirim lampiran foto.",
                actionJs: `closeNotificationsFullscreen(true);if(typeof openFullChatOverlay==='function')openFullChatOverlay();`
            });
        }
    }

    return items.sort((a, b) => (Number(!!b.priority) - Number(!!a.priority)) || (Number(b.ts || 0) - Number(a.ts || 0)));
}

// ================= 6. INTERAKSI LONCENG NOTIFIKASI =================
function updateNotificationBellBadge() {
    const badge = document.getElementById("header-notif-badge");
    if (!badge) return;
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) {
        badge.classList.add("hide");
        return;
    }
    const notifs = buildNotificationsForCurrentUser();
    const unreadCount = notifs.filter(n => n.unread).length;
    if (unreadCount > 0) {
        badge.innerText = unreadCount > 99 ? "99+" : String(unreadCount);
        badge.classList.remove("hide");
    } else {
        badge.classList.add("hide");
    }
}

function openNotificationsFullscreen() {
    const modal = document.getElementById("modal-notifications");
    if (!modal) return;
    renderNotificationsList();
    modal.classList.remove("hide");
    mrNavPush({ type: "modal", id: "modal-notifications" });
}

function closeNotificationsFullscreen(fromNav = false) {
    const modal = document.getElementById("modal-notifications");
    if (modal) modal.classList.add("hide");
    if (!fromNav) _mrDropTopModalById("modal-notifications");
}

function renderNotificationsList() {
    const box = document.getElementById("notifications-list-body");
    const subTitle = document.getElementById("notif-subtitle");
    if (!box) return;
    const notifs = buildNotificationsForCurrentUser();
    const unreadCnt = notifs.filter(n => n.unread).length;

    if (subTitle) {
        subTitle.innerText = `${notifs.length} total • ${unreadCnt} belum dibaca`;
    }

    if (!notifs.length) {
        box.innerHTML = `
            <div class="app-card border border-dashed rounded-3xl p-8 text-center space-y-2.5">
                <div class="w-12 h-12 rounded-full app-card-soft border gold-border flex items-center justify-center mx-auto text-xl app-muted">
                    <i class="fa-regular fa-bell-slash"></i>
                </div>
                <h4 class="font-extrabold text-sm">Belum Ada Notifikasi</h4>
                <p class="text-xs app-muted">Aktivitas pesanan undangan, berkas CV, maupun sewa sepeda akan muncul di sini.</p>
            </div>
        `;
        return;
    }

    box.innerHTML = notifs.map(n => {
        const unreadDot = n.unread ? `<span class="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>` : "";
        const bgCls = n.unread ? "app-card border-l-4 border-l-amber-500 shadow-sm" : "app-card-soft border opacity-80";
        return `
            <div onclick="${n.actionJs || ''}" class="${bgCls} rounded-2xl p-3.5 space-y-1.5 cursor-pointer hover:brightness-95 active:scale-[0.99] transition">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="w-7 h-7 rounded-lg app-card-soft border gold-border flex items-center justify-center shrink-0 ${n.accent || 'app-accent'} text-xs">
                            <i class="${n.icon || 'fa-solid fa-bell'}"></i>
                        </span>
                        <strong class="text-xs truncate font-extrabold">${escHtml(n.title)}</strong>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        ${unreadDot}
                        <span class="text-[10px] app-muted">${_fmtNotifTime(n.ts)}</span>
                    </div>
                </div>
                <p class="text-[11px] app-muted leading-relaxed pl-9">${escHtml(n.desc)}</p>
            </div>
        `;
    }).join("");
}

function markAllNotificationsRead() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) return;
    _setNotifReadTs(u.username, Date.now());
    updateNotificationBellBadge();
    renderNotificationsList();
    showToast("Semua notifikasi ditandai telah dibaca.");
}

// ================= 7. MENU PENGATURAN FULL-SCREEN (TITIK 3) =================
function toggleSlideMenu(show) {
    const el = document.getElementById("drawer-main");
    if (!el) return;
    if (show) {
        backToMainSlideMenu(true);
        el.classList.add("open");
        mrNavPush({ type: "modal", id: "drawer-main" });
    } else {
        el.classList.remove("open");
        _currentDrawerSub = "";
        _mrDropTopModalById("drawer-main");
    }
}

function handleDrawerBackBtn(fromPopstate = false) {
    if (_currentDrawerSub === "password") {
        openSlideSub("akun", true);
        return;
    }
    backToMainSlideMenu(fromPopstate);
}

function backToMainSlideMenu(silent = false) {
    _currentDrawerSub = "";
    const tEl = document.getElementById("drawer-main-title");
    if (tEl) tEl.innerText = "Pengaturan";
    document.getElementById("drawer-back-btn")?.classList.add("hide");
    document.getElementById("drawer-main-list")?.classList.remove("hide");
    ["drawer-sub-theme", "drawer-sub-privacy", "drawer-sub-about", "drawer-sub-profil", "drawer-sub-akun", "drawer-sub-password", "drawer-sub-qris"]
        .forEach(id => document.getElementById(id)?.classList.add("hide"));
    const sc = document.getElementById("drawer-scroll-body");
    if (sc) sc.scrollTop = 0;

    if (!silent && Array.isArray(window._mrNavStack) && window._mrNavStack.length > 1) {
        const top = window._mrNavStack[window._mrNavStack.length - 1];
        if (top && top.type === "drawer_sub") window._mrNavStack.pop();
    }
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
    const box = document.getElementById("drawer-main-list");
    if (!box) return;
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    let html = "";

    if (!u) {
        html += menuRowItem("fa-right-to-bracket", "Masuk / Daftar Akun", "Buat undangan, CV & rental sepeda", "toggleSlideMenu(false);openAuthModal();");
    } else if (u.role === "master") {
        html += menuRowItem("fa-chart-line", "Grafik & Analitik Bisnis", "Omzet Lembarku, rental sepeda & data PWA", "toggleSlideMenu(false);if(typeof openMasterWorkspace==='function')openMasterWorkspace('overview');");
        html += menuRowItem("fa-bicycle", "Kelola Armada Titik Gowes", "Input unit sepeda, atur tarif sewa & servis", "toggleSlideMenu(false);if(typeof openMasterWorkspace==='function')openMasterWorkspace('gowes_fleet');");
        html += menuRowItem("fa-palette", "Kelola Tema & Harga", "Foto template, nama contoh & harga CV/Lamaran", "toggleSlideMenu(false);if(typeof openMasterWorkspace==='function')openMasterWorkspace('themes');");
        html += menuRowItem("fa-rectangle-ad", "Edit Banner Promosi (12:4.4)", "Atur banner promosi utama beranda", "toggleSlideMenu(false);if(typeof openMasterWorkspace==='function')openMasterWorkspace('home_editor');");
        html += menuRowItem("fa-music", "Stok Musik & Testimoni", "Upload lagu dari perangkat & ulasan beranda", "toggleSlideMenu(false);if(typeof openMasterWorkspace==='function')openMasterWorkspace('media');");
        html += menuRowItem("fa-qrcode", "QRIS DANA & Rekening", "Mode QRIS Tetap / Dinamis & daftar rekening", "openSlideSub('qris')");
        html += menuRowItem("fa-comments", "Live Chat Pelanggan", "Balas pesan, mulai chat baru & pengajuan PIN", "toggleSlideMenu(false);openFullChatOverlay();");
        html += menuRowItem("fa-user-shield", "Privasi & Blokir User", "Atur visibilitas profil, dokumen & akun diblokir", "openSlideSub('privacy')");
        html += menuRowItem("fa-user-pen", "Edit Profil Founder", "Foto profil, sampul & bio", "openSlideSub('profil')");
        html += menuRowItem("fa-shield-halved", "Keamanan Akun & Keluar", "Username, ganti password aman & logout", "openSlideSub('akun')");
    } else if (u.role === "administrasi") {
        html += menuRowItem("fa-comments", "Live Chat Pelanggan", "Balas pesan & hubungi kontak user", "toggleSlideMenu(false);openFullChatOverlay();");
        html += menuRowItem("fa-user-shield", "Privasi & Blokir User", "Atur visibilitas profil, dokumen & akun diblokir", "openSlideSub('privacy')");
        html += menuRowItem("fa-user-pen", "Edit Profil Staf", "Foto profil & informasi kontak", "openSlideSub('profil')");
        html += menuRowItem("fa-shield-halved", "Keamanan Akun & Keluar", "Username, ganti password aman & logout", "openSlideSub('akun')");
    } else if (u.role === "cabang") {
        html += menuRowItem("fa-user-pen", "Profil & Label Brand Cabang", "Foto, sampul, nama brand & kontak", "openSlideSub('profil')");
        html += menuRowItem("fa-shield-halved", "Keamanan Akun & Keluar", "Username, ganti password aman & logout", "openSlideSub('akun')");
        html += menuRowItem("fa-headset", "Live Chat Founder", "Bantuan, top-up kuota & kendala teknis", "toggleSlideMenu(false);openFullChatOverlay();");
    } else {
        html += menuRowItem("fa-user-pen", "Pengaturan Profil", "Foto, sampul, nama & kontak", "openSlideSub('profil')");
        html += menuRowItem("fa-user-shield", "Privasi & Blokir User", "Atur postingan, followers, following & blokir", "openSlideSub('privacy')");
        html += menuRowItem("fa-shield-halved", "Keamanan Akun & Keluar", "Username, ganti password aman & logout", "openSlideSub('akun')");
        html += menuRowItem("fa-headset", "Live Chat Admin", "Bantuan, konfirmasi & upgrade Pro", "toggleSlideMenu(false);openFullChatOverlay();");
    }

    html += menuRowItem("fa-swatchbook", "Tampilan & Warna Aplikasi", "Gaya Pengaturan iOS & nuansa lainnya", "openSlideSub('theme')");
    if (!isAppInstalled()) {
        html += menuRowItem("fa-mobile-screen-button", "Pasang Aplikasi (< 2 MB)", "Akses super cepat dari layar utama HP", "toggleSlideMenu(false);openWelcomeInstallModal(true);");
    }
    html += menuRowItem("fa-circle-info", "Tentang Aplikasi", "Penjelasan fitur Lembarku & Titik Gowes", "openSlideSub('about')");

    box.innerHTML = html;
}

function openSlideSub(sec, skipNavPush = false) {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (sec === "privacy" && (!u || u.role === "cabang")) {
        return showToast("Pengaturan privasi tidak tersedia untuk akun Cabang.", "info");
    }

    _currentDrawerSub = sec;
    document.getElementById("drawer-back-btn")?.classList.remove("hide");
    document.getElementById("drawer-main-list")?.classList.add("hide");
    ["drawer-sub-theme", "drawer-sub-privacy", "drawer-sub-about", "drawer-sub-profil", "drawer-sub-akun", "drawer-sub-password", "drawer-sub-qris"]
        .forEach(id => document.getElementById(id)?.classList.add("hide"));

    const sc = document.getElementById("drawer-scroll-body");
    if (sc) sc.scrollTop = 0;

    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";
    const tKey = typeof APP_THEME_KEY !== "undefined" ? APP_THEME_KEY : "MR_UNDANGAN_APP_THEME";
    const tEl = document.getElementById("drawer-main-title");

    if (sec === "theme") {
        if (tEl) tEl.innerText = "Tampilan & Warna";
        if (typeof applyAppTheme === "function") applyAppTheme(localStorage.getItem(tKey) || "light", false);
        document.getElementById("drawer-sub-theme")?.classList.remove("hide");
    } else if (sec === "privacy" && u) {
        if (tEl) tEl.innerText = "Privasi & Blokir";
        renderPrivacySubPanel();
        document.getElementById("drawer-sub-privacy")?.classList.remove("hide");
    } else if (sec === "about") {
        if (tEl) tEl.innerText = "Tentang Aplikasi";
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
        if (tEl) tEl.innerText = "Keamanan Akun";
        const uInp = document.getElementById("set-acc-user");
        const uNote = document.getElementById("set-acc-user-note");
        const uBtn = document.getElementById("btn-save-acc-user");
        const isFounder = u.role === "master";
        if (uInp) {
            uInp.value = u.username;
            uInp.readOnly = isFounder;
        }
        if (uNote) {
            uNote.innerText = isFounder
                ? "Username Founder (@kausar.af) bersifat permanen untuk keamanan sistem."
                : "Username dipakai untuk masuk akun dan alamat profil Anda.";
        }
        if (uBtn) uBtn.classList.toggle("hide", isFounder);
        document.getElementById("drawer-sub-akun")?.classList.remove("hide");
    } else if (sec === "password" && u) {
        if (tEl) tEl.innerText = "Ganti Kata Sandi";
        ["pw-old", "pw-new", "pw-confirm"].forEach(id => {
            const inp = document.getElementById(id);
            if (inp) { inp.value = ""; inp.type = "password"; }
        });
        evaluatePasswordStrengthUI();
        document.getElementById("drawer-sub-password")?.classList.remove("hide");
    } else if (sec === "qris" && u && u.role === "master") {
        if (tEl) tEl.innerText = "QRIS DANA & Rekening";
        const ms = db.masterSettings || {};
        const mSel = document.getElementById("ms-qris-mode"); if (mSel) mSel.value = ms.qrisMode || "static";
        const dInp = document.getElementById("ms-qris-dyn-str"); if (dInp) dInp.value = ms.qrisDynamicString || "";
        const uChk = document.getElementById("ms-qris-unique"); if (uChk) uChk.checked = ms.qrisUniqueCode !== false;
        const qPrev = document.getElementById("ms-qris-prev"); if (qPrev) qPrev.src = ms.qrisImage || "";
        const pInp = document.getElementById("ms-p"); if (pInp) pInp.value = ms.priceText || "Rp 99.000";
        if (typeof toggleQrisModeFields === "function") toggleQrisModeFields();
        const box = document.getElementById("ms-banks-container");
        if (box && typeof getMasterBanksList === "function" && typeof addMasterBankRow === "function") {
            box.innerHTML = "";
            getMasterBanksList().forEach(b => addMasterBankRow(b.bank, b.no, b.holder));
        }
        document.getElementById("drawer-sub-qris")?.classList.remove("hide");
    }

    if (!skipNavPush) mrNavPush({ type: "drawer_sub", sec });
}

function renderPrivacySubPanel() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u || u.role === "cabang") return;
    const priv = typeof getUserPrivacy === "function" ? getUserPrivacy(u) : DEFAULT_PRIVACY;

    const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    setChk("priv-show-projects", priv.showProjects);
    setChk("priv-show-followers", priv.showFollowers);
    setChk("priv-show-following", priv.showFollowing);
    setChk("priv-show-contact", priv.showContact);
    setChk("priv-show-chat-contacts", priv.showInChatContacts);
    setChk("priv-allow-direct-chat", priv.allowDirectChat);

    const blocked = typeof getBlockedUsersList === "function" ? getBlockedUsersList(u) : [];
    const cntEl = document.getElementById("priv-blocked-count");
    if (cntEl) cntEl.innerText = String(blocked.length);
    const listEl = document.getElementById("priv-blocked-list");
    if (!listEl) return;

    if (!blocked.length) {
        listEl.innerHTML = `<p class="text-xs app-muted text-center py-4 app-card-soft rounded-2xl border border-dashed">Tidak ada akun yang diblokir.</p>`;
        return;
    }

    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";
    listEl.innerHTML = blocked.map(bUname => {
        const bObj = (db.users || []).find(x => _normAppUserKey(x.username) === _normAppUserKey(bUname)) || { username: bUname, name: bUname, avatar: defAv };
        return `
            <div class="app-card-soft border rounded-2xl p-2.5 flex items-center justify-between gap-2.5">
                <div class="flex items-center gap-2.5 min-w-0">
                    <img src="${bObj.avatar || defAv}" class="w-9 h-9 rounded-full object-cover border gold-border bg-zinc-800 shrink-0">
                    <div class="min-w-0">
                        <strong class="text-xs block truncate">${escHtml(bObj.name || bUname)}</strong>
                        <span class="text-[10px] app-muted block truncate">@${escHtml(bUname)}</span>
                    </div>
                </div>
                <button type="button" onclick="toggleBlockTargetUser('${esc(bUname)}',true)" class="px-3 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-[11px] font-bold shrink-0">Buka Blokir</button>
            </div>
        `;
    }).join("");
}

async function savePrivacySettings() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u || u.role === "cabang") return;

    const privacy = {
        showProjects: !!document.getElementById("priv-show-projects")?.checked,
        showFollowers: !!document.getElementById("priv-show-followers")?.checked,
        showFollowing: !!document.getElementById("priv-show-following")?.checked,
        showContact: !!document.getElementById("priv-show-contact")?.checked,
        showInChatContacts: !!document.getElementById("priv-show-chat-contacts")?.checked,
        allowDirectChat: !!document.getElementById("priv-allow-direct-chat")?.checked
    };

    setBtnLoading("btn-save-privacy", true, "Menyimpan...");
    const res = await apiAction({ action: "update_privacy", privacy });
    setBtnLoading("btn-save-privacy", false);

    if (res && res.ok) {
        ensureUserInLocalDb(Object.assign({}, u, res.user || {}, { privacy }));
        showToast("Pengaturan privasi berhasil disimpan!");
    } else {
        showToast((res && res.message) || "Gagal menyimpan privasi.", "error");
    }
}

function evaluatePasswordStrengthUI() {
    const pNew = (document.getElementById("pw-new")?.value || "").trim();
    const pConf = (document.getElementById("pw-confirm")?.value || "").trim();
    const bar = document.getElementById("pw-strength-bar");
    const txt = document.getElementById("pw-strength-text");
    const matchEl = document.getElementById("pw-match-hint");

    let score = 0;
    if (pNew.length >= 6) score++;
    if (pNew.length >= 10) score++;
    if (/[A-Z]/.test(pNew) && /[a-z]/.test(pNew)) score++;
    if (/[0-9]/.test(pNew)) score++;
    if (/[^A-Za-z0-9]/.test(pNew)) score++;

    if (bar && txt) {
        if (!pNew) {
            bar.style.width = "0%";
            bar.className = "h-full transition-all duration-300 bg-zinc-400";
            txt.innerText = "Gunakan minimal 6 karakter kombinasi huruf & angka.";
        } else if (pNew.length < 6 || score <= 1) {
            bar.style.width = "30%";
            bar.className = "h-full transition-all duration-300 bg-red-500";
            txt.innerText = "Kekuatan: Lemah (minimal 6 karakter).";
        } else if (score <= 3) {
            bar.style.width = "65%";
            bar.className = "h-full transition-all duration-300 bg-amber-500";
            txt.innerText = "Kekuatan: Cukup kuat.";
        } else {
            bar.style.width = "100%";
            bar.className = "h-full transition-all duration-300 bg-emerald-500";
            txt.innerText = "Kekuatan: Sangat kuat.";
        }
    }

    if (matchEl) {
        if (!pConf) {
            matchEl.classList.add("hide");
        } else if (pNew === pConf) {
            matchEl.className = "text-[10px] text-emerald-600 font-semibold";
            matchEl.innerText = "✓ Konfirmasi password baru cocok.";
        } else {
            matchEl.className = "text-[10px] text-red-500 font-semibold";
            matchEl.innerText = "✕ Ulangi password baru belum sama.";
        }
    }
}

async function submitSecurePasswordChange(e) {
    e.preventDefault();
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) return showToast("Sesi login tidak ditemukan.", "error");

    const oldPassword = (document.getElementById("pw-old")?.value || "").trim();
    const newPassword = (document.getElementById("pw-new")?.value || "").trim();
    const confirmPassword = (document.getElementById("pw-confirm")?.value || "").trim();

    if (!oldPassword || !newPassword || !confirmPassword) {
        return showToast("Semua kolom kata sandi wajib diisi.", "error");
    }
    if (newPassword.length < 6) {
        return showToast("Password baru minimal 6 karakter.", "error");
    }
    if (newPassword !== confirmPassword) {
        return showToast("Konfirmasi password baru tidak cocok.", "error");
    }
    if (oldPassword === newPassword) {
        return showToast("Password baru tidak boleh sama dengan password lama.", "error");
    }

    const confirmed = await showConfirm(
        "Peringatan Ganti Password",
        "Pastikan Anda sudah mencatat kata sandi baru dengan aman sebelum melanjutkan. Konfirmasi penggantian sekarang?",
        "fa-solid fa-triangle-exclamation",
        "Konfirmasi & Ganti"
    );
    if (!confirmed) return;

    setBtnLoading("btn-submit-change-pw", true, "Memverifikasi...");
    const res = await apiAction({ action: "change_password", oldPassword, newPassword });
    setBtnLoading("btn-submit-change-pw", false);

    if (!res || !res.ok) {
        return showToast((res && res.message) || "Gagal mengganti kata sandi.", "error");
    }

    if (res.token) {
        currentSessionToken = res.token;
        localStorage.setItem(SESSION_TOKEN_KEY, res.token);
    }
    if (res.user) ensureUserInLocalDb(res.user);

    ["pw-old", "pw-new", "pw-confirm"].forEach(id => {
        const inp = document.getElementById(id);
        if (inp) inp.value = "";
    });
    evaluatePasswordStrengthUI();
    openSlideSub("akun", true);
    showToast("Kata sandi berhasil diganti dengan aman!");
}

async function changeUsernameOnly() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) return;
    if (u.role === "master") return showToast("Username Founder (@kausar.af) bersifat permanen.", "info");
    const oldU = _normAppUserKey(u.username);
    const newU = _normAppUserKey(document.getElementById("set-acc-user").value.trim().toLowerCase());
    if (!newU) return showToast("Isi username baru terlebih dahulu.", "error");
    if (newU === oldU) return showToast("Username tidak berubah.", "info");
    if (!(await showConfirm("Ubah Username", `Yakin ingin mengganti username dari @${oldU} menjadi @${newU}?`, "fa-solid fa-user-pen", "Ya, Simpan"))) return;

    setBtnLoading("btn-save-acc-user", true, "Menyimpan...");
    const updated = Object.assign({}, u, { username: newU });
    delete updated.password;
    const res = await apiAction({ action: "upsert_user", oldUsername: oldU, user: updated });
    setBtnLoading("btn-save-acc-user", false);
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal memperbarui username.", "error");

    const finalUser = (res.user && res.user.username)
        ? Object.assign({}, updated, res.user, { username: _normAppUserKey(res.user.username) })
        : updated;

    currentSessionUser = finalUser.username;
    localStorage.setItem(SESSION_KEY, currentSessionUser);
    if (res.token) {
        currentSessionToken = res.token;
        localStorage.setItem(SESSION_TOKEN_KEY, res.token);
    }
    if (Array.isArray(db.users) && oldU && oldU !== currentSessionUser) {
        db.users = db.users.filter(x => _normAppUserKey(x.username) !== oldU);
    }
    ensureUserInLocalDb(finalUser);
    if (typeof idbSet === "function") idbSet("db_snapshot", db);
    refreshActiveViewSmart();
    renderHeaderActions();
    showToast("Username berhasil diperbarui!");
}

function pickCroppedProfileMedia(inp, type) {
    const file = inp.files[0];
    if (!file) return;
    inp.value = "";
    const isBanner = type === "banner";
    if (typeof openImageCropper !== "function") return;
    openImageCropper(file, isBanner ? 16 / 6 : 1, isBanner ? "Atur Sampul Profil (16:6)" : "Atur Foto Profil (1:1)", isBanner ? 1000 : 380, isBanner ? 375 : 380, async (dataUrl) => {
        const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
        if (!u) return;
        showLoading("Menyimpan foto...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: `${type}_${u.username}` });
        if (!up || !up.ok || !up.url) {
            hideLoading();
            return showToast("Gagal mengunggah foto.", "error");
        }
        const upd = Object.assign({}, u);
        upd[type] = up.url;
        const res = await apiAction({ action: "upsert_user", oldUsername: u.username, user: upd });
        hideLoading();
        if (res && res.ok) {
            ensureUserInLocalDb(upd);
            if (!isBanner) {
                const prev = document.getElementById("set-prof-avatar-prev");
                if (prev) prev.src = up.url;
            }
            refreshActiveViewSmart();
            renderHeaderActions();
            showToast(isBanner ? "Sampul profil diperbarui!" : "Foto profil diperbarui!");
        }
    });
}

async function removeProfileMedia(type) {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) return;
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";
    if (!u[type]) return showToast("Foto sudah kosong.", "info");
    if (!(await showConfirm("Hapus Foto", `Hapus ${type === "avatar" ? "foto profil" : "sampul profil"} ini?`, "fa-solid fa-trash", "Ya, Hapus"))) return;

    showLoading("Menghapus...");
    const upd = Object.assign({}, u);
    upd[type] = "";
    const res = await apiAction({ action: "upsert_user", oldUsername: u.username, user: upd });
    hideLoading();
    if (res && res.ok) {
        ensureUserInLocalDb(upd);
        if (type === "avatar") {
            const prev = document.getElementById("set-prof-avatar-prev");
            if (prev) prev.src = defAv;
        }
        refreshActiveViewSmart();
        renderHeaderActions();
        showToast("Foto dihapus.", "info");
    }
}

async function saveProfileInfo() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) return;
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
        toggleSlideMenu(false);
        refreshActiveViewSmart();
        renderHeaderActions();
        showToast("Profil berhasil disimpan!");
    } else showToast("Gagal menyimpan profil.", "error");
}

// ================= 8. BERANDA LEMBARKU (BANNER + ETALASE SAMBUNG) =================
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
        title: "Undangan Digital, CV & Lamaran Siap PDF",
        subtitle: "Pilih desain, isi data, dan bagikan tautan undangan atau unduh PDF langsung dari HP.",
        ctaText: "Mulai Buat",
        img: "./lembarku-logo.png",
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
            <img src="${s.img || "./lembarku-logo.png"}" class="absolute inset-0 w-full h-full object-cover opacity-75">
            <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/50 to-black/20"></div>
            <div class="relative z-10 max-w-xl space-y-1 sm:space-y-2 text-white">
                <span class="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold text-[9px] uppercase tracking-wider">${escHtml(s.badge || "PROMO")}</span>
                <h2 class="text-sm sm:text-2xl md:text-3xl font-extrabold leading-tight drop-shadow">${escHtml(s.title || "Lembarku")}</h2>
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
    if (s.targetType === "gowes") {
        if (typeof switchAppMode === "function") switchAppMode("titik_gowes");
    } else if (s.targetType === "login") {
        if (currentSessionUser) routeDashboard(); else openAuthModal();
    } else if (s.targetType === "chat" && typeof openFullChatOverlay === "function") {
        openFullChatOverlay();
    } else {
        document.getElementById(s.targetSection || "sec-undangan")?.scrollIntoView({ behavior: "smooth" });
    }
}

function renderInvCategoryPills() {
    if (typeof THEME_CATALOG === "undefined") return;
    const cats = Object.keys(THEME_CATALOG);
    const box = document.getElementById("landing-inv-cat-tabs");
    if (!box) return;
    box.innerHTML = cats.map(c =>
        `<button type="button" onclick="scrollInvShelfToCat('${esc(c)}')" class="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${activeInvShelfCat === c ? "gold-pill-btn shadow" : "app-card border app-muted"}">${escHtml(c)}</button>`
    ).join("");
}

function renderInfiniteInvShelf() {
    const shelf = document.getElementById("landing-inv-shelf");
    if (!shelf) return;
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
    const shelf = document.getElementById("landing-inv-shelf");
    if (!shelf) return;
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
    const box = document.getElementById("landing-pf-cat-tabs");
    if (!box) return;
    box.innerHTML = [
        { key: "cv", lbl: "Curriculum Vitae (9)" },
        { key: "lamaran", lbl: "Lamaran Kerja (3)" }
    ].map(c => `<button type="button" onclick="scrollPfShelfToCat('${c.key}')" class="px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition ${activePfShelfCat === c.key ? "gold-pill-btn shadow" : "app-card border app-muted"}">${c.lbl}</button>`).join("");
}

function renderPortfolioShelf() {
    const shelf = document.getElementById("landing-pf-shelf");
    if (!shelf) return;
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
                    if (c && c !== activePfShelfCat) {
                        activePfShelfCat = c;
                        renderPfCategoryPills();
                    }
                    break;
                }
            }
        }, { passive: true });
    }
}

function scrollPfShelfToCat(cat) {
    activePfShelfCat = cat;
    renderPfCategoryPills();
    const shelf = document.getElementById("landing-pf-shelf");
    if (!shelf) return;
    const target = shelf.querySelector(`[data-pf-cat="${cat}"]`);
    if (target) {
        pfShelfLock = true;
        shelf.scrollTo({ left: Math.max(0, target.offsetLeft - 6), behavior: "smooth" });
        setTimeout(() => { pfShelfLock = false; }, 500);
    }
}

function renderCertificateShowcaseShelf() {
    const shelf = document.getElementById("landing-cert-shelf");
    if (!shelf) return;
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
            <div onclick="showToast('Fitur Sertifikat & Piagam Otomatis segera hadir!','info')" class="${sizeCls} rounded-2xl overflow-hidden border border-black/15 shadow-md cursor-pointer select-none relative flex flex-col justify-between p-4 text-zinc-900 shrink-0" style="background:${c.bg};">
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
    const list = db.testimonials || [];
    const tr = document.getElementById("testimonial-track");
    const dt = document.getElementById("testimonial-dots");
    if (!tr) return;
    if (!list.length) {
        tr.innerHTML = `<div class="min-w-full text-center text-xs app-muted py-5">Belum ada ulasan pelanggan.</div>`;
        if (dt) dt.innerHTML = "";
        return;
    }
    if (testiIdx >= list.length) testiIdx = 0;
    tr.innerHTML = list.map(t => `
        <div class="min-w-full px-1">
            <div class="app-card-soft border rounded-2xl p-4 space-y-2 text-center max-w-2xl mx-auto">
                <div class="text-amber-500 text-xs">${'<i class="fa-solid fa-star mx-0.5"></i>'.repeat(t.rating || 5)}</div>
                <p class="text-xs italic">"${escHtml(t.text)}"</p>
                <div>
                    <h4 class="font-bold text-xs">${escHtml(t.name)}</h4>
                    <span class="text-[10px] app-accent uppercase font-semibold">${escHtml(t.category)}</span>
                </div>
            </div>
        </div>
    `).join("");
    if (dt) {
        dt.innerHTML = list.map((_, i) => `<button onclick="testiIdx=${i};renderTestimonials()" class="h-1.5 rounded-full transition-all ${i===testiIdx?"w-6 bg-blue-600":"w-2 bg-zinc-500/40"}"></button>`).join("");
    }
    tr.style.transform = `translateX(-${testiIdx * 100}%)`;
}

function slideTestimonial(d) {
    const n = (db.testimonials || []).length;
    if (!n) return;
    testiIdx = (testiIdx + d + n) % n;
    renderTestimonials();
}

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

// ================= 9. BUAT BERKASMU & PROFIL USER / CABANG =================
function openCreateChoiceModal(isCabang = false) {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) {
        showToast("Masuk atau daftar akun dulu untuk membuat berkasmu!", "info");
        return openAuthModal();
    }
    createChoiceIsCabang = isCabang || (u.role === "cabang");
    document.getElementById("modal-create-choice")?.classList.remove("hide");
    mrNavPush({ type: "modal", id: "modal-create-choice" });
}

function chooseCreateDoc(kind) {
    document.getElementById("modal-create-choice")?.classList.add("hide");
    _mrDropTopModalById("modal-create-choice");
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
    const uname = _normAppUserKey(username);
    const invs = (db.invitations || []).filter(i => _normAppUserKey(i.owner) === uname).map(i => Object.assign({}, i, { _kind: "inv" }));
    const pfs = (db.portfolios || []).filter(p => _normAppUserKey(p.owner) === uname).map(p => Object.assign({}, p, { _kind: "pf" }));
    return [...invs, ...pfs].sort((a, b) => Number(b.createdAt || b.id || 0) - Number(a.createdAt || a.id || 0));
}

function renderProfileFavoritesShelf() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) return;
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

    ["user-favs-shelf", "cabang-favs-shelf"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    });
    ["prof-fav-count", "cabang-fav-count"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = favs.length;
    });
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

function _mountProfileIgStats(sectionId, mountId, userObj) {
    const sec = document.getElementById(sectionId);
    if (!sec || !userObj) return;
    let mount = document.getElementById(mountId);
    if (!mount) {
        mount = document.createElement("div");
        mount.id = mountId;
        const firstCard = sec.querySelector(".app-card");
        if (firstCard && firstCard.nextSibling) sec.insertBefore(mount, firstCard.nextSibling);
        else sec.prepend(mount);
    }
    mount.innerHTML = _buildIgStatsRowHtml(userObj);
}

function _buildIgStatsRowHtml(userObj) {
    if (!userObj) return "";
    const isMaster = userObj.role === "master";
    const isCabang = userObj.role === "cabang";

    let fCount = 0;
    if (isMaster) {
        fCount = typeof _formatMasterFollowersNum === "function" ? _formatMasterFollowersNum() : 18300;
    } else if (typeof _getFollowersListForUser === "function") {
        fCount = typeof _formatInstagramMetric === "function" ? _formatInstagramMetric(_getFollowersListForUser(userObj).length) : 0;
    } else {
        fCount = Array.isArray(userObj.followers) ? userObj.followers.length : 0;
    }

    const gCount = (typeof _getFollowingListForUser === "function")
        ? (typeof _formatInstagramMetric === "function" ? _formatInstagramMetric(_getFollowingListForUser(userObj).length) : 0)
        : (Array.isArray(userObj.following) ? userObj.following.length : 0);

    const allInvs = (db.invitations || []).filter(i => _normAppUserKey(i.owner) === _normAppUserKey(userObj.username));
    const allPfs = (db.portfolios || []).filter(p => _normAppUserKey(p.owner) === _normAppUserKey(userObj.username));
    const allRentals = (db.gowesRentals || []).filter(r => _normAppUserKey(r.customerUsername) === _normAppUserKey(userObj.username));
    const pCount = typeof _formatInstagramMetric === "function"
        ? _formatInstagramMetric(allInvs.length + allPfs.length + allRentals.length)
        : (allInvs.length + allPfs.length + allRentals.length);

    if (isCabang) {
        return `
            <div class="app-card border rounded-3xl p-3 shadow-sm my-2">
                <div class="grid grid-cols-1 text-center">
                    <button type="button" onclick="openSoloProjectModal('${esc(userObj.username)}')" class="py-1.5 px-2 rounded-2xl hover:bg-black/5 active:scale-98 transition">
                        <span class="block text-base font-extrabold tracking-tight">${escHtml(String(pCount))}</span>
                        <span class="block text-[11px] app-muted font-medium">Project Klien</span>
                    </button>
                </div>
            </div>
        `;
    }

    return `
        <div class="app-card border rounded-3xl p-3 shadow-sm my-2">
            <div class="grid grid-cols-3 divide-x divide-black/10 text-center">
                <button type="button" onclick="openSoloFollowersModal('${esc(userObj.username)}')" class="py-1.5 px-1 rounded-2xl hover:bg-black/5 active:scale-98 transition">
                    <span class="block text-base font-extrabold tracking-tight">${escHtml(String(fCount))}</span>
                    <span class="block text-[11px] app-muted font-medium">Followers</span>
                </button>
                <button type="button" onclick="openSoloFollowingModal('${esc(userObj.username)}')" class="py-1.5 px-1 rounded-2xl hover:bg-black/5 active:scale-98 transition">
                    <span class="block text-base font-extrabold tracking-tight">${escHtml(String(gCount))}</span>
                    <span class="block text-[11px] app-muted font-medium">Following</span>
                </button>
                <button type="button" onclick="openSoloProjectModal('${esc(userObj.username)}')" class="py-1.5 px-1 rounded-2xl hover:bg-black/5 active:scale-98 transition">
                    <span class="block text-base font-extrabold tracking-tight">${escHtml(String(pCount))}</span>
                    <span class="block text-[11px] app-muted font-medium">Project</span>
                </button>
            </div>
        </div>
    `;
}

function renderUserProfile() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!u) return;
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";
    const bEl = document.getElementById("prof-banner"); if (bEl) bEl.style.backgroundImage = u.banner ? `url('${u.banner}')` : "";
    const aEl = document.getElementById("prof-avatar");
    if (aEl) {
        aEl.src = u.avatar || defAv;
        aEl.onclick = () => { if (typeof openExpandedAvatarLightbox === "function") openExpandedAvatarLightbox(u.avatar || defAv, u.name || u.username); };
        aEl.classList.add("cursor-pointer", "active:scale-95", "transition");
    }
    const caEl = document.getElementById("prof-composer-avatar"); if (caEl) caEl.src = u.avatar || defAv;
    const nEl = document.getElementById("prof-name"); if (nEl) nEl.innerText = u.name;
    document.getElementById("prof-pro-badge")?.classList.toggle("hide", !u.isPro);
    const uEl = document.getElementById("prof-username"); if (uEl) uEl.innerText = `@${u.username}`;
    const bioEl = document.getElementById("prof-bio"); if (bioEl) bioEl.innerText = u.bio || "";
    const cEl = document.getElementById("prof-contact"); if (cEl) cEl.innerHTML = `${u.phone ? `<span><i class="fa-solid fa-phone app-accent mr-1"></i>${escHtml(u.phone)}</span>` : ""}${u.address ? `<span><i class="fa-solid fa-location-dot app-accent mr-1"></i>${escHtml(u.address)}</span>` : ""}`;

    _mountProfileIgStats("view-profile", "prof-ig-stats-mount", u);

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
    const cab = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    if (!cab) return;
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";
    const bEl = document.getElementById("cprof-banner"); if (bEl) bEl.style.backgroundImage = cab.banner ? `url('${cab.banner}')` : "";
    const aEl = document.getElementById("cprof-avatar");
    if (aEl) {
        aEl.src = cab.avatar || defAv;
        aEl.onclick = () => { if (typeof openExpandedAvatarLightbox === "function") openExpandedAvatarLightbox(cab.avatar || defAv, cab.name || cab.username); };
        aEl.classList.add("cursor-pointer", "active:scale-95", "transition");
    }
    const caEl = document.getElementById("cabang-composer-avatar"); if (caEl) caEl.src = cab.avatar || defAv;
    const nEl = document.getElementById("cabang-title-name"); if (nEl) nEl.innerText = cab.name;
    document.getElementById("cabang-pro-badge")?.classList.toggle("hide", !cab.isPro);
    const uEl = document.getElementById("cabang-username"); if (uEl) uEl.innerText = `@${cab.username}`;
    const qEl = document.getElementById("cabang-quota-badge"); if (qEl) qEl.innerText = cab.quota || 0;
    const brandLbl = (cab.brandName && cab.brandName.trim()) ? cab.brandName.trim() : cab.name;
    const brEl = document.getElementById("cabang-brand-badge"); if (brEl) brEl.innerHTML = `<i class="fa-solid fa-tag app-accent mr-1"></i>Label: <strong>${escHtml(brandLbl)}</strong> • Powered by Lembarku`;

    _mountProfileIgStats("view-cabang-admin", "cabang-ig-stats-mount", cab);

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

// ================= 10. SMART REFRESH & BOOT INITIALIZATION =================
function isUserTypingIn(id) {
    const el = document.activeElement;
    if (!el || !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return false;
    const wrap = document.getElementById(id);
    return wrap ? wrap.contains(el) : false;
}

function refreshActiveViewSmart() {
    if (typeof updateChatBadges === "function") updateChatBadges();
    updateNotificationBellBadge();
    if (_isElVis("modal-notifications")) renderNotificationsList();

    const chatOv = document.getElementById("full-chat-overlay");
    if (chatOv && !chatOv.classList.contains("hide") && typeof renderFullChatContentSmart === "function") renderFullChatContentSmart();

    if (currentViewName === "landing") {
        if (currentAppMode === "titik_gowes") {
            if (typeof renderGowesLandingPage === "function" && !isUserTypingIn("view-gowes")) renderGowesLandingPage();
        } else {
            if (!isUserTypingIn("view-landing")) renderLandingPage();
        }
    } else if (currentViewName === "profile") {
        renderUserProfile();
    } else if (currentViewName === "cabang") {
        renderCabangAdmin();
    } else if (currentViewName === "staff" && typeof renderStaffAdmin === "function") {
        renderStaffAdmin();
    } else if (currentViewName === "guestlist" && !isUserTypingIn("view-guestlist") && typeof renderGuestListStatsAndRows === "function") {
        renderGuestListStatsAndRows();
    } else if (currentViewName === "master" && typeof renderMasterHeaderStats === "function") {
        renderMasterHeaderStats();
    }

    if (_isElVis("modal-master-workspace") && currentMasterWorkspace !== "home_editor" && currentMasterWorkspace !== "media" && !isUserTypingIn("master-workspace-body") && typeof renderMasterWorkspaceContent === "function") {
        renderMasterWorkspaceContent();
    }
    if (window._soloStatsViewState && window._soloStatsViewState.open && typeof renderSoloStatsModal === "function") {
        renderSoloStatsModal();
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
        if (isStandaloneRunning()) {
            localStorage.setItem("MR_PWA_INSTALLED", "true");
            if (typeof reportAppInstallState === "function") reportAppInstallState("installed");
        }

        const tKey = typeof APP_THEME_KEY !== "undefined" ? APP_THEME_KEY : "MR_UNDANGAN_APP_THEME";
        if (typeof applyAppTheme === "function") applyAppTheme(localStorage.getItem(tKey) || "light", false);

        initBackNavigationGuard();
        if (typeof updateAppModeUI === "function") updateAppModeUI();

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
                if (savedU && _normAppUserKey(savedU.username) === _normAppUserKey(currentSessionUser)) {
                    ensureUserInLocalDb(savedU);
                }
            } catch {}

            const uCached = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
            if (uCached) {
                const nmEl = document.getElementById("ios-hello-name");
                if (nmEl && uCached.name) nmEl.innerText = uCached.name.split(" ")[0];
            }
            _mrResetNavToLanding();
            goToLanding(true);
            finishSplash(1150);

            if (typeof fetchFullCloud === "function") {
                fetchFullCloud().then((synced) => {
                    if (!synced) return;
                    const uNow = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
                    if (uNow) {
                        ensureUserInLocalDb(uNow);
                        renderHeaderActions();
                        refreshActiveViewSmart();
                    }
                    if (typeof updateChatBadges === "function") updateChatBadges();
                });
            }
        } else {
            const pubCached = typeof idbGet === "function" ? await idbGet("public_snapshot") : null;
            if (pubCached && typeof applyPublicDb === "function") applyPublicDb(pubCached);
            _mrResetNavToLanding();
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
        updateNotificationBellBadge();
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
