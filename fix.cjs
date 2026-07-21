const fs = require("fs");
let content = fs.readFileSync("src/components/GroupsModule.tsx", "utf8");
content = content.replace(/\\n/g, "\n");
fs.writeFileSync("src/components/GroupsModule.tsx", content);
