const fs = require("fs");
const path = require("path");
const { PDFDocument, PDFName, PDFRawStream } = require("pdf-lib");

async function test(filename) {
  // Load the original PDF
  const pdfDoc = await PDFDocument.load(
    fs.readFileSync(path.join(__dirname, `${filename}`))
  );
  const imagesInDoc = [];
  pdfDoc.context.indirectObjects.forEach((pdfObject, ref) => {
    if (!(pdfObject instanceof PDFRawStream)) return;
    const {
      dict: { dict: dict },
    } = pdfObject;
    const smaskRef = dict.get(PDFName.of("SMask"));
    const colorSpace = dict.get(PDFName.of("ColorSpace"));
    const subtype = dict.get(PDFName.of("Subtype"));
    const width = dict.get(PDFName.of("Width"));
    const height = dict.get(PDFName.of("Height"));
    const name = dict.get(PDFName.of("Name"));
    const bitsPerComponent = dict.get(PDFName.of("BitsPerComponent"));
    const filter = dict.get(PDFName.of("Filter"));
    if (subtype === PDFName.of("Image")) {
      imagesInDoc.push({
        ref,
        smaskRef,
        colorSpace,
        name: name ? name.encodedName : `Object${ref.objectNumber}`,
        width: width.numberValue,
        height: height.numberValue,
        bitsPerComponent: bitsPerComponent.numberValue,
        data: pdfObject.contents,
        type: "jpg",
      });
    }
  });
  // Find and mark SMasks as alpha layers
  imagesInDoc.forEach((image) => {
    if (image.type === "png" && image.smaskRef) {
      const smaskImg = imagesInDoc.find(({ ref }) => ref === image.smaskRef);
      smaskImg.isAlphaLayer = true;
      image.alphaLayer = image;
    }
  });
  console.log(`\nfound images: ${imagesInDoc.length}\n`);

  //Export images
  const imagesFolder = path.join(__dirname, "images");
  imagesInDoc.forEach((image) => {
    fs.writeFileSync(
      path.join(
        imagesFolder,
        `image_obj${image.ref.objectNumber}.${image.type}`
      ),
      image.data
    );
  });
  console.log(`images has been output at\n${imagesFolder}\n`);

  // Replace image
  // It is assumed here that the first picture is replaced.
  const correctedFile = path.join(__dirname, filename);
  let data = fs.readFileSync(path.join(__dirname, "image_corrected.jpg"));
  let bufferData = Buffer.from(data);
  pdfDoc.context.indirectObjects.get(imagesInDoc[0].ref).contents = bufferData;
  pdfDoc
    .save()
    .then((res) => {
      fs.writeFileSync(correctedFile, res);
      console.log(
        `image has been replaced and the corrected file is saved in\n${correctedFile}\n`
      );
    })
    .catch((e) => console.log(e));
}
exports.test = test;
