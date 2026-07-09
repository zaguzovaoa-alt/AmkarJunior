import fs from 'fs';
let code = fs.readFileSync('src/context/AuthContext.tsx', 'utf8');

code = code.replace(
  '      if (allMatchedDocs.length > 0) {\n        found = true;\n        \n        let targetDoc = allMatchedDocs[0];',
  '      if (allMatchedDocs.length > 0) {\n        found = true;\n        \n        // Sort by ID descending so newer profiles come first\n        allMatchedDocs.sort((a, b) => b.snap.id.localeCompare(a.snap.id));\n        let targetDoc = allMatchedDocs[0];'
);

fs.writeFileSync('src/context/AuthContext.tsx', code);
console.log("Patched AuthContext");
