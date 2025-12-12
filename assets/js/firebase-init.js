/* =====================================================
   firebase-init.js – Firestore + Offline Persistence
===================================================== */

(function () {
  console.log("FIREBASE INIT: start");

  // ضع إعدادات مشروعك
  const firebaseConfig = {
    apiKey: "AIzaSyBLlsujxa0K58Ml8VJjKp9vSoqTWNkGgPY",
    authDomain: "invoice-67f94.firebaseapp.com",
    projectId: "invoice-67f94",
    storageBucket: "invoice-67f94.firebasestorage.app",
    messagingSenderId: "926472146916",
    appId: "1:926472146916:web:c45f75e42e7f82211bc1f1"
  };

  try {
    // منع initialize مرتين
    if (firebase.apps && firebase.apps.length) {
      console.warn("FIREBASE INIT: already initialized");
    } else {
      firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.firestore();

    // Offline persistence (IndexedDB)
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
      // لا نكسر التطبيق بسبب persistence
      console.warn("Persistence not enabled:", err.code || err.message);
    });

    // واجهة موحدة لباقي الملفات
    window.FB = {
      db,
      FieldValue: firebase.firestore.FieldValue,

      async getAll(colName) {
        const snap = await db.collection(colName).get();
        return snap.docs.map(d => ({ __docId: d.id, ...d.data() }));
      },

      async set(colName, docId, data, merge = true) {
        await db.collection(colName).doc(String(docId)).set(data, { merge });
        return { status: "success" };
      },

      async get(colName, docId) {
        const doc = await db.collection(colName).doc(String(docId)).get();
        return doc.exists ? ({ __docId: doc.id, ...doc.data() }) : null;
      },

      batch() {
        return db.batch();
      },

      docRef(colName, docId) {
        return db.collection(colName).doc(String(docId));
      }
    };

    window.FIREBASE_OK = true;
    console.log("FIREBASE INIT: ready");
  } catch (e) {
    window.FIREBASE_OK = false;
    console.error("FIREBASE INIT: failed", e);
  }
})();
