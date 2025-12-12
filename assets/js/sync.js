/* -----------------------------------------
   sync.js – Firebase (لا حاجة لمزامنة أوفلاين)
------------------------------------------*/

function initSync(){
  console.log("Firebase يقوم بالمزامنة ذاتياً. لا حاجة للكود القديم.");
}

// فقط placeholder للمحافظة على عمل المشروع
async function syncAllPendingData(){
  return { invoicesSent:0, invoicesRemaining:0, stockSent:0, stockRemaining:0 };
}
