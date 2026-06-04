import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app1 = initializeApp(config, 'app1');
const db1 = getFirestore(app1, 'ai-studio-2f501af5-f006-4da1-bfb5-0c6f206187cd');

const app2 = initializeApp(config, 'app2');
const db2 = getFirestore(app2, '(default)');

async function check() {
  try {
    const snap1 = await getDocs(collection(db1, 'coaches'));
    console.log('Current DB (ai-studio-...) coaches count:', snap1.size);
  } catch (e) {
    console.log('Current DB error:', e.message);
  }

  try {
    const snap2 = await getDocs(collection(db2, 'coaches'));
    console.log('Default DB coaches count:', snap2.size);
  } catch (e) {
    console.log('Default DB error:', e.message);
  }
}
check();
