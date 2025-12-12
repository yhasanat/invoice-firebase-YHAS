/* ===============================
   utils.js – Firebase FINAL
================================ */

// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBLlsujxa0K58Ml8VJjKp9vSoqTWNkGgPY",
  authDomain: "invoice-67f94.firebaseapp.com",
  projectId: "invoice-67f94",
  storageBucket: "invoice-67f94.firebasestorage.app",
  messagingSenderId: "926472146916",
  appId: "1:926472146916:web:c45f75e42e7f82211bc1f1"
};

// Init
const app = initializeApp(firebaseConfig);
window.db = getFirestore(app);

// ===============================
// Firestore Helpers
// ===============================
async function fbGet(col) {
  const snap = await getDocs(collection(db, col));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function fbSet(col, id, data) {
  return await setDoc(doc(db, col, String(id)), data, { merge: true });
}

async function fbAdd(col, data) {
  return await addDoc(collection(db, col), data);
}

// ===============================
// Helpers
// ===============================
function isOnline() {
  return navigator.onLine;
}

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function fnum(n) {
  return Number(n || 0).toFixed(2);
}

// فاتورة: YYMMDDHHmm + اتصال + عدّاد
function generateInvoiceNumber() {
  const d = new Date();
  const YY = String(d.getFullYear()).slice(-2);
  const MM = String(d.getMonth() + 1).padStart(2, "0");
  const DD = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const C = isOnline() ? "1" : "0";

  let n = Number(localStorage.getItem("invCounter") || 0) + 1;
  if (n > 99) n = 1;
  localStorage.setItem("invCounter", n);

  return `${YY}${MM}${DD}${HH}${mm}${C}${String(n).padStart(2, "0")}`;
}

// DOM helpers
function $(s) { return document.querySelector(s); }
function $all(s) { return document.querySelectorAll(s); }
function create(t, cls = "") {
  const e = document.createElement(t);
  if (cls) e.className = cls;
  return e;
}

// Export globals
window.fbGet = fbGet;
window.fbSet = fbSet;
window.fbAdd = fbAdd;
window.generateInvoiceNumber = generateInvoiceNumber;
window.todayISO = todayISO;
window.fnum = fnum;
window.$ = $;
window.$all = $all;
window.create = create;
