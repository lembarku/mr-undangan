// =========================================================================
// LEMBARKU & TITIK GOWES — CONFIG, CATALOGS & SHARED ENGINE (js/config.js)
// Versi: V14.3 (Modular Super-App Ekosistem)
// =========================================================================
const CLOUD_API_URL = "https://script.google.com/macros/s/AKfycbyHsITJ02tiA59p0QIXkOQaO3VnBFQmDBp-7iUHcUkmrYjlOtRVwxhlGZCzL4RLKKNW/exec";
const FOUNDER_USERNAME = "kausar.af";

const SESSION_KEY = "MR_UNDANGAN_SESSION";
const SESSION_TOKEN_KEY = "MR_UNDANGAN_SESSION_TOKEN";
const DISPLAY_NAME_KEY = "MR_UNDANGAN_DISPLAY_NAME";
const APP_THEME_KEY = "MR_UNDANGAN_APP_THEME";
const APP_MODE_KEY = "MR_APP_MODE"; // 'lembarku' | 'titik_gowes'
const PWA_REMIND_KEY = "MR_PWA_REMIND_TS";
const LOGIN_REMIND_KEY = "MR_LOGIN_REMIND_TS";
const DRAFT_INV_KEY = "MR_DRAFT_INV";
const DRAFT_PF_KEY = "MR_DRAFT_PF";
const GUEST_CHAT_KEY = "MR_GUEST_CHAT_ID";
const APP_DEVICE_ID_KEY = "LBK_PWA_DEVICE_ID";
const APP_INSTALLED_REPORTED_KEY = "LBK_PWA_STATUS_REPORTED";
const NOTIF_READ_TS_KEY = "LBK_NOTIF_LAST_READ_TS";

const DEFAULT_PRIVACY = {
    showProjects: true,
    showFollowers: true,
    showFollowing: true,
    showContact: false,
    showInChatContacts: true,
    allowDirectChat: true
};

const DEFAULT_AVATAR = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="#1e293b"/><circle cx="60" cy="44" r="22" fill="#94a3b8"/><path d="M22 110c4-24 22-36 38-36s34 12 38 36" fill="#94a3b8"/></svg>`
);

const LEMBARKU_LOGO_PATH = "./lembarku-logo.png";
const GOWES_LOGO_PATH = "./titik-gowes-logo.png";
const GOWES_LOGO_FALLBACK = "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><circle cx="256" cy="220" r="160" fill="none" stroke="#000000" stroke-width="26"/><path d="M120 280 L256 460 L392 280" fill="none" stroke="#000000" stroke-width="26" stroke-linejoin="round"/><circle cx="180" cy="240" r="46" fill="none" stroke="#000000" stroke-width="18"/><circle cx="332" cy="240" r="46" fill="none" stroke="#000000" stroke-width="18"/><path d="M180 240 L235 240 L280 160 L215 160 Z" fill="none" stroke="#000000" stroke-width="18" stroke-linejoin="round"/><path d="M235 240 L210 120 M332 240 L280 160 L270 125 L300 125" fill="none" stroke="#000000" stroke-width="18" stroke-linecap="round"/><circle cx="256" cy="380" r="18" fill="#000000"/></svg>`
);

const DEFAULT_WA_TEMPLATE =
`Kepada Yth. *[NAMA_TAMU]*,

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara *[JUDUL]*.

Info lengkap, peta lokasi & RSVP:
[LINK]

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

_[BRAND_FOOTER]_`;

const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=75`;

const BANK_LOGOS = {
    BCA: { bg: "#0060af", text: "#ffffff", label: "BCA" },
    BRI: { bg: "#00529c", text: "#ffffff", label: "BRI" },
    BNI: { bg: "#f15a23", text: "#ffffff", label: "BNI" },
    Mandiri: { bg: "#003d79", text: "#facc15", label: "MANDIRI" },
    BSI: { bg: "#00a39d", text: "#ffffff", label: "BSI" },
    DANA: { bg: "#118eea", text: "#ffffff", label: "DANA" },
    OVO: { bg: "#4c3494", text: "#ffffff", label: "OVO" },
    GoPay: { bg: "#00aed6", text: "#ffffff", label: "GOPAY" },
    ShopeePay: { bg: "#ee4d2d", text: "#ffffff", label: "SHOPEEPAY" },
    SeaBank: { bg: "#ff6600", text: "#ffffff", label: "SEABANK" }
};

// ================= ORNAMEN SVG UNDANGAN =================
const SVG_LEAF_SHADOW = `<svg viewBox="0 0 240 260" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M210 10C150 40 105 90 78 160c-12 30-20 62-25 90 15-20 35-42 58-58 45-32 82-78 99-182z" opacity="0.55"/><path d="M180 45C130 62 80 108 55 170c22-18 52-35 84-55 28-18 42-42 41-70z" opacity="0.35"/></svg>`;
const SVG_BATIK_SHADOW = `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="btkPat" width="44" height="44" patternUnits="userSpaceOnUse"><circle cx="22" cy="22" r="16" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.4"/><circle cx="22" cy="22" r="5" fill="currentColor" opacity="0.35"/><path d="M0 22h44M22 0v44" stroke="currentColor" stroke-width="0.6" opacity="0.2"/></pattern></defs><rect width="100%" height="100%" fill="url(#btkPat)"/></svg>`;
const SVG_ROSES_MONO = `<svg viewBox="0 0 430 70" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-14 opacity-50"><path d="M0 0h430v12c-70 28-140 42-215 42S70 40 0 12V0z" fill="rgba(255,255,255,0.12)"/><circle cx="215" cy="24" r="14" stroke="#fff" stroke-width="1.2" opacity="0.7"/><circle cx="180" cy="18" r="9" stroke="#fff" stroke-width="1" opacity="0.5"/><circle cx="250" cy="18" r="9" stroke="#fff" stroke-width="1" opacity="0.5"/></svg>`;
const SVG_GUNUNGAN_JAWA = `<svg viewBox="0 0 120 120" class="w-16 h-16 mx-auto text-amber-300" fill="currentColor"><path d="M60 6L18 96h84L60 6zm0 18l27 58H33l27-58z" opacity="0.9"/><rect x="56" y="88" width="8" height="24" rx="2"/></svg>`;
const SVG_RUMAH_SULAWESI = `<svg viewBox="0 0 140 70" class="w-20 h-10 mx-auto text-yellow-300" fill="currentColor"><path d="M10 38L70 8l60 30-14 4-46-22-46 22-14-4z"/><rect x="34" y="42" width="72" height="20" rx="2" opacity="0.85"/></svg>`;

// ================= VISUAL PRESETS UNDANGAN =================
const VISUAL_PRESETS = {
    "maroon-gold": {
        vars: { "--th-bg":"#5c0a12","--th-card-bg":"rgba(74,8,15,0.82)","--th-card-border":"1px solid rgba(243,210,133,0.38)","--th-card-radius":"1.5rem","--th-backdrop":"blur(8px)","--th-shadow":"0 16px 38px rgba(0,0,0,0.45)","--th-text":"#fdf6ec","--th-accent":"#f3d285","--th-btn-bg":"linear-gradient(90deg,#f3d285,#d4af37)","--th-btn-text":"#1f0a0c","--th-btn-radius":"9999px","--th-font-heading":"'Great Vibes',cursive","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(45,4,8,0.45) 0%,rgba(92,10,18,0.88) 100%)", ambient: "batik"
    },
    "premium-black": {
        vars: { "--th-bg":"#070709","--th-card-bg":"rgba(20,20,24,0.88)","--th-card-border":"1px solid rgba(255,255,255,0.18)","--th-card-radius":"1.5rem","--th-backdrop":"blur(10px)","--th-shadow":"0 18px 42px rgba(0,0,0,0.65)","--th-text":"#f4f4f5","--th-accent":"#ffffff","--th-btn-bg":"#ffffff","--th-btn-text":"#09090b","--th-btn-radius":"9999px","--th-font-heading":"'Great Vibes',cursive","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(0,0,0,0.38) 0%,rgba(7,7,9,0.92) 100%)", ambient: "leaf"
    },
    "dark-gold": {
        vars: { "--th-bg":"#0f1117","--th-card-bg":"rgba(24,27,36,0.88)","--th-card-border":"1px solid rgba(234,179,8,0.35)","--th-card-radius":"1.5rem","--th-backdrop":"blur(8px)","--th-shadow":"0 16px 36px rgba(0,0,0,0.5)","--th-text":"#f8fafc","--th-accent":"#eab308","--th-btn-bg":"linear-gradient(90deg,#f0d58c,#d4af37)","--th-btn-text":"#111827","--th-btn-radius":"9999px","--th-font-heading":"'Playfair Display',serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(10,12,18,0.35) 0%,rgba(15,17,23,0.9) 100%)", ambient: "batik"
    },
    "emerald-gold": {
        vars: { "--th-bg":"#04362a","--th-card-bg":"rgba(7,71,56,0.86)","--th-card-border":"1px solid rgba(250,204,21,0.38)","--th-card-radius":"1.5rem","--th-backdrop":"blur(8px)","--th-shadow":"0 16px 36px rgba(0,0,0,0.45)","--th-text":"#ecfdf5","--th-accent":"#facc15","--th-btn-bg":"linear-gradient(90deg,#fde047,#eab308)","--th-btn-text":"#052e16","--th-btn-radius":"9999px","--th-font-heading":"'Cormorant Garamond',serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(4,40,30,0.4) 0%,rgba(4,54,42,0.9) 100%)", ambient: "leaf"
    },
    "ivory-sage": {
        vars: { "--th-bg":"#f7f4ef","--th-card-bg":"rgba(255,255,255,0.92)","--th-card-border":"1px solid rgba(140,118,88,0.28)","--th-card-radius":"1.5rem","--th-backdrop":"blur(6px)","--th-shadow":"0 12px 30px rgba(0,0,0,0.08)","--th-text":"#3b352f","--th-accent":"#8c7658","--th-btn-bg":"linear-gradient(90deg,#8c7658,#6b583e)","--th-btn-text":"#ffffff","--th-btn-radius":"9999px","--th-font-heading":"'Playfair Display',serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(0,0,0,0.25) 0%,rgba(59,53,47,0.82) 100%)", extra: "linen-pattern", ambient: "leaf"
    },
    "navy-silver": {
        vars: { "--th-bg":"#172433","--th-card-bg":"rgba(31,49,70,0.88)","--th-card-border":"1px solid rgba(191,219,254,0.32)","--th-card-radius":"1.5rem","--th-backdrop":"blur(8px)","--th-shadow":"0 16px 36px rgba(0,0,0,0.48)","--th-text":"#f1f5f9","--th-accent":"#bfdbfe","--th-btn-bg":"linear-gradient(90deg,#93c5fd,#3b82f6)","--th-btn-text":"#0f172a","--th-btn-radius":"9999px","--th-font-heading":"'Cormorant Garamond',serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(15,23,42,0.35) 0%,rgba(23,36,51,0.9) 100%)", ambient: "leaf"
    },
    "pastel-pink": {
        vars: { "--th-bg":"#fff1f2","--th-card-bg":"rgba(255,255,255,0.94)","--th-card-border":"1px solid rgba(244,114,182,0.35)","--th-card-radius":"1.6rem","--th-backdrop":"blur(6px)","--th-shadow":"0 12px 28px rgba(244,114,182,0.16)","--th-text":"#3f2a30","--th-accent":"#db2777","--th-btn-bg":"linear-gradient(90deg,#f472b6,#db2777)","--th-btn-text":"#ffffff","--th-btn-radius":"9999px","--th-font-heading":"'Fredoka',sans-serif","--th-font-body":"'Plus Jakarta Sans',sans-serif" },
        coverOverlay: "linear-gradient(180deg,rgba(0,0,0,0.22) 0%,rgba(131,24,67,0.78) 100%)", ambient: "leaf"
    }
};

// ================= KATALOG 5 KATEGORI UNDANGAN =================
const THEME_CATALOG = {
    "Pernikahan": [
        { name:"Adat Kalimantan", preset:"maroon-gold", style:"kalimantan_story", ornament:"batik", price:99000, origPrice:175000, badge:"TERLARIS", img:IMG("1519741497674-611481863552") },
        { name:"Premium Black Mono", preset:"premium-black", style:"premium_black", ornament:"floral_mono", photoFilter:"mono", price:109000, origPrice:185000, badge:"VIP", img:IMG("1511285560929-80b456fea0bc") },
        { name:"Adat Jawa Klasik", preset:"dark-gold", style:"jawa", ornament:"jawa", coupleMode:"combined", price:99000, origPrice:175000, badge:"BARU", img:IMG("1515934751635-c81c6bc9a2d8") },
        { name:"Adat Sulawesi Emas", preset:"emerald-gold", style:"sulawesi", ornament:"sulawesi", price:99000, origPrice:165000, img:IMG("1522673607200-164d1b6ce486") },
        { name:"Ivory Sage Minimalis", preset:"ivory-sage", style:"editorial", ornament:"leaf", price:89000, origPrice:150000, badge:"PROMO", img:IMG("1520854221256-17451cc331bf") },
        { name:"Royal Navy Silver", preset:"navy-silver", style:"kalimantan_story", ornament:"leaf", price:95000, origPrice:160000, img:IMG("1519225421980-715cb0215aed") },
        { name:"Batik Keraton Gold", preset:"dark-gold", style:"batik", ornament:"batik", coupleMode:"combined", price:99000, origPrice:170000, img:IMG("1532712938310-34cb3982ef74") }
    ],
    "Ulang Tahun": [
        { name:"Sweet Pastel Party", preset:"pastel-pink", style:"classic_card", ornament:"leaf", price:59000, origPrice:99000, badge:"TERLARIS", img:IMG("1530103862676-de8c9debad1d") },
        { name:"Golden Sweet 17th", preset:"dark-gold", style:"classic_card", ornament:"none", price:69000, origPrice:120000, badge:"VIP", img:IMG("1464349095431-e9a21285b5f3") },
        { name:"Kids Rainbow Fun", preset:"pastel-pink", style:"classic_card", ornament:"leaf", price:55000, origPrice:95000, img:IMG("1558636508-e0db3814bd1d") }
    ],
    "Aqiqah": [
        { name:"Aqiqah Sage Islami", preset:"ivory-sage", style:"classic_card", ornament:"islami", faith:"islami", price:59000, origPrice:99000, badge:"TERLARIS", img:IMG("1519689680058-324335c77eba") },
        { name:"Aqiqah Emerald Gold", preset:"emerald-gold", style:"classic_card", ornament:"islami", faith:"islami", price:65000, origPrice:110000, img:IMG("1544126592-807ade215a0b") }
    ],
    "Syukuran": [
        { name:"Walimatul Khitan", preset:"emerald-gold", style:"classic_card", ornament:"islami", faith:"islami", isKhitan:true, price:59000, origPrice:99000, badge:"BARU", img:IMG("1513151233558-d860c5398176") },
        { name:"Syukuran Rumah Baru", preset:"ivory-sage", style:"classic_card", ornament:"leaf", faith:"islami", price:55000, origPrice:95000, img:IMG("1560518883-ce09059eeffa") },
        { name:"Syukuran Umum / Doa", preset:"navy-silver", style:"classic_card", ornament:"none", faith:"kristen", price:55000, origPrice:95000, img:IMG("1511795409834-ef04bbd61622") }
    ],
    "Lainnya": [
        { name:"Undangan Rapat & Event", preset:"navy-silver", style:"classic_card", ornament:"none", price:49000, origPrice:89000, demoTitle:"Rapat Koordinasi Tahunan", demoSub:"Pertemuan & Silaturahmi", demoOrg:"Panitia Pelaksana", img:IMG("1505373877841-8d25f7d46678") },
        { name:"Grand Opening Usaha", preset:"dark-gold", style:"classic_card", ornament:"none", price:59000, origPrice:99000, badge:"PROMO", demoTitle:"Grand Opening Store", demoSub:"Peresmian & Ramah Tamah", demoOrg:"Manajemen", img:IMG("1540575467063-178a50c2df87") }
    ]
};

// ================= KATALOG PORTOFOLIO (9 TEMA CV + 3 SURAT LAMARAN) =================
const PORTFOLIO_CATALOG = {
    cv: [
        { id:"cv_emerald", name:"Emerald Fresh", tag:"2 Kolom Modern", accent:"#1b7a49", price:20000, origPrice:40000, badge:"TERLARIS" },
        { id:"cv_charcoal", name:"Charcoal Timeline", tag:"Timeline Vertikal", accent:"#3f3f42", price:22000, origPrice:45000, badge:"BARU" },
        { id:"cv_peach", name:"Pastel Peach Gen-Z", tag:"Estetik & Kreatif", accent:"#e29d93", price:19000, origPrice:38000 },
        { id:"cv_navy", name:"Deep Navy Corporate", tag:"Profesional Kantor", accent:"#131c4e", price:25000, origPrice:50000, badge:"VIP" },
        { id:"cv_royal", name:"Royal Blue Executive", tag:"Korporat Tanpa Foto", accent:"#295594", price:25000, origPrice:50000 },
        { id:"cv_teal", name:"Ocean Teal Formal", tag:"Tabel & Data Lengkap", accent:"#0e5f82", price:22000, origPrice:45000 },
        { id:"cv_slate", name:"Slate Fresh Grad", tag:"Lulusan Baru Rapi", accent:"#24414d", price:18000, origPrice:35000, badge:"PROMO" },
        { id:"cv_clean", name:"Clean Minimalist", tag:"Putih Bersih Elegan", accent:"#18181b", price:18000, origPrice:35000 },
        { id:"cv_ats", name:"ATS Classic Pro", tag:"1 Kolom Standar HRD", accent:"#111827", price:25000, origPrice:55000, badge:"TERLARIS" }
    ],
    lamaran: [
        { id:"lam_formal", name:"Surat Lamaran Formal", tag:"Standar BUMN & PT", accent:"#18181b", price:15000, origPrice:30000, badge:"TERLARIS" },
        { id:"lam_modern", name:"Lamaran Modern Navy", tag:"Elegan & Tegas", accent:"#0f4c81", price:18000, origPrice:35000 },
        { id:"lam_fresh", name:"Lamaran Fresh Grad", tag:"Lulusan Baru & Magang", accent:"#065f46", price:15000, origPrice:30000, badge:"PROMO" }
    ]
};

// ================= KATALOG BAWAAN TITIK GOWES (ARMADA SEPEDA & SHELTER) =================
const DEFAULT_GOWES_SHELTER = {
    name: "Titik Gowes Shelter Utama",
    address: "Jl. Mulawarman No. 88, Samarinda (Dekat Taman Kota)",
    mapsUrl: "https://maps.google.com/?q=-0.502,117.153",
    operationalHours: "Setiap Hari: 05.30 - 20.00 WITA",
    csPhone: "085117488828"
};

const DEFAULT_GOWES_BIKES = [
    {
        id: "bike_1",
        name: "Polygon Xtrada 6",
        type: "MTB (Gunung)",
        frameSize: "M (165-175 cm)",
        gears: "1x11 Speed Shimano Deore",
        price2Hours: 40000,
        price6Hours: 75000,
        priceFullDay: 120000,
        status: "Tersedia",
        description: "Suspensi empuk air fork, rem hidrolik pakem, cocok untuk rute aspal maupun off-road ringan.",
        freeAccessories: ["Helm Sepeda", "Kunci Gembok Spiral", "Lampu Depan/Belakang"],
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 24,
        createdAt: 1700000000000
    },
    {
        id: "bike_2",
        name: "United Milano Roadbike",
        type: "Roadbike (Balap)",
        frameSize: "S/M (160-172 cm)",
        gears: "2x9 Speed Shimano Sora",
        price2Hours: 50000,
        price6Hours: 95000,
        priceFullDay: 150000,
        status: "Tersedia",
        description: "Super ringan & kencang, geometri nyaman untuk gowes pagi keliling kota atau latihan endurance.",
        freeAccessories: ["Helm Aero", "Pompa Mini Portabel", "Bottle Cage"],
        image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 38,
        createdAt: 1700000000001
    },
    {
        id: "bike_3",
        name: "Pacific Noris Pro Lipat",
        type: "Sepeda Lipat (Folding)",
        frameSize: "All Size (Adjustable)",
        gears: "8 Speed Shimano Tourney",
        price2Hours: 35000,
        price6Hours: 60000,
        priceFullDay: 90000,
        status: "Tersedia",
        description: "Sangat ringkas & praktis, mudah dilipat ke dalam bagasi mobil, cocok untuk Car Free Day santai.",
        freeAccessories: ["Helm Casual", "Tas Stang Depan", "Kunci Gembok"],
        image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 42,
        createdAt: 1700000000002
    }
];

// ================= ETALASE SERTIFIKAT =================
const CERT_SHOWCASE = [
    {
        id: "cert_formal_qr",
        orientation: "portrait",
        styleVariant: "navy_ornament_qr",
        cat: "Pelatihan Kompetensi",
        code: "No: 2026110845A2",
        title: "Sertifikat",
        course: "Program Pelatihan Komputer Perkantoran & Presentasi Profesional",
        holder: "Rendra Mahendra",
        org: "Balai Pengembangan Kompetensi Mandiri",
        signer: "Drs. Hendra Wijaya, M.M.",
        role: "Pimpinan Penyelenggara",
        bg: "#ffffff",
        accent: "#16324f"
    },
    {
        id: "cert_gold_mandala",
        orientation: "landscape",
        styleVariant: "champagne_mandala",
        cat: "Tata Rambut & Kecantikan",
        code: "ID: 77492018",
        title: "Certificate of Completion",
        course: "Modern Hair Styling & Coloring Masterclass",
        holder: "Nadia Putri Larasati",
        org: "Aurelia Hair & Beauty Academy",
        signer: "Clara Amanda",
        role: "Lead Instructor",
        bg: "linear-gradient(135deg, #fdfbf7 0%, #ead8b1 100%)",
        accent: "#78350f"
    },
    {
        id: "cert_rose_aesthetic",
        orientation: "landscape",
        styleVariant: "rose_gold_glitter",
        cat: "Estetika & Studio",
        code: "ID: 50419283",
        title: "Certificate of Achievement",
        course: "Eyelash Extension & Brow Styling Course",
        holder: "Sabrina Maharani",
        org: "Lumina Esthetic Studio",
        signer: "Keisha Anindita",
        role: "Senior Trainer",
        bg: "linear-gradient(135deg, #fffafa 0%, #f5e6e8 100%)",
        accent: "#831843"
    },
    {
        id: "cert_navy_ribbon",
        orientation: "landscape",
        styleVariant: "geometric_ribbon",
        cat: "Pelatihan Operasional",
        code: "Reg No. 373/DDT-LV/XI/2026",
        title: "CERTIFICATE",
        course: "Defensive Driving Training (DDT) — Light Vehicle",
        holder: "Dimas Saputra",
        org: "Cakrawala Safety Academy",
        signer: "Bagus Prakoso",
        role: "Training & Development Manager",
        bg: "#ffffff",
        accent: "#0f294a"
    },
    {
        id: "cert_wave_seal",
        orientation: "landscape",
        styleVariant: "wave_round_seal",
        cat: "Keselamatan Kerja",
        code: "No: 029/BST-XI/2026",
        title: "CERTIFICATE OF APPRECIATION",
        course: "Pembekalan Basic Safety Training (BST) & Identifikasi Bahaya",
        holder: "Aulia Rahmawati",
        org: "Sentra Diklat Keselamatan",
        signer: "Fajar Nugroho, S.T.",
        role: "Direktur Pelatihan",
        bg: "#ffffff",
        accent: "#0f4c5c"
    },
    {
        id: "cert_firstaid_modern",
        orientation: "landscape",
        styleVariant: "blue_angle_dual",
        cat: "Pertolongan Pertama",
        code: "Certificate ID: 3407976309",
        title: "FIRST AID TRAINING CERTIFICATE",
        course: "Save-a-Life Emergency & Basic First Aid",
        holder: "Bima Sakti Pratama",
        org: "Medika Tanggap Center",
        signer: "dr. Ratna Kusuma",
        role: "Koordinator Medis",
        bg: "linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)",
        accent: "#1d4ed8"
    }
];

// ================= STATE GLOBAL & FALLBACK DB =================
function getLocalFallbackDB() {
    return {
        users: [],
        invitations: [],
        portfolios: [],
        chats: [],
        adminLogs: [],
        customThemes: [],
        hiddenThemes: [],
        themeOverrides: {},
        cvPriceOverrides: {},
        musicLibrary: [],
        gowesBikes: [...DEFAULT_GOWES_BIKES],
        gowesRentals: [],
        gowesShelter: Object.assign({}, DEFAULT_GOWES_SHELTER),
        gowesAnalytics: null,
        appStats: {
            activeInstalled: 0,
            totalInstalled: 0,
            totalUninstalled: 0,
            history: []
        },
        testimonials: [
            { id: 1, name: "Rina & Dimas", category: "Undangan Pernikahan", rating: 5, text: "Undangan Adat Kalimantannya mewah banget, tamu-tamu pada puji animasi buka kertasnya!" },
            { id: 2, name: "Fajar Pratama", category: "CV & Lamaran PDF", rating: 5, text: "Fitur Sempurnakan + Auto-Scan KTP & Ijazah jadi 1 PDF di bawah 2 MB bikin lamaran saya langsung dipanggil HRD." },
            { id: 3, name: "Bayu Kurniawan", category: "Rental Titik Gowes", rating: 5, text: "Sewa United Roadbike buat gowes pagi akhir pekan sangat mulus, unit bersih dan dapat helm gratis!" }
        ],
        promoBanners: [
            { id: 1, badge: "PROMO SPESIAL", title: "Undangan Digital, CV & Lamaran Siap PDF", subtitle: "Pilih Desain → Isi Data & Konfirmasi → Bagikan / Unduh PDF langsung dari HP.", ctaText: "Lihat Desain", targetType: "section", targetSection: "sec-undangan", img: IMG("1519741497674-611481863552") },
            { id: 2, badge: "TITIK GOWES", title: "Rental Sepeda Premium: MTB, Roadbike & Lipat", subtitle: "Gowes sehat dan seru keliling kota. Booking praktis via QRIS DANA & jaminan aman.", ctaText: "Lihat Armada Sepeda", targetType: "gowes", targetSection: "sec-gowes-catalog", img: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=75" },
            { id: 3, badge: "SIAP KERJA", title: "9 Desain CV Modern + Auto-Scan PDF", subtitle: "Gabungkan CV, Surat Lamaran, KTP & Ijazah dalam 1 file PDF bersih seperti scanner.", ctaText: "Pilih Tema CV", targetType: "section", targetSection: "sec-portofolio", img: IMG("1586281380349-632531db7ed4") }
        ],
        masterSettings: {
            qrisMode: "static",
            qrisImage: "",
            qrisDynamicString: "",
            qrisUniqueCode: true,
            priceText: "Rp 99.000",
            banks: [{ bank: "DANA", no: "085117488828", holder: "Lembarku" }]
        }
    };
}

let db = getLocalFallbackDB();
let currentAppMode = localStorage.getItem(APP_MODE_KEY) || "lembarku";
let currentSessionUser = localStorage.getItem(SESSION_KEY) || null;
if (currentSessionUser && String(currentSessionUser).trim().toLowerCase() === "master") {
    currentSessionUser = FOUNDER_USERNAME;
    localStorage.setItem(SESSION_KEY, FOUNDER_USERNAME);
}
let currentSessionToken = localStorage.getItem(SESSION_TOKEN_KEY) || "";
let guestChatId = localStorage.getItem(GUEST_CHAT_KEY);
if (!guestChatId) {
    guestChatId = "tamu_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(GUEST_CHAT_KEY, guestChatId);
}
let currentViewName = "landing";
let currentMasterWorkspace = "overview";
let activeMasterChatThread = null;
let previewOpenCount = 0;
let clientPortalState = { active: false, invId: null, key: "", brandName: "", invitation: null };

// ================= 1. PENGALIH MODE EKOSISTEM (LEMBARKU <-> TITIK GOWES) =================
function toggleEcosystemDrawer(show) {
    const el = document.getElementById("drawer-ecosystem");
    const btn = document.getElementById("header-threads-btn");
    if (!el) return;
    if (show) {
        renderEcosystemDrawerUser();
        el.classList.add("open");
        if (btn) btn.classList.add("is-active");
        if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "drawer-ecosystem" });
    } else {
        el.classList.remove("open");
        if (btn) btn.classList.remove("is-active");
        if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("drawer-ecosystem");
    }
}

function renderEcosystemDrawerUser() {
    const u = typeof getCurrentUserObj === "function" ? getCurrentUserObj() : null;
    const avEl = document.getElementById("drawer-eco-avatar");
    const nmEl = document.getElementById("drawer-eco-name");
    const rlEl = document.getElementById("drawer-eco-role");
    const defAv = typeof DEFAULT_AVATAR !== "undefined" ? DEFAULT_AVATAR : "./lembarku-logo.png";

    if (!u) {
        if (avEl) avEl.src = defAv;
        if (nmEl) nmEl.innerText = "Tamu Pengunjung";
        if (rlEl) rlEl.innerText = "Masuk akun untuk akses penuh";
        return;
    }

    if (avEl) avEl.src = u.avatar || defAv;
    if (nmEl) nmEl.innerText = u.name || u.username;
    if (rlEl) {
        const roleLabel = u.role === "master" ? "Founder Lembarku"
            : u.role === "administrasi" ? "Tim Administrasi"
            : u.role === "cabang" ? `Mitra Cabang (${u.brandName || "Resmi"})`
            : "Pengguna Terdaftar";
        rlEl.innerText = `@${u.username} • ${roleLabel}`;
    }
}

function updateAppModeUI() {
    const isGowes = currentAppMode === "titik_gowes";
    const logoEl = document.getElementById("header-app-logo");
    const authLogoEl = document.getElementById("auth-brand-logo");
    const brandMainEl = document.getElementById("header-brand-main");
    const brandSubEl = document.getElementById("header-brand-sub");

    const optLbk = document.getElementById("eco-opt-lembarku");
    const optGws = document.getElementById("eco-opt-gowes");
    const chkLbk = document.getElementById("eco-chk-lembarku");
    const chkGws = document.getElementById("eco-chk-gowes");

    if (optLbk && optGws) {
        optLbk.classList.toggle("is-active", !isGowes);
        optGws.classList.toggle("is-active-gowes", isGowes);
    }
    if (chkLbk && chkGws) {
        chkLbk.classList.toggle("hide", isGowes);
        chkGws.classList.toggle("hide", !isGowes);
    }

    if (isGowes) {
        if (logoEl) {
            logoEl.src = GOWES_LOGO_PATH;
            logoEl.onerror = function() { this.src = GOWES_LOGO_FALLBACK; };
        }
        if (authLogoEl) {
            authLogoEl.src = GOWES_LOGO_PATH;
            authLogoEl.onerror = function() { this.src = GOWES_LOGO_FALLBACK; };
        }
        if (brandMainEl) brandMainEl.innerText = "Titik Gowes";
        if (brandSubEl) {
            brandSubEl.innerText = "Rental Sepeda";
            brandSubEl.classList.remove("hide");
        }
        document.body.classList.add("mode-gowes");
    } else {
        if (logoEl) {
            logoEl.src = LEMBARKU_LOGO_PATH;
            logoEl.onerror = null;
        }
        if (authLogoEl) {
            authLogoEl.src = LEMBARKU_LOGO_PATH;
            authLogoEl.onerror = null;
        }
        if (brandMainEl) brandMainEl.innerText = "Lembarku";
        if (brandSubEl) {
            brandSubEl.innerText = "";
            brandSubEl.classList.add("hide");
        }
        document.body.classList.remove("mode-gowes");
    }

    // Toggle tampilan beranda utama jika sedang berada di layar beranda
    if (currentViewName === "landing") {
        const vLbk = document.getElementById("view-landing");
        const vGws = document.getElementById("view-gowes");
        if (vLbk && vGws) {
            vLbk.classList.toggle("hide", isGowes);
            vGws.classList.toggle("hide", !isGowes);
        }
        if (isGowes && typeof renderGowesLandingPage === "function") {
            renderGowesLandingPage();
        } else if (!isGowes && typeof renderLandingPage === "function") {
            renderLandingPage();
        }
    }
}

function switchAppMode(mode) {
    if (mode !== "lembarku" && mode !== "titik_gowes") mode = "lembarku";
    currentAppMode = mode;
    localStorage.setItem(APP_MODE_KEY, mode);
    toggleEcosystemDrawer(false);
    updateAppModeUI();

    const toastMsg = mode === "titik_gowes"
        ? "Beralih ke Titik Gowes (Rental Sepeda)"
        : "Beralih ke Lembarku (Undangan & Berkas)";
    if (typeof showToast === "function") showToast(toastMsg, "info");
}

// ================= 2. PWA DEVICE TRACKING & INDEXED-DB CACHE =================
function getAppDeviceId() {
    let id = localStorage.getItem(APP_DEVICE_ID_KEY);
    if (!id) {
        id = "dev_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 9);
        localStorage.setItem(APP_DEVICE_ID_KEY, id);
    }
    return id;
}

async function reportAppInstallState(eventType) {
    const devId = getAppDeviceId();
    const prev = localStorage.getItem(APP_INSTALLED_REPORTED_KEY);
    if (prev === eventType) return;

    const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? "iOS"
        : /Android/.test(navigator.userAgent) ? "Android"
        : "Desktop";

    try {
        const res = await apiAction({
            action: "track_app_event",
            deviceId: devId,
            eventType: eventType,
            platform: platform
        });
        if (res && res.ok) {
            localStorage.setItem(APP_INSTALLED_REPORTED_KEY, eventType);
            if (res.appStats) db.appStats = res.appStats;
        }
    } catch {}
}

function openMrDb() {
    return new Promise((resolve) => {
        if (!("indexedDB" in window)) return resolve(null);
        const req = indexedDB.open("MrUndanganLocalDB", 2);
        req.onupgradeneeded = (e) => {
            const idb = e.target.result;
            if (!idb.objectStoreNames.contains("keyval")) {
                idb.createObjectStore("keyval");
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
    });
}

async function idbGet(key) {
    const idb = await openMrDb();
    if (!idb) return null;
    return new Promise((resolve) => {
        try {
            const tx = idb.transaction("keyval", "readonly");
            const st = tx.objectStore("keyval");
            const r = st.get(key);
            r.onsuccess = () => resolve(r.result || null);
            r.onerror = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
}

async function idbSet(key, val) {
    const idb = await openMrDb();
    if (!idb) return;
    try {
        const tx = idb.transaction("keyval", "readwrite");
        const st = tx.objectStore("keyval");
        st.put(val, key);
    } catch {}
}

async function idbRemove(key) {
    const idb = await openMrDb();
    if (!idb) return;
    try {
        const tx = idb.transaction("keyval", "readwrite");
        const st = tx.objectStore("keyval");
        st.delete(key);
    } catch {}
}

// ================= 3. CLIENT CLOUD SYNC & API ACTION =================
function applyPublicDb(remote) {
    if (!remote || typeof remote !== "object") return;
    ["customThemes", "hiddenThemes", "themeOverrides", "cvPriceOverrides", "musicLibrary", "testimonials", "promoBanners", "masterSettings"].forEach(k => {
        if (remote[k] !== undefined) db[k] = remote[k];
    });

    if (remote.gowesPublic && typeof remote.gowesPublic === "object") {
        if (Array.isArray(remote.gowesPublic.bikes)) db.gowesBikes = remote.gowesPublic.bikes;
        if (remote.gowesPublic.shelterLocation) db.gowesShelter = remote.gowesPublic.shelterLocation;
    }
}

function applyServerDb(remote) {
    if (!remote || typeof remote !== "object") return;
    ["users", "invitations", "portfolios", "chats", "adminLogs", "customThemes", "hiddenThemes", "themeOverrides", "cvPriceOverrides", "musicLibrary", "testimonials", "promoBanners", "masterSettings", "appStats"].forEach(k => {
        if (remote[k] !== undefined) db[k] = remote[k];
    });

    if (remote.gowesData && typeof remote.gowesData === "object") {
        if (Array.isArray(remote.gowesData.allBikes)) db.gowesBikes = remote.gowesData.allBikes;
        else if (Array.isArray(remote.gowesData.bikes)) db.gowesBikes = remote.gowesData.bikes;

        if (Array.isArray(remote.gowesData.rentals)) db.gowesRentals = remote.gowesData.rentals;
        else if (Array.isArray(remote.gowesData.myRentals)) db.gowesRentals = remote.gowesData.myRentals;

        if (remote.gowesData.shelterLocation) db.gowesShelter = remote.gowesData.shelterLocation;
        if (remote.gowesData.analytics) db.gowesAnalytics = remote.gowesData.analytics;
    }
}

async function apiAction(payload) {
    if (!payload) return { ok: false, message: "Payload kosong." };
    if (!payload.token && currentSessionToken) {
        payload.token = currentSessionToken;
    }
    try {
        const res = await fetch(CLOUD_API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json && json.data) {
            applyServerDb(json.data);
            idbSet("db_snapshot", db);
        }
        return json;
    } catch (err) {
        return { ok: false, message: err.message || "Gagal terhubung ke server." };
    }
}

async function fetchPublicCloud() {
    try {
        const res = await fetch(`${CLOUD_API_URL}?action=get_public`, { cache: "no-store" });
        const json = await res.json();
        if (json && json.ok && json.data) {
            applyPublicDb(json.data);
            idbSet("public_snapshot", json.data);
            return true;
        }
    } catch {}
    return false;
}

async function fetchFullCloud() {
    try {
        let url = `${CLOUD_API_URL}?action=get_full`;
        if (currentSessionToken) url += `&token=${encodeURIComponent(currentSessionToken)}`;
        if (guestChatId) url += `&guestId=${encodeURIComponent(guestChatId)}`;

        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (json && json.ok && json.data) {
            applyServerDb(json.data);
            idbSet("db_snapshot", db);
            return true;
        }
    } catch {}
    return false;
}

async function fetchSingleInvitationFast(id) {
    try {
        const res = await fetch(`${CLOUD_API_URL}?action=get_invitation&id=${encodeURIComponent(id)}`, { cache: "no-store" });
        const json = await res.json();
        if (json && json.ok && json.invitation) {
            return json.invitation;
        }
    } catch {}
    return null;
}

async function fetchClientPortalData(clientId, clientKey) {
    try {
        const res = await fetch(`${CLOUD_API_URL}?action=get_client_portal&client=${encodeURIComponent(clientId)}&key=${encodeURIComponent(clientKey || "")}`, { cache: "no-store" });
        return await res.json();
    } catch (e) {
        return { ok: false, message: e.message || "Gagal memuat portal tamu." };
    }
}

// ================= 4. SHARED HELPER UTILITIES =================
function getCurrentUserObj() {
    if (!currentSessionUser) return null;
    const cleanU = String(currentSessionUser).trim().toLowerCase();
    const list = Array.isArray(db.users) ? db.users : [];
    return list.find(u => String(u.username || "").trim().toLowerCase() === cleanU) || null;
}

function getUserPrivacy(userObj) {
    if (!userObj || typeof userObj !== "object") return DEFAULT_PRIVACY;
    const raw = userObj.privacy;
    if (!raw || typeof raw !== "object") return DEFAULT_PRIVACY;
    return {
        showProjects: raw.showProjects !== false,
        showFollowers: raw.showFollowers !== false,
        showFollowing: raw.showFollowing !== false,
        showContact: raw.showContact === true,
        showInChatContacts: raw.showInChatContacts !== false,
        allowDirectChat: raw.allowDirectChat !== false
    };
}

function getBlockedUsersList(userObj) {
    if (!userObj || !Array.isArray(userObj.blockedUsers)) return [];
    return Array.from(new Set(userObj.blockedUsers.map(x => String(x || "").trim().toLowerCase()).filter(Boolean)));
}

function isUserBlockedByMe(targetUname) {
    const curU = getCurrentUserObj();
    if (!curU) return false;
    const tKey = String(targetUname || "").trim().toLowerCase();
    return getBlockedUsersList(curU).includes(tKey);
}

function esc(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
}

function escHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function fmtRp(num) {
    const n = Math.max(0, parseInt(num, 10) || 0);
    return "Rp " + n.toLocaleString("id-ID");
}

function imgFbAttr(fb) {
    if (!fb) return "";
    return `data-fb="${esc(fb)}" onerror="if(this.dataset.fb && this.src!==this.dataset.fb){this.src=this.dataset.fb;this.dataset.fb='';}"`;
}

function deepCloneSafe(obj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch {
        return Object.assign({}, obj);
    }
}

function getCleanBaseUrl() {
    return window.location.origin + window.location.pathname;
}

// ================= 5. TEMA UNDANGAN & PORTOFOLIO CATALOG RESOLVERS =================
function findThemeObject(cat, themeName) {
    const catList = THEME_CATALOG[cat] || THEME_CATALOG["Pernikahan"] || [];
    let found = catList.find(t => t.name.toLowerCase() === String(themeName).toLowerCase());
    if (found) return found;

    const custom = (db.customThemes || []).find(t => t.category === cat && t.name.toLowerCase() === String(themeName).toLowerCase());
    if (custom) return custom;

    return catList[0] || { name: themeName, preset: "dark-gold", style: "kalimantan_story", price: 99000, origPrice: 175000 };
}

function getThemeCoverPair(cat, tObj) {
    const fallback = tObj.img || IMG("1519741497674-611481863552");
    const ov = (db.themeOverrides && db.themeOverrides[`${cat}::${tObj.name}`]) || {};
    const primary = ov.customCover || tObj.customCover || fallback;
    return { src: primary, fb: fallback };
}

function getThemePricing(tObj) {
    const ov = (db.themeOverrides && db.themeOverrides[`${tObj.cat || tObj.category}::${tObj.name}`]) || {};
    const price = Number(ov.price !== undefined ? ov.price : tObj.price || 99000);
    const origPrice = Number(ov.origPrice !== undefined ? ov.origPrice : tObj.origPrice || 175000);
    return {
        price,
        origPrice,
        hasDisc: origPrice > price && price > 0,
        discPct: origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0
    };
}

function getMergedThemes(cat, includeHidden = false) {
    const builtIn = (THEME_CATALOG[cat] || []).map(t => {
        const key = `${cat}::${t.name}`;
        const ov = (db.themeOverrides && db.themeOverrides[key]) || {};
        const isHidden = (db.hiddenThemes || []).includes(key);
        return Object.assign({}, t, ov, {
            cat,
            key,
            isCustom: false,
            isHidden,
            demoPhotos: Object.assign({}, t.demoPhotos || {}, ov.demoPhotos || {}),
            demoData: Object.assign({}, t.demoData || {}, ov.demoData || {})
        });
    });

    const custom = (db.customThemes || []).filter(t => t.category === cat).map(t => {
        return Object.assign({}, t, {
            cat,
            key: `custom::${t.id}`,
            isCustom: true,
            isHidden: false
        });
    });

    const combined = [...builtIn, ...custom];
    return includeHidden ? combined : combined.filter(t => !t.isHidden);
}

function getPortfolioThemeObj(docType, themeId) {
    const type = docType === "lamaran" ? "lamaran" : "cv";
    const list = PORTFOLIO_CATALOG[type] || [];
    const base = list.find(x => x.id === themeId) || list[0];
    const ov = (db.cvPriceOverrides && db.cvPriceOverrides[themeId]) || {};
    const price = Number(ov.price !== undefined ? ov.price : base.price);
    const origPrice = Number(ov.origPrice !== undefined ? ov.origPrice : base.origPrice);
    return Object.assign({}, base, {
        price,
        origPrice,
        hasDisc: origPrice > price && price > 0,
        discPct: origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0
    });
}

function buildMiniCoverCardHtml(cat, tObj, isShelf = true) {
    const cov = getThemeCoverPair(cat, tObj);
    const pr = getThemePricing(tObj);
    const u = getCurrentUserObj();
    const isFav = !!(u && Array.isArray(u.favorites) && u.favorites.some(f => f.cat === cat && f.name === tObj.name));

    return `
        <div class="mini-inv-cover-stage relative">
            <img src="${cov.src}" ${imgFbAttr(cov.fb)} loading="lazy" class="absolute inset-0 w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30"></div>
            <button type="button" onclick="event.stopPropagation();toggleFavoriteTheme('${esc(cat)}','${esc(tObj.name)}',this)" class="fav-heart-btn ${isFav ? "is-fav" : ""}" title="Simpan ke Favorit">
                <i class="fa-${isFav ? "solid" : "regular"} fa-heart"></i>
            </button>
            <div class="relative z-10 p-2.5 flex items-start justify-between">
                <span class="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full ${tObj.badge ? "bg-amber-400 text-black" : "bg-black/60 text-white"}">${escHtml(tObj.badge || cat)}</span>
            </div>
            <div class="relative z-10 p-2.5 mt-auto text-center space-y-1">
                <strong class="block text-xs font-serif-ed text-white drop-shadow truncate">${escHtml(tObj.name)}</strong>
                <span class="inline-block px-3 py-1 text-[9px] font-bold rounded-full bg-white text-black shadow-md">Buka Undangan</span>
            </div>
        </div>
    `;
}

function buildPortfolioMiniCardHtml(docType, pObj, isShelf = true) {
    const u = getCurrentUserObj();
    const isFav = !!(u && Array.isArray(u.favorites) && u.favorites.some(f => f.docType === docType && f.id === pObj.id));

    return `
        <div class="mini-inv-cover-stage relative p-3 text-white" style="background:linear-gradient(155deg, ${pObj.accent || "#1e293b"}, #09090b);">
            <button type="button" onclick="event.stopPropagation();toggleFavoritePortfolio('${docType}','${pObj.id}',this)" class="fav-heart-btn ${isFav ? "is-fav" : ""}" title="Simpan ke Favorit">
                <i class="fa-${isFav ? "solid" : "regular"} fa-heart"></i>
            </button>
            <div class="relative z-10 flex items-start justify-between">
                <span class="text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-black/60">${docType === "lamaran" ? "Lamaran" : "CV"}</span>
            </div>
            <div class="relative z-10 my-auto text-center space-y-1">
                <div class="w-10 h-10 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center mx-auto text-sm font-extrabold">
                    <i class="fa-solid ${docType === "lamaran" ? "fa-file-signature" : "fa-id-card"}"></i>
                </div>
                <strong class="block text-xs font-extrabold leading-tight truncate px-1">${escHtml(pObj.name)}</strong>
                <span class="text-[9px] opacity-80 block truncate">${escHtml(pObj.tag || "")}</span>
            </div>
            <div class="relative z-10 mt-auto text-center">
                <span class="inline-block px-3 py-1 text-[9px] font-bold rounded-full bg-white text-black shadow-md">Lihat Desain</span>
            </div>
        </div>
    `;
}

function buildPriceStripHtml(tObj, isShelf = true) {
    const pr = tObj.price !== undefined && tObj.origPrice !== undefined ? {
        price: tObj.price,
        origPrice: tObj.origPrice,
        hasDisc: tObj.origPrice > tObj.price && tObj.price > 0,
        discPct: tObj.origPrice > tObj.price ? Math.round(((tObj.origPrice - tObj.price) / tObj.origPrice) * 100) : 0
    } : getThemePricing(tObj);

    return `
        <div class="p-2.5 bg-black/90 text-white flex items-center justify-between border-t border-white/10 text-xs">
            <div class="min-w-0">
                ${pr.hasDisc ? `<span class="line-through text-[10px] text-zinc-400 block">${fmtRp(pr.origPrice)}</span>` : ""}
                <strong class="app-accent font-extrabold block truncate">${fmtRp(pr.price)}</strong>
            </div>
            ${pr.hasDisc ? `<span class="px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-extrabold shrink-0">-${pr.discPct}%</span>` : ""}
        </div>
    `;
}

// ================= 6. TEMA APLIKASI & UI CONTROLS =================
function applyAppTheme(themeKey, saveToStorage = false) {
    const allowed = ["light", "dark", "gold", "blue", "black", "orange"];
    const theme = allowed.includes(themeKey) ? themeKey : "light";
    document.documentElement.setAttribute("data-app-theme", theme);
    if (saveToStorage) localStorage.setItem(APP_THEME_KEY, theme);

    document.querySelectorAll(".theme-opt-row").forEach(btn => {
        const isMatch = btn.dataset.topt === theme;
        btn.classList.toggle("gold-border", isMatch);
        const chk = btn.querySelector(".theme-chk");
        if (chk) chk.classList.toggle("hide", !isMatch);
    });
}

function cycleAppThemeQuick() {
    const allowed = ["light", "dark", "gold", "blue", "black", "orange"];
    const cur = document.documentElement.getAttribute("data-app-theme") || "light";
    const nextIdx = (allowed.indexOf(cur) + 1) % allowed.length;
    applyAppTheme(allowed[nextIdx], true);
    if (typeof showToast === "function") showToast(`Tema: ${allowed[nextIdx].toUpperCase()}`, "info");
}

function showToast(msg, type = "success") {
    const toast = document.getElementById("app-toast");
    const txt = document.getElementById("app-toast-msg");
    const ic = document.getElementById("app-toast-icon");
    if (!toast || !txt) return;

    txt.innerText = msg;
    if (ic) {
        ic.className = type === "error" ? "fa-solid fa-circle-exclamation text-red-500 text-base"
            : type === "info" ? "fa-solid fa-circle-info text-blue-500 text-base"
            : "fa-solid fa-circle-check text-emerald-500 text-base";
    }

    toast.classList.remove("hide");
    clearTimeout(window.__mrToastTimer);
    window.__mrToastTimer = setTimeout(() => {
        toast.classList.add("hide");
    }, 3200);
}

function showLoading(text = "Memproses...") {
    const bar = document.getElementById("global-loading-bar");
    const lbl = document.getElementById("global-loading-text");
    if (lbl) lbl.innerText = text;
    if (bar) bar.classList.remove("hide");
}

function hideLoading() {
    document.getElementById("global-loading-bar")?.classList.add("hide");
}

function showConfirm(title, msg, iconClass = "fa-solid fa-circle-question", okText = "Ya, Lanjutkan") {
    return new Promise((resolve) => {
        const modal = document.getElementById("app-confirm-modal");
        const tEl = document.getElementById("app-confirm-title");
        const mEl = document.getElementById("app-confirm-msg");
        const iEl = document.getElementById("app-confirm-icon");
        const btnOk = document.getElementById("app-confirm-ok");
        const btnCancel = document.getElementById("app-confirm-cancel");
        if (!modal) return resolve(false);

        if (tEl) tEl.innerText = title;
        if (mEl) mEl.innerText = msg;
        if (iEl) iEl.className = iconClass;
        if (btnOk) btnOk.innerText = okText;

        modal.classList.remove("hide");

        const cleanup = () => {
            modal.classList.add("hide");
            btnOk.onclick = null;
            btnCancel.onclick = null;
        };

        btnOk.onclick = () => { cleanup(); resolve(true); };
        btnCancel.onclick = () => { cleanup(); resolve(false); };
    });
}

function setBtnLoading(btnOrId, isLoading, loadingText = "...") {
    const btn = typeof btnOrId === "string" ? document.getElementById(btnOrId) : btnOrId;
    if (!btn) return;
    if (isLoading) {
        btn.dataset.origHtml = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin mr-1"></i>${loadingText}`;
    } else {
        btn.disabled = false;
        if (btn.dataset.origHtml) btn.innerHTML = btn.dataset.origHtml;
    }
}

function togglePassVis(inpId, btn) {
    const inp = document.getElementById(inpId);
    if (!inp) return;
    const isPass = inp.type === "password";
    inp.type = isPass ? "text" : "password";
    const ic = btn.querySelector("i");
    if (ic) {
        ic.className = isPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    }
}

// ================= 7. IMAGE & AUDIO CROPPING ENGINE =================
let activeCropperInstance = null;
let cropperCallback = null;

function openImageCropper(fileOrBlob, aspectRatio, titleText, outW = 800, outH = 600, callback = null) {
    const modal = document.getElementById("modal-image-cropper");
    const imgEl = document.getElementById("crop-source-img");
    const titleEl = document.getElementById("crop-modal-title");
    if (!modal || !imgEl) return;

    if (titleEl && titleText) titleEl.innerText = titleText;
    cropperCallback = callback;

    const reader = new FileReader();
    reader.onload = (e) => {
        imgEl.src = e.target.result;
        modal.classList.remove("hide");
        if (activeCropperInstance) activeCropperInstance.destroy();

        activeCropperInstance = new Cropper(imgEl, {
            aspectRatio: aspectRatio || NaN,
            viewMode: 1,
            autoCropArea: 0.95,
            responsive: true,
            restore: false
        });
        window.__cropOutDimensions = { w: outW, h: outH };
        if (typeof mrNavPush === "function") mrNavPush({ type: "modal", id: "modal-image-cropper" });
    };
    reader.readAsDataURL(fileOrBlob);
}

function closeImageCropper() {
    if (activeCropperInstance) {
        activeCropperInstance.destroy();
        activeCropperInstance = null;
    }
    document.getElementById("modal-image-cropper")?.classList.add("hide");
    if (typeof _mrDropTopModalById === "function") _mrDropTopModalById("modal-image-cropper");
}

function cropperZoom(ratio) {
    if (activeCropperInstance) activeCropperInstance.zoom(ratio);
}

function applyImageCrop() {
    if (!activeCropperInstance || !cropperCallback) return closeImageCropper();
    const dims = window.__cropOutDimensions || { w: 800, h: 600 };
    const cvs = activeCropperInstance.getCroppedCanvas({
        maxWidth: dims.w,
        maxHeight: dims.h,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high"
    });
    const dataUrl = cvs.toDataURL("image/jpeg", 0.82);
    const cb = cropperCallback;
    closeImageCropper();
    cb(dataUrl);
}

async function quickResizeImage(fileOrBlob, maxDim = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width, h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                    else { w = Math.round((w * maxDim) / h); h = maxDim; }
                }
                const canvas = document.createElement("canvas");
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(fileOrBlob);
    });
}
