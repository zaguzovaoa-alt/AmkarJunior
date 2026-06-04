import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('/app/applet/firebase-applet-config.json', 'utf8'));

const app1 = initializeApp(config, 'app1');
const db1 = getFirestore(app1, 'ai-studio-2f501af5-f006-4da1-bfb5-0c6f206187cd');

const app2 = initializeApp(config, 'app2');
const db2 = getFirestore(app2, '(default)');

async function run() {
  try {
    const snap1 = await getDocs(collection(db1, 'clients'));
    console.log('Current DB (ai-studio-...) clients count:', snap1.size);
  } catch(e) { console.log('DB1 error:', e.message); }

  try {
    const snap2 = await getDocs(collection(db2, 'clients'));
    console.log('Default DB clients count:', snap2.size);
  } catch(e) { console.log('DB2 error:', e.message); }
  
  process.exit(0);
}
run();
