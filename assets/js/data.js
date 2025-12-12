/* assets/js/data.js */

const DataStore = {
  products: [],
  customers: [],
  invoices: []
};

const FALLBACK_PRODUCTS = [
  { barcode:"11001000111", name:"جاكيت", priceRetail:0, priceWholesale:0 },
  { barcode:"20001000111", name:"بنطلون", priceRetail:0, priceWholesale:0 }
];

async function fbReady(){
  if(window.FB_READY) await window.FB_READY;
  if(!window.FB || !window.FB.db) throw new Error("Firebase not initialized");
}

/* تحميل الأصناف */
async function loadProducts() {
  try {
    await fbReady();
    const rows = await window.FB.getAll(DB.products);
    if (Array.isArray(rows) && rows.length) {
      DataStore.products = rows.map(p => ({
        barcode: String(p.barcode || ""),
        name: p.name || "",
        priceRetail: Number(p.priceRetail || 0),
        priceWholesale: Number(p.priceWholesale || 0)
      })).filter(p => p.barcode);
    } else {
      DataStore.products = FALLBACK_PRODUCTS.slice();
    }
  } catch (err) {
    console.error("Error loading products:", err);
    DataStore.products = FALLBACK_PRODUCTS.slice();
  }
}

/* تحميل العملاء */
async function loadCustomers() {
  try {
    await fbReady();
    const rows = await window.FB.getAll(DB.customers);
    if (Array.isArray(rows) && rows.length) {
      DataStore.customers = rows.map(c => ({ name: c.name || "" })).filter(c => c.name);
    } else {
      DataStore.customers = [{ name:"زبون نقدي" }, { name:"تاجر" }];
    }
  } catch (err) {
    console.error("Error loading customers:", err);
    DataStore.customers = [{ name:"زبون نقدي" }, { name:"تاجر" }];
  }
  updateCustomersDatalist();
}

/* تحميل الفواتير + الأصناف */
async function loadInvoices() {
  try {
    await fbReady();
    const inv = await window.FB.getAll(DB.invoices);
    const items = await window.FB.getAll(DB.invoiceItems);

    const map = {};
    (inv || []).forEach(r => {
      map[String(r.id)] = {
        id: String(r.id),
        type: r.type,
        name: r.name,
        customerType: r.customerType,
        dateISO: r.dateISO,
        discount: Number(r.discount || 0),
        paid: Number(r.paid || 0),
        total: Number(r.total || 0),
        items: []
      };
    });

    (items || []).forEach(line => {
      const invId = String(line.invoiceId || "");
      if (!map[invId]) return;
      map[invId].items.push({
        barcode: String(line.barcode || ""),
        name: line.name || "",
        qty: Number(line.qty || 0),
        price: Number(line.priceRetail || line.priceWholesale || 0)
      });
    });

    DataStore.invoices = Object.values(map);
  } catch (err) {
    console.error("Error loading invoices:", err);
    DataStore.invoices = [];
  }
}

/* حساب مخزون جميع الأصناف: StockUpdates + InvoiceItems */
async function calculateAllStocks(){
  await fbReady();
  const adds = await window.FB.getAll(DB.stockUpdates);
  const sales = await window.FB.getAll(DB.invoiceItems);
  const stockMap = {};

  (adds || []).forEach(r => {
    const bc = String(r.barcode || "");
    const qty = Number(r.changeQty || 0);
    if(!bc) return;
    stockMap[bc] = (stockMap[bc] || 0) + qty;
  });

  (sales || []).forEach(r => {
    const bc = String(r.barcode || "");
    const qty = Number(r.qty || 0);
    if(!bc) return;
    stockMap[bc] = (stockMap[bc] || 0) - qty;
  });

  return stockMap;
}

/* حفظ فاتورة: Batch (Invoices + InvoiceItems + StockUpdates sale) */
async function saveInvoiceToDB(invoice) {
  try {
    await fbReady();
    const batch = window.FB.writeBatch();

    // Invoices: docId = invoice.id
    batch.set(
      window.FB.doc(window.FB.db, DB.invoices, String(invoice.id)),
      {
        id: String(invoice.id),
        type: invoice.type,
        name: invoice.name,
        customerType: invoice.customerType,
        dateISO: invoice.dateISO,
        discount: Number(invoice.discount || 0),
        paid: Number(invoice.paid || 0),
        total: Number(invoice.total || 0)
      },
      { merge: true }
    );

    // Items: docId = `${invoiceId}_${barcode}`
    for (const line of (invoice.items || [])) {
      const itemId = `${String(invoice.id)}_${String(line.barcode)}`;
      batch.set(
        window.FB.doc(window.FB.db, DB.invoiceItems, itemId),
        {
          invoiceId: String(invoice.id),
          barcode: String(line.barcode),
          name: line.name,
          qty: Number(line.qty || 0),
          priceRetail: Number(line.price || 0),
          priceWholesale: Number(line.price || 0)
        },
        { merge: true }
      );

      // StockUpdates sale: docId = `${invoiceId}_${barcode}_sale`
      const stId = `${String(invoice.id)}_${String(line.barcode)}_sale`;
      batch.set(
        window.FB.doc(window.FB.db, DB.stockUpdates, stId),
        {
          barcode: String(line.barcode),
          changeQty: -Number(line.qty || 0),
          source: "sale",
          notes: "Invoice " + String(invoice.id),
          dateISO: invoice.dateISO
        },
        { merge: true }
      );
    }

    await batch.commit();
    return { status: "success" };
  } catch (err) {
    console.error("Error saving invoice:", err);
    return { status: "error", message: err.message };
  }
}

/* تسجيل حركة مخزون */
async function saveProductToDB(data) {
  try {
    await fbReady();
    // stock update unique id to avoid duplicates: `${dateISO}_${barcode}_${source}_${ts}`
    const docId = `${data.dateISO}_${data.barcode}_${data.source}_${Date.now()}`;
    await window.FB.set(DB.stockUpdates, docId, {
      barcode: String(data.barcode),
      changeQty: Number(data.qty || 0),
      source: data.source,
      notes: data.notes || "",
      dateISO: data.dateISO
    }, true);

    // تحديث/إنشاء المنتج كـ docId = barcode
    await window.FB.set(DB.products, String(data.barcode), {
      barcode: String(data.barcode),
      name: data.name,
      priceRetail: Number(data.priceRetail || 0),
      priceWholesale: Number(data.priceWholesale || 0)
    }, true);

    return { status: "success" };
  } catch (err) {
    console.error("Error saving stock update:", err);
    return { status: "error", message: err.message };
  }
}

/* Datalist */
function updateCustomersDatalist() {
  const dl = $("#customers-list");
  if (!dl) return;
  dl.innerHTML = "";
  const names = [...new Set(DataStore.customers.map(c => c.name))].filter(Boolean);
  names.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n;
    dl.appendChild(opt);
  });
}

/* تحميل أولي */
async function loadAllData() {
  await loadProducts();
  await loadCustomers();
  await loadInvoices();
}

