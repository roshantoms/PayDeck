let contacts = [];
try {
  contacts = JSON.parse(localStorage.getItem('paydeck')) || [];
} catch {
  contacts = [];
}

function save() {
  localStorage.setItem('paydeck', JSON.stringify(contacts));
}

function sanitize(str) {
  return str.replace(/[<>]/g, '').trim();
}

function render(filter = '') {
  const list = document.getElementById('list');
  list.innerHTML = '';

  contacts
    .filter(c => (c.name + c.upi + c.note).toLowerCase().includes(filter.toLowerCase()))
    .forEach((c, i) => {
      const div = document.createElement('div');
      div.className = 'card';

      const name = document.createElement('h3');
      name.textContent = c.name;

      const upi = document.createElement('p');
      upi.textContent = c.upi;

      const note = document.createElement('p');
      note.textContent = c.note || '';

      const actions = document.createElement('div');
      actions.className = 'actions';

      // Primary: Copy Link button (works everywhere)
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy';
      copyBtn.textContent = 'Copy Link & Pay';
      copyBtn.style.background = '#3b82f6';
      copyBtn.onclick = () => copyUpiLink(c.upi, c.name);

      // Secondary: QR Code (for others to scan)
      const qrBtn = document.createElement('button');
      qrBtn.className = 'qr';
      qrBtn.textContent = 'QR Code';
      qrBtn.style.background = '#10b981';
      qrBtn.onclick = () => showQRCode(c.upi, c.name);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = () => remove(i);

      actions.appendChild(copyBtn);
      actions.appendChild(qrBtn);
      actions.appendChild(deleteBtn);

      div.appendChild(name);
      div.appendChild(upi);
      div.appendChild(note);
      div.appendChild(actions);

      list.appendChild(div);
    });
}

function addContact() {
  const name = sanitize(document.getElementById('name').value);
  const upi = sanitize(document.getElementById('upi').value);
  const note = sanitize(document.getElementById('note').value);

  if (!name || !upi) {
    alert('Fill required fields');
    return;
  }

  const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9.\-_]{2,}$/;
  if (!upiRegex.test(upi)) {
    alert('Invalid UPI ID format (e.g., name@okhdfcbank)');
    return;
  }

  contacts.push({ name, upi, note });
  save();
  render();
  closeModal();
  document.getElementById('name').value = '';
  document.getElementById('upi').value = '';
  document.getElementById('note').value = '';
}

function remove(i) {
  if (!confirm('Delete this contact?')) return;
  contacts.splice(i, 1);
  save();
  render();
}

// Copy link with amount – user pastes into any UPI app (100% reliable)
function copyUpiLink(upi, name) {
  let amount = prompt('Enter amount (₹):', '');
  if (!amount) return;
  amount = amount.toString().replace(/[₹,]/g, '');
  let numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    alert('Enter a valid amount');
    return;
  }
  const intAmount = Math.floor(numAmount);
  const url = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${intAmount}&cu=INR`;
  
  navigator.clipboard.writeText(url).then(() => {
    alert(`✅ Link copied!\n\n1. Open Google Pay / PhonePe / Paytm\n2. Tap "Pay to UPI ID" or "Send money"\n3. Paste the link (long press → paste)\n4. Confirm payment`);
  }).catch(() => {
    alert('Failed to copy. Manually copy:\n' + url);
  });
}

// QR code for others to scan
function showQRCode(upi, name) {
  let amount = prompt('Enter amount (₹):', '');
  if (!amount) return;
  amount = amount.toString().replace(/[₹,]/g, '');
  let numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    alert('Enter a valid amount');
    return;
  }
  const intAmount = Math.floor(numAmount);
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${intAmount}&cu=INR`;

  const qrContainer = document.getElementById('qrcode');
  qrContainer.innerHTML = '';
  try {
    new QRCode(qrContainer, {
      text: upiUrl,
      width: 256,
      height: 256,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    document.getElementById('qrModal').style.display = 'flex';
  } catch (err) {
    alert('Failed to generate QR code.');
  }
}

function closeQRModal() {
  document.getElementById('qrModal').style.display = 'none';
}

function openModal() {
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

document.getElementById('search').addEventListener('input', e => render(e.target.value));
render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
}