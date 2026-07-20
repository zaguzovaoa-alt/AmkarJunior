const fs = require('fs');
let code = fs.readFileSync('src/components/TrainerCRM.tsx', 'utf8');

code = code.replace(
  '{/* Right column: Groups, Ratings, Files */',
  '{/* Right column: Groups, Ratings, Files */}'
);

fs.writeFileSync('src/components/TrainerCRM.tsx', code);
