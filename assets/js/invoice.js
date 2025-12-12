/* =====================================================
   invoice.js – منطق الفواتير (نسخة مصححة نهائياً)
===================================================== */

console.log("INVOICE.JS LOADED");

const AppState = {
  currentInvoice: null
};

/* -----------------------------------------
   البحث عن صنف
------------------------------------------ */
function findProductByBarcode(barcode){
  return DataStore.products.find(p => String(p.barcode) === String(barcode));
}

/* -----------------------------------------
   رصيد العميل
------------------------------------------ */
function getCustomerBalance(name){
  if(!name) return 0;
  let balance = 0;
  DataStore.invoices.forEach(inv => {
    if(inv.name === name){
      balance += (Number(inv.total || 0) - Number(inv.paid || 0));
    }
  });
  return balance;
}

/* -----------------------------------------
   إنشاء فاتورة جديدة (الأهم)
------------------------------------------ */
async function createNewInvoice(type){
  const id = generateInvoiceNumber();
  const dateISO = todayISO();

  AppState.currentInvoice = {
    id,
    type,
    name: "",
    dateISO,
    items: [],
    discount: 0,
    paid: 0,
    total: 0
  };

  if(type === "retail"){
    /* تحديث الواجهة – مفرق */
    const n = $("#retail-invoice-number");
    const d = $("#retail-invoice-date");
    if(n) n.textContent = id;
    if(d) d.textContent = dateISO;

    const disc = $("#retail-discount");
    const paid = $("#retail-paid");
    if(disc) disc.value = 0;
    if(paid) paid.value = 0;

    const tb = $("#retail-items-table tbody");
    if(tb) tb.innerHTML = "";

    updateInvoiceTotals("retail");
    if(typeof renderQuickButtons === "function") renderQuickButtons();
  }
  else {
    /* تحديث الواجهة – جملة */
    const n = $("#wh-invoice-number");
    const d = $("#wh-invoice-date");
    if(n) n.textContent = id;
    if(d) d.textContent = dateISO;

    const disc = $("#wh-discount");
    const paid = $("#wh-paid");
    if(disc) disc.value = 0;
    if(paid) paid.value = 0;

    const tb = $("#wh-items-table tbody");
    if(tb) tb.innerHTML = "";

    updateInvoiceTotals("wholesale");
  }
}

/* -----------------------------------------
   إضافة صنف للفاتورة
------------------------------------------ */
function addItemToCurrentInvoice(barcode, qty, type){
  if(!AppState.currentInvoice || AppState.currentInvoice.type !== type){
    createNewInvoice(type);
  }

  const product = findProductByBarcode(barcode);
  if(!product){
    alert("الصنف غير موجود");
    return;
  }

  qty = Number(qty || 1);
  if(qty <= 0) qty = 1;

  const price =
    type === "retail"
      ? Number(product.priceRetail || 0)
      : Number(product.priceWholesale || 0);

  let line = AppState.currentInvoice.items.find(i => i.barcode === barcode);
  if(line){
    line.qty += qty;
  } else {
    AppState.currentInvoice.items.push({
      barcode: product.barcode,
      name: product.name,
      qty,
      price
    });
  }

  renderInvoiceItemsTable(type);
  updateInvoiceTotals(type);
}

/* -----------------------------------------
   رسم جدول الأصناف
------------------------------------------ */
function renderInvoiceItemsTable(type){
  const tbody =
    type === "retail"
      ? $("#retail-items-table tbody")
      : $("#wh-items-table tbody");

  if(!tbody) return;
  tbody.innerHTML = "";

  AppState.currentInvoice.items.forEach((line, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${line.barcode}</td>
      <td class="text-right">${line.name}</td>
      <td>
        <input type="number" min="1" value="${line.qty}"
          data-barcode="${line.barcode}"
          class="input"
          style="max-width:70px;font-size:11px;padding:3px;">
      </td>
      <td>${fnum(line.price)}</td>
      <td>${fnum(line.qty * line.price)}</td>
      <td>
        <button class="btn secondary"
          data-remove="${line.barcode}"
          style="padding:2px 8px;font-size:10px;">
          حذف
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll("input[type='number']").forEach(inp => {
    inp.addEventListener("change", e => {
      const bc = e.target.dataset.barcode;
      let q = Number(e.target.value || 1);
      if(q <= 0) q = 1;
      const line = AppState.currentInvoice.items.find(i => i.barcode === bc);
      if(line){
        line.qty = q;
        updateInvoiceTotals(type);
        renderInvoiceItemsTable(type);
      }
    });
  });

  tbody.querySelectorAll("button[data-remove]").forEach(btn => {
    btn.addEventListener("click", e => {
      const bc = e.target.dataset.remove;
      AppState.currentInvoice.items =
        AppState.currentInvoice.items.filter(i => i.barcode !== bc);
      updateInvoiceTotals(type);
      renderInvoiceItemsTable(type);
    });
  });
}

/* -----------------------------------------
   تحديث المجاميع
------------------------------------------ */
function updateInvoiceTotals(type){
  if(!AppState.currentInvoice) return;

  let totalBefore = 0;
  AppState.currentInvoice.items.forEach(i => {
    totalBefore += i.qty * i.price;
  });

  if(type === "retail"){
    const discount = Number($("#retail-discount")?.value || 0);
    const paid = Number($("#retail-paid")?.value || 0);
    const total = totalBefore - discount;
    const balance = total - paid;

    AppState.currentInvoice.discount = discount;
    AppState.currentInvoice.paid = paid;
    AppState.currentInvoice.total = total;

    $("#retail-total-before").textContent = fnum(totalBefore);
    $("#retail-total-after").textContent = fnum(total);
    $("#retail-balance").textContent = fnum(balance);
    $("#retail-current-invoice").textContent = fnum(total);

    const name = $("#retail-customer")?.value.trim();
    const prev = getCustomerBalance(name);
    $("#retail-prev-balance").textContent = fnum(prev);
    $("#retail-new-balance").textContent = fnum(prev + balance);
  }
  else {
    const discount = Number($("#wh-discount")?.value || 0);
    const paid = Number($("#wh-paid")?.value || 0);
    const total = totalBefore - discount;
    const balance = total - paid;

    AppState.currentInvoice.discount = discount;
    AppState.currentInvoice.paid = paid;
    AppState.currentInvoice.total = total;

    $("#wh-total-before").textContent = fnum(totalBefore);
    $("#wh-total-after").textContent = fnum(total);
    $("#wh-balance").textContent = fnum(balance);
    $("#wh-current-invoice").textContent = fnum(total);

    const name = $("#wh-customer")?.value.trim();
    const prev = getCustomerBalance(name);
    $("#wh-prev-balance").textContent = fnum(prev);
    $("#wh-new-balance").textContent = fnum(prev + balance);
  }
}

/* -----------------------------------------
   حفظ الفاتورة (Offline فقط حالياً)
------------------------------------------ */
async function saveCurrentInvoice(type, paymentOnly = false){
  if(!AppState.currentInvoice) return;

  const name =
    type === "retail"
      ? ($("#retail-customer")?.value.trim() || "زبون نقدي")
      : ($("#wh-customer")?.value.trim() || "تاجر نقدي");

  AppState.currentInvoice.name = name;

  // حساب الإجمالي قبل الحفظ
  updateInvoiceTotals(type);

  // خزّن في الذاكرة المحلية لعرضه فوراً
  DataStore.invoices.push({ ...AppState.currentInvoice });

  // حاول الحفظ في Firebase (Offline persistence سيعمل حتى بدون نت)
  if (typeof saveInvoiceToDB === "function") {
    const res = await saveInvoiceToDB(AppState.currentInvoice);
    if (res.status === "success") {
      alert(paymentOnly ? "تم تسجيل الدفعة (Firebase)." : "تم حفظ الفاتورة (Firebase).");
    } else {
      // كحل إضافي: Queue (لو أردت)
      if (typeof queueInvoiceForSync === "function") queueInvoiceForSync(AppState.currentInvoice);
      alert("تعذر الحفظ الآن، تم حفظها محلياً وسيتم إرسالها لاحقاً.");
    }
  } else {
    if (typeof queueInvoiceForSync === "function") queueInvoiceForSync(AppState.currentInvoice);
    alert("Firebase غير جاهز، تم حفظها محلياً.");
  }

  await createNewInvoice(type);
  if (typeof refreshDashboard === "function") refreshDashboard();
}


window.__INVOICE_READY__ = true;
