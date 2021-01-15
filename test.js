const runPdf = require("./index");

// runPdf.test("./pdf/okay.pdf");

const testFolder = "./pdf/";
const fs = require("fs");

const files = [];

fs.readdirSync(testFolder).forEach((file) => {
  if (file === ".DS_Store") {
  } else {
    files.push(file);
  }
});

files.forEach((file) => {
  runPdf.test(`./pdf/${file}`);
});
