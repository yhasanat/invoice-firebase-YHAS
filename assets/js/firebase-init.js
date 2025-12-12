// assets/js/firebase-init.js
// Firebase CDN (Modular) - Official approach :contentReference[oaicite:1]{index=1}
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  enableIndexedDbPersistence,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  writeBatch,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// 1) ضع إعداداتك هنا
const firebaseConfig = {
  apiKey: "AIzaSyBLlsujxa0K58Ml8VJjKp9vSoqTWNkGgPY",
  authDomain: "invoice-67f94.firebaseapp.com",
  projectId: "invoice-67f94",
  storageBucket: "invoice-67f94.firebasestorage.app",
  messagingSenderId: "926472146916",
  appId: "1:926472146916:web:c45f75e42e7f82211bc1f1"
};

// 2) تفعيل كاش محلي + دعم تعدد التبويبات (أفضل من enableIndexedDbPersistence التقليدي)
const app = initializeApp(firebaseConfig);

// Firestore with persistent cache (multiple tabs)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// 3) واجهة عامة للتطبيق (window.FB)
window.FB = {
  db,
  // أدوات عامة للاستخدام من ملفات غير-module
  async getAll(colName) {
    const snap = await getDocs(collection(db, colName));
    return snap.docs.map(d => ({ __docId: d.id, ...d.data() }));
  },
  async getByDocId(colName, docId) {
    const ref = doc(db, colName, docId);
    const snap = await getDoc(ref);
    return snap.exists() ? ({ __docId: snap.id, ...snap.data() }) : null;
  },
  async set(colName, docId, data, merge = true) {
    await setDoc(doc(db, colName, docId), data, { merge });
    return { status: "success" };
  },
  writeBatch() {
    return writeBatch(db);
  },
  doc,
  collection,
  query,
  where
};

// Promise جاهز للاستخدام من باقي الملفات
window.FB_READY = Promise.resolve(true);
console.log("Firebase initialized OK");
