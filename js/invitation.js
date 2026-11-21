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

// ================= UI FEEDBACK: LOADING, TOAST, CONFIRM, SPLASH, TEMA =================
let _toastTimer = null;
function showLoading(txt = "Memproses...") {
    const bar = document.getElementById("global-loading-bar"), el = document.getElementById("global-loading-text");
    if (el) el.innerText = txt;
    if (bar) bar.classList.remove("hide");
}
function hideLoading() { document.getElementById("global-loading-bar")?.classList.add("hide"); }

function showToast(msg, type = "success") {
    const el = document.getElementById("app-toast"), txt = document.getElementById("app-toast-msg"), ic = document.getElementById("app-toast-icon");
    if (!el || !txt) return;
    txt.innerText = msg;
    if (ic) {
        ic.className = type === "error"
            ? "fa-solid fa-circle-exclamation text-red-500 text-base"
            : type === "info"
                ? "fa-solid fa-circle-info app-accent text-base"
                : "fa-solid fa-circle-check text-emerald-500 text-base";
    }
    el.classList.remove("hide");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.add("hide"), 3200);
}

function showConfirm(title, msg, icon = "fa-solid fa-circle-question", okText = "Ya, Lanjutkan") {
    return new Promise((resolve) => {
        const m = document.getElementById("app-confirm-modal"); if (!m) return resolve(confirm(msg));
        document.getElementById("app-confirm-title").innerText = title || "Konfirmasi";
        document.getElementById("app-confirm-msg").innerText = msg || "";
        document.getElementById("app-confirm-icon").className = icon;
        const okBtn = document.getElementById("app-confirm-ok"), canBtn = document.getElementById("app-confirm-cancel");
        okBtn.innerText = okText;
        const done = (val) => { m.classList.add("hide"); resolve(val); };
        okBtn.onclick = () => done(true);
        canBtn.onclick = () => done(false);
        m.classList.remove("hide");
    });
}

function setBtnLoading(btnOrId, isLoading, text = "Memproses...") {
    const el = typeof btnOrId === "string" ? document.getElementById(btnOrId) : btnOrId;
    if (!el) return;
    if (isLoading) {
        if (!el.dataset.origHtml) el.dataset.origHtml = el.innerHTML;
        el.disabled = true;
        el.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i>${text}`;
    } else {
        el.disabled = false;
        if (el.dataset.origHtml) { el.innerHTML = el.dataset.origHtml; delete el.dataset.origHtml; }
    }
}

function togglePassVis(id, btn) {
    const inp = document.getElementById(id); if (!inp) return;
    const isP = inp.type === "password";
    inp.type = isP ? "text" : "password";
    if (btn) btn.innerHTML = `<i class="fa-regular fa-${isP ? "eye-slash" : "eye"}"></i>`;
}

function hideHelloSplash() {
    const sp = document.getElementById("ios-hello-splash");
    if (!sp || sp.classList.contains("hide")) return;
    sp.classList.add("splash-out");
    setTimeout(() => sp.classList.add("hide"), 520);
}
function showEnvelopeLoader(txt = "Membuka Undangan...") {
    const el = document.getElementById("envelope-loader"), t = document.getElementById("envelope-loader-text");
    if (t) t.innerText = txt;
    if (el) el.classList.remove("hide");
}
function hideEnvelopeLoader() { document.getElementById("envelope-loader")?.classList.add("hide"); }

function applyAppTheme(theme, save = true) {
    const valid = ["light", "dark", "gold", "blue", "black", "orange"];
    const t = valid.includes(theme) ? theme : "light";
    document.documentElement.setAttribute("data-app-theme", t);
    if (save) localStorage.setItem(APP_THEME_KEY, t);
    document.querySelectorAll(".theme-opt-row").forEach(row => {
        const chk = row.querySelector(".theme-chk");
        if (chk) chk.classList.toggle("hide", row.dataset.topt !== t);
    });
}
function cycleAppThemeQuick() {
    const order = ["light", "dark", "gold", "blue", "black", "orange"];
    const cur = localStorage.getItem(APP_THEME_KEY) || "light";
    applyAppTheme(order[(order.indexOf(cur) + 1) % order.length], true);
}

// ================= HELPER USER, TEMA, HARGA, FAVORIT =================
function getCurrentUserObj() {
    if (!currentSessionUser) return null;
    return (db.users || []).find(u => String(u.username || "").toLowerCase() === String(currentSessionUser).toLowerCase()) || null;
}

function getMasterBanksList() {
    const ms = db.masterSettings || {};
    if (Array.isArray(ms.banks) && ms.banks.length) return ms.banks;
    if (ms.bankNo) return [{ bank: ms.bankName || "DANA", no: ms.bankNo, holder: ms.bankHolder || "Mr Undangan" }];
    return [{ bank: "DANA", no: "085117488828", holder: "Kausar.pictures" }];
}

function getInvBrandInfo(inv) {
    const b = (inv && inv.brandName && String(inv.brandName).trim()) ? String(inv.brandName).trim() : "";
    if (b) return { topLabel: b, footerMain: b, footerSub: "Powered by Mr Undangan", waFooter: `${b} — Powered by Mr Undangan` };
    return { topLabel: "MR UNDANGAN", footerMain: "Mr Undangan", footerSub: "Powered by Kausar.pictures", waFooter: "Mr Undangan — Powered by Kausar.pictures" };
}

function deepCloneSafe(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch { return Object.assign({}, obj); }
}

function getMergedThemes(cat, includeHidden = false) {
    const builtIn = (THEME_CATALOG[cat] || []).map(t => {
        const baseT = deepCloneSafe(t);
        const key = `${cat}::${baseT.name}`;
        const ov = deepCloneSafe((db.themeOverrides && db.themeOverrides[key]) || {});
        const isHidden = (db.hiddenThemes || []).includes(key);
        const merged = Object.assign({}, baseT, ov, { cat, key, isCustom: false, isHidden });
        merged.demoPhotos = Object.assign({}, baseT.demoPhotos || {}, ov.demoPhotos || {});
        merged.demoData = Object.assign({}, baseT.demoData || {}, ov.demoData || {});
        return merged;
    });
    const custom = (db.customThemes || []).filter(t => t.category === cat).map(t => {
        const baseT = deepCloneSafe(t);
        const merged = Object.assign({}, baseT, { cat, key: `custom::${baseT.id}`, isCustom: true, isHidden: false });
        merged.demoPhotos = Object.assign({}, baseT.demoPhotos || {});
        merged.demoData = Object.assign({}, baseT.demoData || {});
        return merged;
    });
    const all = [...custom, ...builtIn];
    return includeHidden ? all : all.filter(t => !t.isHidden);
}

function findThemeObject(cat, name) {
    const list = getMergedThemes(cat || "Pernikahan", true);
    return list.find(t => String(t.name).toLowerCase() === String(name || "").toLowerCase()) || list[0] || deepCloneSafe(THEME_CATALOG["Pernikahan"][0]);
}

function getThemePricing(tObj) {
    const price = Number((tObj && tObj.price) || 99000);
    const origPrice = Number((tObj && tObj.origPrice) || 0);
    const hasDisc = origPrice > price && price > 0;
    const discPct = hasDisc ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
    return { price, origPrice, hasDisc, discPct };
}

function getThemeCoverPair(cat, tObj) {
    const fb = (tObj && tObj.img) || IMG("1519741497674-611481863552");
    const src = (tObj && tObj.demoPhotos && tObj.demoPhotos.cover) || (tObj && tObj.customCover) || fb;
    return { src, fb };
}

function getThemeSlotPair(tObj, slotKey, _file, fallback) {
    const dp = (tObj && tObj.demoPhotos) || {};
    if (dp[slotKey]) return { src: dp[slotKey], fb: fallback };
    if (slotKey === "pria") return { src: "./assets/model-pria.jpg", fb: fallback };
    if (slotKey === "wanita") return { src: "./assets/model-wanita.jpg", fb: fallback };
    return { src: fallback, fb: fallback };
}

function getPortfolioThemeObj(docType, id) {
    const list = PORTFOLIO_CATALOG[docType] || PORTFOLIO_CATALOG.cv;
    const base = list.find(x => x.id === id) || list[0];
    const ov = (db.cvPriceOverrides && db.cvPriceOverrides[base.id]) || {};
    return Object.assign({}, base, ov);
}

function isItemFavorited(favKey) {
    const u = getCurrentUserObj();
    if (u && Array.isArray(u.favorites)) return u.favorites.some(f => f.favKey === favKey);
    try { return JSON.parse(localStorage.getItem("MR_LOCAL_FAVS") || "[]").some(f => f.favKey === favKey); } catch { return false; }
}

async function toggleFavoriteItem(ev, favObj) {
    if (ev) ev.stopPropagation();
    const u = getCurrentUserObj();
    let list = u ? [...(u.favorites || [])] : JSON.parse(localStorage.getItem("MR_LOCAL_FAVS") || "[]");
    const idx = list.findIndex(f => f.favKey === favObj.favKey);
    const added = idx === -1;
    if (added) list.unshift(favObj); else list.splice(idx, 1);

    document.querySelectorAll(`[data-fav-btn="${CSS.escape(favObj.favKey)}"]`).forEach(btn => {
        btn.classList.toggle("is-fav", added);
        btn.innerHTML = `<i class="fa-${added ? "solid" : "regular"} fa-heart"></i>`;
    });

    if (u) {
        u.favorites = list;
        if (typeof renderProfileFavoritesShelf === "function") renderProfileFavoritesShelf();
        apiAction({ action: "upsert_user", oldUsername: u.username, user: Object.assign({}, u, { favorites: list }) });
    } else {
        localStorage.setItem("MR_LOCAL_FAVS", JSON.stringify(list));
    }
    showToast(added ? "Disimpan ke Favorit!" : "Dihapus dari Favorit.", "info");
}

function buildMiniCoverCardHtml(cat, tObj, showFavBtn = true) {
    const cov = getThemeCoverPair(cat, tObj);
    const favKey = `inv::${cat}::${tObj.name}`;
    const isFav = isItemFavorited(favKey);
    const favObjStr = esc(JSON.stringify({ favKey, kind: "inv", cat, name: tObj.name }));
    return `
        <div class="relative aspect-[3/4] w-full overflow-hidden bg-zinc-900 select-none">
            <img src="${cov.src}" ${imgFbAttr(cov.fb)} loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent"></div>
            ${tObj.badge ? `<span class="absolute top-2 left-2 z-20 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-400 text-black uppercase shadow">${escHtml(tObj.badge)}</span>` : ""}
            ${showFavBtn ? `<button type="button" data-fav-btn="${esc(favKey)}" onclick="toggleFavoriteItem(event, JSON.parse('${favObjStr}'))" class="fav-heart-btn ${isFav ? "is-fav" : ""}" title="Simpan ke Favorit"><i class="fa-${isFav ? "solid" : "regular"} fa-heart"></i></button>` : ""}
            <div class="absolute inset-x-0 bottom-0 p-2.5 text-left">
                <span class="text-[8px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/20 text-white backdrop-blur">${escHtml(cat)}</span>
                <h4 class="font-bold text-xs text-white truncate mt-1">${escHtml(tObj.name)}</h4>
            </div>
        </div>
    `;
}

function buildPriceStripHtml(tObj, compact = true) {
    const pr = getThemePricing(tObj);
    return `
        <div class="px-2.5 py-2 bg-[#111115] text-white flex items-center justify-between gap-1 border-t border-white/10">
            <div class="leading-tight min-w-0">
                ${pr.hasDisc ? `<span class="block text-[9px] text-zinc-400 line-through">${fmtRp(pr.origPrice)}</span>` : ""}
                <strong class="text-xs text-amber-400 font-extrabold">${fmtRp(pr.price)}</strong>
            </div>
            ${pr.hasDisc ? `<span class="text-[8px] px-1.5 py-0.5 rounded bg-red-600 text-white font-extrabold shrink-0">-${pr.discPct}%</span>` : ""}
        </div>
    `;
}

// ================= INDEXEDDB CACHE RINGAN =================
function openMrIdb() {
    return new Promise((resolve) => {
        if (!window.indexedDB) return resolve(null);
        const req = indexedDB.open("MR_UNDANGAN_DB", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("kv");
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}
async function idbGet(key) {
    const dbi = await openMrIdb(); if (!dbi) return null;
    return new Promise((resolve) => {
        const tx = dbi.transaction("kv", "readonly");
        const req = tx.objectStore("kv").get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
    });
}
async function idbSet(key, val) {
    const dbi = await openMrIdb(); if (!dbi) return;
    return new Promise((resolve) => {
        const tx = dbi.transaction("kv", "readwrite");
        tx.objectStore("kv").put(val, key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}
async function idbRemove(key) {
    const dbi = await openMrIdb(); if (!dbi) return;
    return new Promise((resolve) => {
        const tx = dbi.transaction("kv", "readwrite");
        tx.objectStore("kv").delete(key);
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
    });
}

// ================= CLOUD SYNC & API =================
function applyPublicDb(data) {
    if (!data || typeof data !== "object") return;
    ["customThemes", "hiddenThemes", "themeOverrides", "cvPriceOverrides", "musicLibrary", "testimonials", "promoBanners", "masterSettings"].forEach(k => {
        if (data[k] !== undefined) db[k] = data[k];
    });
}
function applyServerDb(data) {
    if (!data || typeof data !== "object") return;
    applyPublicDb(data);
    ["users", "invitations", "portfolios", "chats", "adminLogs"].forEach(k => {
        if (Array.isArray(data[k])) db[k] = data[k];
    });
    idbSet("db_snapshot", db);
    idbSet("public_snapshot", {
        customThemes: db.customThemes,
        hiddenThemes: db.hiddenThemes,
        themeOverrides: db.themeOverrides,
        cvPriceOverrides: db.cvPriceOverrides,
        musicLibrary: db.musicLibrary,
        testimonials: db.testimonials,
        promoBanners: db.promoBanners,
        masterSettings: db.masterSettings
    });
}

async function fetchJsonWithTimeout(url, opts = {}, ms = 18000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, Object.assign({}, opts, { signal: ctrl.signal, cache: "no-store" }));
        clearTimeout(t);
        return await res.json();
    } catch {
        clearTimeout(t);
        return null;
    }
}

async function fetchPublicCloud() {
    const j = await fetchJsonWithTimeout(`${CLOUD_API_URL}?action=get_public&t=${Date.now()}`, {}, 14000);
    if (j && j.ok && j.data) {
        applyPublicDb(j.data);
        idbSet("public_snapshot", j.data);
        return true;
    }
    return false;
}

async function fetchFullCloud() {
    const url = `${CLOUD_API_URL}?action=get_full&username=${encodeURIComponent(currentSessionUser || "")}&token=${encodeURIComponent(currentSessionToken || "")}&guestId=${encodeURIComponent(guestChatId || "")}&t=${Date.now()}`;
    const j = await fetchJsonWithTimeout(url, {}, 18000);
    if (j && j.ok && j.data) {
        applyServerDb(j.data);
        return true;
    }
    return false;
}

async function fetchSingleInvitationFast(id) {
    const j = await fetchJsonWithTimeout(`${CLOUD_API_URL}?action=get_invitation&id=${encodeURIComponent(id)}&t=${Date.now()}`, {}, 12000);
    return (j && j.ok && j.invitation) ? j.invitation : null;
}

async function fetchClientPortalData(invId, key) {
    return await fetchJsonWithTimeout(`${CLOUD_API_URL}?action=get_client_portal&client=${encodeURIComponent(invId)}&key=${encodeURIComponent(key || "")}&t=${Date.now()}`, {}, 14000);
}

async function apiAction(payload) {
    const u = getCurrentUserObj();
    const enriched = Object.assign({
        actor: currentSessionUser || "",
        actorRole: (u && u.role) || "user",
        token: currentSessionToken || "",
        guestId: guestChatId || ""
    }, payload);
    const j = await fetchJsonWithTimeout(CLOUD_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(enriched)
    }, 35000);

    if (j && j.ok) {
        if (j.data) {
            applyServerDb(j.data);
        } else if (j.user) {
            const idx = (db.users || []).findIndex(x => String(x.username || "").toLowerCase() === String(j.user.username || "").toLowerCase());
            if (idx >= 0) db.users[idx] = Object.assign({}, db.users[idx], j.user);
            else db.users.push(j.user);
            idbSet("db_snapshot", db);
        }
    }
    return j || { ok: false, message: "Koneksi server sedang sibuk, coba lagi." };
}

let _pollTimer = null;
function scheduleAdaptivePoll() {
    clearTimeout(_pollTimer);
    const chatOpen = !document.getElementById("full-chat-overlay")?.classList.contains("hide");
    if (!currentSessionUser && !chatOpen) return;
    const delay = chatOpen ? 6000 : 20000;
    _pollTimer = setTimeout(async () => {
        if (!document.hidden && (currentSessionUser || chatOpen)) {
            const ok = await fetchFullCloud();
            if (ok && typeof refreshActiveViewSmart === "function") refreshActiveViewSmart();
        }
        scheduleAdaptivePoll();
    }, delay);
}

// ================= IMAGE RESIZER, AUDIO FALLBACK & CROPPER =================
function quickResizeImage(file, maxSide = 820, quality = 0.80) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > maxSide || h > maxSide) {
                    const sc = maxSide / Math.max(w, h);
                    w = Math.round(w * sc); h = Math.round(h * sc);
                }
                const c = document.createElement("canvas");
                c.width = w; c.height = h;
                const ctx = c.getContext("2d");
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";
                ctx.drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL("image/jpeg", quality));
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

const _audioBlobCache = new Map();

function extractGoogleDriveAudioId(url) {
    if (!url) return "";
    const s = String(url).trim();
    const m1 = s.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
    if (m1) return m1[1];
    const m2 = s.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (m2) return m2[1];
    return "";
}

function getAudioUrlCandidates(url) {
    if (!url) return [];
    const raw = String(url).trim();
    if (!raw) return [];
    if (raw.startsWith("data:audio/") || raw.startsWith("blob:")) return [raw];
    const id = extractGoogleDriveAudioId(raw);
    if (id) {
        return [
            `${CLOUD_API_URL}?action=stream_audio&id=${encodeURIComponent(id)}`,
            `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
            `https://docs.google.com/uc?export=download&id=${id}`,
            `https://drive.google.com/uc?export=download&id=${id}`
        ];
    }
    return [raw];
}

function dataUrlToBlobUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== "string") return "";
    if (dataUrl.startsWith("blob:")) return dataUrl;
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return dataUrl;
    const mime = match[1] || "audio/mpeg";
    const bin = atob(match[2]);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
}

async function fetchAudioAsBlobUrl(rawUrl, candidates) {
    const cacheKey = String(rawUrl || (candidates && candidates[0]) || "");
    if (!cacheKey) return "";
    if (_audioBlobCache.has(cacheKey)) {
        const cachedVal = _audioBlobCache.get(cacheKey);
        if (cachedVal && cachedVal.startsWith("data:")) {
            const bUrl = dataUrlToBlobUrl(cachedVal);
            _audioBlobCache.set(cacheKey, bUrl);
            return bUrl;
        }
        return cachedVal;
    }

    const driveId = extractGoogleDriveAudioId(rawUrl) || extractGoogleDriveAudioId((candidates && candidates[0]) || "");
    if (driveId) {
        try {
            const streamJson = await fetchJsonWithTimeout(`${CLOUD_API_URL}?action=stream_audio&id=${encodeURIComponent(driveId)}&t=${Date.now()}`, {}, 25000);
            if (streamJson && streamJson.ok && streamJson.dataUrl) {
                const bUrl = dataUrlToBlobUrl(streamJson.dataUrl);
                if (bUrl) {
                    _audioBlobCache.set(cacheKey, bUrl);
                    return bUrl;
                }
            }
        } catch {}
    }

    const list = (candidates && candidates.length) ? candidates : getAudioUrlCandidates(rawUrl);
    for (const u of list) {
        if (u.indexOf("action=stream_audio") !== -1) continue;
        try {
            const resp = await fetch(u, { mode: "cors", cache: "force-cache", redirect: "follow" });
            if (!resp.ok) continue;
            const buf = await resp.arrayBuffer();
            if (!buf || buf.byteLength < 1024) continue;

            const headStr = new TextDecoder().decode(buf.slice(0, 128)).trim().toLowerCase();
            if (headStr.startsWith("<!doctype") || headStr.startsWith("<html") || headStr.includes("google-site-verification")) {
                continue;
            }

            let mime = (resp.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
            if (!mime || mime === "application/octet-stream") {
                const sig = new Uint8Array(buf.slice(0, 4));
                if (sig[0] === 0x52 && sig[1] === 0x49 && sig[2] === 0x46 && sig[3] === 0x46) mime = "audio/wav";
                else if (sig[0] === 0x4F && sig[1] === 0x67 && sig[2] === 0x67 && sig[3] === 0x53) mime = "audio/ogg";
                else mime = "audio/mpeg";
            }
            const blob = new Blob([buf], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            _audioBlobCache.set(cacheKey, blobUrl);
            return blobUrl;
        } catch {}
    }
    return "";
}

async function resolveAudioUrl(url) {
    const list = getAudioUrlCandidates(url);
    const blobUrl = await fetchAudioAsBlobUrl(url, list);
    return blobUrl || list[0] || "";
}

let _cropperInst = null, _cropCfg = { outW: 600, outH: 600, onDone: null };
function openImageCropper(file, ratio = 1, title = "Atur Rasio Foto", outW = 600, outH = 600, onDone = null) {
    _cropCfg = { outW, outH, onDone };
    document.getElementById("crop-modal-title").innerHTML = `<i class="fa-solid fa-crop-simple app-accent mr-1.5"></i>${escHtml(title)}`;
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById("crop-source-img");
        img.src = e.target.result;
        document.getElementById("modal-image-cropper").classList.remove("hide");
        if (_cropperInst) { _cropperInst.destroy(); _cropperInst = null; }
        if (window.Cropper) {
            _cropperInst = new window.Cropper(img, { aspectRatio: ratio, viewMode: 1, dragMode: "move", autoCropArea: 0.92, background: false });
        }
    };
    reader.readAsDataURL(file);
}
function cropperZoom(d) { if (_cropperInst) _cropperInst.zoom(d); }
function closeImageCropper() {
    if (_cropperInst) { _cropperInst.destroy(); _cropperInst = null; }
    document.getElementById("modal-image-cropper")?.classList.add("hide");
}
function applyImageCrop() {
    let dataUrl = "";
    if (_cropperInst) {
        const c = _cropperInst.getCroppedCanvas({ width: _cropCfg.outW, height: _cropCfg.outH, imageSmoothingQuality: "high" });
        dataUrl = c ? c.toDataURL("image/jpeg", 0.85) : "";
    } else {
        dataUrl = document.getElementById("crop-source-img")?.src || "";
    }
    const cb = _cropCfg.onDone;
    closeImageCropper();
    if (cb && dataUrl) cb(dataUrl);
}

// ================= AUDIO CROPPER INTERAKTIF (MP3 RINGAN ANTI GAGAL UPLOAD) =================
let _acFile = null, _acBlobUrl = "", _acDuration = 45, _acTotalDur = 60, _acStartSec = 0, _acAudio = null, _acPlayTimer = null;

function _fmtSec(s) {
    const n = Math.max(0, Math.floor(s || 0));
    return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}

function _updateAcBoxUI() {
    const win = document.getElementById("ac-select-window");
    const lbl = document.getElementById("ac-clip-range-lbl");
    const dur = Math.max(1, _acTotalDur);
    const clipLen = Math.min(dur, _acDuration);
    if (_acStartSec + clipLen > dur) _acStartSec = Math.max(0, dur - clipLen);

    const leftPct = (_acStartSec / dur) * 100;
    const widthPct = Math.max(12, (clipLen / dur) * 100);
    if (win) {
        win.style.left = `${leftPct}%`;
        win.style.width = `${Math.min(100 - leftPct, widthPct)}%`;
    }
    if (lbl) lbl.innerText = `${_fmtSec(_acStartSec)} — ${_fmtSec(_acStartSec + clipLen)}`;
}

function _bindAcDrag() {
    const track = document.getElementById("ac-wave-track");
    const win = document.getElementById("ac-select-window");
    if (!track || !win || track.dataset.dragBound) return;
    track.dataset.dragBound = "1";

    let dragging = false, startX = 0, origStartSec = 0;
    const onDown = (clientX) => { dragging = true; startX = clientX; origStartSec = _acStartSec; };
    const onMove = (clientX) => {
        if (!dragging) return;
        const rect = track.getBoundingClientRect();
        const dx = clientX - startX;
        const deltaSec = (dx / Math.max(1, rect.width)) * _acTotalDur;
        const maxStart = Math.max(0, _acTotalDur - Math.min(_acTotalDur, _acDuration));
        _acStartSec = Math.max(0, Math.min(maxStart, origStartSec + deltaSec));
        _updateAcBoxUI();
    };
    const onUp = () => {
        if (!dragging) return;
        dragging = false;
        if (_acAudio && !_acAudio.paused) _acAudio.currentTime = _acStartSec;
    };

    win.addEventListener("mousedown", (e) => { e.preventDefault(); onDown(e.clientX); });
    window.addEventListener("mousemove", (e) => onMove(e.clientX));
    window.addEventListener("mouseup", onUp);

    win.addEventListener("touchstart", (e) => { onDown(e.touches[0].clientX); }, { passive: true });
    window.addEventListener("touchmove", (e) => { if (dragging) onMove(e.touches[0].clientX); }, { passive: true });
    window.addEventListener("touchend", onUp);
}

function openAudioCropperFromInput(inp) {
    const file = inp.files && inp.files[0]; if (!file) return; inp.value = "";
    if (file.size > 25 * 1024 * 1024) return showToast("Ukuran lagu maksimal 25 MB.", "error");
    _acFile = file;
    _acStartSec = 0;
    document.getElementById("ac-song-title").value = file.name.replace(/\.[^/.]+$/, "");
    if (_acBlobUrl) { try { URL.revokeObjectURL(_acBlobUrl); } catch {} _acBlobUrl = ""; }
    _acBlobUrl = URL.createObjectURL(file);
    if (_acAudio) { _acAudio.pause(); _acAudio = null; }
    _acAudio = new Audio(_acBlobUrl);
    _acAudio.onloadedmetadata = () => {
        _acTotalDur = Math.max(10, Math.floor(_acAudio.duration || 60));
        document.getElementById("ac-total-dur").innerText = _fmtSec(_acTotalDur);
        _updateAcBoxUI();
    };
    const bars = document.getElementById("ac-wave-bars");
    if (bars) bars.innerHTML = Array.from({ length: 40 }, () => `<span class="w-1 bg-blue-400/75 rounded-full" style="height:${20 + Math.floor(Math.random()*70)}%"></span>`).join("");
    _bindAcDrag();
    _updateAcBoxUI();
    document.getElementById("modal-audio-cropper").classList.remove("hide");
    if (typeof pushBackGuard === "function") pushBackGuard();
}

function setAudioClipDuration(sec) {
    _acDuration = sec;
    document.querySelectorAll(".ac-dur-btn").forEach(b => {
        b.className = `ac-dur-btn px-2.5 py-1 rounded-lg text-[11px] font-bold ${Number(b.dataset.dur) === sec ? "gold-pill-btn" : "app-btn-sec"}`;
    });
    _updateAcBoxUI();
}

function toggleAudioCropPreview() {
    if (!_acAudio) return;
    if (_acAudio.paused) {
        _acAudio.currentTime = _acStartSec;
        _acAudio.play().catch(() => {});
        clearInterval(_acPlayTimer);
        _acPlayTimer = setInterval(() => {
            if (!_acAudio || _acAudio.paused) return;
            const clipLen = Math.min(_acTotalDur, _acDuration);
            const rel = _acAudio.currentTime - _acStartSec;
            if (rel >= clipLen) _acAudio.currentTime = _acStartSec;
            const ph = document.getElementById("ac-playhead");
            if (ph) ph.style.left = `${Math.max(0, Math.min(100, (rel / Math.max(1, clipLen)) * 100))}%`;
        }, 120);
    } else {
        _acAudio.pause();
        clearInterval(_acPlayTimer);
    }
}

function closeAudioCropper() {
    clearInterval(_acPlayTimer);
    if (_acAudio) { _acAudio.pause(); _acAudio = null; }
    if (_acBlobUrl) { try { URL.revokeObjectURL(_acBlobUrl); } catch {} _acBlobUrl = ""; }
    document.getElementById("modal-audio-cropper")?.classList.add("hide");
}

async function _ensureLameJsReady() {
    if (window.lamejs && window.lamejs.Mp3Encoder) return true;
    const cdns = [
        "https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js",
        "https://unpkg.com/lamejs@1.2.1/lame.min.js"
    ];
    for (const url of cdns) {
        try {
            await loadScriptOnce(url);
            if (window.lamejs && window.lamejs.Mp3Encoder) return true;
        } catch {}
    }
    return false;
}

async function _sliceAudioFileDataUrl(file, startSec, clipSec) {
    try {
        await _ensureLameJsReady();
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) throw new Error("No AudioContext");
        const arrBuf = await file.arrayBuffer();
        const ctx = new AudioCtx();
        const decoded = await ctx.decodeAudioData(arrBuf);
        const origSr = decoded.sampleRate;
        const hasMp3 = !!(window.lamejs && window.lamejs.Mp3Encoder);
        const targetSr = hasMp3 ? 22050 : 11025;
        const ratio = origSr / targetSr;
        const startIdx = Math.max(0, Math.min(decoded.length - 1, Math.floor(startSec * origSr)));
        const endIdx = Math.max(startIdx + origSr, Math.min(decoded.length, Math.floor((startSec + clipSec) * origSr)));
        const outLen = Math.max(1, Math.floor((endIdx - startIdx) / ratio));

        const ch0 = decoded.getChannelData(0);
        const ch1 = decoded.numberOfChannels > 1 ? decoded.getChannelData(1) : ch0;
        const monoSamples = new Int16Array(outLen);
        for (let i = 0; i < outLen; i++) {
            const srcIdx = Math.min(decoded.length - 1, startIdx + Math.floor(i * ratio));
            const mixed = ((ch0[srcIdx] || 0) + (ch1[srcIdx] || 0)) * 0.5;
            const s = Math.max(-1, Math.min(1, mixed));
            monoSamples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        if (ctx.close) ctx.close().catch(() => {});

        if (hasMp3) {
            const mp3enc = new window.lamejs.Mp3Encoder(1, targetSr, 80);
            const mp3Data = [];
            const sampleBlockSize = 1152;
            for (let i = 0; i < monoSamples.length; i += sampleBlockSize) {
                const chunk = monoSamples.subarray(i, i + sampleBlockSize);
                const mp3buf = mp3enc.encodeBuffer(chunk);
                if (mp3buf.length > 0) mp3Data.push(mp3buf);
            }
            const endBuf = mp3enc.flush();
            if (endBuf.length > 0) mp3Data.push(endBuf);

            let totalBytes = 0;
            mp3Data.forEach(b => totalBytes += b.length);
            const merged = new Uint8Array(totalBytes);
            let pos = 0;
            mp3Data.forEach(b => { merged.set(b, pos); pos += b.length; });

            let bin = "";
            const step = 0x8000;
            for (let i = 0; i < merged.length; i += step) {
                bin += String.fromCharCode.apply(null, merged.subarray(i, i + step));
            }
            return "data:audio/mpeg;base64," + btoa(bin);
        }

        const wavLen = 44 + monoSamples.length * 2;
        const outBuf = new ArrayBuffer(wavLen);
        const view = new DataView(outBuf);
        const writeStr = (off, str) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
        writeStr(0, "RIFF");
        view.setUint32(4, 36 + monoSamples.length * 2, true);
        writeStr(8, "WAVE");
        writeStr(12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, targetSr, true);
        view.setUint32(28, targetSr * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, "data");
        view.setUint32(40, monoSamples.length * 2, true);
        let offset = 44;
        for (let i = 0; i < monoSamples.length; i++) {
            view.setInt16(offset, monoSamples[i], true);
            offset += 2;
        }
        const bytes = new Uint8Array(outBuf);
        let bin = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return "data:audio/wav;base64," + btoa(bin);
    } catch {
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }
}

async function processAndUploadCroppedAudio() {
    if (!_acFile) return;
    setBtnLoading("btn-save-audio-crop", true, "Memotong & Kompresi MP3...");
    const clipLen = Math.min(_acTotalDur, _acDuration);
    const songTitle = (document.getElementById("ac-song-title")?.value || "").trim() || _acFile.name.replace(/\.[^/.]+$/, "");
    const audioDataUrl = await _sliceAudioFileDataUrl(_acFile, _acStartSec, clipLen);
    setBtnLoading("btn-save-audio-crop", true, "Mengunggah Lagu...");
    const up = await apiAction({ action: "upload_media", dataUrl: audioDataUrl, prefix: "audio_clip" });
    setBtnLoading("btn-save-audio-crop", false);
    if (up && up.ok && up.url) {
        const localBlobUrl = dataUrlToBlobUrl(audioDataUrl) || audioDataUrl;
        _audioBlobCache.set(up.url, localBlobUrl);
        if (typeof wizardState !== "undefined") {
            wizardState.customAudioUrl = up.url;
            wizardState.customAudioTitle = songTitle;
        }
        if (!Array.isArray(db.musicLibrary)) db.musicLibrary = [];
        if (!db.musicLibrary.some(m => m.url === up.url)) {
            db.musicLibrary.unshift({
                id: Date.now(),
                title: songTitle,
                category: (typeof wizardState !== "undefined" && wizardState.category) || "Pernikahan",
                url: up.url
            });
            apiAction({ action: "update_section", section: "musicLibrary", value: db.musicLibrary });
            if (typeof populateMusicDropdown === "function") populateMusicDropdown(up.url);
        }
        const st = document.getElementById("audio-upload-status");
        if (st) {
            st.innerText = `✓ Lagu "${songTitle}" (${_fmtSec(_acStartSec)}–${_fmtSec(_acStartSec + clipLen)}) siap & masuk stok lagu!`;
            st.classList.remove("hide");
        }
        closeAudioCropper();
        showToast("Potongan lagu MP3 tersimpan & otomatis masuk Stok Lagu!");
    } else {
        showToast("Gagal mengunggah lagu. Pastikan koneksi stabil atau pilih durasi lebih singkat.", "error");
    }
}
