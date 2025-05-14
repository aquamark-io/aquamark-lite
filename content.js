// Run when Gmail loads or new content appears
const observer = new MutationObserver(() => {
  injectButtons();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

function injectButtons() {
  const cards = document.querySelectorAll('div[data-tooltip^="Download"]');

  cards.forEach((card) => {
    // Avoid injecting multiple times
    if (card.querySelector('.aquamark-btn')) return;

    // Only target PDFs
    const link = card.closest('a');
    const filename = link?.innerText || '';
    if (!filename.toLowerCase().endsWith('.pdf')) return;

    // Create the watermark button
    const btn = document.createElement('button');
    btn.innerText = 'Watermark';
    btn.className = 'aquamark-btn';
    btn.style.marginLeft = '8px';
    btn.style.padding = '2px 6px';
    btn.style.fontSize = '12px';
    btn.style.cursor = 'pointer';
    btn.style.border = '1px solid #007bff';
    btn.style.background = '#f0f8ff';
    btn.style.borderRadius = '4px';

    btn.onclick = async () => {
      const fileUrl = link.href;
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      // Send message to background for watermarking
      chrome.runtime.sendMessage({
        action: 'watermark',
        filename,
        fileBytes: Array.from(new Uint8Array(arrayBuffer)) // send as plain array
      });
    };

    card.appendChild(btn);
  });
}
