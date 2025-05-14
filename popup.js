document.getElementById('saveBtn').addEventListener('click', () => {
  const email = document.getElementById('email').value.trim();

  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address');
    return;
  }

  chrome.storage.local.set({ userEmail: email }, () => {
    document.getElementById('status').textContent = '✅ Email saved!';
  });
});
