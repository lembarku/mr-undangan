// =========================================================================
// TITIK GOWES — MODULAR BACKEND ENGINE (gowes.gs)
// Sinkron penuh dengan Code.gs V14.3 (Folder Drive: Titik_Gowes_Data)
// Mendukung Multi-Sepeda (selectedBikes), Toko Tutup, Banner 16:5 & Kategori
// =========================================================================

const GOWES_FOLDER_NAME = "Titik_Gowes_Data";
const GOWES_DB_FILENAME = "titik_gowes_db.json";

function _gowesGetOrCreateFolder() {
  const it = DriveApp.getFoldersByName(GOWES_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  const folder = DriveApp.createFolder(GOWES_FOLDER_NAME);
  try {
    folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {}
  return folder;
}

function _gowesDefaultDb() {
  return {
    bikes: [
      {
        id: "bike_1",
        name: "Polygon Xtrada 6",
        type: "MTB (Gunung)",
        frameSize: "M (165-175 cm)",
        gears: "1x11 Speed Shimano Deore",
        brakes: "Hydraulic Disc Brake Shimano",
        price2Hours: 40000,
        price6Hours: 75000,
        priceFullDay: 120000,
        status: "Tersedia",
        description: "Suspensi empuk air fork, rem hidrolik pakem, sangat tangguh untuk rute aspal maupun tanah berkerikil.",
        freeAccessories: ["Helm Sepeda", "Kunci Gembok Spiral", "Lampu Malam Depan/Belakang"],
        image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 28,
        createdAt: 1700000000000
      },
      {
        id: "bike_2",
        name: "United Milano Roadbike",
        type: "Roadbike (Balap)",
        frameSize: "S/M (160-172 cm)",
        gears: "2x9 Speed Shimano Sora",
        brakes: "Caliper Dual-Pivot Rim Brake",
        price2Hours: 50000,
        price6Hours: 95000,
        priceFullDay: 150000,
        status: "Tersedia",
        description: "Bobot alloy super ringan, posisi aerodinamis mantap untuk latihan kecepatan dan endurance keliling kota.",
        freeAccessories: ["Helm Aero", "Pompa Mini Portabel", "Bottle Cage"],
        image: "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 42,
        createdAt: 1700000000001
      },
      {
        id: "bike_3",
        name: "Pacific Noris Pro Lipat",
        type: "Sepeda Lipat (Folding)",
        frameSize: "All Size (Adjustable)",
        gears: "8 Speed Shimano Tourney",
        brakes: "Mechanical Disc Brake",
        price2Hours: 35000,
        price6Hours: 60000,
        priceFullDay: 90000,
        status: "Tersedia",
        description: "Sangat ringkas dan elegan, mudah dilipat ke bagasi mobil, cocok untuk Car Free Day santai keluarga.",
        freeAccessories: ["Helm Casual", "Tas Stang Depan", "Kunci Gembok"],
        image: "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 56,
        createdAt: 1700000000002
      },
      {
        id: "bike_4",
        name: "Thrill Fervent T120",
        type: "MTB (Gunung)",
        frameSize: "L (175-185 cm)",
        gears: "1x12 Speed SRAM SX Eagle",
        brakes: "Hydraulic Disc Brake",
        price2Hours: 45000,
        price6Hours: 85000,
        priceFullDay: 135000,
        status: "Tersedia",
        description: "Full suspension (dual suspension) empuk, sangat stabil meredam getaran jalan berlubang atau tanjakan curam.",
        freeAccessories: ["Helm Trail", "Kunci Spiral", "Lampu Malam"],
        image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=800&q=75",
        totalRentedCount: 19,
        createdAt: 1700000000003
      }
    ],
    rentals: [],
    shelterLocation: {
      name: "Titik Gowes Shelter Utama",
      address: "Jl. Mulawarman No. 88, Samarinda (Dekat Taman Kota)",
      mapsUrl: "https://maps.google.com/?q=-0.502,117.153",
      operationalHours: "Setiap Hari: 05.30 - 20.00 WITA",
      csPhone: "085117488828",
      isClosed: false,
      closedReason: "Garasi Titik Gowes sedang istirahat / tutup sementara. Kami siap melayani kembali besok pukul 05.30 WITA."
    },
    banners: null,
    categories: null
  };
}

function _gowesReadDb() {
  const folder = _gowesGetOrCreateFolder();
  const files = folder.getFilesByName(GOWES_DB_FILENAME);
  if (!files.hasNext()) {
    const def = _gowesDefaultDb();
    folder.createFile(GOWES_DB_FILENAME, JSON.stringify(def), MimeType.PLAIN_TEXT);
    return def;
  }
  try {
    const txt = files.next().getBlob().getDataAsString();
    const parsed = JSON.parse(txt);
    const def = _gowesDefaultDb();
    return {
      bikes: Array.isArray(parsed.bikes) ? parsed.bikes : def.bikes,
      rentals: Array.isArray(parsed.rentals) ? parsed.rentals : [],
      shelterLocation: Object.assign({}, def.shelterLocation, parsed.shelterLocation || {}),
      banners: Array.isArray(parsed.banners) ? parsed.banners : null,
      categories: Array.isArray(parsed.categories) ? parsed.categories : null
    };
  } catch (e) {
    return _gowesDefaultDb();
  }
}

function _gowesSaveDb(data) {
  const folder = _gowesGetOrCreateFolder();
  const files = folder.getFilesByName(GOWES_DB_FILENAME);
  const content = JSON.stringify(data);
  if (files.hasNext()) {
    files.next().setContent(content);
  } else {
    folder.createFile(GOWES_DB_FILENAME, content, MimeType.PLAIN_TEXT);
  }
}

function _gowesUploadDataUrlIfNeeded(val, prefix) {
  if (!val || typeof val !== "string") return "";
  if (!val.startsWith("data:image/")) return val;
  try {
    const match = val.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return val;
    const mime = match[1];
    const ext = mime.includes("png") ? "png" : "jpg";
    const bytes = Utilities.base64Decode(match[2]);
    const blob = Utilities.newBlob(bytes, mime, (prefix || "gw") + "_" + Date.now() + "." + ext);
    const folder = _gowesGetOrCreateFolder();
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://lh3.googleusercontent.com/d/" + file.getId() + "=s1600";
  } catch (e) {
    return val;
  }
}

function _gowesBikeRateByKey(bike, durationKey) {
  if (durationKey === "6_hours") return Number(bike.price6Hours || 75000);
  if (durationKey === "full_day") return Number(bike.priceFullDay || 120000);
  return Number(bike.price2Hours || 40000);
}

// Dipanggil oleh Code.gs -> doGet (get_public & get_gowes_public)
function buildGowesPublicPayload() {
  const gdb = _gowesReadDb();
  const out = {
    bikes: (gdb.bikes || []).filter(function(b) { return b && b.status !== "Dihapus"; }),
    shelterLocation: gdb.shelterLocation
  };
  if (Array.isArray(gdb.banners) && gdb.banners.length) out.banners = gdb.banners;
  if (Array.isArray(gdb.categories) && gdb.categories.length) out.categories = gdb.categories;
  return out;
}

// Dipanggil oleh Code.gs -> doGet & doPost (get_full, login, dll.)
function buildGowesScopedPayload(sessionUser) {
  const gdb = _gowesReadDb();
  const uname = sessionUser ? String(sessionUser.username || "").trim().toLowerCase() : "";
  const role = sessionUser ? String(sessionUser.role || "user").trim().toLowerCase() : "guest";
  const isStaff = (role === "master" || role === "administrasi");

  const rentals = Array.isArray(gdb.rentals) ? gdb.rentals : [];
  const scopedRentals = !sessionUser
    ? []
    : isStaff
      ? rentals
      : rentals.filter(function(r) { return String(r.customerUsername || "").trim().toLowerCase() === uname; });

  const out = {
    allBikes: gdb.bikes || [],
    bikes: (gdb.bikes || []).filter(function(b) { return b && b.status !== "Dihapus"; }),
    rentals: scopedRentals,
    shelterLocation: gdb.shelterLocation
  };
  if (Array.isArray(gdb.banners) && gdb.banners.length) out.banners = gdb.banners;
  if (Array.isArray(gdb.categories) && gdb.categories.length) out.categories = gdb.categories;
  return out;
}

// Dipanggil oleh Code.gs -> doPost untuk semua action berawalan "gowes_"
function handleGowesPostAction(action, body, authUser, authRole, authUname) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const gdb = _gowesReadDb();
    const isStaff = (authRole === "master" || authRole === "administrasi");

    // 1. BUAT BOOKING SEWA SEPEDA (MENDUKUNG MULTI-UNIT BERBEDA)
    if (action === "gowes_create_booking") {
      if (!authUser) return jsonOut({ ok: false, message: "Silakan masuk akun terlebih dahulu untuk booking." });
      const bk = body.booking || {};
      const durationKey = bk.durationKey || "2_hours";

      const rawSelected = Array.isArray(bk.selectedBikes) && bk.selectedBikes.length
        ? bk.selectedBikes
        : [{ bikeId: bk.bikeId }];

      const resolvedBikes = [];
      let basePriceTotal = 0;

      for (let i = 0; i < rawSelected.length; i++) {
        const sb = rawSelected[i] || {};
        const found = (gdb.bikes || []).find(function(x) { return String(x.id) === String(sb.bikeId); });
        if (!found) continue;
        basePriceTotal += _gowesBikeRateByKey(found, durationKey);
        resolvedBikes.push({
          bikeId: found.id,
          bikeName: found.name,
          bikeType: found.type || "",
          bikeImage: found.image || ""
        });
      }

      if (!resolvedBikes.length) {
        return jsonOut({ ok: false, message: "Unit sepeda yang dipilih tidak ditemukan." });
      }

      const qty = resolvedBikes.length;
      const firstBike = resolvedBikes[0];
      const uniqueNames = [];
      resolvedBikes.forEach(function(item) {
        if (uniqueNames.indexOf(item.bikeName) === -1) uniqueNames.push(item.bikeName);
      });
      const combinedName = uniqueNames.length === 1 ? uniqueNames[0] : uniqueNames.join(" + ");

      const nowTs = Date.now();
      const uniqueCode = (nowTs % 899) + 101;
      const totalPrice = basePriceTotal + uniqueCode;
      const ktpUrl = _gowesUploadDataUrlIfNeeded(bk.ktpImage || "", "gw_ktp");

      const newRental = {
        id: "gw_" + nowTs,
        bikeId: firstBike.bikeId,
        bikeName: combinedName,
        bikeImage: firstBike.bikeImage || "",
        selectedBikes: resolvedBikes,
        durationKey: durationKey,
        durationLabel: bk.durationLabel || "Paket 2 Jam",
        quantity: qty,
        basePrice: basePriceTotal,
        uniqueCode: uniqueCode,
        totalPrice: totalPrice,
        customerUsername: authUname,
        customerName: bk.customerName || authUser.name || authUname,
        customerPhone: bk.customerPhone || "",
        customerAddress: bk.customerAddress || "",
        startDate: bk.startDate || "",
        startTime: bk.startTime || "",
        pickupLocation: (gdb.shelterLocation && gdb.shelterLocation.name) || "Titik Gowes Shelter Utama",
        ktpImage: ktpUrl,
        note: bk.note || "",
        paymentProof: "",
        handoverOutPhoto: "",
        handoverInPhoto: "",
        status: "Menunggu Pembayaran",
        createdAt: nowTs
      };

      gdb.rentals.unshift(newRental);
      _gowesSaveDb(gdb);
      return jsonOut({ ok: true, rental: newRental });
    }

    // 2. KIRIM BUKTI PEMBAYARAN QRIS
    if (action === "gowes_submit_payment") {
      if (!authUser) return jsonOut({ ok: false, message: "Sesi login tidak valid." });
      const rIdx = gdb.rentals.findIndex(function(r) { return String(r.id) === String(body.rentalId); });
      if (rIdx < 0) return jsonOut({ ok: false, message: "Pesanan sewa tidak ditemukan." });
      const target = gdb.rentals[rIdx];
      if (!isStaff && String(target.customerUsername || "").toLowerCase() !== authUname) {
        return jsonOut({ ok: false, message: "Akses ditolak." });
      }
      target.paymentProof = _gowesUploadDataUrlIfNeeded(body.paymentProof || "", "gw_proof");
      target.status = "Menunggu Verifikasi";
      target.paidAt = Date.now();
      _gowesSaveDb(gdb);
      return jsonOut({ ok: true, rental: target });
    }

    // 3. UPDATE STATUS OPERASIONAL GARASI (SAKELAR TOKO TUTUP)
    if (action === "gowes_update_shelter_ops") {
      if (!isStaff) return jsonOut({ ok: false, message: "Hanya Founder & Tim Administrasi yang berhak." });
      gdb.shelterLocation = Object.assign({}, gdb.shelterLocation || {}, body.shelter || {});
      _gowesSaveDb(gdb);
      return jsonOut({ ok: true, shelter: gdb.shelterLocation });
    }

    // 4. TAMBAH / EDIT UNIT SEPEDA
    if (action === "gowes_upsert_bike") {
      if (!isStaff) return jsonOut({ ok: false, message: "Hanya Founder & Tim Administrasi yang berhak." });
      const b = Object.assign({}, body.bike || {});
      if (!b.name) return jsonOut({ ok: false, message: "Nama unit sepeda wajib diisi." });
      b.image = _gowesUploadDataUrlIfNeeded(b.image || "", "gw_bike");
      const bIdx = gdb.bikes.findIndex(function(x) { return String(x.id) === String(b.id); });
      if (bIdx >= 0) {
        gdb.bikes[bIdx] = Object.assign({}, gdb.bikes[bIdx], b);
      } else {
        b.id = b.id || ("bike_" + Date.now());
        b.totalRentedCount = b.totalRentedCount || 0;
        b.createdAt = Date.now();
        gdb.bikes.unshift(b);
      }
      _gowesSaveDb(gdb);
      return jsonOut({ ok: true, bike: b });
    }

    // 5. HAPUS UNIT SEPEDA (KHUSUS FOUNDER)
    if (action === "gowes_delete_bike") {
      if (authRole !== "master") return jsonOut({ ok: false, message: "Hanya Founder yang berhak menghapus unit." });
      gdb.bikes = gdb.bikes.filter(function(x) { return String(x.id) !== String(body.bikeId); });
      _gowesSaveDb(gdb);
      return jsonOut({ ok: true });
    }

    // 6. UPDATE BANNER 16:5 TITIK GOWES (FOUNDER)
    if (action === "gowes_update_banners") {
      if (authRole !== "master") return jsonOut({ ok: false, message: "Hanya Founder yang dapat mengubah banner." });
      const list = Array.isArray(body.banners) ? body.banners : [];
      gdb.banners = list.map(function(item) {
        const copy = Object.assign({}, item);
        copy.img = _gowesUploadDataUrlIfNeeded(copy.img || "", "gw_banner");
        return copy;
      });
      _gowesSaveDb(gdb);
      return jsonOut({ ok: true, banners: gdb.banners });
    }

    // 7. UPDATE KATEGORI FILTER SEPEDA (FOUNDER)
    if (action === "gowes_update_categories") {
      if (authRole !== "master") return jsonOut({ ok: false, message: "Hanya Founder yang dapat mengubah kategori." });
      gdb.categories = Array.isArray(body.categories) ? body.categories : [];
      _gowesSaveDb(gdb);
      return jsonOut({ ok: true, categories: gdb.categories });
    }

    // 8. REKAM FOTO SERAH TERIMA FISIK SEPEDA
    if (action === "gowes_record_handover") {
      if (!isStaff) return jsonOut({ ok: false, message: "Hanya Founder & Tim Administrasi yang berhak." });
      const rIdx = gdb.rentals.findIndex(function(r) { return String(r.id) === String(body.rentalId); });
      if (rIdx < 0) return jsonOut({ ok: false, message: "Data sewa tidak ditemukan." });
      const photoUrl = _gowesUploadDataUrlIfNeeded(body.photo || "", "gw_ho_" + (body.stage || "out"));
      if (body.stage === "in") gdb.rentals[rIdx].handoverInPhoto = photoUrl;
      else gdb.rentals[rIdx].handoverOutPhoto = photoUrl;
      _gowesSaveDb(gdb);
      return jsonOut({ ok: true, rental: gdb.rentals[rIdx] });
    }

    // 9. UPDATE STATUS TRANSAKSI RENTAL (MENDUKUNG MULTI-UNIT)
    if (action === "gowes_update_rental_status") {
      if (!isStaff) return jsonOut({ ok: false, message: "Hanya Founder & Tim Administrasi yang berhak." });
      const rIdx = gdb.rentals.findIndex(function(r) { return String(r.id) === String(body.rentalId); });
      if (rIdx < 0) return jsonOut({ ok: false, message: "Data sewa tidak ditemukan." });

      const rental = gdb.rentals[rIdx];
      const nextStatus = String(body.status || "");
      rental.status = nextStatus;
      if (nextStatus === "Terkonfirmasi") rental.confirmedAt = Date.now();
      if (nextStatus === "Sedang Digunakan") rental.startedAt = Date.now();
      if (nextStatus === "Selesai") rental.completedAt = Date.now();

      const affectedIds = (Array.isArray(rental.selectedBikes) && rental.selectedBikes.length)
        ? rental.selectedBikes.map(function(sb) { return String(sb.bikeId); })
        : [String(rental.bikeId)];

      gdb.bikes.forEach(function(b) {
        if (affectedIds.indexOf(String(b.id)) !== -1) {
          if (nextStatus === "Sedang Digunakan") {
            b.status = "Sedang Disewa";
          } else if (nextStatus === "Selesai") {
            b.status = "Tersedia";
            b.totalRentedCount = Number(b.totalRentedCount || 0) + 1;
          } else if (nextStatus === "Dibatalkan") {
            b.status = "Tersedia";
          }
        }
      });

      _gowesSaveDb(gdb);
      return jsonOut({ ok: true, rental: rental });
    }

    return null;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}
