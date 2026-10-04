const fs = require('fs');
let c = fs.readFileSync('app.js', 'utf8');

c = c.replace(
  /var availableHouses = \[\];\s*if \(window\.appState && window\.appState\.fbAllocations\) \{[\s\S]*?availableHouses = rows\.map\(function\(r\) \{ return r\.house_no; \}\)\.filter\(function\(v, i, a\) \{ return a\.indexOf\(v\) === i; \}\)\.sort\(function\(a,b\)\{return a-b;\}\);\s*\}/,
  `var availableHouses = [];
      Object.keys(window.state.profiles || {}).forEach(function(u) {
          var p = window.state.profiles[u];
          var v = p.village || '';
          if (!isGlobal && myVillage && v.toLowerCase() !== myVillage.toLowerCase()) return;
          if (p.house && availableHouses.indexOf(p.house) === -1) availableHouses.push(p.house);
      });
      availableHouses.sort(function(a,b){return parseInt(a)-parseInt(b);});`
);

fs.writeFileSync('app.js', c);
