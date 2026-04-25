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

      const payBtn = document.createElement('button');
      payBtn.className = 'pay';
      payBtn.textContent = 'Pay';
      payBtn.onclick = () => pay(c.upi, c.name);

      const copyBtn = document.createElement('button');
      copyBtn.className = 'delete'; // reuse delete style, but change text
      copyBtn.textContent = 'Copy Link';
      copyBtn.style.background = '#3b82f6'; // blue
      copyBtn.onclick = () => copyUpiLink(c.upi, c.name);

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = () => remove(i);

      actions.appendChild(payBtn);
      actions.appendChild(copyBtn);
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

function pay(upi, name) {
  let amount = prompt('Enter amount (₹):', '');
  if (!amount) return;

  amount = amount.toString().replace(/[₹,]/g, '');
  let numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    alert('Enter a valid amount greater than 0');
    return;
  }

  const intAmount = Math.floor(numAmount); // integer only

  const confirmPay = confirm(`Pay ₹${intAmount} to ${name}?`);
  if (!confirmPay) return;

  const url = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${intAmount}&cu=INR`;
  
  // Debug: show the URL in console
  console.log('Generated UPI URL:', url);
  
  window.location.href = url;
}

// New function: copy UPI link to clipboard with any amount
function copyUpiLink(upi, name) {
  let amount = prompt('Enter amount (₹) for the link:', '');
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
    alert('UPI link copied! Open any UPI app and paste it into the browser or "Pay to UPI ID" field.');
  }).catch(() => {
    alert('Failed to copy. Manually copy this:\n' + url);
  });
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
  navigator.serviceWorker.register('sw.js').catch(err => {
    console.log('Service Worker registration failed:', err);
  });
}