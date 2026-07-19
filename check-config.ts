import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app1 = initializeApp(config, 'app1');
const db1 = getFirestore(app1, 'ai-studio-2f501af5-f006-4da1-bfb5-0c6f206187cd');

async function check() {
  try {
    const snap1 = await getDoc(doc(db1, '_config', 'initialized'));
    console.log('Config:', snap1.data());
  } catch (e: any) {
    console.log('Error:', e.message);
  }
}
check();
