/* assets/js/sync.js */

const SYNC_KEYS = {
  invoices: "pending-invoices",
  stock: "pending-stock-updates"
};

function getPendingInvoices() {
  return loadJSON(SYNC_KEYS.invoices, []);
}
function setPendingInvoices(list) {
  saveJSON(SYNC_KEYS.invoices, list);
}

function getPendingStockUpdates() {
  return loadJSON(SYNC_KEYS.stock, []);
}
function setPendingStockUpdates(list) {
  saveJSON(SYNC_KEYS.stock, list);
}

function queueInvoiceForSync(invoice) {
  const list = getPendingInvoices();
  if (!list.some(inv => String(inv.id) === String(invoice.id))) {
    list.push(invoice);
    setPendingInvoices(list);
  }
}

function queueStockUpdateForSync(update) {
  const list = getPendingStockUpdates();
  list.push(update);
  setPendingStockUpdates(list);
}

async function syncPendingInvoices() {
  let list = getPendingInvoices();
  if (!list.length || !isOnline()) {
    return { sent: 0, remaining: list.length };
  }

  let sent = 0;
  const remaining = [];

  for (const inv of list) {
    try {
      const res = await saveInvoiceToDB(inv);
      if (res.status === "success") {
        sent++;
        if (!DataStore.invoices.some(i => String(i.id) === String(inv.id))) {
          DataStore.invoices.push(inv);
        }
      } else {
        remaining.push(inv);
      }
    } catch (e) {
      console.error("sync invoice error", e);
      remaining.push(inv);
    }
  }

  setPendingInvoices(remaining);
  return { sent, remaining: remaining.length };
}

async function syncPendingStockUpdates() {
  let list = getPendingStockUpdates();
  if (!list.length || !isOnline()) {
    return { sent: 0, remaining: list.length };
  }

  let sent = 0;
  const remaining = [];

  for (const upd of list) {
    try {
      const res = await saveProductToDB(upd);
      if (res.status === "success") sent++;
      else remaining.push(upd);
    } catch (e) {
      console.error("sync stock error", e);
      remaining.push(upd);
    }
  }

  setPendingStockUpdates(remaining);
  return { sent, remaining: remaining.length };
}

async function syncAllPendingData() {
  const invRes = await syncPendingInvoices();
  const stRes  = await syncPendingStockUpdates();
  return {
    invoicesSent: invRes.sent,
    invoicesRemaining: invRes.remaining,
    stockSent: stRes.sent,
    stockRemaining: stRes.remaining
  };
}

function initSync() {
  if (isOnline()) syncAllPendingData();
  window.addEventListener("online", () => syncAllPendingData());
}
