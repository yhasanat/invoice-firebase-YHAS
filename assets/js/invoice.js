/* ===============================
   invoice.js – Firebase FINAL
================================ */
console.log("INVOICE.JS LOADED");

const AppState = { currentInvoice: null };

function findProduct(barcode) {
  return DataStore.products.find(p => p.barcode === barcode);
}

function createNewInvoice(type) {
  AppState.currentInvoice = {
    id: generateInvoiceNumber(),
    type,
    name: "",
    customerType: "cash",
    dateISO: todayISO(),
    items: [],
    discount: 0,
    paid: 0,
    total: 0
  };
}

function addItemToCurrentInvoice(barcode, qty, type) {
  const p = findProduct(barcode);
  if (!p) return alert("الصنف غير موجود");

  if (!AppState.currentInvoice || AppState.currentInvoice.type !== type) {
    createNewInvoice(type);
  }

  const price = type === "retail" ? p.priceRetail : p.priceWholesale;
  let line = AppState.currentInvoice.items.find(i => i.barcode === barcode);

  if (line) line.qty += qty;
  else AppState.currentInvoice.items.push({
    barcode, name: p.name, qty, price
  });
}

async function saveCurrentInvoice(type) {
  const inv = AppState.currentInvoice;
  inv.name = $("#retail-customer").value || "زبون نقدي";
  inv.items.forEach(i => inv.total += i.qty * i.price);

  await saveInvoiceToDB(inv);
  alert("تم حفظ الفاتورة على Firebase");
  createNewInvoice(type);
}
window.__INVOICE_READY__ = true;
