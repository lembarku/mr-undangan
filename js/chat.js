// =========================================================================
// MR UNDANGAN — LIVE CHAT, KONTAK BARU (+), NOTIFIKASI & HAPUS HISTORY (js/chat.js)
// =========================================================================
const QUICK_REPLIES_STAFF = [
    "Halo Kak, ada yang bisa kami bantu?",
    "Pesanan Kakak sudah aktif ya! Silakan dicek di profil.",
    "Silakan lampirkan bukti transfer atau screenshot pesanan ya Kak.",
    "Revisi berkas sudah kami setujui & aktif kembali ya Kak!"
];

let tempChatAttachment = "";
let _lastKnownChatCount = -1;
let _waChatPopListenerAttached = false;

function isStaffUserObj(u) {
    return !!(u && (u.role === "master" || u.role === "administrasi"));
}

function playSoftChatNotification() {
    try {
        if (navigator.vibrate) navigator.vibrate([70, 40, 70]);
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(740, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.23);
    } catch {}
}

function getChatThreads() {
    const curU = getCurrentUserObj();
    const isAdministrasiOnly = curU && curU.role === "administrasi";
    const map = {};
    (db.chats || []).forEach(c => {
        const key = String(c.threadUser || c.sender || "tamu").toLowerCase();
        const u = (db.users || []).find(x => String(x.username || "").toLowerCase() === key);
        const role = (u && u.role) || (key.startsWith("tamu_") ? "tamu" : "user");
        if (isAdministrasiOnly && (role === "cabang" || role === "master")) return;

        if (!map[key]) {
            map[key] = {
                threadUser: key,
                displayName: (u && u.name) || c.senderName || key,
                avatar: (u && u.avatar) || DEFAULT_AVATAR,
                role,
                isPro: !!(u && u.isPro),
                messages: [],
                unread: 0,
                lastTs: 0
            };
        }
        map[key].messages.push(c);
        const isFromStaff = c.role === "master" || c.role === "administrasi";
        if (!c.readByMaster && !isFromStaff) map[key].unread++;
        if ((c.ts || 0) >= map[key].lastTs) map[key].lastTs = c.ts || 0;
    });
    return Object.values(map).sort((a, b) => b.lastTs - a.lastTs);
}

function getAccessibleChatContacts() {
    const curU = getCurrentUserObj();
    if (!curU) return [];
    const all = (db.users || []).filter(u => String(u.username || "").toLowerCase() !== String(curU.username || "").toLowerCase());
    if (curU.role === "master") {
        return all;
    }
    if (curU.role === "administrasi") {
        return all.filter(u => u.role === "user");
    }
    return [];
}

function openChatContactsModal() {
    const curU = getCurrentUserObj();
    if (!isStaffUserObj(curU)) return;
    const sub = document.getElementById("cc-access-sub");
    if (sub) {
        sub.innerText = curU.role === "master"
            ? "Akses Master: Semua User, Akun Pro, Cabang & Tim Administrasi"
            : "Akses Tim Administrasi: Daftar Kontak User Terdaftar";
    }
    const inp = document.getElementById("cc-search-inp");
    if (inp) inp.value = "";
    renderChatContactsModalList();
    document.getElementById("modal-chat-contacts").classList.remove("hide");
    _pushWaHistoryState();
}

function renderChatContactsModalList() {
    const box = document.getElementById("cc-contacts-list"); if (!box) return;
    const q = (document.getElementById("cc-search-inp")?.value || "").trim().toLowerCase();
    const contacts = getAccessibleChatContacts().filter(u =>
        !q ||
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.username || "").toLowerCase().includes(q)
    );

    if (!contacts.length) {
        box.innerHTML = `<p class="p-8 text-center text-xs app-muted">Tidak ada kontak yang sesuai.</p>`;
        return;
    }

    box.innerHTML = contacts.map(u => {
        const roleTag = u.role === "cabang"
            ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 font-bold">CABANG</span>`
            : u.role === "administrasi"
                ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 font-bold">ADMINISTRASI</span>`
                : `<span class="text-[9px] px-1.5 py-0.5 rounded app-btn-sec font-bold">USER</span>`;
        return `
            <div onclick="startDirectChatWithContact('${esc(u.username)}')" class="p-3.5 hover:bg-black/5 cursor-pointer flex items-center gap-3">
                <img src="${u.avatar || DEFAULT_AVATAR}" class="w-10 h-10 rounded-full object-cover bg-zinc-800 border gold-border shrink-0">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                        <strong class="text-xs truncate">${escHtml(u.name || u.username)}</strong>
                        ${u.isPro ? '<i class="fa-solid fa-circle-check text-blue-500 text-xs"></i>' : ""}
                        ${roleTag}
                    </div>
                    <p class="text-[11px] app-muted truncate">@${escHtml(u.username)} ${u.phone ? `• ${escHtml(u.phone)}` : ""}</p>
                </div>
                <i class="fa-solid fa-paper-plane app-accent text-xs shrink-0"></i>
            </div>
        `;
    }).join("");
}

function startDirectChatWithContact(username) {
    document.getElementById("modal-chat-contacts")?.classList.add("hide");
    openFullChatOverlay(String(username || "").toLowerCase());
}

async function deleteChatThreadHistory(targetUser) {
    const curU = getCurrentUserObj();
    if (!curU || curU.role !== "master") return showToast("Hanya Master Admin yang dapat menghapus riwayat chat.", "error");
    const tUser = String(targetUser || activeMasterChatThread || "").trim().toLowerCase();
    if (!tUser) return;
    if (!(await showConfirm("Hapus Riwayat Chat", `Hapus seluruh riwayat pesan dengan @${tUser} secara permanen?`, "fa-solid fa-trash", "Ya, Hapus Riwayat"))) return;

    showLoading("Menghapus riwayat chat...");
    const res = await apiAction({ action: "delete_chat_thread", threadUser: tUser });
    hideLoading();
    if (res && res.ok) {
        db.chats = (db.chats || []).filter(c => String(c.threadUser || c.sender || "").trim().toLowerCase() !== tUser);
        if (activeMasterChatThread === tUser) activeMasterChatThread = null;
        renderFullChatOverlay();
        updateChatBadges();
        showToast("Riwayat chat berhasil dihapus!", "info");
    } else {
        showToast((res && res.message) || "Gagal menghapus riwayat chat.", "error");
    }
}

function _pushWaHistoryState() {
    try {
        history.pushState({ mrWaChat: true, t: Date.now() + Math.random() }, "", window.location.href);
    } catch {}
}

function _openUserProfileDirect(threadUser) {
    const cleanUser = String(threadUser || "").trim().toLowerCase();
    if (!cleanUser || cleanUser.startsWith("tamu_")) return;

    const ov = document.getElementById("full-chat-overlay");
    if (ov) {
        ov.style.cssText = "";
        ov.classList.add("hide");
    }
    document.body.style.overflow = "";
    tempChatAttachment = "";
    if (typeof scheduleAdaptivePoll === "function") scheduleAdaptivePoll();

    if (typeof viewUserProfileModal === "function") {
        viewUserProfileModal(cleanUser);
        return;
    }
    if (typeof openUserProfileModal === "function") {
        openUserProfileModal(cleanUser);
        return;
    }
    if (typeof inspectUserProfile === "function") {
        inspectUserProfile(cleanUser);
    }
}

// Format Header WhatsApp Mentok Kiri & Bersih
function _syncWaChatHeader(mode = "list", title = "", avatarUrl = "", threadUser = "") {
    const ov = document.getElementById("full-chat-overlay");
    if (!ov) return;

    ov.style.cssText = "display:flex !important;position:fixed !important;inset:0 !important;width:100vw !important;height:100vh !important;max-width:100vw !important;max-height:100vh !important;padding:0 !important;margin:0 !important;z-index:110 !important;background:#000000 !important;opacity:1 !important;visibility:visible !important;";

    const cardBox = ov.querySelector(".app-card");
    if (cardBox) {
        cardBox.style.cssText = "display:flex !important;flex-direction:column !important;width:100% !important;height:100% !important;max-width:100% !important;max-height:100% !important;border-radius:0 !important;border:none !important;padding:0 !important;margin:0 !important;background:var(--app-card,#ffffff) !important;color:var(--app-text,#0f172a) !important;";
    }

    const topBar = ov.querySelector(".gold-gradient");
    if (topBar) {
        topBar.style.cssText = "display:flex !important;align-items:center !important;justify-content:flex-start !important;padding:0.75rem 1rem !important;border-radius:0 !important;";

        const isRealUser = mode === "thread" && threadUser && !String(threadUser).startsWith("tamu_");

        topBar.innerHTML = `
            <div id="wa-chat-header-trigger" class="flex items-center gap-3 w-full min-w-0 ${isRealUser ? "cursor-pointer active:opacity-80" : ""}">
                ${mode === "thread"
                    ? `<img id="wa-thread-prof-img" src="${avatarUrl || DEFAULT_AVATAR}" class="w-10 h-10 rounded-full object-cover border border-white/60 bg-zinc-800 shrink-0">
                       <div class="min-w-0 flex-1">
                           <h3 id="wa-thread-prof-name" class="text-base font-extrabold text-white tracking-tight truncate">${escHtml(title || "Pengguna")}</h3>
                       </div>`
                    : `<img src="./logo.png" class="w-9 h-9 rounded-xl bg-white p-1 object-contain border border-black/10 shrink-0">
                       <div class="min-w-0 flex-1">
                           <h3 class="text-lg font-extrabold text-white tracking-tight">Mr Undangan</h3>
                       </div>`
                }
            </div>
        `;

        if (isRealUser) {
            const trig = topBar.querySelector("#wa-chat-header-trigger");
            if (trig) {
                trig.addEventListener("click", (ev) => {
                    ev.preventDefault();
                    ev.stopPropagation();
                    _openUserProfileDirect(threadUser);
                });
            }
        }
    }

    const body = document.getElementById("fchat-body");
    if (body) {
        body.style.cssText = "display:flex !important;flex-direction:column !important;flex:1 1 auto !important;min-height:0 !important;background:var(--app-bg,#f8fafc) !important;";
    }

    if (cardBox) {
        Array.from(cardBox.children).forEach(child => {
            if (child !== topBar && child !== body) {
                child.style.setProperty("display", "none", "important");
            }
        });
    }
}

// Tangkap tombol Back HP pada fase capture agar obrolan kembali ke daftar chat dulu
if (!_waChatPopListenerAttached) {
    _waChatPopListenerAttached = true;
    window.addEventListener("popstate", (e) => {
        const ov = document.getElementById("full-chat-overlay");
        if (!ov || ov.classList.contains("hide")) return;

        const contactsMod = document.getElementById("modal-chat-contacts");
        if (contactsMod && !contactsMod.classList.contains("hide")) {
            e.stopImmediatePropagation();
            contactsMod.classList.add("hide");
            _pushWaHistoryState();
            return;
        }

        const u = getCurrentUserObj();
        if (isStaffUserObj(u) && activeMasterChatThread) {
            e.stopImmediatePropagation();
            activeMasterChatThread = null;
            _pushWaHistoryState();
            renderFullChatOverlay();
            return;
        }

        e.stopImmediatePropagation();
        closeFullChatOverlay();
    }, true);
}

async function openFullChatOverlay(targetThread = null) {
    const ov = document.getElementById("full-chat-overlay"); if (!ov) return;
    if (targetThread) activeMasterChatThread = String(targetThread).toLowerCase();
    tempChatAttachment = "";
    document.body.style.overflow = "hidden";
    ov.classList.remove("hide");

    _pushWaHistoryState();
    if (activeMasterChatThread) {
        _pushWaHistoryState();
    }

    const u = getCurrentUserObj();
    if (isStaffUserObj(u) && typeof fetchFullCloud === "function") {
        fetchFullCloud().then((ok) => {
            if (ok && !ov.classList.contains("hide")) {
                renderFullChatContentSmart();
                updateChatBadges();
            }
        });
    }

    renderFullChatOverlay();
    if (typeof scheduleAdaptivePoll === "function") scheduleAdaptivePoll();
}

function closeFullChatOverlay() {
    const ov = document.getElementById("full-chat-overlay"); if (!ov) return;
    ov.style.cssText = "";
    ov.classList.add("hide");
    document.body.style.overflow = "";
    tempChatAttachment = "";
    activeMasterChatThread = null;
    if (typeof scheduleAdaptivePoll === "function") scheduleAdaptivePoll();
}

async function pickChatAttachment(inp) {
    const file = inp.files && inp.files[0]; if (!file) return; inp.value = "";
    showLoading("Menyiapkan lampiran...");
    const b64 = await quickResizeImage(file, 820, 0.80);
    const up = await apiAction({ action: "upload_media", dataUrl: b64, prefix: "chat_att" });
    hideLoading();
    tempChatAttachment = (up && up.ok && up.url) ? up.url : b64;
    const bar = document.getElementById("chat-att-preview-bar");
    const img = document.getElementById("chat-att-preview-img");
    if (img) img.src = tempChatAttachment;
    if (bar) bar.classList.remove("hide");
}

function clearChatAttachment() {
    tempChatAttachment = "";
    document.getElementById("chat-att-preview-bar")?.classList.add("hide");
}

function buildChatComposerHtml(onSubmitFn, inputId, btnId, placeholderText) {
    return `
        <div id="chat-att-preview-bar" class="hide px-3 py-2 app-card border-t gold-border flex items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-2">
                <img id="chat-att-preview-img" src="" class="w-10 h-10 rounded-lg object-cover border gold-border">
                <span class="text-[11px] font-semibold app-accent">Foto lampiran siap dikirim</span>
            </div>
            <button type="button" onclick="clearChatAttachment()" class="w-7 h-7 rounded-full bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form onsubmit="${onSubmitFn}" class="px-3 py-2.5 app-card border-t gold-border flex items-center gap-2 shrink-0 w-full">
            <label class="w-10 h-10 rounded-full app-btn-sec flex items-center justify-center text-sm app-accent cursor-pointer shrink-0" title="Lampirkan Foto / Bukti">
                <i class="fa-solid fa-paperclip"></i>
                <input type="file" accept="image/*" class="hide" onchange="pickChatAttachment(this)">
            </label>
            <input type="text" id="${inputId}" placeholder="${placeholderText}" class="app-input !rounded-full !py-2.5 !px-4 flex-1 text-xs">
            <button type="submit" id="${btnId}" class="w-10 h-10 rounded-full gold-pill-btn flex items-center justify-center text-xs shrink-0 shadow" title="Kirim Pesan"><i class="fa-solid fa-paper-plane"></i></button>
        </form>
    `;
}

function renderFullChatOverlay() {
    const body = document.getElementById("fchat-body"); if (!body) return;
    const u = getCurrentUserObj();
    if (isStaffUserObj(u)) {
        const isMaster = u.role === "master";
        const threads = getChatThreads();
        if (!activeMasterChatThread) {
            _syncWaChatHeader("list", "Mr Undangan");
            body.innerHTML = `
                <div class="flex-1 overflow-y-auto divide-y divide-black/10 pb-20">${threads.length ? threads.map(th => {
                    const last = th.messages[th.messages.length - 1];
                    const lastStaff = last.role === "master" || last.role === "administrasi";
                    const roleBadge = th.role === "cabang" ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 font-bold">CABANG</span>`
                        : th.role === "tamu" ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-zinc-500/15 app-muted font-bold">TAMU</span>` : "";
                    return `<div onclick="openMasterChatThread('${esc(th.threadUser)}')" class="p-3.5 hover:bg-black/5 cursor-pointer flex items-center gap-3">
                        <img src="${th.avatar}" class="w-12 h-12 rounded-full object-cover bg-zinc-800 border gold-border shrink-0">
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center gap-2">
                                <strong class="text-sm truncate flex items-center gap-1">${escHtml(th.displayName)} ${th.isPro ? '<i class="fa-solid fa-circle-check text-blue-500 text-xs"></i>' : ""} ${roleBadge}</strong>
                                <span class="text-[11px] app-muted shrink-0">${last.time || ""}</span>
                            </div>
                            <div class="flex justify-between items-center mt-1 gap-2">
                                <p class="text-xs app-muted truncate">${lastStaff ? "✓✓ Admin: " : ""}${last.image ? "📷 [Lampiran] " : ""}${escHtml(last.text)}</p>
                                <div class="flex items-center gap-1.5 shrink-0">
                                    ${th.unread > 0 ? `<span class="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center">${th.unread}</span>` : ""}
                                    ${isMaster ? `<button type="button" onclick="event.stopPropagation();deleteChatThreadHistory('${esc(th.threadUser)}');" class="w-7 h-7 rounded-lg bg-red-600/12 text-red-500 hover:bg-red-600/25 flex items-center justify-center text-[11px]" title="Hapus Riwayat Chat"><i class="fa-solid fa-trash"></i></button>` : ""}
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join("") : '<p class="p-12 text-center text-xs app-muted">Belum ada percakapan. Ketuk tombol <strong>+</strong> untuk memulai chat dengan user.</p>'}</div>
                <button type="button" onclick="openChatContactsModal()" class="absolute bottom-4 right-4 z-20 w-12 h-12 rounded-full gold-gradient shadow-xl flex items-center justify-center text-lg font-extrabold hover:scale-105 transition" title="Mulai Chat Baru (Daftar Kontak)">
                    <i class="fa-solid fa-plus"></i>
                </button>
            `;
        } else {
            const uObj = (db.users || []).find(x => String(x.username || "").toLowerCase() === activeMasterChatThread);
            const th = threads.find(t => t.threadUser === activeMasterChatThread) || {
                threadUser: activeMasterChatThread,
                displayName: (uObj && uObj.name) || activeMasterChatThread,
                avatar: (uObj && uObj.avatar) || DEFAULT_AVATAR
            };
            _syncWaChatHeader("thread", th.displayName, th.avatar, th.threadUser);
            const quickBar = `<div class="px-3 py-1.5 app-card border-t gold-border flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">${QUICK_REPLIES_STAFF.map(txt => `<button type="button" onclick="fillQuickReply('${esc(txt)}')" class="px-2.5 py-1 rounded-full app-card-soft border text-[10px] font-semibold whitespace-nowrap hover:brightness-95">${escHtml(txt.slice(0, 34))}...</button>`).join("")}</div>`;

            body.innerHTML = `
                <div id="fchat-messages-scroll" class="flex-1 overflow-y-auto p-3.5 space-y-2.5"></div>
                ${quickBar}
                ${buildChatComposerHtml("sendMasterThreadReply(event)", "master-wa-input", "btn-wa-send", `Ketik pesan ke @${esc(th.threadUser)}...`)}
            `;
            renderFullChatMessagesOnly();
        }
    } else {
        _syncWaChatHeader("thread", "Admin Mr Undangan", "./logo.png", "");
        body.innerHTML = `
            <div id="fchat-messages-scroll" class="flex-1 overflow-y-auto p-3.5 space-y-2.5"></div>
            ${buildChatComposerHtml("sendUserChatMessage(event)", "chat-input-text", "btn-chat-send", "Ketik pesan...")}
        `;
        renderFullChatMessagesOnly();
        apiAction({ action: "mark_chat_read", threadUser: (currentSessionUser || guestChatId).toLowerCase(), by: "user" }).then(updateChatBadges);
    }
}

function fillQuickReply(txt) {
    const inp = document.getElementById("master-wa-input");
    if (inp) { inp.value = txt; inp.focus(); }
}

function renderFullChatMessagesOnly() {
    const el = document.getElementById("fchat-messages-scroll"); if (!el) return;
    const u = getCurrentUserObj(), isStaff = isStaffUserObj(u);
    const thread = isStaff ? activeMasterChatThread : (currentSessionUser || guestChatId).toLowerCase();
    const msgs = (db.chats || []).filter(c => String(c.threadUser || c.sender).toLowerCase() === thread);

    let lastStaffReplyTs = 0;
    msgs.forEach(m => {
        if ((m.role === "master" || m.role === "administrasi") && !m._pending) {
            if ((m.ts || 0) > lastStaffReplyTs) lastStaffReplyTs = m.ts || 0;
        }
    });

    el.innerHTML = msgs.length ? msgs.map(m => {
        const msgIsStaff = (m.role === "master" || m.role === "administrasi");
        const isMe = isStaff ? msgIsStaff : !msgIsStaff;

        let tickHtml = "";
        if (isMe) {
            if (m._pending) {
                tickHtml = `<i class="fa-solid fa-check text-[10px] opacity-65 ml-1" title="Mengirim..."></i>`;
            } else if (!isStaff && (m.repliedByAdmin || (lastStaffReplyTs > 0 && (m.ts || 0) <= lastStaffReplyTs))) {
                tickHtml = `<i class="fa-solid fa-check-double text-[10px] chat-tick-replied ml-1" title="Sudah dibalas Admin"></i>`;
            } else {
                tickHtml = `<i class="fa-solid fa-check-double text-[10px] opacity-60 ml-1" title="Terkirim"></i>`;
            }
        }

        const bubbleCls = isMe ? "app-card border-2 gold-border rounded-br-sm" : "app-card border rounded-bl-sm";
        const senderLbl = isMe ? "Anda" : (m.role === "master" ? "Master Admin" : m.role === "administrasi" ? "Tim Administrasi" : (m.senderName || "Pengguna"));

        return `<div class="flex ${isMe ? "justify-end" : "justify-start"}">
            <div class="max-w-[84%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm ${bubbleCls}">
                <span class="block text-[9px] font-bold app-accent mb-0.5">${escHtml(senderLbl)}</span>
                ${m.image ? `<a href="${m.image}" target="_blank" class="block mb-1.5"><img src="${m.image}" class="max-h-48 rounded-xl border gold-border object-contain"></a>` : ""}
                ${m.text ? `<p class="whitespace-pre-wrap break-words">${escHtml(m.text)}</p>` : ""}
                <div class="flex items-center justify-end gap-0.5 mt-1 text-[9px] app-muted">
                    <span>${m.time || ""}</span>
                    ${tickHtml}
                </div>
            </div>
        </div>`;
    }).join("") : `<p class="text-center app-muted py-16 text-xs">Belum ada percakapan. Kirim pesan pertama Anda sekarang!</p>`;
    el.scrollTop = el.scrollHeight;
}

function renderFullChatContentSmart() {
    const u = getCurrentUserObj();
    if (isStaffUserObj(u) && !activeMasterChatThread) renderFullChatOverlay();
    else renderFullChatMessagesOnly();
}

async function openMasterChatThread(tUser) {
    activeMasterChatThread = tUser;
    _pushWaHistoryState();
    renderFullChatOverlay();
    const u = getCurrentUserObj();
    await apiAction({ action: "mark_chat_read", threadUser: tUser, by: (u && u.role) || "master" });
    updateChatBadges();
}

async function sendMasterThreadReply(e) {
    e.preventDefault();
    const inp = document.getElementById("master-wa-input");
    const text = inp.value.trim();
    const image = tempChatAttachment || "";
    if (!text && !image) return;
    const u = getCurrentUserObj();
    const cid = "cm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const localMsg = {
        clientMsgId: cid,
        threadUser: activeMasterChatThread,
        senderName: u && u.role === "administrasi" ? `Admin (${u.name})` : "Master Admin",
        role: (u && u.role) || "master",
        text,
        image,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        ts: Date.now(),
        readByMaster: true,
        _pending: true
    };
    db.chats.push(localMsg);
    inp.value = "";
    clearChatAttachment();
    renderFullChatMessagesOnly();

    const res = await apiAction({ action: "send_chat", message: localMsg });
    if (res && res.ok) {
        delete localMsg._pending;
        if (res.savedMsg && res.savedMsg.id) localMsg.id = res.savedMsg.id;
        renderFullChatMessagesOnly();
    } else {
        showToast("Pesan tertunda, periksa koneksi internet.", "error");
    }
}

async function sendUserChatMessage(e) {
    e.preventDefault();
    const inp = document.getElementById("chat-input-text");
    const text = inp.value.trim();
    const image = tempChatAttachment || "";
    if (!text && !image) return;
    const u = getCurrentUserObj();
    const cid = "cm_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
    const localMsg = {
        clientMsgId: cid,
        threadUser: (currentSessionUser || guestChatId).toLowerCase(),
        senderName: (u && u.name) || "Pengunjung",
        role: (u && u.role) || "user",
        text,
        image,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        ts: Date.now(),
        readByUser: true,
        repliedByAdmin: false,
        _pending: true
    };
    db.chats.push(localMsg);
    inp.value = "";
    clearChatAttachment();
    renderFullChatMessagesOnly();

    const res = await apiAction({ action: "send_chat", message: localMsg });
    if (res && res.ok) {
        delete localMsg._pending;
        if (res.savedMsg && res.savedMsg.id) localMsg.id = res.savedMsg.id;
        renderFullChatMessagesOnly();
    } else {
        showToast("Pesan tertunda, periksa koneksi internet.", "error");
    }
}

function updateChatBadges() {
    const badge = document.getElementById("floating-chat-badge");
    const staffPill = document.getElementById("staff-chat-pill-cnt");
    const u = getCurrentUserObj();
    let count = 0;

    if (isStaffUserObj(u)) {
        const isAdministrasiOnly = u.role === "administrasi";
        count = (db.chats || []).filter(c => {
            if (c.readByMaster || c.role === "master" || c.role === "administrasi") return false;
            if (isAdministrasiOnly) {
                const key = String(c.threadUser || c.sender || "").toLowerCase();
                const owner = (db.users || []).find(x => String(x.username || "").toLowerCase() === key);
                if (owner && (owner.role === "cabang" || owner.role === "master")) return false;
            }
            return true;
        }).length;
    } else {
        count = (db.chats || []).filter(c => String(c.threadUser).toLowerCase() === (currentSessionUser || guestChatId).toLowerCase() && !c.readByUser && (c.role === "master" || c.role === "administrasi")).length;
    }

    if (_lastKnownChatCount >= 0 && count > _lastKnownChatCount) {
        playSoftChatNotification();
    }
    _lastKnownChatCount = count;

    if (badge) {
        badge.innerText = count;
        badge.classList.toggle("hide", count === 0);
    }
    if (staffPill) {
        staffPill.innerText = count;
        staffPill.classList.toggle("hide", count === 0);
    }
}
