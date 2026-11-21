// =========================================================================
// MR UNDANGAN — ENGINE UNDANGAN, 3D PAGE-TURN & PORTAL CLIENT (js/invitation.js)
// =========================================================================
let wizardState = {
    isEdit: false, adminDirectEdit: false, editInvId: null, isCabangBypass: false,
    category: "Pernikahan", theme: "Adat Kalimantan",
    photoSlots: [], couplePhoto: "", groomPhoto: "", bridePhoto: "",
    customAudioUrl: "", customAudioTitle: "", hiddenFields: [],
    sections: { sesi2: true, story: true, bank: true, music: true, closing: true }
};
let previewAudio = null, previewAudioToken = 0, invDraftSaveTimer = null;

function getDefaultOpeningText(cat, tObj = null) {
    if (cat === "Pernikahan") return {
        greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
        quote: "\"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih dan sayang.\" (QS. Ar-Rum: 21)"
    };
    if (cat === "Aqiqah") return {
        greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
        quote: "Dengan memohon rahmat dan ridho Allah SWT, serta mengucap syukur atas kelahiran buah hati kami, kami mengundang Bapak/Ibu/Saudara/i untuk turut mendoakan dan menghadiri acara Tasyakuran Aqiqah putra/putri kami."
    };
    if (cat === "Ulang Tahun") return {
        greeting: "Halo Sahabat & Keluarga Tercinta!",
        quote: "Kebahagiaan akan terasa jauh lebih bermakna jika dirayakan bersama orang-orang tersayang. Dengan penuh sukacita kami mengundang Anda untuk hadir memeriahkan hari ulang tahun spesial ini."
    };
    if (cat === "Syukuran") {
        if (tObj && tObj.isKhitan) return {
            greeting: "Assalamu'alaikum Warahmatullahi Wabarakatuh",
            quote: "Ya Allah, muliakanlah anak kami ini, panjangkanlah umurnya, terangilah hatinya, teguhkanlah imannya, dan jadikanlah ia anak yang sholeh serta berbakti kepada kedua orang tua. Aamiin."
        };
        const gr = (tObj && tObj.faith === "kristen") ? "Shalom / Damai Sejahtera" : (tObj && tObj.faith === "hindu_buddha") ? "Om Swastyastu / Namo Buddhaya" : "Assalamu'alaikum Warahmatullahi Wabarakatuh";
        return { greeting: gr, quote: "Dengan penuh rasa syukur atas segala limpahan rahmat dan karunia-Nya, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir dalam acara syukuran dan doa bersama keluarga kami." };
    }
    return { greeting: "Salam Hangat & Hormat Kami", quote: "Dengan segala kerendahan hati, kami mengundang Bapak/Ibu/Saudara/i untuk meluangkan waktu dan berkenan hadir dalam rangkaian acara spesial yang akan kami selenggarakan." };
}

function getDefaultClosingText(cat) {
    if (cat === "Pernikahan") return { title: "Terima Kasih", text: "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu bagi kedua mempelai. Atas kehadiran serta doa restunya, kami ucapkan terima kasih." };
    if (cat === "Aqiqah") return { title: "Jazakumullahu Khairan", text: "Atas kehadiran serta doa tulus Bapak/Ibu/Saudara/i untuk buah hati kami, kami mengucapkan terima kasih yang sebesar-besarnya. Semoga Allah SWT membalas kebaikan Anda berlipat ganda." };
    if (cat === "Ulang Tahun") return { title: "Sampai Jumpa di Hari Spesial!", text: "Kehadiran dan doa terbaik dari teman-teman dan keluarga akan menjadikan hari ulang tahun ini semakin berkesan dan penuh kebahagiaan. Terima kasih!" };
    if (cat === "Syukuran") return { title: "Terima Kasih & Doa Restu", text: "Suatu kehormatan dan kebahagiaan bagi keluarga kami apabila Bapak/Ibu/Saudara/i berkenan hadir memenuhi undangan syukuran ini. Atas doa dan kehadirannya kami haturkan terima kasih." };
    return { title: "Terima Kasih", text: "Demikian undangan ini kami sampaikan. Besar harapan kami atas kehadiran Bapak/Ibu/Saudara/i demi kelancaran dan kebersamaan acara ini." };
}

function getSafeAudioCandidates(rawUrl) {
    const cleanRaw = String(rawUrl || "").trim();
    if (!cleanRaw) return [];
    const list = [];
    if (typeof _audioBlobCache !== "undefined" && _audioBlobCache && _audioBlobCache.has(cleanRaw)) {
        const cached = _audioBlobCache.get(cleanRaw);
        if (cached) list.push(cached);
    }
    if (typeof getAudioUrlCandidates === "function") {
        getAudioUrlCandidates(cleanRaw).forEach((u) => {
            if (u && !list.includes(u)) list.push(u);
        });
    } else if (!list.includes(cleanRaw)) {
        list.push(cleanRaw);
    }
    return list;
}

function playAudioElementWithFallback(audioEl, candidates, onAllFail, rawUrl = "") {
    if (!audioEl || !candidates || !candidates.length) {
        if (onAllFail) onAllFail();
        return;
    }
    let idx = 0;
    let blobTried = false;
    let settled = false;
    let failTimer = null;

    audioEl.dataset.wantPlay = "1";

    const clearFailTimer = () => {
        if (failTimer) {
            clearTimeout(failTimer);
            failTimer = null;
        }
    };

    const markPlayingSuccess = () => {
        settled = true;
        clearFailTimer();
    };

    const finishWithError = () => {
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        clearFailTimer();
        if (onAllFail) onAllFail();
    };

    const tryBlobFallback = async () => {
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        if (blobTried || typeof fetchAudioAsBlobUrl !== "function") {
            finishWithError();
            return;
        }
        blobTried = true;
        const blobUrl = await fetchAudioAsBlobUrl(rawUrl, candidates);
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        if (blobUrl) {
            audioEl.src = blobUrl;
            try { audioEl.load(); } catch {}
            const p = audioEl.play();
            if (p && typeof p.catch === "function") {
                p.catch((err) => {
                    if (settled || audioEl.dataset.wantPlay !== "1") return;
                    if (err && err.name === "NotAllowedError") return;
                    finishWithError();
                });
            }
        } else {
            finishWithError();
        }
    };

    const tryCurrent = () => {
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        if (idx >= candidates.length) {
            tryBlobFallback();
            return;
        }
        const targetSrc = candidates[idx];
        audioEl.src = targetSrc;
        try { audioEl.load(); } catch {}

        clearFailTimer();
        failTimer = setTimeout(() => {
            if (settled || audioEl.dataset.wantPlay !== "1") return;
            if (!audioEl.paused && audioEl.currentTime > 0) {
                markPlayingSuccess();
                return;
            }
            if (idx + 1 < candidates.length) {
                idx++;
                tryCurrent();
            } else {
                tryBlobFallback();
            }
        }, 4500);

        const p = audioEl.play();
        if (p && typeof p.catch === "function") {
            p.catch((err) => {
                if (settled || audioEl.dataset.wantPlay !== "1") return;
                if (err && err.name === "NotAllowedError") {
                    clearFailTimer();
                    return;
                }
                if (idx + 1 < candidates.length) {
                    idx++;
                    tryCurrent();
                } else {
                    tryBlobFallback();
                }
            });
        }
    };

    const prevOnPlaying = audioEl.onplaying;
    audioEl.onplaying = (ev) => {
        markPlayingSuccess();
        if (typeof prevOnPlaying === "function") prevOnPlaying(ev);
    };

    const prevOnPause = audioEl.onpause;
    audioEl.onpause = (ev) => {
        if (audioEl.dataset.wantPlay !== "1") clearFailTimer();
        if (typeof prevOnPause === "function") prevOnPause(ev);
    };

    audioEl.onerror = () => {
        if (settled || audioEl.dataset.wantPlay !== "1") return;
        if (idx + 1 < candidates.length) {
            idx++;
            tryCurrent();
        } else {
            tryBlobFallback();
        }
    };

    tryCurrent();
}

// ================= 1. WIZARD UNDANGAN =================
function getSelectedThemeObj() { return findThemeObject(wizardState.category, wizardState.theme); }
function stopPreviewAudio() {
    previewAudioToken++;
    if (previewAudio) {
        previewAudio.dataset.wantPlay = "0";
        previewAudio.onerror = null;
        previewAudio.onplaying = null;
        try { previewAudio.pause(); } catch {}
        previewAudio = null;
    }
    const b = document.getElementById("btn-preview-song");
    if (b) b.innerHTML = `<i class="fa-solid fa-play mr-1"></i> Putar Preview`;
}
async function togglePreviewSelectedSong() {
    const rawUrl = wizardState.customAudioUrl || document.getElementById("f-preset-audio").value;
    if (!rawUrl) return showToast("Pilih stok lagu atau upload & potong lagu terlebih dahulu.", "info");
    if (previewAudio && !previewAudio.paused) return stopPreviewAudio();
    stopPreviewAudio();
    const myToken = previewAudioToken;
    const candidates = getSafeAudioCandidates(rawUrl);
    if (!candidates.length) return showToast("Lagu gagal dimuat.", "error");

    const b = document.getElementById("btn-preview-song");
    if (b) b.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i> Memuat...`;

    const el = new Audio();
    el.preload = "auto";
    el.setAttribute("playsinline", "");
    el.onplaying = () => {
        if (myToken !== previewAudioToken) return;
        const btn = document.getElementById("btn-preview-song");
        if (btn) btn.innerHTML = `<i class="fa-solid fa-stop mr-1"></i> Stop`;
    };
    el.onended = () => {
        if (myToken === previewAudioToken) stopPreviewAudio();
    };
    previewAudio = el;

    playAudioElementWithFallback(el, candidates, () => {
        if (myToken !== previewAudioToken) return;
        stopPreviewAudio();
        showToast("Gagal memutar audio. Pastikan file lagu valid & dapat diakses publik.", "error");
    }, rawUrl);
}
function populateMusicDropdown(selUrl = "") {
    const sel = document.getElementById("f-preset-audio"); if (!sel) return;
    sel.innerHTML = !db.musicLibrary.length
        ? `<option value="">-- Belum ada stok lagu (Upload & potong lagu di bawah) --</option>`
        : `<option value="">-- Pilih Stok Lagu Website --</option>` + db.musicLibrary.map(m => `<option value="${esc(m.url)}" ${m.url===selUrl?"selected":""}>🎵 [${escHtml(m.category)}] ${escHtml(m.title)}</option>`).join("");
}

const VENUE_PRESETS = ["Rumah Mempelai Wanita", "Rumah Mempelai Pria", "Gedung Serbaguna", "Hotel", ""];
function syncVenueDropdown(kind) {
    const sel = document.getElementById(`f-${kind}-venue-sel`);
    const inp = document.getElementById(`f-${kind}-venue`);
    if (!sel || !inp) return;
    if (sel.value === "__custom__") {
        inp.classList.remove("hide");
        if (VENUE_PRESETS.includes(inp.value)) inp.value = "";
        inp.focus();
    } else {
        inp.classList.add("hide");
        inp.value = sel.value;
    }
}
function setVenueDropdownValue(kind, val) {
    const sel = document.getElementById(`f-${kind}-venue-sel`);
    const inp = document.getElementById(`f-${kind}-venue`);
    if (!sel || !inp) return;
    const clean = String(val || "").trim();
    if (VENUE_PRESETS.includes(clean)) {
        sel.value = clean;
        inp.value = clean;
        inp.classList.add("hide");
    } else {
        sel.value = "__custom__";
        inp.value = clean;
        inp.classList.remove("hide");
    }
}
function getVenueFieldValue(kind) {
    const sel = document.getElementById(`f-${kind}-venue-sel`);
    const inp = document.getElementById(`f-${kind}-venue`);
    if (!sel || !inp) return "";
    return sel.value === "__custom__" ? inp.value.trim() : sel.value;
}

function getMainFieldSpecs(cat) {
    if (cat === "Pernikahan") return [
        { id:"f-title", label:"Nama Panggilan Pasangan (Wajib)", ph:"Nama panggilan Anda & pasangan", req:true, full:true },
        { id:"f-groom", label:"Nama Lengkap Mempelai Pria", ph:"Nama lengkap mempelai pria" },
        { id:"f-groom-ig", label:"Instagram Mempelai Pria (Opsional)", ph:"Username Instagram Anda" },
        { id:"f-groom-parents", label:"Nama Kedua Orang Tua Mempelai Pria", ph:"Nama kedua orang tua Anda", full:true },
        { id:"f-bride", label:"Nama Lengkap Mempelai Wanita", ph:"Nama lengkap mempelai wanita" },
        { id:"f-bride-ig", label:"Instagram Mempelai Wanita (Opsional)", ph:"Username Instagram pasangan" },
        { id:"f-bride-parents", label:"Nama Kedua Orang Tua Mempelai Wanita", ph:"Nama kedua orang tua pasangan Anda", full:true }
    ];
    if (cat === "Ulang Tahun") return [
        { id:"f-title", label:"Nama yang Berulang Tahun (Wajib)", ph:"Nama Anda / buah hati Anda", req:true },
        { id:"f-age", label:"Usia", ph:"Usia yang dirayakan" },
        { id:"f-groom-parents", label:"Nama Kedua Orang Tua / Pengundang", ph:"Nama kedua orang tua Anda", full:true }
    ];
    if (cat === "Aqiqah") return [
        { id:"f-title", label:"Nama Lengkap Anak (Wajib)", ph:"Nama lengkap buah hati Anda", req:true },
        { id:"f-age", label:"Tanggal Lahir Anak", ph:"Tanggal lahir buah hati Anda" },
        { id:"f-groom-parents", label:"Nama Kedua Orang Tua", ph:"Nama kedua orang tua Anda", full:true }
    ];
    return [
        { id:"f-title", label:"Judul Acara / Nama Anda (Wajib)", ph:"Judul acara atau nama Anda", req:true },
        { id:"f-sub", label:"Sub-Judul / Agenda Acara", ph:"Agenda singkat acara Anda" },
        { id:"f-groom-parents", label:"Hormat Kami / Nama Keluarga / Panitia", ph:"Nama keluarga atau panitia Anda", full:true }
    ];
}

function buildInlineCouplePhotoCard(key, title, desc, imgSrc, aspectRatio) {
    const fb = key === "groomPhoto" ? IMG("1507003211169-0a1dd7228f2d") : key === "bridePhoto" ? IMG("1534528741775-53994a69daeb") : IMG("1519741497674-611481863552");
    return `<div class="md:col-span-2 app-card border rounded-2xl p-3 flex items-center gap-3.5"><img src="${imgSrc || fb}" ${imgFbAttr(fb)} class="w-16 h-20 rounded-xl object-cover border gold-border shrink-0"><div class="flex-1 min-w-0"><strong class="text-xs block">${title}</strong><p class="text-[10px] app-muted mt-0.5">${desc}</p><label class="inline-block mt-2 px-3 py-1.5 rounded-lg gold-pill-btn text-[11px] cursor-pointer"><i class="fa-solid fa-crop-simple mr-1"></i>Upload &amp; Atur Foto<input type="file" accept="image/*" class="hide" onchange="pickCroppedCouplePhoto(this,'${key}',${aspectRatio})"></label></div></div>`;
}
function renderDynamicMainFields(prefill = {}) {
    const specs = getMainFieldSpecs(wizardState.category), tObj = getSelectedThemeObj();
    const box = document.getElementById("dynamic-main-fields"), hidBox = document.getElementById("dynamic-hidden-fields");
    let visibleHtml = "", hiddenHtml = "";
    specs.forEach(sp => {
        if (!sp.req && wizardState.hiddenFields.includes(sp.id)) {
            hiddenHtml += `<button type="button" onclick="restoreWizardField('${sp.id}')" class="px-2.5 py-1 rounded-lg app-btn-sec text-[10px] app-accent border gold-border font-semibold">+ ${sp.label}</button>`;
            return;
        }
        const val = prefill[sp.id] !== undefined ? prefill[sp.id] : "";
        const delBtn = sp.req ? "" : `<button type="button" onclick="removeWizardField('${sp.id}')" class="text-[10px] text-red-500 font-semibold hover:underline"><i class="fa-solid fa-xmark"></i> Hapus</button>`;
        const inp = `<input type="text" id="${sp.id}" value="${esc(val)}" placeholder="${esc(sp.ph||"")}" class="app-input" ${sp.req?"required":""}>`;
        visibleHtml += `<div class="${sp.full?"md:col-span-2":""}"><div class="flex justify-between items-center mb-1"><label class="app-label !mb-0 ${sp.req?"app-accent":""}">${sp.label}</label>${delBtn}</div>${inp}</div>`;
        if (wizardState.category === "Pernikahan" && tObj.coupleMode !== "combined") {
            const isPol = tObj.style === "kalimantan_story" || tObj.style === "editorial" || tObj.style === "premium_black";
            if (sp.id === "f-groom-parents") visibleHtml += buildInlineCouplePhotoCard("groomPhoto", isPol ? "Foto Mempelai Pria (4:5)" : "Foto Layar Penuh Mempelai Pria (9:16)", "Tampil di slide khusus Mempelai Pria.", wizardState.groomPhoto, isPol ? 4 / 5 : 9 / 16);
            if (sp.id === "f-bride-parents") visibleHtml += buildInlineCouplePhotoCard("bridePhoto", isPol ? "Foto Mempelai Wanita (4:5)" : "Foto Layar Penuh Mempelai Wanita (9:16)", "Tampil di slide khusus Mempelai Wanita.", wizardState.bridePhoto, isPol ? 4 / 5 : 9 / 16);
        }
    });
    if (wizardState.category === "Pernikahan" && tObj.coupleMode === "combined") {
        visibleHtml += buildInlineCouplePhotoCard("couplePhoto", "Foto Berdua Mempelai (Tema Digabung)", "Tampil penuh elegan di atas nama kedua mempelai.", wizardState.couplePhoto, 4 / 5);
    }
    box.innerHTML = visibleHtml;
    if (hiddenHtml) { hidBox.innerHTML = `<span class="text-[10px] app-muted self-center mr-1">Kolom dihapus:</span>` + hiddenHtml; hidBox.classList.remove("hide"); }
    else { hidBox.innerHTML = ""; hidBox.classList.add("hide"); }
}
function pickCroppedCouplePhoto(inp, key, ratio) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    const isTall = ratio < 0.7;
    openImageCropper(file, ratio, isTall ? "Atur Foto Mempelai (9:16)" : "Atur Foto Mempelai (4:5)", 720, isTall ? 1280 : 900, async (dataUrl) => {
        showLoading("Mengunggah foto mempelai...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: key });
        hideLoading();
        if (up && up.ok && up.url) { const cur = captureCurrentMainValues(); wizardState[key] = up.url; renderDynamicMainFields(cur); showToast("Foto mempelai tersimpan!"); }
        else showToast("Gagal mengunggah foto.", "error");
    });
}
function captureCurrentMainValues() { const m = {}; getMainFieldSpecs(wizardState.category).forEach(sp => { const el = document.getElementById(sp.id); if (el) m[sp.id] = el.value; }); return m; }
function removeWizardField(id) { const cur = captureCurrentMainValues(); if (!wizardState.hiddenFields.includes(id)) wizardState.hiddenFields.push(id); renderDynamicMainFields(cur); }
function restoreWizardField(id) { const cur = captureCurrentMainValues(); wizardState.hiddenFields = wizardState.hiddenFields.filter(x => x !== id); renderDynamicMainFields(cur); }
function toggleWizardSection(sec, show) { wizardState.sections[sec] = show; const el = document.getElementById(`sec-${sec}`); if (el) el.classList.toggle("hide", !show); renderWizardRestoreBar(); }
function renderWizardRestoreBar() {
    const names = { sesi2:"Sesi 2 / Resepsi", story:"Kisah Momen", bank:"Amplop Digital", music:"Backsound Musik", closing:"Ucapan Penutup" };
    const off = Object.keys(names).filter(k => !wizardState.sections[k]);
    const bar = document.getElementById("wizard-restore-bar"), pills = document.getElementById("wizard-restore-pills");
    if (!off.length) { bar.classList.add("hide"); return; }
    bar.classList.remove("hide");
    pills.innerHTML = off.map(k => `<button type="button" onclick="toggleWizardSection('${k}',true)" class="px-3 py-1 rounded-full app-card border text-[11px] app-accent font-bold">+ Tampilkan ${names[k]}</button>`).join("");
}

function startCreateInvitation(isCabang = false, preCat = null, preTheme = null) {
    if (isCabang) { const cab = getCurrentUserObj(); if (!cab || (cab.quota || 0) <= 0) return showToast("Kuota deposit habis! Hubungi Master Admin.", "error"); }
    currentViewName = "wizard";
    const initCat = preCat || "Pernikahan";
    const activeList = getMergedThemes(initCat, false);
    const initTheme = preTheme || (activeList[0] && activeList[0].name) || "Adat Kalimantan";
    wizardState = {
        isEdit: false, adminDirectEdit: false, editInvId: null, isCabangBypass: isCabang,
        category: initCat, theme: initTheme, photoSlots: [],
        couplePhoto: IMG("1519741497674-611481863552"),
        groomPhoto: "./assets/model-pria.jpg",
        bridePhoto: "./assets/model-wanita.jpg",
        customAudioUrl: "", customAudioTitle: "", hiddenFields: [],
        sections: { sesi2: true, story: true, bank: true, music: true, closing: true }
    };
    hideAllViews(); document.getElementById("view-wizard").classList.remove("hide");
    document.getElementById("wiz-heading").innerText = isCabang ? "Buat Undangan Klien Instan (-1 Kuota)" : "Buat Undangan Digital Baru";
    document.getElementById("btn-submit-inv").innerText = isCabang ? "Buat & Aktifkan (-1 Kuota)" : "Ajukan Undangan";
    document.getElementById("btn-change-theme-step").classList.remove("hide");
    renderHeaderActions(); pushBackGuard(); renderWizardStep1();
    if (preCat && preTheme) selectWizardTheme(preTheme);
    else setWizardStep(1);
}

function setWizardStep(s) {
    stopPreviewAudio();
    document.getElementById("wiz-step-1").classList.toggle("hide", s !== 1);
    document.getElementById("wiz-step-2").classList.toggle("hide", s !== 2);
    document.getElementById("wiz-subheading").innerText = `Langkah ${s} dari 2`;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderWizardStep1() {
    document.getElementById("wiz-cat-buttons").innerHTML = Object.keys(THEME_CATALOG).map(c => `<button type="button" onclick="wizardState.category='${c}';wizardState.theme=(getMergedThemes('${c}',false)[0]?.name||'');renderWizardStep1();" class="p-3 rounded-2xl border text-xs font-bold transition ${wizardState.category===c?"gold-pill-btn shadow":"app-card-soft"}">${c}</button>`).join("");
    document.getElementById("wiz-cat-selected-name").innerText = wizardState.category;
    const themes = getMergedThemes(wizardState.category, false);
    document.getElementById("wiz-theme-cards").innerHTML = themes.map(t => {
        const isSel = wizardState.theme === t.name;
        return `
            <div class="group rounded-2xl overflow-hidden border-2 ${isSel ? "border-blue-500 shadow-lg" : "border-black/15"} bg-black flex flex-col">
                ${buildMiniCoverCardHtml(wizardState.category, t, false)}
                ${buildPriceStripHtml(t, true)}
                <div class="grid grid-cols-2 gap-1.5 p-2 bg-[#16161b]">
                    <button type="button" onclick="openThemeLivePreview('${esc(wizardState.category)}','${esc(t.name)}')" class="py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/20"><i class="fa-regular fa-eye mr-1"></i>Lihat Ini</button>
                    <button type="button" onclick="selectWizardTheme('${esc(t.name)}')" class="py-2 rounded-xl gold-pill-btn text-[11px] shadow">Pilih</button>
                </div>
            </div>
        `;
    }).join("");
}

function selectWizardTheme(name) {
    wizardState.theme = name;
    const tObj = getSelectedThemeObj();
    const pr = getThemePricing(tObj);
    document.getElementById("form-badge-cat").innerText = wizardState.category;
    document.getElementById("form-badge-theme").innerText = name;
    document.getElementById("form-badge-price").innerText = fmtRp(pr.price);
    wizardState.hiddenFields = [];
    wizardState.sections = { sesi2: wizardState.category === "Pernikahan", story: wizardState.category === "Pernikahan", bank: true, music: true, closing: true };
    document.getElementById("toggle-countdown").checked = true; document.getElementById("toggle-wishes").checked = true;
    document.getElementById("label-sesi-1").innerText = wizardState.category === "Pernikahan" ? "Sesi 1: Akad Nikah (Wajib)" : `Waktu & Tempat ${wizardState.category} (Wajib)`;
    const defOpen = getDefaultOpeningText(wizardState.category, tObj), defClose = getDefaultClosingText(wizardState.category);
    document.getElementById("f-opening-greeting").value = defOpen.greeting;
    document.getElementById("f-opening-quote").value = defOpen.quote;
    document.getElementById("f-closing-title").value = defClose.title;
    document.getElementById("f-closing-text").value = defClose.text;
    setVenueDropdownValue("akad", "Rumah Mempelai Wanita");
    setVenueDropdownValue("resepsi", "Gedung Serbaguna");
    renderDynamicMainFields();
    ["sesi2","story","bank","music","closing"].forEach(k => toggleWizardSection(k, wizardState.sections[k]));
    if (!wizardState.isEdit) {
        document.getElementById("story-rows-container").innerHTML = ""; addStoryFieldRow("Perkenalan", "2022", "Awal pertemuan kami hingga hari bahagia.");
        document.getElementById("bank-rows-container").innerHTML = ""; addBankFieldRow("BCA", "", "");
        const safeCover = (tObj.demoPhotos && tObj.demoPhotos.cover) || (tObj.img && tObj.img.startsWith("http") ? tObj.img : IMG("1519741497674-611481863552"));
        wizardState.photoSlots = [safeCover, IMG("1519741497674-611481863552"), IMG("1511285560929-80b456fea0bc"), IMG("1522673607200-164d1b6ce486")];
        try {
            const sd = JSON.parse(localStorage.getItem(DRAFT_INV_KEY) || "null");
            if (sd && sd.category === wizardState.category && sd.title) {
                const elT = document.getElementById("f-title"); if (elT && !elT.value) elT.value = sd.title;
            }
        } catch {}
    }
    renderPhotoSlots();
    populateMusicDropdown(tObj.defaultAudio || "");
    bindInvFormAutoSave();
    setWizardStep(2);
}

function bindInvFormAutoSave() {
    const form = document.getElementById("full-invitation-form");
    if (!form || wizardState.isEdit) return;
    form.oninput = () => {
        clearTimeout(invDraftSaveTimer);
        invDraftSaveTimer = setTimeout(() => {
            try {
                const title = document.getElementById("f-title")?.value || "";
                if (title) localStorage.setItem(DRAFT_INV_KEY, JSON.stringify({ category: wizardState.category, title }));
            } catch {}
        }, 700);
    };
}

function renderPhotoSlots() {
    document.getElementById("photo-upload-slots").innerHTML = wizardState.photoSlots.map((src, i) => `<div class="app-card border rounded-2xl p-2 text-center space-y-1.5 relative">${i>0?`<button type="button" onclick="wizardState.photoSlots.splice(${i},1);renderPhotoSlots();" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white text-[10px]"><i class="fa-solid fa-xmark"></i></button>`:""}<span class="text-[10px] font-bold app-accent block">${i===0?"★ Sampul Utama (9:16)":"Polaroid #"+i}</span><img src="${src}" class="w-full h-24 object-cover rounded-xl"><label class="block app-btn-sec py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"><i class="fa-solid fa-crop-simple mr-1"></i>Pilih &amp; Crop<input type="file" accept="image/*" class="hide" onchange="pickCroppedInvPhoto(this,${i})"></label></div>`).join("");
}
function addGalleryPhotoSlot() { wizardState.photoSlots.push(IMG("1522673607200-164d1b6ce486")); renderPhotoSlots(); }
function pickCroppedInvPhoto(inp, idx) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    const isCover = idx === 0;
    openImageCropper(file, isCover ? 9 / 16 : 4 / 5, isCover ? "Atur Foto Sampul Utama (9:16)" : "Atur Foto Polaroid Galeri (4:5)", isCover ? 720 : 680, isCover ? 1280 : 850, async (dataUrl) => {
        showLoading("Mengunggah foto...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: isCover ? "cover" : "gal" });
        hideLoading();
        if (up && up.ok && up.url) { wizardState.photoSlots[idx] = up.url; renderPhotoSlots(); showToast("Foto tersimpan sesuai potongan!"); }
        else showToast("Gagal mengunggah foto.", "error");
    });
}
function addStoryFieldRow(t="",y="",d="") {
    const div = document.createElement("div"); div.className = "grid sm:grid-cols-3 gap-2 app-card p-2.5 rounded-xl border story-row";
    div.innerHTML = `<input type="text" placeholder="Judul momen" value="${esc(t)}" class="st-t app-input !py-2"><input type="text" placeholder="Tahun" value="${esc(y)}" class="st-y app-input !py-2"><div class="flex gap-1.5"><input type="text" placeholder="Cerita singkat Anda" value="${esc(d)}" class="st-d app-input !py-2 flex-1"><button type="button" onclick="this.closest('.story-row').remove()" class="px-2.5 bg-red-600/15 text-red-500 rounded-xl text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
    document.getElementById("story-rows-container").appendChild(div);
}
function addBankFieldRow(bk="BCA",no="",h="") {
    const div = document.createElement("div"); div.className = "grid sm:grid-cols-3 gap-2 app-card p-2.5 rounded-xl border bank-row";
    div.innerHTML = `<select class="bk-n app-input !py-2 font-bold">${Object.keys(BANK_LOGOS).map(k=>`<option value="${k}" ${k===bk?"selected":""}>${k}</option>`).join("")}</select><input type="text" placeholder="No. Rekening Anda" value="${esc(no)}" class="bk-no app-input !py-2"><div class="flex gap-1.5"><input type="text" placeholder="Atas nama Anda" value="${esc(h)}" class="bk-h app-input !py-2 flex-1"><button type="button" onclick="this.closest('.bank-row').remove()" class="px-2.5 bg-red-600/15 text-red-500 rounded-xl text-xs"><i class="fa-solid fa-trash"></i></button></div>`;
    document.getElementById("bank-rows-container").appendChild(div);
}
function autoFillDemoData() {
    const d = buildDemoInvitation(wizardState.category, wizardState.theme);
    const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
    setV("f-opening-greeting", d.greeting); setV("f-opening-quote", d.introText);
    setV("f-title", d.title); setV("f-groom", d.groomName); setV("f-groom-ig", d.groomIg); setV("f-groom-parents", d.groomParents);
    setV("f-bride", d.brideName); setV("f-bride-ig", d.brideIg); setV("f-bride-parents", d.brideParents);
    setV("f-age", d.age || d.birthDate); setV("f-sub", d.subTitle);
    setVenueDropdownValue("akad", d.akadVenue); setV("f-akad-address", d.akadAddress); setV("f-akad-date", d.akadDate); setV("f-akad-time", d.akadTime); setV("f-akad-map", d.akadMap);
    setVenueDropdownValue("resepsi", d.resepsiVenue); setV("f-resepsi-address", d.resepsiAddress); setV("f-resepsi-date", d.resepsiDate); setV("f-resepsi-time", d.resepsiTime); setV("f-resepsi-map", d.resepsiMap);
    setV("f-closing-title", d.closingTitle); setV("f-closing-text", d.closingText);
    showToast("Contoh data terisi!", "info");
}

function openEditInvitation(invId, isAdminDirect = false) {
    const inv = db.invitations.find(i => String(i.id) === String(invId));
    if (!inv) return showToast("Undangan tidak ditemukan.", "error");
    if (!isAdminDirect) {
        if (inv.status !== "Aktif") return showToast("Undangan baru bisa direvisi setelah disetujui Admin.", "error");
        if ((inv.editCount || 0) >= 2) return showToast("Kuota revisi maksimal (2 kali) sudah habis.", "error");
    }
    currentViewName = "wizard";
    wizardState = {
        isEdit: true, adminDirectEdit: !!isAdminDirect, editInvId: inv.id, isCabangBypass: false,
        category: inv.category, theme: inv.theme,
        photoSlots: [...(inv.photos || [])], couplePhoto: inv.couplePhoto || IMG("1519741497674-611481863552"),
        groomPhoto: inv.groomPhoto || "./assets/model-pria.jpg", bridePhoto: inv.bridePhoto || "./assets/model-wanita.jpg",
        customAudioUrl: inv.audioUrl || "", customAudioTitle: inv.audioTitle || "", hiddenFields: inv.hiddenFields || [],
        sections: Object.assign({ sesi2: !!inv.resepsiVenue || !!inv.resepsiDate, story: !!(inv.stories && inv.stories.length), bank: !!(inv.banks && inv.banks.length), music: !!inv.audioUrl, closing: inv.closingText !== "" }, inv.sections || {})
    };
    hideAllViews(); document.getElementById("view-wizard").classList.remove("hide");
    renderHeaderActions(); pushBackGuard();
    const pr = getThemePricing(getSelectedThemeObj());
    document.getElementById("wiz-heading").innerText = isAdminDirect
        ? `Edit Langsung (Tanpa Limit) — ${inv.title}`
        : `Ajukan Revisi ke-${(inv.editCount || 0) + 1} (Sisa Kuota: ${2 - (inv.editCount || 0)}x)`;
    document.getElementById("btn-submit-inv").innerText = isAdminDirect ? "Simpan Perubahan Langsung" : `Kirim Revisi ke-${(inv.editCount || 0) + 1}`;
    document.getElementById("btn-change-theme-step").classList.toggle("hide", !isAdminDirect);
    document.getElementById("form-badge-cat").innerText = inv.category; document.getElementById("form-badge-theme").innerText = inv.theme;
    document.getElementById("form-badge-price").innerText = fmtRp(inv.price || pr.price);
    const defOpen = getDefaultOpeningText(inv.category, getSelectedThemeObj()), defClose = getDefaultClosingText(inv.category);
    const setV = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ""; };
    setV("f-opening-greeting", inv.greeting || defOpen.greeting); setV("f-opening-quote", inv.introText || defOpen.quote);
    renderDynamicMainFields({ "f-title":inv.title, "f-groom":inv.groomName, "f-groom-ig":inv.groomIg, "f-groom-parents":inv.groomParents, "f-bride":inv.brideName, "f-bride-ig":inv.brideIg, "f-bride-parents":inv.brideParents, "f-age":inv.age||inv.birthDate, "f-sub":inv.subTitle });
    ["sesi2","story","bank","music","closing"].forEach(k => toggleWizardSection(k, wizardState.sections[k]));
    document.getElementById("toggle-countdown").checked = inv.showCountdown !== false; document.getElementById("toggle-wishes").checked = inv.showWishes !== false;
    setVenueDropdownValue("akad", inv.akadVenue || ""); setV("f-akad-address", inv.akadAddress); setV("f-akad-date", inv.akadDate); setV("f-akad-time", inv.akadTime); setV("f-akad-map", inv.akadMap);
    setVenueDropdownValue("resepsi", inv.resepsiVenue || ""); setV("f-resepsi-address", inv.resepsiAddress); setV("f-resepsi-date", inv.resepsiDate); setV("f-resepsi-time", inv.resepsiTime); setV("f-resepsi-map", inv.resepsiMap);
    setV("f-closing-title", inv.closingTitle || defClose.title); setV("f-closing-text", inv.closingText !== undefined ? inv.closingText : defClose.text);
    document.getElementById("story-rows-container").innerHTML = ""; (inv.stories||[]).forEach(s => addStoryFieldRow(s.title, s.year, s.desc));
    document.getElementById("bank-rows-container").innerHTML = ""; (inv.banks||[]).forEach(b => addBankFieldRow(b.bank, b.no, b.holder));
    renderPhotoSlots(); populateMusicDropdown(inv.audioUrl); setWizardStep(2);
}

async function saveInvitationDraft(e) {
    e.preventDefault(); stopPreviewAudio(); setBtnLoading("btn-submit-inv", true, "Mengirim...");
    const getV = (id) => { const el = document.getElementById(id); return (el && !wizardState.hiddenFields.includes(id)) ? el.value.trim() : ""; };
    const s = wizardState.sections, pr = getThemePricing(getSelectedThemeObj()), curU = getCurrentUserObj();
    const cabBrand = (curU && curU.role === "cabang") ? ((curU.brandName && curU.brandName.trim()) ? curU.brandName.trim() : curU.name) : "";

    const selectedAudioUrl = s.music ? (wizardState.customAudioUrl || document.getElementById("f-preset-audio").value) : "";
    const payload = {
        category: wizardState.category, theme: wizardState.theme,
        price: pr.price, origPrice: pr.origPrice, brandName: cabBrand,
        greeting: document.getElementById("f-opening-greeting").value.trim(),
        introText: document.getElementById("f-opening-quote").value.trim(),
        title: getV("f-title"), groomName: getV("f-groom"), groomIg: getV("f-groom-ig"), groomParents: getV("f-groom-parents"),
        brideName: getV("f-bride"), brideIg: getV("f-bride-ig"), brideParents: getV("f-bride-parents"), age: getV("f-age"), birthDate: getV("f-age"), subTitle: getV("f-sub"),
        couplePhoto: wizardState.couplePhoto, groomPhoto: wizardState.groomPhoto, bridePhoto: wizardState.bridePhoto,
        akadVenue: getVenueFieldValue("akad"), akadAddress: getV("f-akad-address"), akadDate: getV("f-akad-date"), akadTime: getV("f-akad-time"), akadMap: getV("f-akad-map"),
        resepsiVenue: s.sesi2 ? getVenueFieldValue("resepsi") : "", resepsiAddress: s.sesi2 ? getV("f-resepsi-address") : "",
        resepsiDate: s.sesi2 ? getV("f-resepsi-date") : "", resepsiTime: s.sesi2 ? getV("f-resepsi-time") : "", resepsiMap: s.sesi2 ? getV("f-resepsi-map") : "",
        stories: s.story ? Array.from(document.querySelectorAll(".story-row")).map(r=>({title:r.querySelector(".st-t").value.trim(),year:r.querySelector(".st-y").value.trim(),desc:r.querySelector(".st-d").value.trim()})).filter(x=>x.title) : [],
        banks: s.bank ? Array.from(document.querySelectorAll(".bank-row")).map(r=>({bank:r.querySelector(".bk-n").value,no:r.querySelector(".bk-no").value.trim(),holder:r.querySelector(".bk-h").value.trim()})).filter(x=>x.no) : [],
        photos: [...wizardState.photoSlots],
        audioUrl: selectedAudioUrl,
        audioTitle: wizardState.customAudioTitle || "",
        closingTitle: s.closing ? getV("f-closing-title") : "", closingText: s.closing ? getV("f-closing-text") : "",
        hiddenFields: [...wizardState.hiddenFields], sections: Object.assign({}, s),
        showCountdown: document.getElementById("toggle-countdown").checked, showWishes: document.getElementById("toggle-wishes").checked
    };

    if (wizardState.isEdit) {
        if (wizardState.adminDirectEdit) {
            const orig = db.invitations.find(i => String(i.id) === String(wizardState.editInvId));
            const res = await apiAction({
                action: "upsert_invitation",
                invitation: Object.assign({}, orig, payload, { brandName: (orig && orig.brandName) || payload.brandName }),
                adminActionLog: `Mengedit langsung undangan "${payload.title}" (@${orig ? orig.owner : ""})`
            });
            setBtnLoading("btn-submit-inv", false);
            if (!res || !res.ok) return showToast((res && res.message) || "Gagal menyimpan perubahan.", "error");
            showToast("Perubahan undangan langsung tersimpan & aktif!");
            return routeDashboard();
        }
        const res = await apiAction({ action: "submit_revision", id: wizardState.editInvId, revision: payload });
        setBtnLoading("btn-submit-inv", false);
        if (!res || !res.ok) return showToast((res && res.message) || "Gagal mengajukan revisi.", "error");
        showToast("Revisi terkirim! Menunggu persetujuan Admin.");
        return routeDashboard();
    }

    const genKey = Math.random().toString(36).slice(2, 10);
    const newId = Date.now();
    const newInv = {
        id: newId, createdAt: newId, owner: currentSessionUser, clientKey: genKey,
        status: wizardState.isCabangBypass ? "Aktif" : "Menunggu Pembayaran",
        editCount: 0, uniqueCode: getDeterministicUniqueCode(newId),
        paymentProof: "", guests: ["Tamu Kehormatan"], sentGuests: [], waTemplate: "", wishes: [], ...payload
    };
    newInv.totalPay = Number(newInv.price || 99000) + newInv.uniqueCode;

    const resInv = await apiAction({ action: "upsert_invitation", invitation: newInv, deductQuotaFrom: wizardState.isCabangBypass ? currentSessionUser : "" });
    setBtnLoading("btn-submit-inv", false);
    if (!resInv || !resInv.ok) return showToast((resInv && resInv.message) || "Gagal menyimpan undangan.", "error");
    if (!Array.isArray(db.invitations)) db.invitations = [];
    if (!db.invitations.some(i => String(i.id) === String(newInv.id))) {
        db.invitations.unshift(newInv);
        idbSet("db_snapshot", db);
    }
    try { localStorage.removeItem(DRAFT_INV_KEY); } catch {}
    if (wizardState.isCabangBypass) {
        showToast("Undangan klien langsung AKTIF (-1 Kuota)! Klik Link Klien untuk portal tamu.");
        return routeDashboard();
    }
    openUnifiedPayment("inv", newInv.id);
}

// ================= 2. DAFTAR TAMU & PORTAL MANDIRI CLIENT CABANG =================
let activeGlId = null, guestFilterMode = "all", guestSyncTimer = null;
let sharePayload = { invId: null, guestName: "", text: "", url: "", img: "", title: "", confirmedSent: false };
let activeClientShare = { url: "", waText: "" };

function getActiveGuestListInvitation() {
    if (clientPortalState.active && clientPortalState.invitation) return clientPortalState.invitation;
    return db.invitations.find(i => String(i.id) === String(activeGlId)) || null;
}

async function openClientPortalShareModal(invId) {
    const inv = db.invitations.find(i => String(i.id) === String(invId)); if (!inv) return;
    if (!inv.clientKey) {
        const newKey = Math.random().toString(36).slice(2, 10);
        inv.clientKey = newKey;
        showLoading("Membuat kunci akses portal klien...");
        await apiAction({ action: "sync_guests", id: inv.id, setClientKey: newKey });
        hideLoading();
    }
    const brand = getInvBrandInfo(inv);
    const portalUrl = `${getCleanBaseUrl()}?client=${inv.id}&key=${encodeURIComponent(inv.clientKey)}`;
    const waText = `Halo Kak! Undangan digital *${inv.title}* sudah aktif 🎉\n\nSilakan buka tautan khusus ini untuk melihat preview undangan, input daftar tamu (satu per satu atau massal), dan bagikan ke WhatsApp:\n${portalUrl}\n\n_${brand.waFooter}_`;
    activeClientShare = { url: portalUrl, waText };
    document.getElementById("cp-modal-inv-title").innerText = `${inv.title} (${inv.category})`;
    document.getElementById("cp-link-input").value = portalUrl;
    document.getElementById("cp-wa-preview").value = waText;
    document.getElementById("modal-client-portal").classList.remove("hide");
    pushBackGuard();
}
function copyClientPortalLinkOnly() { navigator.clipboard.writeText(activeClientShare.url); showToast("Tautan Portal Tamu Klien disalin!"); }
function openClientPortalDirect() { if (activeClientShare.url) window.open(activeClientShare.url, "_blank"); }
function sendClientPortalViaWA() { window.open(`https://wa.me/?text=${encodeURIComponent(activeClientShare.waText)}`, "_blank"); document.getElementById("modal-client-portal").classList.add("hide"); }

function openClientPortalView(inv, brandName) {
    const cleanBrand = String(brandName || inv.brandName || "Mitra Cabang").trim();
    clientPortalState = { active: true, invId: inv.id, key: inv.clientKey || "", brandName: cleanBrand, invitation: inv };
    activeGlId = inv.id; currentViewName = "guestlist"; guestFilterMode = "all";
    if (!Array.isArray(inv.guests)) inv.guests = [];
    if (!Array.isArray(inv.sentGuests)) inv.sentGuests = [];
    hideAllViews(); document.getElementById("view-guestlist").classList.remove("hide");
    document.getElementById("gl-client-portal-banner").classList.remove("hide");
    document.getElementById("gl-back-btn").classList.add("hide");

    const kopEl = document.getElementById("gl-portal-kop-badge");
    if (kopEl) kopEl.innerText = `${cleanBrand.toUpperCase()} • POWERED BY MR UNDANGAN`;
    document.getElementById("gl-portal-brand-title").innerText = `Undangan: ${inv.title}`;

    const brand = getInvBrandInfo(Object.assign({}, inv, { brandName: cleanBrand }));
    document.getElementById("gl-search-input").value = "";
    document.getElementById("gl-wa-template").value = inv.waTemplate || DEFAULT_WA_TEMPLATE.replace("[BRAND_FOOTER]", brand.waFooter);
    document.getElementById("gl-bulk-panel").classList.add("hide");
    document.getElementById("gl-template-panel").classList.add("hide");
    renderHeaderActions(); setGuestFilter("all"); renderGuestListStatsAndRows();
}
function previewActiveClientInv() { const inv = getActiveGuestListInvitation(); if (inv) openGuestViewWithObject(inv, "Tamu Kehormatan", false); }

function openGuestListManager(id) {
    activeGlId = id; currentViewName = "guestlist"; guestFilterMode = "all";
    const inv = db.invitations.find(i => String(i.id) === String(id)); if (!inv) return;
    if (!Array.isArray(inv.guests)) inv.guests = [];
    if (!Array.isArray(inv.sentGuests)) inv.sentGuests = [];
    const brand = getInvBrandInfo(inv);
    hideAllViews(); document.getElementById("view-guestlist").classList.remove("hide");
    document.getElementById("gl-client-portal-banner").classList.add("hide");
    document.getElementById("gl-back-btn").classList.remove("hide");
    document.getElementById("gl-search-input").value = "";
    document.getElementById("gl-wa-template").value = inv.waTemplate || DEFAULT_WA_TEMPLATE.replace("[BRAND_FOOTER]", brand.waFooter);
    document.getElementById("gl-bulk-panel").classList.add("hide");
    document.getElementById("gl-template-panel").classList.add("hide");
    renderHeaderActions(); pushBackGuard(); setGuestFilter("all"); renderGuestListStatsAndRows();
}
function toggleGuestPanel(id) {
    ["gl-bulk-panel", "gl-template-panel"].forEach(pid => {
        const el = document.getElementById(pid);
        if (pid === id) el.classList.toggle("hide"); else el.classList.add("hide");
    });
}
function setGuestFilter(mode) {
    guestFilterMode = mode;
    document.querySelectorAll(".gl-f-btn").forEach(b => {
        const active = b.dataset.f === mode;
        b.className = `gl-f-btn px-3 py-1.5 rounded-xl text-[11px] font-bold ${active ? "gold-pill-btn" : "app-btn-sec"}`;
    });
    renderGuestListRows();
}
function scheduleGuestCloudSync(inv) {
    if (!clientPortalState.active) idbSet("db_snapshot", db);
    clearTimeout(guestSyncTimer);
    guestSyncTimer = setTimeout(() => {
        apiAction({
            action: "sync_guests", id: inv.id, guests: inv.guests,
            sentGuests: inv.sentGuests || [], waTemplate: inv.waTemplate || "",
            fromClientPortal: clientPortalState.active, clientKey: clientPortalState.key || ""
        });
    }, 350);
}
function renderGuestListStatsAndRows() {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    const wishes = inv.wishes || [];
    document.getElementById("rsvp-hadir").innerText = wishes.filter(w => w.rsvp === "Hadir").length;
    document.getElementById("rsvp-tidak").innerText = wishes.filter(w => w.rsvp === "Tidak Hadir").length;
    document.getElementById("rsvp-netral").innerText = wishes.filter(w => w.rsvp !== "Hadir" && w.rsvp !== "Tidak Hadir").length;
    renderGuestListRows();
}
function renderGuestListRows() {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    if (!Array.isArray(inv.guests)) inv.guests = [];
    if (!Array.isArray(inv.sentGuests)) inv.sentGuests = [];
    const sentSet = new Set(inv.sentGuests.map(s => String(s).toLowerCase()));
    const q = (document.getElementById("gl-search-input")?.value || "").trim().toLowerCase();
    const sentCount = inv.guests.filter(g => sentSet.has(String(g).toLowerCase())).length;
    document.getElementById("gl-inv-subtitle").innerText = `${inv.title} • ${inv.guests.length} Tamu (${sentCount} Terkirim)`;

    const rows = inv.guests.map((g, idx) => ({ name: g, idx, isSent: sentSet.has(String(g).toLowerCase()) }))
        .filter(item => (!q || item.name.toLowerCase().includes(q)) && (guestFilterMode === "all" || (guestFilterMode === "sent" && item.isSent) || (guestFilterMode === "unsent" && !item.isSent)));

    const box = document.getElementById("gl-rows-container");
    if (!rows.length) {
        box.innerHTML = `<p class="text-xs app-muted text-center py-8 app-card-soft rounded-2xl border border-dashed">${inv.guests.length ? "Tidak ada tamu yang cocok dengan filter." : "Belum ada daftar tamu. Tambahkan nama tamu di atas."}</p>`;
        return;
    }
    box.innerHTML = rows.map(item => `
        <div class="app-card-soft border rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors duration-300 ${item.isSent ? "guest-sent-row" : ""}">
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <span class="w-6 h-6 rounded-full shrink-0 text-[11px] font-bold flex items-center justify-center ${item.isSent ? "bg-emerald-500 text-white" : "app-accent-bg app-accent"}">${item.isSent ? "✓" : item.idx + 1}</span>
                <input type="text" value="${esc(item.name)}" onchange="updateGuestName(${item.idx},this.value)" class="bg-transparent text-xs font-bold focus:outline-none flex-1 min-w-0">
                ${item.isSent ? `<span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold whitespace-nowrap">✓ Terkirim</span>` : ""}
            </div>
            <div class="flex flex-wrap gap-1.5">
                <button onclick="openGuestView(${inv.id},'${esc(item.name)}')" class="px-2.5 py-1.5 rounded-lg app-btn-sec text-[11px] font-semibold">Lihat</button>
                <button onclick="copyUniqueGuestUrl(${inv.id},'${esc(item.name)}')" class="px-2.5 py-1.5 rounded-lg app-card border text-[11px] app-accent font-semibold">Salin</button>
                <button onclick="openSocialShareModal(${inv.id},'${esc(item.name)}')" class="${item.isSent ? "bg-emerald-600 text-white font-bold" : "gold-pill-btn"} px-3 py-1.5 rounded-lg text-[11px]"><i class="fa-solid fa-paper-plane mr-1"></i>${item.isSent ? "Kirim Lagi" : "Kirim"}</button>
                <button onclick="deleteGuestItem(${item.idx})" class="px-2.5 py-1.5 rounded-lg bg-red-600/15 text-red-500 text-[11px]"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join("");
}
function addGuestToInvitation(e) {
    if (e) e.preventDefault();
    const inp = document.getElementById("gl-new-name"), name = inp.value.trim(); if (!name) return;
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    if (!Array.isArray(inv.guests)) inv.guests = [];
    inv.guests.unshift(name); inp.value = "";
    renderGuestListRows(); scheduleGuestCloudSync(inv); showToast(`"${name}" ditambahkan!`);
}
function addBulkGuests() {
    const ta = document.getElementById("gl-bulk-textarea"), names = ta.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!names.length) return showToast("Tempel minimal 1 nama tamu terlebih dahulu.", "error");
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    if (!Array.isArray(inv.guests)) inv.guests = [];
    inv.guests = [...names, ...inv.guests]; ta.value = "";
    document.getElementById("gl-bulk-panel").classList.add("hide");
    renderGuestListRows(); scheduleGuestCloudSync(inv); showToast(`${names.length} tamu sekaligus berhasil ditambahkan!`);
}
function saveWaTemplate() {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    const brand = getInvBrandInfo(inv);
    inv.waTemplate = document.getElementById("gl-wa-template").value.trim() || DEFAULT_WA_TEMPLATE.replace("[BRAND_FOOTER]", brand.waFooter);
    document.getElementById("gl-template-panel").classList.add("hide");
    scheduleGuestCloudSync(inv); showToast("Template pesan WhatsApp disimpan!");
}
function resetWaTemplate() {
    const inv = getActiveGuestListInvitation(), brand = getInvBrandInfo(inv);
    document.getElementById("gl-wa-template").value = DEFAULT_WA_TEMPLATE.replace("[BRAND_FOOTER]", brand.waFooter);
    showToast("Template dikembalikan ke default.", "info");
}
function updateGuestName(i, v) {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    const oldName = inv.guests[i], newName = v.trim(); if (!newName) return;
    inv.guests[i] = newName;
    if (Array.isArray(inv.sentGuests)) inv.sentGuests = inv.sentGuests.map(s => s.toLowerCase() === String(oldName).toLowerCase() ? newName : s);
    scheduleGuestCloudSync(inv);
}
function deleteGuestItem(i) {
    const inv = getActiveGuestListInvitation(); if (!inv) return;
    const removed = inv.guests.splice(i, 1)[0];
    if (Array.isArray(inv.sentGuests)) inv.sentGuests = inv.sentGuests.filter(s => s.toLowerCase() !== String(removed).toLowerCase());
    renderGuestListRows(); scheduleGuestCloudSync(inv);
}
function markGuestAsSent(invId, guestName) {
    const inv = (clientPortalState.active && clientPortalState.invitation) ? clientPortalState.invitation : db.invitations.find(x => String(x.id) === String(invId));
    if (!inv) return;
    if (!Array.isArray(inv.sentGuests)) inv.sentGuests = [];
    if (!inv.sentGuests.some(s => s.toLowerCase() === String(guestName).toLowerCase())) {
        inv.sentGuests.push(guestName);
        if (currentViewName === "guestlist" && String(activeGlId) === String(invId)) renderGuestListRows();
        scheduleGuestCloudSync(inv);
    }
}
const buildGuestUrl = (id, g) => `${getCleanBaseUrl()}?inv=${id}&to=${encodeURIComponent(g)}`;
function formatWaMessage(inv, guestName, url) {
    const brand = getInvBrandInfo(inv);
    const tpl = (inv.waTemplate && inv.waTemplate.trim()) ? inv.waTemplate : DEFAULT_WA_TEMPLATE;
    return tpl.replace(/\[NAMA_TAMU\]/g, guestName).replace(/\[JUDUL\]/g, inv.title || "Acara Spesial").replace(/\[LINK\]/g, url).replace(/\[BRAND_FOOTER\]/g, brand.waFooter);
}
function copyUniqueGuestUrl(id, g) { navigator.clipboard.writeText(buildGuestUrl(id, g)); markGuestAsSent(id, g); showToast(`Tautan untuk ${g} disalin & ditandai Terkirim!`); }

function openSocialShareModal(id, g) {
    const inv = (clientPortalState.active && clientPortalState.invitation) ? clientPortalState.invitation : db.invitations.find(i => String(i.id) === String(id));
    if (!inv) return;
    const url = buildGuestUrl(id, g), coverImg = (inv.photos && inv.photos[0]) || "./logo.png";
    const text = formatWaMessage(inv, g, url);
    sharePayload = { invId: id, guestName: g, text, url, img: coverImg, title: `Undangan ${inv.title}`, confirmedSent: false };
    document.getElementById("share-cover-preview").src = coverImg;
    document.getElementById("share-target-guest").innerText = g;
    document.getElementById("share-preview-text").value = text;
    document.getElementById("modal-share-sosmed").classList.remove("hide");
    pushBackGuard();
}

function cancelSocialShareModal() {
    document.getElementById("modal-share-sosmed").classList.add("hide");
    if (!sharePayload.confirmedSent) {
        showToast("Pengiriman dibatalkan — status tamu tetap belum terkirim.", "info");
    }
}

async function launchNativeShareWithPhoto() {
    if (!navigator.share) return launchSocialShare("wa");
    setBtnLoading("btn-share-native", true, "Menyiapkan foto...");
    try {
        let shareObj = { title: sharePayload.title, text: sharePayload.text };
        if (sharePayload.img && navigator.canShare) {
            const resp = await fetch(sharePayload.img), blob = await resp.blob();
            const file = new File([blob], "undangan-sampul.jpg", { type: blob.type || "image/jpeg" });
            if (navigator.canShare({ files: [file] })) shareObj.files = [file];
        }
        await navigator.share(shareObj);
        sharePayload.confirmedSent = true;
        markGuestAsSent(sharePayload.invId, sharePayload.guestName);
        document.getElementById("modal-share-sosmed").classList.add("hide");
        showToast(`Undangan untuk ${sharePayload.guestName} ditandai Terkirim!`);
    } catch (err) {
        if (err && err.name === "AbortError") {
            showToast("Berbagi dibatalkan — status tamu tidak berubah.", "info");
        } else {
            launchSocialShare("wa");
        }
    } finally {
        setBtnLoading("btn-share-native", false);
    }
}

function launchSocialShare(p) {
    const enc = encodeURIComponent(sharePayload.text);
    sharePayload.confirmedSent = true;
    markGuestAsSent(sharePayload.invId, sharePayload.guestName);
    if (p === "wa") window.open(`https://wa.me/?text=${enc}`, "_blank");
    else if (p === "tg") window.open(`https://t.me/share/url?url=${encodeURIComponent(sharePayload.url)}&text=${enc}`, "_blank");
    else { navigator.clipboard.writeText(sharePayload.text); showToast("Teks & tautan disalin! Silakan Paste di Instagram/Messenger."); }
    document.getElementById("modal-share-sosmed").classList.add("hide");
}
