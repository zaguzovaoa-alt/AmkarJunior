import admin from 'firebase-admin';
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});
const db = admin.firestore();
db.collection('test').get().then(snap => {
  console.log('Success! Docs:', snap.size);
}).catch(err => {
  console.error('Error:', err.message);
});
