const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([600, 400]);
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('dummy.pdf', pdfBytes);
  console.log("Dummy PDF successfully created!");
}

createPdf().catch(console.error);
