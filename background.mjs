import { PDFDocument, degrees } from './pdf-lib.esm.min.js';

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'watermark') {
    const { filename, fileBytes } = message;
    const pdfBytes = new Uint8Array(fileBytes);

    chrome.storage.local.get(['userEmail'], async ({ userEmail }) => {
      if (!userEmail) {
        alert("Please log in to Aquamark.io first to store your email.");
        return;
      }

      try {
        const logoUrl = await fetchLatestLogoUrl(userEmail);
        const watermarkedBytes = await applyWatermark(pdfBytes, logoUrl);
        const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.replace('.pdf', '') + '-protected.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error watermarking:', err);
      }
    });
  }
});

async function fetchLatestLogoUrl(userEmail) {
  const listUrl = `https://dvzmnikrvkvgragzhrof.supabase.co/storage/v1/object/list/logos/${userEmail}`;
  const response = await fetch(listUrl, {
    headers: {
      apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2em1uaWtydmt2Z3JhZ3pocm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5Njg5NzUsImV4cCI6MjA1OTU0NDk3NX0.FaHsjIRNlgf6YWbe5foz0kJFtCO4FuVFo7KVcfhKPEk',
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2em1uaWtydmt2Z3JhZ3pocm9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5Njg5NzUsImV4cCI6MjA1OTU0NDk3NX0.FaHsjIRNlgf6YWbe5foz0kJFtCO4FuVFo7KVcfhKPEkY'
    }
  });
  const data = await response.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('No logo found');
  return `https://dvzmnikrvkvgragzhrof.supabase.co/storage/v1/object/public/logos/${userEmail}/${data[0].name}`;
}

async function applyWatermark(inputBytes, logoUrl) {
  const pdfDoc = await PDFDocument.load(inputBytes);
  const logoBytes = await fetch(logoUrl).then(res => res.arrayBuffer());
  const logoImage = await pdfDoc.embedPng(logoBytes);
  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();
    const rows = 6;
    const cols = 6;
    const logoWidth = width * 0.1;
    const logoHeight = (logoWidth / logoImage.width) * logoImage.height;
    const spacingX = width / cols;
    const spacingY = height / rows;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if ((i + j) % 2 === 0) {
          const x = j * spacingX + (i * spacingX / 2);
          const y = i * spacingY;
          page.drawImage(logoImage, {
            x,
            y,
            width: logoWidth,
            height: logoHeight,
            opacity: 0.15,
            rotate: degrees(45)
          });
        }
      }
    }
  }

  return await pdfDoc.save();
}
