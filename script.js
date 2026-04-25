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
    .filter(c => (c.name + c.upi + c.phone + c.note).toLowerCase().includes(filter.toLowerCase()))
    .forEach((c, i) => {
      const div = document.createElement('div');
      div.className = 'card';

      const name = document.createElement('h3');
      name.textContent = c.name;

      const upi = document.createElement('p');
      upi.textContent = c.upi;

      const phone = document.createElement('p');
      phone.textContent = c.phone ? `📞 ${c.phone}` : '';

      const note = document.createElement('p');
      note.textContent = c.note || '';

      const actions = document.createElement('div');
      actions.className = 'actions';

      // Copy UPI button
      const copyUpiBtn = document.createElement('button');
      copyUpiBtn.className = 'copy-upi';
      copyUpiBtn.textContent = 'Copy UPI';
      copyUpiBtn.onclick = () => copyToClipboard(c.upi, 'UPI ID copied');

      // Copy Phone button (only if phone number exists)
      const copyPhoneBtn = document.createElement('button');
      copyPhoneBtn.className = 'copy-phone';
      copyPhoneBtn.textContent = 'Copy Phone';
      if (c.phone && c.phone.trim() !== '') {
        copyPhoneBtn.onclick = () => copyToClipboard(c.phone, 'Phone number copied');
      } else {
        copyPhoneBtn.disabled = true;
        copyPhoneBtn.style.opacity = '0.5';
        copyPhoneBtn.title = 'No phone number saved';
      }

      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = () => remove(i);

      actions.appendChild(copyUpiBtn);
      actions.appendChild(copyPhoneBtn);
      actions.appendChild(deleteBtn);

      div.appendChild(name);
      div.appendChild(upi);
      if (c.phone) div.appendChild(phone);
      if (c.note) div.appendChild(note);
      div.appendChild(actions);

      list.appendChild(div);
    });
}

function copyToClipboard(text, successMsg) {
  navigator.clipboard.writeText(text).then(() => {
    alert(successMsg);
  }).catch(() => {
    alert('Failed to copy. Please select and copy manually.');
  });
}

function addContact() {
  const name = sanitize(document.getElementById('name').value);
  const upi = sanitize(document.getElementById('upi').value);
  const phone = sanitize(document.getElementById('phone').value);
  const note = sanitize(document.getElementById('note').value);

  if (!name || !upi) {
    alert('Name and UPI ID are required');
    return;
  }

  const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9.\-_]{2,}$/;
  if (!upiRegex.test(upi)) {
    alert('Invalid UPI ID format (e.g., name@okhdfcbank)');
    return;
  }

  // Optional phone number validation (basic)
  if (phone && !/^[0-9+\-\s]{10,15}$/.test(phone)) {
    alert('Phone number should be 10–15 digits (optional)');
    return;
  }

  contacts.push({ name, upi, phone, note });
  save();
  render();
  closeModal();
  document.getElementById('name').value = '';
  document.getElementById('upi').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('note').value = '';
}

function remove(i) {
  if (!confirm('Delete this contact?')) return;
  contacts.splice(i, 1);
  save();
  render();
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