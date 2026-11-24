// =========================================================================
// LEMBARKU — PORTFOLIO ENGINE (9 DESAIN CV UNIK, LAMARAN, AUTO-SCAN & PDF)
// File: js/portfolio.js
// =========================================================================
let pfWizardState = {
    isEdit: false, adminDirectEdit: false, editPfId: null, isCabangBypass: false,
    docType: "cv", themeId: "cv_emerald", photoData: "",
    skills: [
        { name: "Komunikasi & Kerjasama Tim", level: 4 },
        { name: "Microsoft Office / Administrasi", level: 4 }
    ],
    experiences: [
        { role: "Staf Operasional & Administrasi", company: "Perusahaan / Instansi", period: "2023 - Sekarang", desc: "Menangani pelaporan harian, koordinasi lapangan, dan pengarsipan dokumen secara rapi." }
    ],
    educations: [
        { degree: "S1 / SMK Sederajat", school: "Nama Universitas / Sekolah", period: "2019 - 2023", desc: "Aktif dalam kegiatan organisasi dan proyek tim." }
    ],
    lampiranDocs: []
};
let pfDraftSaveTimer = null;
let previewPfDocObj = null, previewPfIsRevision = false;
let sempurnakanPfDocObj = null, sempurnakanPdfMode = "hrd";

const DEFAULT_LAMARAN_TEMPLATE = {
    cityDate: "Banjarmasin, 20 November 2026",
    subject: "Lamaran Pekerjaan",
    recipientTitle: "Yth. Bapak/Ibu HRD / Pimpinan",
    companyName: "Nama Perusahaan Tujuan",
    companyAddress: "Alamat Perusahaan Tujuan",
    salutation: "Dengan hormat,",
    opening: "Berdasarkan informasi lowongan pekerjaan yang tersedia, saya yang bertanda tangan di bawah ini mengajukan lamaran kerja untuk menempati posisi yang dibutuhkan di perusahaan yang Bapak/Ibu pimpin.",
    attachmentsList: "Curriculum Vitae (CV), Fotokopi KTP, Fotokopi Ijazah & Transkrip Nilai, serta Sertifikat Pendukung",
    closing: "Besar harapan saya untuk dapat mengikuti tahap seleksi atau wawancara berikutnya. Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih."
};

// ================= 1. KARTU MINI ETALASE & DATA CONTOH =================
function buildPortfolioMiniCardHtml(docType, tObj, showFavBtn = true) {
    const isLam = docType === "lamaran";
    const favKey = `pf::${docType}::${tObj.id}`;
    const isFav = isItemFavorited(favKey);
    const favObjStr = esc(JSON.stringify({ favKey, kind: "pf", docType, id: tObj.id }));
    const acc = tObj.accent || "#1b7a49";

    // Lembaran mini contoh berisi data nyata agar langsung terbaca seperti dokumen jadi
    let miniThumb = "";
    if (isLam) {
        miniThumb = `
            <div class="bg-white text-zinc-900 rounded-lg p-2 shadow-lg my-auto text-[6.8px] leading-[1.28] space-y-1 border border-white/75">
                <div class="flex justify-between items-center border-b pb-0.5" style="border-color:${acc}">
                    <span class="font-extrabold uppercase tracking-tight" style="color:${acc}">Surat Lamaran Kerja</span>
                    <span class="text-[5.5px] text-zinc-500">Banjarmasin</span>
                </div>
                <p class="font-bold text-zinc-800 truncate">Yth. HRD PT Nusantara Jaya</p>
                <p class="text-zinc-600 line-clamp-2">Dengan hormat, saya Raka Pratama mengajukan lamaran posisi Staf Operasional &amp; Admin.</p>
                <div class="bg-zinc-50 border border-zinc-200 rounded px-1.5 py-0.5 space-y-0.5 text-[5.8px]">
                    <div class="flex justify-between gap-1"><span class="text-zinc-500">Nama</span><strong class="text-zinc-800 truncate">Raka Pratama</strong></div>
                    <div class="flex justify-between gap-1"><span class="text-zinc-500">Pendidikan</span><strong class="text-zinc-800 truncate">S1 Manajemen</strong></div>
                    <div class="flex justify-between gap-1"><span class="text-zinc-500">Kontak</span><strong style="color:${acc}" class="truncate">0812-5550-8899</strong></div>
                </div>
                <div class="text-right pt-0.5"><span class="inline-block border-t border-zinc-400 px-1.5 text-[5.8px] font-bold text-zinc-700">Raka Pratama</span></div>
            </div>`;
    } else if (tObj.id === "cv_ats" || tObj.id === "cv_royal") {
        miniThumb = `
            <div class="bg-white text-zinc-900 rounded-lg p-2 shadow-lg my-auto text-[6.8px] leading-[1.26] space-y-1 border border-white/75">
                <div class="text-center border-b pb-0.5" style="border-color:${acc}">
                    <p class="font-extrabold text-[7.8px] uppercase text-zinc-900 truncate">RAKA PRATAMA WIJAYA</p>
                    <p class="text-[5.8px] font-semibold truncate" style="color:${acc}">${escHtml(tObj.tag || "Operasional & Admin")} • 0812-5550-8899</p>
                </div>
                <div>
                    <p class="text-[5.5px] font-extrabold uppercase text-zinc-500">Pengalaman Kerja</p>
                    <p class="font-bold text-zinc-800 truncate">Koordinator Ops • PT Borneo Karya</p>
                    <p class="text-[5.5px] text-zinc-600 truncate">Laporan harian, K3 &amp; arsip dokumen</p>
                </div>
                <div class="border-t border-zinc-200 pt-0.5">
                    <p class="text-[5.5px] font-extrabold uppercase text-zinc-500">Pendidikan &amp; Keahlian</p>
                    <p class="text-[5.8px] text-zinc-700 truncate">S1 Manajemen • Excel, Admin, Pelaporan</p>
                </div>
            </div>`;
    } else if (tObj.id === "cv_charcoal" || tObj.id === "cv_navy") {
        miniThumb = `
            <div class="bg-white text-zinc-900 rounded-lg overflow-hidden shadow-lg grid grid-cols-[38%_1fr] my-auto text-[6.6px] leading-[1.24] border border-white/75">
                <div class="p-1.5 text-white flex flex-col justify-between space-y-1" style="background:${acc}">
                    <div class="text-center space-y-0.5">
                        <div class="w-5 h-5 rounded-full bg-white/25 mx-auto flex items-center justify-center text-[6px] font-extrabold">RP</div>
                        <p class="text-[5.5px] font-bold truncate">0812-5550-8899</p>
                    </div>
                    <div class="space-y-0.5 border-t border-white/20 pt-1">
                        <p class="text-[5.2px] uppercase opacity-75 font-bold">Keahlian</p>
                        <p class="text-[5.5px] truncate">★ Administrasi</p>
                        <p class="text-[5.5px] truncate">★ Ms. Excel</p>
                        <p class="text-[5.5px] truncate">★ Pelaporan</p>
                    </div>
                </div>
                <div class="p-1.5 space-y-1 bg-white">
                    <div>
                        <p class="font-extrabold text-[7.2px] text-zinc-900 truncate">Raka Pratama</p>
                        <p class="text-[5.5px] text-zinc-500 truncate">${escHtml(tObj.tag || "Staf Operasional")}</p>
                    </div>
                    <div class="border-t border-zinc-200 pt-0.5">
                        <p class="text-[5.5px] font-bold text-zinc-800 truncate">Koordinator Ops</p>
                        <p class="text-[5.2px] text-zinc-500 truncate">PT Borneo Karya (2023–Kini)</p>
                    </div>
                    <div class="border-t border-zinc-200 pt-0.5">
                        <p class="text-[5.5px] font-bold text-zinc-800 truncate">S1 Manajemen</p>
                        <p class="text-[5.2px] text-zinc-500 truncate">Univ. Lambung Mangkurat</p>
                    </div>
                </div>
            </div>`;
    } else if (tObj.id === "cv_teal") {
        miniThumb = `
            <div class="bg-white text-zinc-900 rounded-lg p-1.5 shadow-lg my-auto text-[6.4px] leading-[1.24] space-y-1 border border-white/75">
                <div class="flex items-center justify-between border-b pb-0.5" style="border-color:${acc}">
                    <span class="font-extrabold text-[7.2px] text-zinc-900 truncate">Raka Pratama</span>
                    <span class="px-1 py-0.2 rounded bg-zinc-200 text-zinc-700 text-[5px] font-bold shrink-0">CV</span>
                </div>
                <div class="border border-zinc-200 rounded overflow-hidden text-[5.4px]">
                    <div class="px-1 py-0.5 text-white font-bold" style="background:${acc}">I. Data &amp; Pengalaman</div>
                    <div class="px-1 py-0.5 flex justify-between gap-1"><span class="text-zinc-500">Posisi</span><strong class="text-zinc-800 truncate">Admin &amp; Ops</strong></div>
                    <div class="px-1 py-0.5 border-t border-zinc-100 flex justify-between gap-1"><span class="text-zinc-500">Pendidikan</span><strong class="text-zinc-800 truncate">S1 Manajemen</strong></div>
                    <div class="px-1 py-0.5 border-t border-zinc-100 flex justify-between gap-1"><span class="text-zinc-500">Skill</span><span class="text-zinc-700 truncate">Excel, Admin, K3</span></div>
                </div>
            </div>`;
    } else {
        miniThumb = `
            <div class="bg-white text-zinc-900 rounded-lg p-1.5 shadow-lg my-auto text-[6.6px] leading-[1.25] space-y-1 border border-white/75">
                <div class="flex items-center gap-1.5 border-b pb-1" style="border-color:${acc}45">
                    <span class="w-5 h-5 rounded-lg text-white flex items-center justify-center text-[6px] font-extrabold shrink-0" style="background:${acc}">RP</span>
                    <div class="min-w-0">
                        <p class="font-extrabold text-[7.2px] text-zinc-900 truncate">Raka Pratama</p>
                        <p class="text-[5.4px] text-zinc-500 truncate">${escHtml(tObj.tag || "Profil Profesional")}</p>
                    </div>
                </div>
                <div class="grid grid-cols-[1.2fr_1fr] gap-1 pt-0.5 text-[5.4px]">
                    <div class="space-y-0.5">
                        <p class="font-bold text-zinc-800 truncate">Pengalaman</p>
                        <p class="text-zinc-600 truncate">Admin &amp; Operasional</p>
                        <p class="font-bold text-zinc-800 truncate pt-0.5">Pendidikan</p>
                        <p class="text-zinc-600 truncate">S1 Manajemen</p>
                    </div>
                    <div class="bg-zinc-50 rounded p-1 border border-zinc-200 space-y-0.5">
                        <p class="font-bold text-zinc-800">Keahlian</p>
                        <p class="text-zinc-600 truncate">★ Administrasi</p>
                        <p class="text-zinc-600 truncate">★ Excel &amp; Laporan</p>
                    </div>
                </div>
            </div>`;
    }

    return `
        <div class="relative aspect-[3/4] w-full overflow-hidden select-none p-3 flex flex-col justify-between text-white" style="background:linear-gradient(155deg,${acc} 0%,#141418 72%,#09090b 100%);">
            <div class="flex items-center justify-between gap-1 z-10">
                <span class="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur">${isLam ? "LAMARAN" : "CV"}</span>
                ${tObj.badge ? `<span class="text-[8px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-400 text-black uppercase">${escHtml(tObj.badge)}</span>` : ""}
            </div>
            ${showFavBtn ? `<button type="button" data-fav-btn="${esc(favKey)}" onclick="toggleFavoriteItem(event, JSON.parse('${favObjStr}'))" class="fav-heart-btn ${isFav ? "is-fav" : ""}" title="Simpan ke Favorit"><i class="fa-${isFav ? "solid" : "regular"} fa-heart"></i></button>` : ""}
            ${miniThumb}
            <div class="z-10">
                <span class="text-[9px] text-white/75 block truncate">${escHtml(tObj.tag || "")}</span>
                <h4 class="font-bold text-xs text-white truncate">${escHtml(tObj.name)}</h4>
            </div>
        </div>
    `;
}

function buildDemoPortfolioDoc(docType, themeId) {
    const tObj = getPortfolioThemeObj(docType, themeId);
    const isLam = docType === "lamaran";
    return {
        id: "demo_pf",
        docType,
        themeId: tObj.id,
        themeName: tObj.name,
        status: "Aktif",
        title: isLam ? "Surat Lamaran — Raka Pratama" : "CV — Raka Pratama",
        fullName: "Raka Pratama Wijaya",
        headline: isLam ? "Posisi Dilamar: Staf Operasional & Administrasi" : "Operasional Lapangan & Administrasi Proyek",
        email: "raka.pratama@email.com",
        phone: "0812-5550-8899",
        address: "Jl. A. Yani KM 5, Banjarmasin, Kalimantan Selatan",
        summary: "Profesional yang teliti, terbiasa bekerja sesuai prosedur keselamatan & target waktu, serta mampu menyusun laporan administrasi dan dokumentasi lapangan secara akurat.",
        photo: "",
        skills: [
            { name: "Administrasi & Pelaporan", level: 5 },
            { name: "Koordinasi Lapangan & K3", level: 4 },
            { name: "Komunikasi & Problem Solving", level: 4 },
            { name: "Microsoft Excel & Pengarsipan", level: 5 }
        ],
        experiences: [
            { role: "Koordinator Operasional & Admin", company: "PT Borneo Karya Utama", period: "2023 - Sekarang", desc: "Mengatur jadwal kerja tim, dokumentasi harian, serta memastikan kelengkapan berkas administrasi." },
            { role: "Staf Administrasi Proyek", company: "CV Cahaya Mandiri", period: "2021 - 2023", desc: "Mengelola arsip data, rekapitulasi laporan, dan koordinasi antarbagian." }
        ],
        educations: [
            { degree: "S1 Manajemen", school: "Universitas Lambung Mangkurat", period: "2017 - 2021", desc: "Fokus pada manajemen operasional dan tata kelola organisasi." }
        ],
        lamaran: Object.assign({}, DEFAULT_LAMARAN_TEMPLATE, {
            position: "Staf Operasional & Administrasi",
            companyName: "PT Nusantara Jaya Sentosa",
            companyAddress: "Jl. Gatot Subroto No. 45, Banjarmasin"
        })
    };
}

// ================= 2. RENDERER 9 DESAIN CV UNIK + 3 SURAT LAMARAN (A4) =================
function _pfInitials(name) {
    const parts = String(name || "CV").trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return String(name || "CV").slice(0, 2).toUpperCase();
}

function _pfPhotoBox(doc, cls = "w-24 h-24 rounded-2xl", bgStyle = "background:rgba(255,255,255,0.16);color:#ffffff;") {
    if (doc.photo) {
        return `<img src="${doc.photo}" class="${cls} object-cover border-2 border-white shadow-md shrink-0">`;
    }
    return `<div class="${cls} border border-white/35 flex items-center justify-center text-2xl font-extrabold shrink-0" style="${bgStyle}">${escHtml(_pfInitials(doc.fullName))}</div>`;
}

function _pfSkillsStars(skills, acc, darkMode = false) {
    if (!skills || !skills.length) return `<p class="text-xs opacity-60">-</p>`;
    return skills.map(s => {
        const lv = Math.max(1, Math.min(5, Number(s.level) || 4));
        const starCol = darkMode ? "#facc15" : acc;
        const stars = Array.from({ length: 5 }, (_, idx) => `<i class="fa-${idx < lv ? "solid" : "regular"} fa-star text-[10px]" style="color:${starCol}"></i>`).join("");
        return `<div class="flex items-center justify-between gap-2 text-xs py-1.5 border-b ${darkMode ? "border-white/15" : "border-zinc-200/80"} last:border-b-0"><span>${escHtml(s.name)}</span><span class="shrink-0">${stars}</span></div>`;
    }).join("");
}

function _pfSkillsBars(skills, acc, darkMode = false) {
    if (!skills || !skills.length) return `<p class="text-xs opacity-60">-</p>`;
    return skills.map(s => {
        const lv = Math.max(1, Math.min(5, Number(s.level) || 4));
        const pct = lv * 20;
        return `<div class="space-y-1">
            <div class="flex justify-between text-[11px] font-semibold"><span>${escHtml(s.name)}</span><span class="opacity-75">${pct}%</span></div>
            <div class="w-full h-1.5 rounded-full ${darkMode ? "bg-white/15" : "bg-zinc-200"} overflow-hidden"><div class="h-full rounded-full" style="width:${pct}%;background:${darkMode ? "#f8fafc" : acc};"></div></div>
        </div>`;
    }).join("");
}

function _pfExpStandard(exps, acc) {
    if (!exps || !exps.length) return `<p class="text-xs text-zinc-500">-</p>`;
    return exps.map(ex => `
        <div class="space-y-0.5 pb-3 border-b border-zinc-200 last:border-b-0">
            <div class="flex justify-between items-baseline gap-2">
                <strong class="text-xs font-extrabold text-zinc-900">${escHtml(ex.role)}</strong>
                <span class="text-[11px] font-bold shrink-0" style="color:${acc}">${escHtml(ex.period)}</span>
            </div>
            <p class="text-[11px] font-semibold text-zinc-600">${escHtml(ex.company)}</p>
            ${ex.desc ? `<p class="text-[11px] text-zinc-700 leading-relaxed pt-0.5">${escHtml(ex.desc)}</p>` : ""}
        </div>
    `).join("");
}

function _pfEduStandard(edus, acc) {
    if (!edus || !edus.length) return `<p class="text-xs text-zinc-500">-</p>`;
    return edus.map(ed => `
        <div class="space-y-0.5 pb-2.5 border-b border-zinc-200 last:border-b-0">
            <div class="flex justify-between items-baseline gap-2">
                <strong class="text-xs font-bold text-zinc-900">${escHtml(ed.degree)}</strong>
                <span class="text-[11px] font-semibold shrink-0" style="color:${acc}">${escHtml(ed.period)}</span>
            </div>
            <p class="text-[11px] font-medium text-zinc-700">${escHtml(ed.school)}</p>
            ${ed.desc ? `<p class="text-[11px] text-zinc-600">${escHtml(ed.desc)}</p>` : ""}
        </div>
    `).join("");
}

function renderPortfolioA4Html(doc, showWatermark = false) {
    const tObj = getPortfolioThemeObj(doc.docType || "cv", doc.themeId);
    const acc = tObj.accent || "#1b7a49";
    const wmRow = `<div class="a4-wm-item"><img src="./lembarku-logo.png" onerror="this.style.display='none'"><span>LEMBARKU</span></div>`;
    const wmHtml = showWatermark
        ? `<div class="a4-watermark-overlay">${wmRow}${wmRow}${wmRow}${wmRow}${wmRow}</div>`
        : "";

    // ================= A. 3 GAYA SURAT LAMARAN KERJA =================
    if (doc.docType === "lamaran") {
        const l = Object.assign({}, DEFAULT_LAMARAN_TEMPLATE, doc.lamaran || {});
        const birthInfo = [doc.birthPlace, doc.birthDate].filter(Boolean).join(", ") || "Banjarmasin, 12 Mei 1996";
        const isModern = tObj.id === "lam_modern";
        const isFresh = tObj.id === "lam_fresh";

        const headerBlock = isModern
            ? `<div class="px-10 py-6 text-white flex justify-between items-center" style="background:${acc}">
                <div>
                    <span class="text-[10px] uppercase tracking-[0.22em] opacity-80 block">Surat Lamaran Pekerjaan</span>
                    <h1 class="text-2xl font-extrabold mt-0.5">${escHtml(doc.fullName || "")}</h1>
                    <p class="text-xs opacity-90">${escHtml(l.position || doc.headline || "")}</p>
                </div>
                <div class="text-right text-[11px] opacity-90 space-y-0.5">
                    <p class="font-bold">${escHtml(l.cityDate || "")}</p>
                    ${doc.phone ? `<p>${escHtml(doc.phone)}</p>` : ""}
                    ${doc.email ? `<p>${escHtml(doc.email)}</p>` : ""}
                </div>
               </div>`
            : isFresh
                ? `<div class="px-12 pt-10 pb-4">
                    <div class="border-l-4 pl-4 flex justify-between items-start gap-4" style="border-color:${acc}">
                        <div>
                            <span class="text-[10px] uppercase tracking-widest font-extrabold" style="color:${acc}">Aplikasi Lamaran Kerja</span>
                            <h2 class="text-xl font-extrabold text-zinc-900 mt-0.5">${escHtml(l.subject || "Lamaran Pekerjaan")}</h2>
                        </div>
                        <span class="text-xs text-zinc-600 font-semibold shrink-0">${escHtml(l.cityDate || "")}</span>
                    </div>
                   </div>`
                : `<div class="px-12 pt-12 pb-2">
                    <div class="flex justify-between items-start border-b-2 pb-3" style="border-color:${acc}">
                        <div>
                            <span class="text-[10px] uppercase tracking-widest font-extrabold" style="color:${acc}">${escHtml(tObj.name)}</span>
                            <h2 class="text-xl font-extrabold text-zinc-900 mt-0.5">${escHtml(l.subject || "Lamaran Pekerjaan")}</h2>
                        </div>
                        <span class="text-xs text-zinc-600 font-semibold">${escHtml(l.cityDate || "")}</span>
                    </div>
                   </div>`;

        return `
            <div class="a4-paper-sheet flex flex-col justify-between text-[13.5px] leading-relaxed text-zinc-800">
                ${wmHtml}
                <div class="relative z-10">
                    ${headerBlock}
                    <div class="${isModern ? "px-12 py-8" : "px-12 py-5"} space-y-4">
                        <div class="space-y-0.5 text-xs">
                            <p class="font-bold text-zinc-900">${escHtml(l.recipientTitle || "Yth. Bapak/Ibu HRD")}</p>
                            <p class="font-bold" style="color:${acc}">${escHtml(l.companyName || "")}</p>
                            <p class="text-zinc-600">${escHtml(l.companyAddress || "")}</p>
                        </div>

                        <p>${escHtml(l.salutation || "Dengan hormat,")}</p>
                        <p>${escHtml(l.opening || "")}</p>

                        <div class="${isFresh ? "bg-emerald-50/50 border-emerald-200" : "bg-zinc-50 border-zinc-200"} border rounded-xl p-4 space-y-1.5 text-xs">
                            <div class="grid grid-cols-[145px_12px_1fr]"><strong>Nama Lengkap</strong><span>:</span><strong>${escHtml(doc.fullName || "")}</strong></div>
                            <div class="grid grid-cols-[145px_12px_1fr]"><strong>Tempat, Tgl Lahir</strong><span>:</span><span>${escHtml(birthInfo)}</span></div>
                            <div class="grid grid-cols-[145px_12px_1fr]"><strong>Posisi Dilamar</strong><span>:</span><strong style="color:${acc}">${escHtml(l.position || doc.headline || "")}</strong></div>
                            <div class="grid grid-cols-[145px_12px_1fr]"><strong>No. HP / WA</strong><span>:</span><span>${escHtml(doc.phone || "")}</span></div>
                            <div class="grid grid-cols-[145px_12px_1fr]"><strong>Email</strong><span>:</span><span>${escHtml(doc.email || "")}</span></div>
                            <div class="grid grid-cols-[145px_12px_1fr]"><strong>Alamat</strong><span>:</span><span>${escHtml(doc.address || "")}</span></div>
                        </div>

                        ${doc.summary ? `<p>${escHtml(doc.summary)}</p>` : ""}
                        ${l.attachmentsList ? `<div class="text-xs"><strong class="block mb-1 text-zinc-900">Sebagai bahan pertimbangan, turut saya lampirkan:</strong><p class="text-zinc-700">${escHtml(l.attachmentsList)}</p></div>` : ""}
                        <p>${escHtml(l.closing || "")}</p>
                    </div>
                </div>

                <div class="px-12 pb-12 pt-4 flex justify-end relative z-10">
                    <div class="text-center w-52 space-y-14">
                        <p class="text-xs font-semibold text-zinc-700">Hormat saya,</p>
                        <p class="text-sm font-extrabold text-zinc-900 border-t border-zinc-400 pt-1">${escHtml(doc.fullName || "")}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // ================= B. 9 DESAIN CV UNIK (TATA LETAK BERBEDA) =================
    const tid = tObj.id || "cv_emerald";
    const skills = doc.skills || [];
    const exps = doc.experiences || [];
    const edus = doc.educations || [];

    if (tid === "cv_ats") {
        const contactLine = [doc.phone, doc.email, doc.address].filter(Boolean).map(escHtml).join("  |  ");
        return `
            <div class="a4-paper-sheet px-12 py-11 flex flex-col text-zinc-900" style="font-family:'Plus Jakarta Sans',Arial,sans-serif;">
                ${wmHtml}
                <div class="relative z-10 space-y-5">
                    <div class="text-center border-b-2 border-zinc-900 pb-4 space-y-1">
                        <h1 class="text-3xl font-extrabold uppercase tracking-wider text-zinc-950">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                        ${doc.headline ? `<p class="text-sm font-bold text-zinc-700">${escHtml(doc.headline)}</p>` : ""}
                        <p class="text-[11px] text-zinc-600 pt-1">${contactLine}</p>
                    </div>

                    ${doc.summary ? `<div class="space-y-1.5">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-950 border-b border-zinc-400 pb-1">Ringkasan Profesional</h3>
                        <p class="text-xs text-zinc-800 leading-relaxed">${escHtml(doc.summary)}</p>
                    </div>` : ""}

                    <div class="space-y-3">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-950 border-b border-zinc-400 pb-1">Pengalaman Kerja</h3>
                        ${exps.length ? exps.map(ex => `
                            <div class="space-y-0.5">
                                <div class="flex justify-between items-baseline gap-2">
                                    <strong class="text-xs font-extrabold text-zinc-950">${escHtml(ex.role)} — <span class="font-semibold text-zinc-700">${escHtml(ex.company)}</span></strong>
                                    <span class="text-[11px] font-bold text-zinc-700 shrink-0">${escHtml(ex.period)}</span>
                                </div>
                                ${ex.desc ? `<p class="text-xs text-zinc-800 leading-relaxed pl-3 border-l-2 border-zinc-300">${escHtml(ex.desc)}</p>` : ""}
                            </div>
                        `).join("") : '<p class="text-xs text-zinc-500">-</p>'}
                    </div>

                    <div class="space-y-2.5">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-950 border-b border-zinc-400 pb-1">Pendidikan</h3>
                        ${edus.length ? edus.map(ed => `
                            <div class="flex justify-between items-baseline gap-2">
                                <div>
                                    <strong class="text-xs font-bold text-zinc-950">${escHtml(ed.degree)}</strong>
                                    <span class="text-xs text-zinc-700"> • ${escHtml(ed.school)}</span>
                                    ${ed.desc ? `<p class="text-[11px] text-zinc-600">${escHtml(ed.desc)}</p>` : ""}
                                </div>
                                <span class="text-[11px] font-semibold text-zinc-700 shrink-0">${escHtml(ed.period)}</span>
                            </div>
                        `).join("") : '<p class="text-xs text-zinc-500">-</p>'}
                    </div>

                    <div class="space-y-2">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.16em] text-zinc-950 border-b border-zinc-400 pb-1">Keahlian Utama</h3>
                        <p class="text-xs text-zinc-800 leading-relaxed">
                            ${skills.length ? skills.map(s => `<span class="font-semibold">${escHtml(s.name)}</span>`).join(" &nbsp;•&nbsp; ") : "-"}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    if (tid === "cv_royal") {
        return `
            <div class="a4-paper-sheet flex flex-col text-zinc-800">
                ${wmHtml}
                <div class="h-3 w-full" style="background:${acc}"></div>
                <div class="px-12 py-9 space-y-6 relative z-10 flex-1">
                    <div class="flex justify-between items-end gap-6 border-b-2 pb-5" style="border-color:${acc}">
                        <div class="space-y-1">
                            <span class="text-[10px] font-extrabold uppercase tracking-[0.25em]" style="color:${acc}">Executive Resume</span>
                            <h1 class="text-3xl font-extrabold tracking-tight text-zinc-950">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                            <p class="text-sm font-semibold text-zinc-600">${escHtml(doc.headline || "")}</p>
                        </div>
                        <div class="text-right text-[11px] text-zinc-600 space-y-1 shrink-0">
                            ${doc.phone ? `<p><i class="fa-solid fa-phone mr-1.5" style="color:${acc}"></i>${escHtml(doc.phone)}</p>` : ""}
                            ${doc.email ? `<p><i class="fa-solid fa-envelope mr-1.5" style="color:${acc}"></i>${escHtml(doc.email)}</p>` : ""}
                            ${doc.address ? `<p><i class="fa-solid fa-location-dot mr-1.5" style="color:${acc}"></i>${escHtml(doc.address)}</p>` : ""}
                        </div>
                    </div>

                    ${doc.summary ? `<div class="bg-blue-50/60 border-l-4 rounded-r-xl p-4" style="border-color:${acc}">
                        <h3 class="text-[11px] font-extrabold uppercase tracking-wider mb-1" style="color:${acc}">Profil Eksekutif</h3>
                        <p class="text-xs text-zinc-700 leading-relaxed">${escHtml(doc.summary)}</p>
                    </div>` : ""}

                    <div class="space-y-3">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] pb-1 border-b" style="color:${acc};border-color:${acc}40">Pengalaman Profesional</h3>
                        ${_pfExpStandard(exps, acc)}
                    </div>

                    <div class="grid grid-cols-2 gap-8 pt-1">
                        <div class="space-y-2.5">
                            <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] pb-1 border-b" style="color:${acc};border-color:${acc}40">Pendidikan</h3>
                            ${_pfEduStandard(edus, acc)}
                        </div>
                        <div class="space-y-2.5">
                            <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] pb-1 border-b" style="color:${acc};border-color:${acc}40">Kompetensi Inti</h3>
                            <div class="space-y-2">${_pfSkillsBars(skills, acc, false)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (tid === "cv_charcoal") {
        return `
            <div class="a4-paper-sheet grid grid-cols-[255px_1fr] text-zinc-800">
                ${wmHtml}
                <aside class="text-white p-8 flex flex-col gap-6 relative z-10" style="background:${acc}">
                    <div class="text-center space-y-3 pt-2">
                        <div class="flex justify-center">${_pfPhotoBox(doc, "w-28 h-28 rounded-full", "background:rgba(255,255,255,0.12);color:#ffffff;")}</div>
                        <div>
                            <h1 class="text-xl font-extrabold leading-tight">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                            <p class="text-[11px] text-white/80 mt-1">${escHtml(doc.headline || "")}</p>
                        </div>
                    </div>
                    <div class="space-y-2 text-[11px] text-white/85 border-t border-white/15 pt-4">
                        <h3 class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">Kontak</h3>
                        ${doc.phone ? `<p class="flex items-start gap-2"><i class="fa-solid fa-phone mt-0.5 text-white/70"></i><span>${escHtml(doc.phone)}</span></p>` : ""}
                        ${doc.email ? `<p class="flex items-start gap-2"><i class="fa-solid fa-envelope mt-0.5 text-white/70"></i><span class="break-all">${escHtml(doc.email)}</span></p>` : ""}
                        ${doc.address ? `<p class="flex items-start gap-2"><i class="fa-solid fa-location-dot mt-0.5 text-white/70"></i><span>${escHtml(doc.address)}</span></p>` : ""}
                    </div>
                    <div class="space-y-2.5 border-t border-white/15 pt-4">
                        <h3 class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/60">Keahlian</h3>
                        <div class="space-y-2.5">${_pfSkillsBars(skills, acc, true)}</div>
                    </div>
                </aside>
                <div class="p-9 space-y-6 relative z-10 bg-white">
                    ${doc.summary ? `<div class="space-y-1.5">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] text-zinc-900">Tentang Saya</h3>
                        <p class="text-xs text-zinc-600 leading-relaxed">${escHtml(doc.summary)}</p>
                    </div>` : ""}

                    <div class="space-y-3">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] text-zinc-900">Linimasa Pengalaman</h3>
                        <div class="border-l-2 pl-5 space-y-4 ml-1.5" style="border-color:${acc}">
                            ${exps.length ? exps.map(ex => `
                                <div class="relative space-y-0.5">
                                    <span class="w-3 h-3 rounded-full absolute -left-[27px] top-1 border-2 border-white" style="background:${acc}"></span>
                                    <span class="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 block">${escHtml(ex.period)}</span>
                                    <strong class="text-xs font-extrabold text-zinc-900 block">${escHtml(ex.role)}</strong>
                                    <p class="text-[11px] font-semibold text-zinc-600">${escHtml(ex.company)}</p>
                                    ${ex.desc ? `<p class="text-[11px] text-zinc-600 leading-relaxed pt-0.5">${escHtml(ex.desc)}</p>` : ""}
                                </div>
                            `).join("") : '<p class="text-xs text-zinc-500">-</p>'}
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] text-zinc-900">Linimasa Pendidikan</h3>
                        <div class="border-l-2 pl-5 space-y-3.5 ml-1.5" style="border-color:${acc}">
                            ${edus.length ? edus.map(ed => `
                                <div class="relative space-y-0.5">
                                    <span class="w-3 h-3 rounded-full absolute -left-[27px] top-1 border-2 border-white" style="background:${acc}"></span>
                                    <span class="text-[10px] font-extrabold text-zinc-500 block">${escHtml(ed.period)}</span>
                                    <strong class="text-xs font-bold text-zinc-900 block">${escHtml(ed.degree)}</strong>
                                    <p class="text-[11px] text-zinc-700">${escHtml(ed.school)}</p>
                                    ${ed.desc ? `<p class="text-[11px] text-zinc-500">${escHtml(ed.desc)}</p>` : ""}
                                </div>
                            `).join("") : '<p class="text-xs text-zinc-500">-</p>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (tid === "cv_navy") {
        return `
            <div class="a4-paper-sheet grid grid-cols-[265px_1fr] text-zinc-800">
                ${wmHtml}
                <aside class="text-white p-8 flex flex-col gap-5 relative z-10" style="background:${acc}">
                    <div class="flex justify-center pt-1">${_pfPhotoBox(doc, "w-28 h-32 rounded-xl", "background:rgba(255,255,255,0.14);color:#ffffff;")}</div>
                    <div class="space-y-2 text-[11px] text-white/90 border-t border-white/20 pt-4">
                        <h3 class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Informasi Kontak</h3>
                        ${doc.phone ? `<p><i class="fa-solid fa-phone w-4 text-amber-300"></i>${escHtml(doc.phone)}</p>` : ""}
                        ${doc.email ? `<p class="break-all"><i class="fa-solid fa-envelope w-4 text-amber-300"></i>${escHtml(doc.email)}</p>` : ""}
                        ${doc.address ? `<p><i class="fa-solid fa-location-dot w-4 text-amber-300"></i>${escHtml(doc.address)}</p>` : ""}
                    </div>
                    ${doc.summary ? `<div class="space-y-1.5 border-t border-white/20 pt-4">
                        <h3 class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Ringkasan</h3>
                        <p class="text-[11px] text-white/85 leading-relaxed">${escHtml(doc.summary)}</p>
                    </div>` : ""}
                    <div class="space-y-2 border-t border-white/20 pt-4">
                        <h3 class="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-300">Keahlian</h3>
                        ${_pfSkillsStars(skills, acc, true)}
                    </div>
                </aside>
                <div class="p-9 space-y-6 relative z-10 bg-white">
                    <div class="border-b-4 pb-4" style="border-color:${acc}">
                        <h1 class="text-3xl font-extrabold tracking-tight" style="color:${acc}">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                        <p class="text-sm font-bold text-zinc-600 mt-1">${escHtml(doc.headline || "")}</p>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] px-3 py-1.5 rounded-lg text-white inline-block" style="background:${acc}">Pengalaman Kerja</h3>
                        <div class="space-y-3 pt-1">${_pfExpStandard(exps, acc)}</div>
                    </div>
                    <div class="space-y-3">
                        <h3 class="text-xs font-extrabold uppercase tracking-[0.18em] px-3 py-1.5 rounded-lg text-white inline-block" style="background:${acc}">Riwayat Pendidikan</h3>
                        <div class="space-y-2.5 pt-1">${_pfEduStandard(edus, acc)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    if (tid === "cv_peach") {
        return `
            <div class="a4-paper-sheet flex flex-col text-zinc-800" style="background:#fffaf8;">
                ${wmHtml}
                <div class="mx-8 mt-8 rounded-3xl p-7 flex items-center gap-5 relative z-10" style="background:${acc}2e;border:1.5px solid ${acc}66;">
                    ${_pfPhotoBox(doc, "w-24 h-24 rounded-full", `background:${acc};color:#ffffff;`)}
                    <div class="flex-1 min-w-0 space-y-1">
                        <span class="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-white" style="background:${acc}">Portfolio &amp; CV</span>
                        <h1 class="text-2xl font-extrabold text-zinc-900 leading-tight">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                        <p class="text-xs font-semibold text-zinc-700">${escHtml(doc.headline || "")}</p>
                        <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600 pt-1">
                            ${doc.phone ? `<span><i class="fa-solid fa-phone mr-1" style="color:${acc}"></i>${escHtml(doc.phone)}</span>` : ""}
                            ${doc.email ? `<span><i class="fa-solid fa-envelope mr-1" style="color:${acc}"></i>${escHtml(doc.email)}</span>` : ""}
                            ${doc.address ? `<span><i class="fa-solid fa-location-dot mr-1" style="color:${acc}"></i>${escHtml(doc.address)}</span>` : ""}
                        </div>
                    </div>
                </div>

                <div class="p-8 space-y-5 relative z-10 flex-1">
                    ${doc.summary ? `<div class="bg-white rounded-2xl p-5 border shadow-sm space-y-1.5" style="border-color:${acc}45;">
                        <h3 class="text-xs font-extrabold uppercase tracking-wider" style="color:${acc}">Tentang Saya</h3>
                        <p class="text-xs text-zinc-700 leading-relaxed">${escHtml(doc.summary)}</p>
                    </div>` : ""}

                    <div class="grid grid-cols-[1.45fr_1fr] gap-5">
                        <div class="bg-white rounded-2xl p-5 border shadow-sm space-y-3" style="border-color:${acc}45;">
                            <h3 class="text-xs font-extrabold uppercase tracking-wider" style="color:${acc}">Pengalaman</h3>
                            ${_pfExpStandard(exps, acc)}
                        </div>
                        <div class="space-y-5">
                            <div class="bg-white rounded-2xl p-5 border shadow-sm space-y-2.5" style="border-color:${acc}45;">
                                <h3 class="text-xs font-extrabold uppercase tracking-wider" style="color:${acc}">Pendidikan</h3>
                                ${_pfEduStandard(edus, acc)}
                            </div>
                            <div class="bg-white rounded-2xl p-5 border shadow-sm space-y-2.5" style="border-color:${acc}45;">
                                <h3 class="text-xs font-extrabold uppercase tracking-wider" style="color:${acc}">Keahlian</h3>
                                <div class="flex flex-wrap gap-1.5">
                                    ${skills.length ? skills.map(s => `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold" style="background:${acc}24;color:#4a2520;">${escHtml(s.name)} ★${s.level || 4}</span>`).join("") : '<span class="text-xs text-zinc-500">-</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (tid === "cv_teal") {
        return `
            <div class="a4-paper-sheet px-11 py-10 flex flex-col text-zinc-800">
                ${wmHtml}
                <div class="relative z-10 space-y-5">
                    <div class="flex items-center justify-between gap-5 pb-4 border-b-4" style="border-color:${acc}">
                        <div>
                            <span class="text-[10px] font-extrabold uppercase tracking-[0.22em]" style="color:${acc}">Daftar Riwayat Hidup</span>
                            <h1 class="text-2xl font-extrabold text-zinc-950 mt-0.5">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                            <p class="text-xs font-semibold text-zinc-600">${escHtml(doc.headline || "")}</p>
                        </div>
                        ${_pfPhotoBox(doc, "w-20 h-24 rounded-lg", `background:${acc};color:#ffffff;`)}
                    </div>

                    <div class="border rounded-xl overflow-hidden text-xs" style="border-color:${acc}40;">
                        <div class="px-4 py-1.5 font-extrabold uppercase tracking-wider text-[10px] text-white" style="background:${acc}">I. Data Pribadi</div>
                        <div class="divide-y divide-zinc-200 bg-white">
                            <div class="grid grid-cols-[160px_1fr] px-4 py-2"><strong class="text-zinc-600">Nama Lengkap</strong><span class="font-bold text-zinc-900">${escHtml(doc.fullName || "-")}</span></div>
                            <div class="grid grid-cols-[160px_1fr] px-4 py-2"><strong class="text-zinc-600">Bidang / Posisi</strong><span>${escHtml(doc.headline || "-")}</span></div>
                            <div class="grid grid-cols-[160px_1fr] px-4 py-2"><strong class="text-zinc-600">No. Telepon / WA</strong><span>${escHtml(doc.phone || "-")}</span></div>
                            <div class="grid grid-cols-[160px_1fr] px-4 py-2"><strong class="text-zinc-600">Alamat Email</strong><span>${escHtml(doc.email || "-")}</span></div>
                            <div class="grid grid-cols-[160px_1fr] px-4 py-2"><strong class="text-zinc-600">Alamat Domisili</strong><span>${escHtml(doc.address || "-")}</span></div>
                            ${doc.summary ? `<div class="grid grid-cols-[160px_1fr] px-4 py-2"><strong class="text-zinc-600">Ringkasan Diri</strong><span class="leading-relaxed">${escHtml(doc.summary)}</span></div>` : ""}
                        </div>
                    </div>

                    <div class="border rounded-xl overflow-hidden text-xs" style="border-color:${acc}40;">
                        <div class="px-4 py-1.5 font-extrabold uppercase tracking-wider text-[10px] text-white" style="background:${acc}">II. Riwayat Pendidikan</div>
                        <div class="divide-y divide-zinc-200 bg-white">
                            ${edus.length ? edus.map(ed => `<div class="grid grid-cols-[130px_1fr] px-4 py-2.5 gap-3"><span class="font-bold" style="color:${acc}">${escHtml(ed.period)}</span><div><strong class="block text-zinc-900">${escHtml(ed.degree)}</strong><span class="text-zinc-600">${escHtml(ed.school)}</span>${ed.desc ? `<p class="text-[11px] text-zinc-500 mt-0.5">${escHtml(ed.desc)}</p>` : ""}</div></div>`).join("") : '<div class="px-4 py-2 text-zinc-500">-</div>'}
                        </div>
                    </div>

                    <div class="border rounded-xl overflow-hidden text-xs" style="border-color:${acc}40;">
                        <div class="px-4 py-1.5 font-extrabold uppercase tracking-wider text-[10px] text-white" style="background:${acc}">III. Pengalaman Kerja</div>
                        <div class="divide-y divide-zinc-200 bg-white">
                            ${exps.length ? exps.map(ex => `<div class="grid grid-cols-[130px_1fr] px-4 py-2.5 gap-3"><span class="font-bold" style="color:${acc}">${escHtml(ex.period)}</span><div><strong class="block text-zinc-900">${escHtml(ex.role)}</strong><span class="text-[11px] font-semibold text-zinc-600">${escHtml(ex.company)}</span>${ex.desc ? `<p class="text-[11px] text-zinc-700 mt-0.5 leading-relaxed">${escHtml(ex.desc)}</p>` : ""}</div></div>`).join("") : '<div class="px-4 py-2 text-zinc-500">-</div>'}
                        </div>
                    </div>

                    <div class="border rounded-xl overflow-hidden text-xs" style="border-color:${acc}40;">
                        <div class="px-4 py-1.5 font-extrabold uppercase tracking-wider text-[10px] text-white" style="background:${acc}">IV. Keahlian &amp; Kompetensi</div>
                        <div class="p-4 grid grid-cols-2 gap-x-6 gap-y-1 bg-white">
                            ${_pfSkillsStars(skills, acc, false)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    if (tid === "cv_slate") {
        return `
            <div class="a4-paper-sheet flex flex-col text-zinc-800">
                ${wmHtml}
                <div class="px-10 py-7 text-white flex items-center justify-between gap-5 relative z-10" style="background:${acc}">
                    <div class="space-y-1 flex-1 min-w-0">
                        <span class="text-[10px] uppercase tracking-[0.22em] text-teal-200 font-bold">Fresh Graduate Profile</span>
                        <h1 class="text-2xl font-extrabold">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                        <p class="text-xs text-white/85">${escHtml(doc.headline || "")}</p>
                        <div class="flex flex-wrap gap-3 text-[11px] text-white/80 pt-1">
                            ${doc.phone ? `<span><i class="fa-solid fa-phone mr-1"></i>${escHtml(doc.phone)}</span>` : ""}
                            ${doc.email ? `<span><i class="fa-solid fa-envelope mr-1"></i>${escHtml(doc.email)}</span>` : ""}
                            ${doc.address ? `<span><i class="fa-solid fa-location-dot mr-1"></i>${escHtml(doc.address)}</span>` : ""}
                        </div>
                    </div>
                    ${_pfPhotoBox(doc, "w-24 h-24 rounded-full", "background:rgba(255,255,255,0.16);color:#ffffff;")}
                </div>
                <div class="p-10 space-y-6 relative z-10 flex-1">
                    ${doc.summary ? `<div class="space-y-1.5">
                        <h3 class="text-xs font-extrabold uppercase tracking-wider" style="color:${acc}">Tujuan Karier &amp; Profil</h3>
                        <p class="text-xs text-zinc-700 leading-relaxed">${escHtml(doc.summary)}</p>
                    </div>` : ""}

                    <div class="grid grid-cols-2 gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-5">
                        <div class="space-y-2.5">
                            <h3 class="text-xs font-extrabold uppercase tracking-wider pb-1 border-b-2" style="color:${acc};border-color:${acc}">Pendidikan Utama</h3>
                            ${_pfEduStandard(edus, acc)}
                        </div>
                        <div class="space-y-2.5">
                            <h3 class="text-xs font-extrabold uppercase tracking-wider pb-1 border-b-2" style="color:${acc};border-color:${acc}">Keahlian &amp; Kemampuan</h3>
                            <div class="space-y-2">${_pfSkillsBars(skills, acc, false)}</div>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-xs font-extrabold uppercase tracking-wider pb-1 border-b-2" style="color:${acc};border-color:${acc}">Pengalaman Kerja / Magang / Organisasi</h3>
                        ${_pfExpStandard(exps, acc)}
                    </div>
                </div>
            </div>
        `;
    }

    if (tid === "cv_clean") {
        return `
            <div class="a4-paper-sheet px-12 py-11 flex flex-col text-zinc-900 bg-white">
                ${wmHtml}
                <div class="relative z-10 space-y-7">
                    <div class="flex items-start justify-between gap-6 border-b border-zinc-300 pb-6">
                        <div class="space-y-1.5">
                            <h1 class="text-3xl font-light tracking-tight text-zinc-950" style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                            <p class="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">${escHtml(doc.headline || "")}</p>
                            <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-600 pt-2">
                                ${doc.phone ? `<span>${escHtml(doc.phone)}</span>` : ""}
                                ${doc.email ? `<span>• &nbsp;${escHtml(doc.email)}</span>` : ""}
                                ${doc.address ? `<span>• &nbsp;${escHtml(doc.address)}</span>` : ""}
                            </div>
                        </div>
                        ${doc.photo ? `<img src="${doc.photo}" class="w-20 h-20 rounded-full object-cover border border-zinc-300 shrink-0">` : ""}
                    </div>

                    ${doc.summary ? `<div class="grid grid-cols-[150px_1fr] gap-6">
                        <h3 class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">Profil</h3>
                        <p class="text-xs text-zinc-700 leading-relaxed">${escHtml(doc.summary)}</p>
                    </div>` : ""}

                    <div class="grid grid-cols-[150px_1fr] gap-6 border-t border-zinc-200 pt-6">
                        <h3 class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">Pengalaman</h3>
                        <div class="space-y-3">${_pfExpStandard(exps, "#18181b")}</div>
                    </div>

                    <div class="grid grid-cols-[150px_1fr] gap-6 border-t border-zinc-200 pt-6">
                        <h3 class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">Pendidikan</h3>
                        <div class="space-y-2.5">${_pfEduStandard(edus, "#18181b")}</div>
                    </div>

                    <div class="grid grid-cols-[150px_1fr] gap-6 border-t border-zinc-200 pt-6">
                        <h3 class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-zinc-400">Keahlian</h3>
                        <div class="grid grid-cols-2 gap-x-6 gap-y-1">${_pfSkillsStars(skills, "#18181b", false)}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // 9. EMERALD FRESH (Default)
    return `
        <div class="a4-paper-sheet flex flex-col text-zinc-800">
            ${wmHtml}
            <div class="px-10 py-8 text-white flex items-center gap-5 relative z-10" style="background:${acc}">
                ${_pfPhotoBox(doc, "w-24 h-24 rounded-2xl", "background:rgba(255,255,255,0.16);color:#ffffff;")}
                <div class="min-w-0 flex-1 space-y-1">
                    <h1 class="text-2xl font-extrabold tracking-tight leading-tight">${escHtml(doc.fullName || "Nama Lengkap")}</h1>
                    <p class="text-xs font-semibold text-white/90">${escHtml(doc.headline || "")}</p>
                    <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-white/85 pt-1">
                        ${doc.phone ? `<span><i class="fa-solid fa-phone mr-1"></i>${escHtml(doc.phone)}</span>` : ""}
                        ${doc.email ? `<span><i class="fa-solid fa-envelope mr-1"></i>${escHtml(doc.email)}</span>` : ""}
                        ${doc.address ? `<span><i class="fa-solid fa-location-dot mr-1"></i>${escHtml(doc.address)}</span>` : ""}
                    </div>
                </div>
            </div>
            <div class="p-10 grid grid-cols-[1.35fr_1fr] gap-8 flex-1 relative z-10">
                <div class="space-y-6">
                    ${doc.summary ? `<div class="space-y-1.5"><h3 class="text-xs font-extrabold uppercase tracking-wider pb-1 border-b-2" style="color:${acc};border-color:${acc}">Profil Ringkas</h3><p class="text-xs text-zinc-700 leading-relaxed">${escHtml(doc.summary)}</p></div>` : ""}
                    <div class="space-y-2.5"><h3 class="text-xs font-extrabold uppercase tracking-wider pb-1 border-b-2" style="color:${acc};border-color:${acc}">Pengalaman Kerja</h3>${_pfExpStandard(exps, acc)}</div>
                    <div class="space-y-2.5"><h3 class="text-xs font-extrabold uppercase tracking-wider pb-1 border-b-2" style="color:${acc};border-color:${acc}">Pendidikan</h3>${_pfEduStandard(edus, acc)}</div>
                </div>
                <div class="space-y-6 bg-emerald-50/40 rounded-2xl p-5 border border-emerald-200/70 h-fit">
                    <div class="space-y-2"><h3 class="text-xs font-extrabold uppercase tracking-wider pb-1 border-b" style="color:${acc};border-color:${acc}">Keahlian</h3>${_pfSkillsStars(skills, acc, false)}</div>
                </div>
            </div>
        </div>
    `;
}

// Skala kertas A4 otomatis pas selebar layar HP (sambil tetap mendukung cubit zoom)
function fitPreviewA4Scale() {
    const body = document.getElementById("pfp-scroll-body");
    const mount = document.getElementById("pfp-a4-mount");
    const sheet = mount ? mount.querySelector(".a4-paper-sheet") : null;
    if (!body || !mount || !sheet) return;
    const availW = Math.max(240, Math.min(window.innerWidth - 16, body.clientWidth - 16));
    const scale = Math.min(1, availW / 794);
    const fullH = Math.max(1123, sheet.scrollHeight || 1123);
    sheet.style.transformOrigin = "top left";
    sheet.style.transform = `scale(${scale})`;
    mount.style.width = `${Math.floor(794 * scale)}px`;
    mount.style.height = `${Math.ceil(fullH * scale)}px`;
    mount.style.overflow = "hidden";
    body.scrollTop = 0;
}

window.addEventListener("resize", () => {
    if (!document.getElementById("modal-portfolio-preview")?.classList.contains("hide")) {
        fitPreviewA4Scale();
    }
});

function openPortfolioDemoPreview(docType, themeId) {
    const demo = buildDemoPortfolioDoc(docType, themeId);
    previewPfDocObj = demo;
    previewPfIsRevision = false;
    document.getElementById("pfp-use-btn").classList.remove("hide");
    document.getElementById("pfp-sempurnakan-btn").classList.add("hide");
    document.getElementById("pfp-a4-mount").innerHTML = renderPortfolioA4Html(demo, true);
    document.getElementById("modal-portfolio-preview").classList.remove("hide");
    pushBackGuard();
    requestAnimationFrame(() => requestAnimationFrame(fitPreviewA4Scale));
}

function openPortfolioDocPreview(pfId, isRevisionView = false) {
    const pf = (db.portfolios || []).find(p => String(p.id) === String(pfId)); if (!pf) return;
    const target = (isRevisionView && pf.pendingRevision) ? Object.assign({}, pf, pf.pendingRevision) : pf;
    previewPfDocObj = target;
    previewPfIsRevision = isRevisionView;
    const isPaidOrActive = target.status === "Aktif";
    document.getElementById("pfp-use-btn").classList.add("hide");
    document.getElementById("pfp-sempurnakan-btn").classList.toggle("hide", !isPaidOrActive);
    document.getElementById("pfp-a4-mount").innerHTML = renderPortfolioA4Html(target, !isPaidOrActive);
    document.getElementById("modal-portfolio-preview").classList.remove("hide");
    pushBackGuard();
    requestAnimationFrame(() => requestAnimationFrame(fitPreviewA4Scale));
}

function previewPortfolioDraft() {
    const draftDoc = collectPortfolioFormPayload(true);
    previewPfDocObj = draftDoc;
    document.getElementById("pfp-use-btn").classList.add("hide");
    document.getElementById("pfp-sempurnakan-btn").classList.add("hide");
    document.getElementById("pfp-a4-mount").innerHTML = renderPortfolioA4Html(draftDoc, true);
    document.getElementById("modal-portfolio-preview").classList.remove("hide");
    pushBackGuard();
    requestAnimationFrame(() => requestAnimationFrame(fitPreviewA4Scale));
}

function usePreviewedPortfolioTheme() {
    if (!previewPfDocObj) return;
    const dt = previewPfDocObj.docType || "cv";
    const tid = previewPfDocObj.themeId || "cv_emerald";
    document.getElementById("modal-portfolio-preview").classList.add("hide");
    if (currentSessionUser && getCurrentUserObj()) {
        startCreatePortfolio(getCurrentUserObj().role === "cabang", dt, tid);
        showToast("Desain dipilih! Silakan lengkapi data Anda.");
    } else {
        window.pendingActionAfterLogin = { type: "portfolio", docType: dt, themeId: tid };
        if (typeof openAuthModal === "function") openAuthModal();
        showToast("Masuk / daftar dulu untuk langsung membuat berkas dengan desain ini!", "info");
    }
}

function openSempurnakanFromPreview() {
    if (!previewPfDocObj || !previewPfDocObj.id || previewPfDocObj.id === "demo_pf") return;
    document.getElementById("modal-portfolio-preview").classList.add("hide");
    openSempurnakanModal(previewPfDocObj.id);
}

// ================= 3. WIZARD CV & LAMARAN KERJA =================
function startCreatePortfolio(isCabang = false, initType = "cv", initThemeId = null) {
    if (isCabang) {
        const cab = getCurrentUserObj();
        if (!cab || (cab.quota || 0) <= 0) return showToast("Kuota deposit habis! Hubungi Founder.", "error");
    }
    currentViewName = "portfolio_wizard";
    const list = PORTFOLIO_CATALOG[initType] || PORTFOLIO_CATALOG.cv;
    pfWizardState = {
        isEdit: false, adminDirectEdit: false, editPfId: null, isCabangBypass: isCabang,
        docType: initType, themeId: initThemeId || list[0].id, photoData: "",
        skills: [
            { name: "Komunikasi & Kerjasama Tim", level: 4 },
            { name: "Administrasi & Dokumentasi", level: 4 }
        ],
        experiences: [
            { role: "Staf Operasional & Administrasi", company: "Nama Perusahaan", period: "2023 - Sekarang", desc: "Menyusun laporan, koordinasi kerja, dan arsip dokumen." }
        ],
        educations: [
            { degree: "S1 / SMK Sederajat", school: "Nama Sekolah / Kampus", period: "2019 - 2023", desc: "" }
        ],
        lampiranDocs: []
    };
    hideAllViews();
    document.getElementById("view-portfolio-wizard").classList.remove("hide");
    document.getElementById("pfw-heading").innerText = isCabang ? "Buat Berkas Klien Instan (-1 Kuota)" : "Buat CV / Surat Lamaran Kerja";
    document.getElementById("btn-submit-pf").innerText = isCabang ? "Buat & Aktifkan (-1 Kuota)" : "Ajukan Berkas";
    document.getElementById("pfw-btn-change-theme").classList.remove("hide");
    renderHeaderActions();
    pushBackGuard();
    setPortfolioWizardType(initType);
    if (initThemeId) selectPortfolioTheme(initThemeId);
    else setPortfolioWizardStep(1);
}

function setPortfolioWizardStep(s) {
    document.getElementById("pfw-step-1").classList.toggle("hide", s !== 1);
    document.getElementById("pfw-step-2").classList.toggle("hide", s !== 2);
    document.getElementById("pfw-subheading").innerText = s === 1 ? "Langkah 1: Pilih Desain" : "Langkah 2: Isi Data Berkas";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

function setPortfolioWizardType(dt) {
    pfWizardState.docType = dt;
    document.getElementById("pfw-tab-cv").className = `flex-1 py-2.5 rounded-2xl text-xs font-bold ${dt === "cv" ? "gold-pill-btn" : "app-btn-sec"}`;
    document.getElementById("pfw-tab-lamaran").className = `flex-1 py-2.5 rounded-2xl text-xs font-bold ${dt === "lamaran" ? "gold-pill-btn" : "app-btn-sec"}`;
    const list = PORTFOLIO_CATALOG[dt] || PORTFOLIO_CATALOG.cv;
    if (!list.some(x => x.id === pfWizardState.themeId)) pfWizardState.themeId = list[0].id;

    document.getElementById("pfw-theme-grid").innerHTML = list.map(item => {
        const obj = getPortfolioThemeObj(dt, item.id);
        const sel = pfWizardState.themeId === obj.id;
        return `
            <div class="rounded-2xl overflow-hidden border-2 ${sel ? "border-blue-500 shadow-lg" : "border-black/15"} bg-black flex flex-col">
                ${buildPortfolioMiniCardHtml(dt, obj, false)}
                ${buildPriceStripHtml(obj, true)}
                <div class="grid grid-cols-2 gap-1.5 p-2 bg-[#16161b]">
                    <button type="button" onclick="openPortfolioDemoPreview('${dt}','${obj.id}')" class="py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold border border-white/20"><i class="fa-regular fa-eye mr-1"></i>Lihat Ini</button>
                    <button type="button" onclick="selectPortfolioTheme('${obj.id}')" class="py-2 rounded-xl gold-pill-btn text-[11px] shadow">Pilih</button>
                </div>
            </div>
        `;
    }).join("");
}

function selectPortfolioTheme(themeId) {
    pfWizardState.themeId = themeId;
    const tObj = getPortfolioThemeObj(pfWizardState.docType, themeId);
    document.getElementById("pfw-badge-type").innerText = pfWizardState.docType === "lamaran" ? "Surat Lamaran Kerja" : "Curriculum Vitae";
    document.getElementById("pfw-badge-theme").innerText = tObj.name;
    document.getElementById("pfw-badge-price").innerText = fmtRp(tObj.price);
    renderPortfolioFormFields();
    if (!pfWizardState.isEdit) {
        try {
            const sd = JSON.parse(localStorage.getItem(DRAFT_PF_KEY) || "null");
            if (sd && sd.docType === pfWizardState.docType && sd.fullName) {
                const elN = document.getElementById("pf-fullname");
                if (elN && !elN.value) elN.value = sd.fullName;
            }
        } catch {}
    }
    bindPortfolioAutoSave();
    setPortfolioWizardStep(2);
}

function bindPortfolioAutoSave() {
    const form = document.getElementById("portfolio-form");
    if (!form) return;
    form.oninput = () => {
        clearTimeout(pfDraftSaveTimer);
        pfDraftSaveTimer = setTimeout(() => {
            try {
                const fullName = document.getElementById("pf-fullname")?.value || "";
                if (fullName) localStorage.setItem(DRAFT_PF_KEY, JSON.stringify({ docType: pfWizardState.docType, fullName }));
            } catch {}
        }, 700);
    };
}

function renderPortfolioFormFields(prefill = null) {
    const isLam = pfWizardState.docType === "lamaran";
    const isNoPhotoTheme = pfWizardState.themeId === "cv_ats" || pfWizardState.themeId === "cv_royal";
    const d = prefill || {};
    const l = Object.assign({}, DEFAULT_LAMARAN_TEMPLATE, d.lamaran || {});
    const box = document.getElementById("pfw-dynamic-fields"); if (!box) return;

    const photoHint = isNoPhotoTheme
        ? "Desain ini bergaya korporat/ATS tanpa foto (foto tetap boleh disimpan jika suatu saat ganti tema)."
        : "Akan disesuaikan otomatis ke rasio 3:4 dan tampil tajam di PDF.";

    const photoBlock = !isLam ? `
        <div class="app-card-soft border rounded-2xl p-4 flex items-center gap-4">
            <img id="pf-photo-prev" src="${pfWizardState.photoData || DEFAULT_AVATAR}" class="w-16 h-16 rounded-2xl object-cover border gold-border bg-zinc-800 shrink-0">
            <div class="flex-1 space-y-1.5">
                <strong class="text-xs block">Pas Foto Formal (Opsional)</strong>
                <p class="text-[10px] app-muted">${photoHint}</p>
                <div class="flex gap-2">
                    <label class="px-3 py-1.5 rounded-lg gold-pill-btn text-[11px] cursor-pointer"><i class="fa-solid fa-crop-simple mr-1"></i>Upload Foto<input type="file" accept="image/*" class="hide" onchange="pickCroppedPortfolioPhoto(this)"></label>
                    ${pfWizardState.photoData ? `<button type="button" onclick="pfWizardState.photoData='';renderPortfolioFormFields(collectPortfolioFormPayload(true));" class="px-2.5 py-1.5 rounded-lg bg-red-600/15 text-red-500 text-[11px] font-bold">Hapus</button>` : ""}
                </div>
            </div>
        </div>
    ` : "";

    const lamaranBlock = isLam ? `
        <div class="app-card-soft border rounded-2xl p-4 space-y-3">
            <h4 class="text-xs font-bold uppercase app-accent border-b gold-border pb-2">Detail Surat Lamaran (Sudah Terisi Contoh — Bebas Diedit)</h4>
            <div class="grid sm:grid-cols-2 gap-3">
                <div><label class="app-label">Kota &amp; Tanggal Surat</label><input type="text" id="lam-citydate" value="${esc(l.cityDate)}" class="app-input" required></div>
                <div><label class="app-label">Perihal / Subjek</label><input type="text" id="lam-subject" value="${esc(l.subject)}" class="app-input" required></div>
                <div><label class="app-label">Posisi / Jabatan Dilamar</label><input type="text" id="lam-position" value="${esc(l.position || d.headline || "Staf Operasional")}" class="app-input" required></div>
                <div><label class="app-label">Kepada (Yth. HRD / Pimpinan)</label><input type="text" id="lam-recipient" value="${esc(l.recipientTitle)}" class="app-input" required></div>
                <div><label class="app-label">Nama Perusahaan Tujuan</label><input type="text" id="lam-company" value="${esc(l.companyName)}" class="app-input" required></div>
                <div><label class="app-label">Alamat Perusahaan</label><input type="text" id="lam-compaddr" value="${esc(l.companyAddress)}" class="app-input"></div>
            </div>
            <div><label class="app-label">Salam Pembuka</label><input type="text" id="lam-salutation" value="${esc(l.salutation)}" class="app-input"></div>
            <div><label class="app-label">Paragraf Pembuka Lamaran</label><textarea id="lam-opening" class="app-input h-20" required>${escHtml(l.opening)}</textarea></div>
            <div><label class="app-label">Daftar Lampiran Berkas</label><input type="text" id="lam-attach" value="${esc(l.attachmentsList)}" class="app-input"></div>
            <div><label class="app-label">Paragraf Penutup Lamaran</label><textarea id="lam-closing" class="app-input h-20">${escHtml(l.closing)}</textarea></div>
        </div>
    ` : `
        <div class="app-card-soft border rounded-2xl p-4 space-y-3">
            <div class="flex justify-between items-center border-b gold-border pb-2">
                <h4 class="text-xs font-bold uppercase app-accent">Keahlian (Skor 1 - 5 Bintang)</h4>
                <button type="button" onclick="addPfSkillRow()" class="text-xs app-accent font-bold hover:underline">+ Tambah Keahlian</button>
            </div>
            <div id="pf-skills-rows" class="space-y-2"></div>
        </div>
        <div class="app-card-soft border rounded-2xl p-4 space-y-3">
            <div class="flex justify-between items-center border-b gold-border pb-2">
                <h4 class="text-xs font-bold uppercase app-accent">Pengalaman Kerja</h4>
                <button type="button" onclick="addPfExpRow()" class="text-xs app-accent font-bold hover:underline">+ Tambah Pengalaman</button>
            </div>
            <div id="pf-exp-rows" class="space-y-2.5"></div>
        </div>
        <div class="app-card-soft border rounded-2xl p-4 space-y-3">
            <div class="flex justify-between items-center border-b gold-border pb-2">
                <h4 class="text-xs font-bold uppercase app-accent">Riwayat Pendidikan</h4>
                <button type="button" onclick="addPfEduRow()" class="text-xs app-accent font-bold hover:underline">+ Tambah Pendidikan</button>
            </div>
            <div id="pf-edu-rows" class="space-y-2.5"></div>
        </div>
    `;

    box.innerHTML = `
        ${photoBlock}
        <div class="app-card-soft border rounded-2xl p-4 space-y-3">
            <h4 class="text-xs font-bold uppercase app-accent border-b gold-border pb-2">Data Pribadi</h4>
            <div class="grid sm:grid-cols-2 gap-3">
                <div><label class="app-label">Nama Lengkap (Wajib)</label><input type="text" id="pf-fullname" value="${esc(d.fullName || "")}" placeholder="Nama lengkap Anda" class="app-input" required></div>
                <div><label class="app-label">${isLam ? "Bidang / Ringkasan Singkat" : "Judul Profesi / Posisi"}</label><input type="text" id="pf-headline" value="${esc(d.headline || "")}" placeholder="Contoh: Staf Administrasi" class="app-input"></div>
                ${isLam ? `<div><label class="app-label">Tempat Lahir</label><input type="text" id="pf-birthplace" value="${esc(d.birthPlace || "")}" placeholder="Kota kelahiran" class="app-input"></div>
                <div><label class="app-label">Tanggal Lahir</label><input type="text" id="pf-birthdate" value="${esc(d.birthDate || "")}" placeholder="Contoh: 12 Mei 1996" class="app-input"></div>` : ""}
                <div><label class="app-label">No. HP / WhatsApp</label><input type="text" id="pf-phone" value="${esc(d.phone || "")}" placeholder="08xxxxxxxxxx" class="app-input" required></div>
                <div><label class="app-label">Email</label><input type="email" id="pf-email" value="${esc(d.email || "")}" placeholder="email@anda.com" class="app-input" required></div>
                <div class="sm:col-span-2"><label class="app-label">Alamat Domisili</label><input type="text" id="pf-address" value="${esc(d.address || "")}" placeholder="Alamat lengkap Anda" class="app-input"></div>
                <div class="sm:col-span-2"><label class="app-label">Profil / Ringkasan Diri</label><textarea id="pf-summary" class="app-input h-20" placeholder="Ceritakan secara singkat keahlian & motivasi Anda...">${escHtml(d.summary || "")}</textarea></div>
            </div>
        </div>
        ${lamaranBlock}
    `;

    if (!isLam) {
        renderPfSkillRows(d.skills || pfWizardState.skills);
        renderPfExpRows(d.experiences || pfWizardState.experiences);
        renderPfEduRows(d.educations || pfWizardState.educations);
    }
}

function pickCroppedPortfolioPhoto(inp) {
    const file = inp.files[0]; if (!file) return; inp.value = "";
    openImageCropper(file, 3 / 4, "Pas Foto Formal (3:4)", 480, 640, async (dataUrl) => {
        showLoading("Mengunggah pas foto...");
        const up = await apiAction({ action: "upload_media", dataUrl, prefix: "pf_photo" });
        hideLoading();
        const finalUrl = (up && up.ok && up.url) ? up.url : dataUrl;
        pfWizardState.photoData = finalUrl;
        if (finalUrl && !finalUrl.startsWith("data:")) {
            idbSet("pf_photo_url_" + finalUrl, dataUrl);
        }
        const prev = document.getElementById("pf-photo-prev");
        if (prev) prev.src = finalUrl;
        showToast("Pas foto tersimpan!");
    });
}

function renderPfSkillRows(list) {
    const box = document.getElementById("pf-skills-rows"); if (!box) return;
    box.innerHTML = (list || []).map((s) => `
        <div class="grid grid-cols-[1fr_auto_auto] gap-2 items-center app-card p-2.5 rounded-xl border pf-skill-row">
            <input type="text" value="${esc(s.name)}" placeholder="Nama keahlian" class="pf-sk-name app-input !py-1.5">
            <select class="pf-sk-lvl app-input !py-1.5 !w-auto font-bold">
                ${[1,2,3,4,5].map(n => `<option value="${n}" ${Number(s.level)===n?"selected":""}>★ ${n}/5</option>`).join("")}
            </select>
            <button type="button" onclick="this.closest('.pf-skill-row').remove()" class="px-2.5 py-1.5 rounded-xl bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join("");
}
function addPfSkillRow() {
    const cur = Array.from(document.querySelectorAll(".pf-skill-row")).map(r => ({ name: r.querySelector(".pf-sk-name").value, level: Number(r.querySelector(".pf-sk-lvl").value) || 4 }));
    cur.push({ name: "", level: 4 });
    renderPfSkillRows(cur);
}

function renderPfExpRows(list) {
    const box = document.getElementById("pf-exp-rows"); if (!box) return;
    box.innerHTML = (list || []).map(ex => `
        <div class="app-card p-3 rounded-xl border space-y-2 pf-exp-row">
            <div class="grid sm:grid-cols-3 gap-2">
                <input type="text" value="${esc(ex.role)}" placeholder="Posisi / Jabatan" class="pf-ex-role app-input !py-1.5">
                <input type="text" value="${esc(ex.company)}" placeholder="Nama Perusahaan" class="pf-ex-comp app-input !py-1.5">
                <div class="flex gap-1.5">
                    <input type="text" value="${esc(ex.period)}" placeholder="Periode (2022-2025)" class="pf-ex-per app-input !py-1.5 flex-1">
                    <button type="button" onclick="this.closest('.pf-exp-row').remove()" class="px-2.5 rounded-xl bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <input type="text" value="${esc(ex.desc)}" placeholder="Uraian tugas & pencapaian" class="pf-ex-desc app-input !py-1.5">
        </div>
    `).join("");
}
function addPfExpRow() {
    const cur = Array.from(document.querySelectorAll(".pf-exp-row")).map(r => ({ role: r.querySelector(".pf-ex-role").value, company: r.querySelector(".pf-ex-comp").value, period: r.querySelector(".pf-ex-per").value, desc: r.querySelector(".pf-ex-desc").value }));
    cur.push({ role: "", company: "", period: "", desc: "" });
    renderPfExpRows(cur);
}

function renderPfEduRows(list) {
    const box = document.getElementById("pf-edu-rows"); if (!box) return;
    box.innerHTML = (list || []).map(ed => `
        <div class="app-card p-3 rounded-xl border space-y-2 pf-edu-row">
            <div class="grid sm:grid-cols-3 gap-2">
                <input type="text" value="${esc(ed.degree)}" placeholder="Gelar / Jurusan" class="pf-ed-deg app-input !py-1.5">
                <input type="text" value="${esc(ed.school)}" placeholder="Nama Sekolah / Kampus" class="pf-ed-sch app-input !py-1.5">
                <div class="flex gap-1.5">
                    <input type="text" value="${esc(ed.period)}" placeholder="Tahun (2018-2022)" class="pf-ed-per app-input !py-1.5 flex-1">
                    <button type="button" onclick="this.closest('.pf-edu-row').remove()" class="px-2.5 rounded-xl bg-red-600/15 text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <input type="text" value="${esc(ed.desc)}" placeholder="Catatan tambahan (opsional)" class="pf-ed-desc app-input !py-1.5">
        </div>
    `).join("");
}
function addPfEduRow() {
    const cur = Array.from(document.querySelectorAll(".pf-edu-row")).map(r => ({ degree: r.querySelector(".pf-ed-deg").value, school: r.querySelector(".pf-ed-sch").value, period: r.querySelector(".pf-ed-per").value, desc: r.querySelector(".pf-ed-desc").value }));
    cur.push({ degree: "", school: "", period: "", desc: "" });
    renderPfEduRows(cur);
}

function autoFillPortfolioDemo() {
    const demo = buildDemoPortfolioDoc(pfWizardState.docType, pfWizardState.themeId);
    pfWizardState.skills = demo.skills;
    pfWizardState.experiences = demo.experiences;
    pfWizardState.educations = demo.educations;
    renderPortfolioFormFields(demo);
    showToast("Contoh data terisi!", "info");
}

function collectPortfolioFormPayload(isPreviewOnly = false) {
    const tObj = getPortfolioThemeObj(pfWizardState.docType, pfWizardState.themeId);
    const fullName = (document.getElementById("pf-fullname")?.value || "").trim();
    const headline = (document.getElementById("pf-headline")?.value || "").trim();
    const phone = (document.getElementById("pf-phone")?.value || "").trim();
    const email = (document.getElementById("pf-email")?.value || "").trim();
    const address = (document.getElementById("pf-address")?.value || "").trim();
    const summary = (document.getElementById("pf-summary")?.value || "").trim();

    const skills = Array.from(document.querySelectorAll(".pf-skill-row")).map(r => ({
        name: r.querySelector(".pf-sk-name").value.trim(),
        level: Number(r.querySelector(".pf-sk-lvl").value) || 4
    })).filter(x => x.name);

    const experiences = Array.from(document.querySelectorAll(".pf-exp-row")).map(r => ({
        role: r.querySelector(".pf-ex-role").value.trim(),
        company: r.querySelector(".pf-ex-comp").value.trim(),
        period: r.querySelector(".pf-ex-per").value.trim(),
        desc: r.querySelector(".pf-ex-desc").value.trim()
    })).filter(x => x.role || x.company);

    const educations = Array.from(document.querySelectorAll(".pf-edu-row")).map(r => ({
        degree: r.querySelector(".pf-ed-deg").value.trim(),
        school: r.querySelector(".pf-ed-sch").value.trim(),
        period: r.querySelector(".pf-ed-per").value.trim(),
        desc: r.querySelector(".pf-ed-desc").value.trim()
    })).filter(x => x.degree || x.school);

    const lamaran = pfWizardState.docType === "lamaran" ? {
        cityDate: (document.getElementById("lam-citydate")?.value || "").trim(),
        subject: (document.getElementById("lam-subject")?.value || "").trim(),
        position: (document.getElementById("lam-position")?.value || "").trim(),
        recipientTitle: (document.getElementById("lam-recipient")?.value || "").trim(),
        companyName: (document.getElementById("lam-company")?.value || "").trim(),
        companyAddress: (document.getElementById("lam-compaddr")?.value || "").trim(),
        salutation: (document.getElementById("lam-salutation")?.value || "").trim(),
        opening: (document.getElementById("lam-opening")?.value || "").trim(),
        attachmentsList: (document.getElementById("lam-attach")?.value || "").trim(),
        closing: (document.getElementById("lam-closing")?.value || "").trim()
    } : null;

    const prefix = pfWizardState.docType === "lamaran" ? "Surat Lamaran" : "CV";
    return {
        docType: pfWizardState.docType,
        themeId: tObj.id,
        themeName: tObj.name,
        price: tObj.price,
        origPrice: tObj.origPrice || 0,
        title: `${prefix} — ${fullName || "Berkas"}`,
        fullName,
        headline: headline || (lamaran && lamaran.position) || "",
        birthPlace: (document.getElementById("pf-birthplace")?.value || "").trim(),
        birthDate: (document.getElementById("pf-birthdate")?.value || "").trim(),
        phone,
        email,
        address,
        summary,
        photo: pfWizardState.photoData || "",
        skills,
        experiences,
        educations,
        lamaran,
        lampiranDocs: pfWizardState.lampiranDocs || []
    };
}

function openEditPortfolio(pfId, isAdminDirect = false) {
    const pf = (db.portfolios || []).find(p => String(p.id) === String(pfId)); if (!pf) return;
    if (!isAdminDirect) {
        if (pf.status !== "Aktif") return showToast("Berkas baru bisa direvisi setelah aktif.", "error");
        if ((pf.editCount || 0) >= 2) return showToast("Kuota revisi maksimal (2 kali) sudah habis.", "error");
    }
    currentViewName = "portfolio_wizard";
    pfWizardState = {
        isEdit: true,
        adminDirectEdit: !!isAdminDirect,
        editPfId: pf.id,
        isCabangBypass: false,
        docType: pf.docType || "cv",
        themeId: pf.themeId || "cv_emerald",
        photoData: pf.photo || "",
        skills: pf.skills || [],
        experiences: pf.experiences || [],
        educations: pf.educations || [],
        lampiranDocs: pf.lampiranDocs || []
    };
    hideAllViews();
    document.getElementById("view-portfolio-wizard").classList.remove("hide");
    document.getElementById("pfw-heading").innerText = isAdminDirect ? `Edit Langsung — ${pf.title}` : `Ajukan Revisi ke-${(pf.editCount || 0) + 1}`;
    document.getElementById("btn-submit-pf").innerText = isAdminDirect ? "Simpan Perubahan Langsung" : `Kirim Revisi ke-${(pf.editCount || 0) + 1}`;
    document.getElementById("pfw-btn-change-theme").classList.toggle("hide", !isAdminDirect);
    const tObj = getPortfolioThemeObj(pfWizardState.docType, pfWizardState.themeId);
    document.getElementById("pfw-badge-type").innerText = pfWizardState.docType === "lamaran" ? "Surat Lamaran Kerja" : "Curriculum Vitae";
    document.getElementById("pfw-badge-theme").innerText = tObj.name;
    document.getElementById("pfw-badge-price").innerText = fmtRp(pf.price || tObj.price);
    renderHeaderActions();
    pushBackGuard();
    renderPortfolioFormFields(pf);
    setPortfolioWizardStep(2);
}

async function submitPortfolioForm(e) {
    e.preventDefault();
    setBtnLoading("btn-submit-pf", true, "Menyimpan...");
    const payload = collectPortfolioFormPayload(false);
    const curU = getCurrentUserObj();
    const cabBrand = (curU && curU.role === "cabang") ? ((curU.brandName && curU.brandName.trim()) ? curU.brandName.trim() : curU.name) : "";
    payload.brandName = cabBrand;

    if (pfWizardState.isEdit) {
        if (pfWizardState.adminDirectEdit) {
            const orig = (db.portfolios || []).find(p => String(p.id) === String(pfWizardState.editPfId));
            const res = await apiAction({
                action: "upsert_portfolio",
                portfolio: Object.assign({}, orig, payload, { brandName: (orig && orig.brandName) || cabBrand }),
                adminActionLog: `Mengedit langsung ${payload.docType === "lamaran" ? "Lamaran" : "CV"} "${payload.title}"`
            });
            setBtnLoading("btn-submit-pf", false);
            if (!res || !res.ok) return showToast((res && res.message) || "Gagal menyimpan perubahan.", "error");
            showToast("Perubahan berkas langsung tersimpan!");
            return routeDashboard();
        }
        const res = await apiAction({ action: "submit_portfolio_revision", id: pfWizardState.editPfId, revision: payload });
        setBtnLoading("btn-submit-pf", false);
        if (!res || !res.ok) return showToast((res && res.message) || "Gagal mengirim revisi.", "error");
        showToast("Revisi berkas terkirim! Menunggu persetujuan Admin.");
        return routeDashboard();
    }

    const newId = Date.now();
    const newPf = Object.assign({
        id: newId,
        createdAt: newId,
        owner: currentSessionUser,
        status: pfWizardState.isCabangBypass ? "Aktif" : "Menunggu Pembayaran",
        editCount: 0,
        uniqueCode: getDeterministicUniqueCode(newId),
        paymentProof: ""
    }, payload);
    newPf.totalPay = Number(newPf.price || 20000) + newPf.uniqueCode;

    const res = await apiAction({
        action: "upsert_portfolio",
        portfolio: newPf,
        deductQuotaFrom: pfWizardState.isCabangBypass ? currentSessionUser : ""
    });
    setBtnLoading("btn-submit-pf", false);
    if (!res || !res.ok) return showToast((res && res.message) || "Gagal menyimpan berkas.", "error");

    if (!Array.isArray(db.portfolios)) db.portfolios = [];
    if (!db.portfolios.some(p => String(p.id) === String(newPf.id))) {
        db.portfolios.unshift(newPf);
        idbSet("db_snapshot", db);
    }
    try { localStorage.removeItem(DRAFT_PF_KEY); } catch {}

    if (pfWizardState.isCabangBypass) {
        showToast("Berkas klien langsung AKTIF (-1 Kuota)!");
        return routeDashboard();
    }
    openUnifiedPayment("portfolio", newPf.id);
}

// ================= 4. SEMPURNAKAN (AUTO-SCAN, SIMPAN LOKAL & PDF ANTI-BLANK) =================
function _getLampiranCacheKey(pfId) {
    return `pf_lampiran_${String(pfId || "draft")}`;
}

async function _persistSempurnakanAttachments() {
    if (!sempurnakanPfDocObj || !sempurnakanPfDocObj.id) return;
    try {
        await idbSet(_getLampiranCacheKey(sempurnakanPfDocObj.id), sempurnakanPfDocObj.lampiranDocs || []);
    } catch {}
}

async function _fetchImageAsDataUrl(url) {
    try {
        const res = await fetch(url, { mode: "cors", cache: "force-cache" });
        if (!res.ok) return "";
        const blob = await res.blob();
        if (!blob || !blob.type.startsWith("image/")) return "";
        return await new Promise((resolve) => {
            const r = new FileReader();
            r.onload = (e) => resolve(e.target.result || "");
            r.onerror = () => resolve("");
            r.readAsDataURL(blob);
        });
    } catch {
        return "";
    }
}

async function _resolvePdfSafePhotoDataUrl(photoUrl) {
    const raw = String(photoUrl || "").trim();
    if (!raw) return "";
    if (raw.startsWith("data:image/")) return raw;

    try {
        const cached = await idbGet("pf_photo_url_" + raw);
        if (cached && String(cached).startsWith("data:image/")) return cached;
    } catch {}

    const candidates = [];
    const m = raw.match(/(?:drive|docs)\.google\.com\/(?:file\/d\/|uc\?(?:.*&)?id=|open\?id=|thumbnail\?(?:.*&)?id=)([a-zA-Z0-9_-]{15,})/)
        || raw.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{15,})/);
    if (m) {
        const id = m[1];
        candidates.push(`https://lh3.googleusercontent.com/d/${id}=w640`);
        candidates.push(`https://drive.google.com/thumbnail?id=${id}&sz=w640`);
    }
    candidates.push(raw);

    for (const url of candidates) {
        const dataUrl = await _fetchImageAsDataUrl(url);
        if (dataUrl) {
            idbSet("pf_photo_url_" + raw, dataUrl);
            return dataUrl;
        }
    }

    for (const url of candidates) {
        const viaCanvas = await new Promise((resolve) => {
            const im = new Image();
            im.crossOrigin = "anonymous";
            im.onload = () => {
                try {
                    const c = document.createElement("canvas");
                    c.width = im.naturalWidth || 480;
                    c.height = im.naturalHeight || 640;
                    c.getContext("2d").drawImage(im, 0, 0);
                    resolve(c.toDataURL("image/jpeg", 0.88));
                } catch {
                    resolve("");
                }
            };
            im.onerror = () => resolve("");
            im.src = url;
        });
        if (viaCanvas) {
            idbSet("pf_photo_url_" + raw, viaCanvas);
            return viaCanvas;
        }
    }

    return raw;
}

async function applyAutoScanFilter(dataUrl) {
    return await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const maxSide = 1240;
            const sc = Math.min(1, maxSide / Math.max(img.width, img.height));
            const c = document.createElement("canvas");
            c.width = Math.round(img.width * sc);
            c.height = Math.round(img.height * sc);
            const ctx = c.getContext("2d");
            ctx.filter = "grayscale(100%) contrast(1.28) brightness(1.08)";
            ctx.drawImage(img, 0, 0, c.width, c.height);
            resolve(c.toDataURL("image/jpeg", 0.78));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

async function openSempurnakanModal(pfId) {
    const pf = (db.portfolios || []).find(p => String(p.id) === String(pfId)); if (!pf) return;
    sempurnakanPfDocObj = pf;
    sempurnakanPdfMode = "hrd";

    try {
        const savedAtts = await idbGet(_getLampiranCacheKey(pf.id));
        if (Array.isArray(savedAtts) && savedAtts.length) {
            const existingIds = new Set((pf.lampiranDocs || []).map(x => x.id));
            const merged = [...(pf.lampiranDocs || [])];
            savedAtts.forEach(item => {
                if (item && item.src && !existingIds.has(item.id)) merged.push(item);
            });
            pf.lampiranDocs = merged;
        }
    } catch {}

    document.getElementById("smp-doc-subtitle").innerText = `${pf.title} • ${pf.themeName || pf.themeId}`;
    setPdfQualityMode("hrd");
    renderSempurnakanAttachments();
    buildCoverLetterEmailText(pf);
    document.getElementById("modal-sempurnakan").classList.remove("hide");
    pushBackGuard();
}

function setPdfQualityMode(mode) {
    sempurnakanPdfMode = mode;
    document.getElementById("smp-q-hrd").className = `py-2.5 px-3 rounded-xl text-xs font-bold ${mode === "hrd" ? "gold-pill-btn" : "app-btn-sec"}`;
    document.getElementById("smp-q-hd").className = `py-2.5 px-3 rounded-xl text-xs font-bold ${mode === "hd" ? "gold-pill-btn" : "app-btn-sec"}`;
}

async function addAttachmentsToSempurnakan(inp) {
    const files = Array.from(inp.files || []); inp.value = "";
    if (!files.length || !sempurnakanPfDocObj) return;
    const autoScan = !!document.getElementById("smp-autoscan-chk")?.checked;
    showLoading(`Memproses ${files.length} lampiran...`);
    if (!Array.isArray(sempurnakanPfDocObj.lampiranDocs)) sempurnakanPfDocObj.lampiranDocs = [];

    for (const f of files) {
        const raw = await quickResizeImage(f, 1240, 0.82);
        const processed = autoScan ? await applyAutoScanFilter(raw) : raw;
        sempurnakanPfDocObj.lampiranDocs.push({
            id: Date.now() + "_" + Math.random().toString(36).slice(2, 6),
            name: f.name,
            src: processed
        });
    }
    await _persistSempurnakanAttachments();
    hideLoading();
    renderSempurnakanAttachments();
    showToast(`${files.length} lampiran ditambahkan & tersimpan otomatis di HP!`);
}

async function removeSempurnakanAttachment(attId) {
    if (!sempurnakanPfDocObj) return;
    sempurnakanPfDocObj.lampiranDocs = (sempurnakanPfDocObj.lampiranDocs || []).filter(x => x.id !== attId);
    await _persistSempurnakanAttachments();
    renderSempurnakanAttachments();
}

function renderSempurnakanAttachments() {
    const box = document.getElementById("smp-attachments-list"); if (!box || !sempurnakanPfDocObj) return;
    const list = sempurnakanPfDocObj.lampiranDocs || [];
    if (!list.length) {
        box.innerHTML = `<p class="text-[11px] app-muted col-span-full py-2">Belum ada lampiran tambahan. Berkas utama tetap bisa langsung diunduh ke PDF.</p>`;
        return;
    }
    box.innerHTML = list.map((item, idx) => `
        <div class="app-card border rounded-xl p-2 relative space-y-1">
            <button type="button" onclick="removeSempurnakanAttachment('${esc(item.id)}')" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white text-[10px]"><i class="fa-solid fa-xmark"></i></button>
            <img src="${item.src}" class="w-full h-24 object-contain bg-white rounded-lg border">
            <span class="text-[10px] font-bold block truncate">Lampiran #${idx + 1}</span>
        </div>
    `).join("");
}

function buildCoverLetterEmailText(pf) {
    const pos = (pf.lamaran && pf.lamaran.position) || pf.headline || "posisi yang tersedia";
    const comp = (pf.lamaran && pf.lamaran.companyName) || "Bapak/Ibu HRD";
    const txt = `Kepada Yth. HRD / Pimpinan ${comp},\n\nPerkenalkan, saya ${pf.fullName || "Pelamar"}. Melalui pesan/email ini, saya bermaksud mengajukan lamaran kerja untuk posisi ${pos}.\n\nBersama ini saya lampirkan berkas lamaran & dokumen pendukung saya dalam satu file PDF. Besar harapan saya dapat diberikan kesempatan untuk berdiskusi lebih lanjut.\n\nTerima kasih atas perhatian dan waktunya.\n\nHormat saya,\n${pf.fullName || ""}\nHP/WA: ${pf.phone || "-"}`;
    const el = document.getElementById("smp-email-text");
    if (el) el.value = txt;
}

function copyCoverLetterMsg() {
    const txt = document.getElementById("smp-email-text")?.value || "";
    if (!txt) return;
    navigator.clipboard.writeText(txt);
    showToast("Teks pengantar lamaran disalin!");
}

async function generateMergedPortfolioPdf() {
    if (!sempurnakanPfDocObj) return;
    setBtnLoading("btn-generate-merged-pdf", true, "Menyiapkan Foto & PDF...");
    try {
        await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
        await loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");

        const safePhoto = sempurnakanPfDocObj.photo
            ? await _resolvePdfSafePhotoDataUrl(sempurnakanPfDocObj.photo)
            : "";
        const docForPdf = Object.assign({}, sempurnakanPfDocObj, { photo: safePhoto });

        setBtnLoading("btn-generate-merged-pdf", true, "Menyusun Halaman PDF...");
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const scale = sempurnakanPdfMode === "hd" ? 2.0 : 1.45;
        const jpgQuality = sempurnakanPdfMode === "hd" ? 0.90 : 0.76;

        const tempHost = document.createElement("div");
        tempHost.style.position = "fixed";
        tempHost.style.left = "-9999px";
        tempHost.style.top = "0";
        tempHost.innerHTML = renderPortfolioA4Html(docForPdf, false);
        document.body.appendChild(tempHost);

        const imgs = Array.from(tempHost.querySelectorAll("img"));
        await Promise.all(imgs.map(im => im.complete ? Promise.resolve() : new Promise(r => { im.onload = r; im.onerror = r; })));

        const sheetEl = tempHost.querySelector(".a4-paper-sheet");
        const canvas = await window.html2canvas(sheetEl, {
            scale,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#ffffff"
        });
        document.body.removeChild(tempHost);

        const imgData = canvas.toDataURL("image/jpeg", jpgQuality);
        const pageW = 210, pageH = 297;
        const imgH = (canvas.height * pageW) / canvas.width;
        let heightLeft = imgH;
        let position = 0;

        pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH);
        heightLeft -= pageH;
        while (heightLeft > 4) {
            position = heightLeft - imgH;
            pdf.addPage();
            pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH);
            heightLeft -= pageH;
        }

        for (const att of (sempurnakanPfDocObj.lampiranDocs || [])) {
            pdf.addPage();
            const margin = 12;
            const maxW = pageW - margin * 2;
            const maxH = pageH - margin * 2;
            const dims = await new Promise((resolve) => {
                const im = new Image();
                im.onload = () => resolve({ w: im.width || 4, h: im.height || 3 });
                im.onerror = () => resolve({ w: 4, h: 3 });
                im.src = att.src;
            });
            const ratio = Math.min(maxW / dims.w, maxH / dims.h);
            const drawW = dims.w * ratio;
            const drawH = dims.h * ratio;
            const x = (pageW - drawW) / 2;
            const y = (pageH - drawH) / 2;
            pdf.addImage(att.src, "JPEG", x, y, drawW, drawH);
        }

        pdf.save(`${slugify(sempurnakanPfDocObj.title || "berkas_lamaran")}.pdf`);
        showToast("File PDF berhasil digabung & diunduh!");
    } catch {
        showToast("Gagal membuat PDF. Coba lagi atau periksa koneksi internet Anda.", "error");
    } finally {
        setBtnLoading("btn-generate-merged-pdf", false);
    }
}
