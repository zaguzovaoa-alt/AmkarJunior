import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp({
  credential: applicationDefault(),
  projectId: 'ai-studio-2f501af5-f006-4da1-bfb5-0c6f206187cd'
});

const db = getFirestore();
db.collection('test').get().then(snap => {
  console.log('Success! Docs:', snap.size);
}).catch(err => {
  console.error('Error:', err.message);
});
