// assets/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";

// 1) إعدادات Firebase الخاصة بك (انسخها من Firebase Console)
const firebaseConfig = {

  apiKey: "AIzaSyAvb_76Pm-U74MYUHMBk8xl9-iD8vPmoU0",
  authDomain: "invoicestockapp.firebaseapp.com",
  projectId: "invoicestockapp",
  storageBucket: "invoicestockapp.firebasestorage.app",
  messagingSenderId: "403989131218",
  appId: "1:403989131218:web:60cfad56a7d3abe306a20b"

};

// 2) تهيئة Firebase + Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// تخزين الجلسة محلياً (يبقى مسجلاً بعد إعادة فتح الصفحة)
setPersistence(auth, browserLocalPersistence).catch(console.error);

// 3) عناصر HTML
function getEls() {
  return {
    loginScreen: document.getElementById("login-screen"),
    loginForm: document.getElementById("login-form"),
    emailInput: document.getElementById("login-email"),
    passInput: document.getElementById("login-password"),
    loginError: document.getElementById("login-error"),
    logoutBtn: document.getElementById("btn-logout"),
    userEmailSpan: document.getElementById("current-user-email"),
    appShell: document.querySelector(".app-shell")
  };
}

// 4) معالجة تسجيل الدخول
function initLoginForm() {
  const {
    loginForm,
    emailInput,
    passInput,
    loginError
  } = getEls();

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.style.display = "none";

    const email = (emailInput.value || "").trim();
    const pass = (passInput.value || "").trim();

    if (!email || !pass) {
      loginError.textContent = "الرجاء إدخال البريد وكلمة السر.";
      loginError.style.display = "block";
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // عند النجاح، onAuthStateChanged سيتكفل بإخفاء شاشة الدخول
    } catch (err) {
      console.error(err);
      loginError.textContent = "فشل تسجيل الدخول، تأكد من البيانات.";
      loginError.style.display = "block";
    }
  });
}

// 5) زر تسجيل الخروج
function initLogoutButton() {
  const { logoutBtn } = getEls();
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error", err);
    }
  });
}

// 6) مراقبة حالة تسجيل الدخول
onAuthStateChanged(auth, (user) => {
  const {
    loginScreen,
    userEmailSpan,
    appShell
  } = getEls();

  if (!loginScreen || !appShell || !userEmailSpan) return;

  if (user) {
    // مستخدم مسجل
    loginScreen.style.display = "none";
    appShell.style.filter = "none";
    appShell.style.pointerEvents = "auto";
    userEmailSpan.textContent = user.email || "مستخدم";
  } else {
    // لا يوجد مستخدم -> إظهار شاشة الدخول ومنع التفاعل مع التطبيق
    loginScreen.style.display = "flex";
    appShell.style.filter = "blur(3px)";
    appShell.style.pointerEvents = "none";
    userEmailSpan.textContent = "غير مسجل";
  }
});

// 7) تهيئة فورم الدخول وزر الخروج عند تحميل الصفحة
window.addEventListener("DOMContentLoaded", () => {
  initLoginForm();
  initLogoutButton();
});
