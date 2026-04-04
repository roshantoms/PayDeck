let contacts = JSON.parse(localStorage.getItem('paydeck') || '[]');

function save() {
  localStorage.setItem('paydeck', JSON.stringify(contacts));
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
      payBtn.onclick = () => pay(c.upi);

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
  const name = document.getElementById('name').value.trim();
  const upi = document.getElementById('upi').value.trim();
  const note = document.getElementById('note').value.trim();

  if (!name || !upi) return alert('Fill required fields');

  if (!upi.includes('@')) {
    return alert('Invalid UPI ID');
  }

  contacts.push({ name, upi, note });
  save();
  render();
  closeModal();
}

function remove(i) {
  contacts.splice(i,1);
  save();
  render();
}

function pay(upi) {
  const amount = prompt('Enter amount');

  if (!amount || isNaN(amount) || amount <= 0) {
    return alert("Enter valid amount");
  }

  const url = `upi://pay?pa=${encodeURIComponent(upi)}&pn=PayDeck&am=${amount}&cu=INR`;
  window.location.href = url;
}

function openModal() {
  document.getElementById('modal').style.display = 'flex';

  document.getElementById('name').value = '';
  document.getElementById('upi').value = '';
  document.getElementById('note').value = '';
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

document.getElementById('search').addEventListener('input', e => render(e.target.value));

render();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}