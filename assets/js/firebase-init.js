/* assets/js/firebase-init.js – compat global */

(function(){
  const firebaseConfig = {
    apiKey: "AIzaSyBLlsujxa0K58Ml8VJjKp9vSoqTWNkGgPY",
    authDomain: "invoice-67f94.firebaseapp.com",
    projectId: "invoice-67f94",
    storageBucket: "invoice-67f94.firebasestorage.app",
    messagingSenderId: "926472146916",
    appId: "1:926472146916:web:c45f75e42e7f82211bc1f1"
  };

  firebase.initializeApp(firebaseConfig);

  const db = firebase.firestore();

  // تفعيل Offline persistence
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

  window.FB = {
    db,

    async getAll(col){
      const snap = await db.collection(col).get();
      return snap.docs.map(d => ({ __docId: d.id, ...d.data() }));
    },

    async set(col, docId, data){
      await db.collection(col).doc(docId).set(data, { merge:true });
      return { status:"success" };
    },

    batch(){
      return db.batch();
    }
  };

  window.FB_READY = Promise.resolve(true);
  console.log("Firebase compat initialized");
})();
