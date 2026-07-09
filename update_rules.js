import fs from 'fs';

let rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`;

fs.writeFileSync('firestore.rules', rules);
console.log("Updated firestore.rules");
