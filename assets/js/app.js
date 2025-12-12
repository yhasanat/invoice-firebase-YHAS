/* -----------------------------------------
   app.js – نقطة دخول التطبيق (Bootstrap آمن)
------------------------------------------*/

/* إظهار الواجهة المطلوبة */
function showView(viewId){
  $all(".view").forEach(v => v.classList.remove("active"));
  const view = $("#view-" + viewId);
  if(view) view.classList.add("active");

  $all(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  if(viewId === "dashboard"){
    refreshDashboard();
  } else if(viewId === "stock"){
    const search = $("#stock-search");
    renderStockTable(search ? search.value : "");
  }
}

/* ربط الأحداث (Safe DOM Binding) */
function initEvents(){

  on("#btn-update-balances","click", () => {
    alert("يتم احتساب الأرصدة من الفواتير المسجلة (مدين - دائن) لكل عميل دون تعديل يدوي.");
  });

  on("#btn-recalc-stock","click", async () => {
    await loadProducts();
    const search = $("#stock-search");
    await renderStockTable(search ? search.value : "");
    await refreshDashboard();
    alert("تم تحديث عرض المخزون.");
  });

  on("#btn-full-sync","click", async () => {
    const syncRes = await syncAllPendingData();
    await loadAllData();
    await refreshDashboard();
    alert(
      "مزامنة البيانات المعلقة:\n" +
      `- فواتير أُرسلت: ${syncRes.invoicesSent} (متبقي: ${syncRes.invoicesRemaining})\n` +
      `- حركات مخزون أُرسلت: ${syncRes.stockSent} (متبقي: ${syncRes.stockRemaining})`
    );
  });

  /* أزرار التنقل */
  $all(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.view);
    });
  });

  /* باركود بيع مفرق */
  on("#retail-barcode","keydown", e => {
    if(e.key === "Enter"){
      const code = e.target.value.trim();
      const qty = Number($("#retail-default-qty")?.value || 1);
      if(code){
        addItemToCurrentInvoice(code, qty, "retail");
        e.target.value = "";
      }
    }
  });

  /* باركود بيع جملة */
  on("#wh-barcode","keydown", e => {
    if(e.key === "Enter"){
      const code = e.target.value.trim();
      const qty = Number($("#wh-default-qty")?.value || 1);
      if(code){
        addItemToCurrentInvoice(code, qty, "wholesale");
        e.target.value = "";
      }
    }
  });

  /* البحث المتقدم */
  on("#retail-search","input", e => {
    const results = searchProductsAdvanced(e.target.value);
    showSuggestions(results, e.target, "retail");
  });

  on("#wh-search","input", e => {
    const results = searchProductsAdvanced(e.target.value);
    showSuggestions(results, e.target, "wholesale");
  });

  /* الخصم والدفع */
  on("#retail-discount","input", () => updateInvoiceTotals("retail"));
  on("#retail-paid","input", () => updateInvoiceTotals("retail"));
  on("#wh-discount","input", () => updateInvoiceTotals("wholesale"));
  on("#wh-paid","input", () => updateInvoiceTotals("wholesale"));

  on("#retail-customer","change", () => updateInvoiceTotals("retail"));
  on("#wh-customer","change", () => updateInvoiceTotals("wholesale"));

  /* أزرار الفواتير */
  on("#btn-retail-new","click", () => createNewInvoice("retail"));
  on("#btn-wh-new","click", () => createNewInvoice("wholesale"));

  on("#btn-retail-save","click", () => saveCurrentInvoice("retail", false));
  on("#btn-retail-save-payment-only","click", () => saveCurrentInvoice("retail", true));
  on("#btn-wh-save","click", () => saveCurrentInvoice("wholesale", false));
  on("#btn-wh-save-payment-only","click", () => saveCurrentInvoice("wholesale", true));

  on("#btn-retail-print","click", () => printCurrentInvoice("retail"));
  on("#btn-wh-print","click", () => printCurrentInvoice("wholesale"));

  /* كشف الحساب */
  on("#btn-st-run","click", runStatement);
  on("#btn-st-print","click", printStatement);

  /* إدارة الأصناف */
  on("#btn-stock-save","click", saveStockItem);
  on("#stock-search","input", e => renderStockTable(e.target.value));
}

/* --------------------------------------------------
   Bootstrap آمن (بدون DOMContentLoaded)
-------------------------------------------------- */
(async function bootstrapApp(){
  try {
    console.log("BOOTSTRAP: start");

    /* تحميل البيانات الأساسية */
    await loadAllData();

    /* إنشاء فاتورة مفرق افتراضية */
    await createNewInvoice("retail");

    /* ربط الأحداث */
    initEvents();

    /* تهيئة المزامنة أوفلاين */
    initSync();

    /* تحديث لوحة التحكم */
    await refreshDashboard();

    console.log("BOOTSTRAP: done");
  } catch (e) {
    console.error("BOOTSTRAP ERROR:", e);
    alert("حدث خطأ أثناء تشغيل النظام، راجع Console");
  }
})();
