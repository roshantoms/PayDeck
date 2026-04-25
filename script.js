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

  // More permissive regex: allows alphanumeric, dot, hyphen, underscore before @, and after @ (bank handle)
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

  // Remove any non-numeric except decimal point
  let cleaned = amount.toString().replace(/[₹,]/g, '');
  let numAmount = parseFloat(cleaned);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    alert('Please enter a valid amount greater than 0');
    return;
  }

  // Remove the hardcoded 100k limit - let the UPI app enforce its own limits
  // (If you want to keep a limit, you can uncomment but set higher)
  /*
  if (numAmount > 100000) {
    alert('Amount exceeds limit (₹100,000)');
    return;
  }
  */

  const confirmPay = confirm(`Pay ₹${numAmount} to ${name} (${upi})?`);
  if (!confirmPay) return;

  // Format amount as integer (no decimal) - most UPI apps prefer this for INR
  // But keep decimal for paise if amount has cents
  let amountParam;
  if (numAmount % 1 === 0) {
    amountParam = Math.round(numAmount).toString(); // "100"
  } else {
    amountParam = numAmount.toFixed(2); // "100.50"
  }

  // Encode parameters
  const encodedPA = encodeURIComponent(upi);
  const encodedPN = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(`Pay to ${name}`); // short note
  
  // Build UPI URL without 'cu=INR' (it's default) and without any extra params
  // Some apps are picky about unknown params
  const url = `upi://pay?pa=${encodedPA}&pn=${encodedPN}&am=${amountParam}&tn=${encodedNote}`;
  
  console.log('Opening UPI URL:', url);
  
  // Try to open
  window.location.href = url;
  
  // Fallback message
  setTimeout(() => {
    alert("If payment app doesn't open, please ensure you have Google Pay, PhonePe, or any UPI app installed.\n\nIf it opens but shows an error, the UPI ID might be incorrect or the bank doesn't support this ID.");
  }, 1500);
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
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log('Service Worker registered');
  }).catch(err => {
    console.log('Service Worker registration failed:', err);
  });
}