/* -----------------------------------------
   print.js – الطباعة الحرارية + كشف حساب A4
------------------------------------------*/

function buildReceiptHTML(invoice){
  const isRetail = invoice.type === "retail";
  const nameLabel = isRetail ? "الزبون" : "التاجر";
  let rowsHTML = "";
  let totalBefore = 0;

  (invoice.items || []).forEach((line, idx) => {
    const value = line.qty * line.price;
    totalBefore += value;
    rowsHTML += `
      <tr>
        <td>${idx+1}</td>
        <td>${line.name}</td>
        <td>${line.qty}</td>
        <td>${fnum(line.price)}</td>
        <td>${fnum(value)}</td>
      </tr>
    `;
  });

  if(!rowsHTML){
    rowsHTML = `<tr><td colspan="5">سند قبض بدون أصناف</td></tr>`;
  }

  const html = `
    <div class="receipt-header">
      <div class="logo">اسم المحل</div>
      <div>عنوان مختصر / هاتف</div>
    </div>
    <div class="receipt-line"></div>
    <div style="font-size:10px;">
      رقم الفاتورة: ${invoice.id}<br>
      التاريخ: ${invoice.dateISO}<br>
      ${nameLabel}: ${invoice.name || (isRetail ? "زبون نقدي" : "تاجر نقدي")}
    </div>
    <div class="receipt-line"></div>
    <table class="receipt-table">
      <thead>
        <tr>
          <th>#</th>
          <th>الصنف</th>
          <th>الكمية</th>
          <th>السعر</th>
          <th>القيمة</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHTML}
      </tbody>
    </table>
    <div class="receipt-line"></div>
    <div style="font-size:10px;">
      إجمالي قبل الخصم: ${fnum(totalBefore)}<br>
      الخصم: ${fnum(invoice.discount || 0)}<br>
      <strong>الصافي: ${fnum(invoice.total || 0)}</strong><br>
      المدفوع: ${fnum(invoice.paid || 0)}<br>
      <strong>الباقي: ${fnum((invoice.total || 0) - (invoice.paid || 0))}</strong>
    </div>
    <div class="receipt-line"></div>
    <div class="receipt-footer">
      شكراً لزيارتكم
    </div>
  `;
  return html;
}

function printCurrentInvoice(type){
  const invoice = AppState.currentInvoice;
  if(!invoice){
    alert("لا توجد فاتورة حالية.");
    return;
  }
  const html = buildReceiptHTML(invoice);
  $("#receipt-content").innerHTML = html;
  window.print();
}

/* كشف حساب للطباعة A4 */
function buildStatementHTML(rows, totals) {
  const { totalDebit, totalCredit, finalBalance, name } = totals;

  let rowsHTML = "";
  rows.forEach(r => {
    rowsHTML += `
      <tr>
        <td>${r.dateISO}</td>
        <td>${r.id}</td>
        <td>${r.type}</td>
        <td class="text-right">${r.desc}</td>
        <td>${fnum(r.debit)}</td>
        <td>${fnum(r.credit)}</td>
        <td>${fnum(r.balance)}</td>
      </tr>`;
  });

  return `
    <div class="statement-print">
      <h2 class="st-header-title">كشف حساب</h2>
      <div class="st-header-info">
        <div><strong>الاسم:</strong> ${name || "غير محدد"}</div>
        <div><strong>تاريخ الطباعة:</strong> ${todayISO()}</div>
      </div>

      <table class="st-table">
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>رقم المستند</th>
            <th>النوع</th>
            <th>الوصف</th>
            <th>مدين</th>
            <th>دائن</th>
            <th>الرصيد</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHTML}
        </tbody>
      </table>

      <div class="st-summary">
        <div><strong>إجمالي المدين:</strong> ${fnum(totalDebit)}</div>
        <div><strong>إجمالي الدائن:</strong> ${fnum(totalCredit)}</div>
        <div><strong>الرصيد النهائي:</strong> ${fnum(finalBalance)}</div>
      </div>

      <div class="st-footer">
        شكراً لتعاملكم معنا
      </div>
    </div>
  `;
}

function printStatement() {
  const tableRows = window.__STATEMENT_ROWS__ || [];
  const totals = window.__STATEMENT_TOTALS__ || {};

  if(!tableRows.length){
    alert("لا يوجد بيانات لطباعتها. الرجاء عرض كشف الحساب أولاً.");
    return;
  }

  const html = buildStatementHTML(tableRows, totals);
  $("#receipt-content").innerHTML = html;
  window.print();
}
