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

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = () => remove(i);

      actions.appendChild(payBtn);
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

  // ✅ Fixed regex – allows all common bank handles
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

  // Remove currency symbols and commas
  amount = amount.toString().replace(/[₹,]/g, '');
  let numAmount = parseFloat(amount);

  if (isNaN(numAmount) || numAmount <= 0) {
    alert('Enter a valid amount greater than 0');
    return;
  }

  if (numAmount > 100000) {
    alert('Amount exceeds limit (₹100,000)');
    return;
  }

  const formattedAmount = numAmount.toFixed(2);  // always two decimals

  const confirmPay = confirm(`Pay ₹${formattedAmount} to ${name}?`);
  if (!confirmPay) return;

  // ✅ Complete UPI URL with transaction note
  const encodedPA = encodeURIComponent(upi);
  const encodedPN = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(`Payment to ${name}`);
  const url = `upi://pay?pa=${encodedPA}&pn=${encodedPN}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;

  // Try to open UPI app
  window.location.href = url;

  // Fallback in case nothing happens
  setTimeout(() => {
    alert("If UPI app didn't open, make sure you have Google Pay, PhonePe, or Paytm installed.");
  }, 2000);
}

function openModal() {
  document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

document.getElementById('search').addEventListener('input', e => render(e.target.value));

render();

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log('Service Worker registered');
  }).catch(err => {
    console.log('Service Worker registration failed:', err);
  });
}