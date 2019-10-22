const fs = require("fs");

const BASE_DIR = __dirname+"/styles/";

const files = fs.readdirSync(BASE_DIR).map((filepath) => {
  return {
    name: filepath.replace(/^_/, "").replace(/\.json$/, ""),
    disabled: !!filepath.match(/^_/),
    filepath: BASE_DIR+filepath,
  };
})

const OUTPATH = __dirname+"/index.json";

fs.writeFileSync(
  OUTPATH,
  JSON.stringify(files, null, 2)
);

console.error("Written to: "+OUTPATH);
