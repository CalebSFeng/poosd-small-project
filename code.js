/* ================================
   Config
================================== */
const urlBase   = 'http://poosdgroup1.xyz/'; // must end with /
const extension = 'php';

/* Session state */
let userId    = 0;
let firstName = '';
let lastName  = '';

/* ================================
   Auth: Login / Register
================================== */
function doLogin() {
  userId = 0; firstName = ''; lastName = '';

  const loginEl    = document.getElementById('loginName');
  const passwordEl = document.getElementById('loginPassword');
  const resultEl   = document.getElementById('loginResult');

  const login    = (loginEl?.value || '').trim();
  const password = passwordEl?.value || '';

  if (!login || !password) return showMsg(resultEl, 'Please enter username and password.');

  
  showMsg(resultEl, '', 'success'); // clear
  const payload = JSON.stringify({ login, password });
  const url     = `${urlBase}Login.${extension}`;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
  xhr.timeout = 10000;

  xhr.onreadystatechange = function(){
    if (this.readyState !== 4) return;

    if (this.status !== 200) {
      if (this.status === 401) return showMsg(resultEl, 'Incorrect username or password.');
      if (this.status === 404) return showMsg(resultEl, 'Account not found.');
      return showMsg(resultEl, `Login failed (HTTP ${this.status}).`);
    }

    let json = {};
    try { json = JSON.parse(xhr.responseText || '{}'); } catch {
      return showMsg(resultEl, 'Invalid server response.');
    }

    if (json.error)             return showMsg(resultEl, json.error); // backend error text
    if (!json.id || json.id < 1) return showMsg(resultEl, 'User/Password combination incorrect.');

    userId = json.id; firstName = json.firstName || ''; lastName = json.lastName || '';
    saveCookie();
    window.location.href = 'color.html';
  };

  xhr.onerror   = () => showMsg(resultEl, 'Network error.');
  xhr.ontimeout = () => showMsg(resultEl, 'Request timed out.');
  xhr.send(payload);
}

function doRegister() {
  const resultEl = document.getElementById('registerResult');
  const tmp = {
    firstName: document.getElementById("firstName")?.value?.trim() || '',
    lastName : document.getElementById("lastName")?.value?.trim()  || '',
    login    : document.getElementById("login")?.value?.trim()     || '',
    password : document.getElementById("password")?.value          || ''
  };
  if (!tmp.firstName || !tmp.lastName || !tmp.login || !tmp.password) {
    return showMsg(resultEl, 'Please fill out all fields.');
  }

  const jsonPayload = JSON.stringify(tmp);
  const url         = `${urlBase}Register.${extension}`;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  xhr.onreadystatechange = function() {
    if (this.readyState !== 4) return;
    // If backend uses 409 for duplicate, show it
    if (this.status === 409) return showMsg(resultEl, 'Account already exists with that username.');

    if (this.status !== 200) {
      return showMsg(resultEl, `Sign up failed (HTTP ${this.status}).`);
    }

    let res = {};
    try { res = JSON.parse(xhr.responseText || '{}'); } catch {}

    if (res.error)             return showMsg(resultEl, res.error);       // backend-provided
    if (res.success === false) return showMsg(resultEl, res.message || 'Sign up failed.');

    // Their PHP returns {"success": <something>} on success
    showMsg(resultEl, 'Account created. Redirecting…', 'success');
    window.location.href = "index.html";
  };

  xhr.onerror = () => showMsg(resultEl, 'Network error.');
  xhr.send(jsonPayload);
}

function addContact() {
    // Grab values from input fields
    let firstName = document.getElementById("firstName").value;
    let lastName = document.getElementById("lastName").value;
    let email = document.getElementById("email").value;
    let phone = document.getElementById("phone").value;

    // ⚠️ For now you’re passing userId — later we’ll switch this to session-based
    let userId = localStorage.getItem("userId"); // assume you stored this after login

    let tmp = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        userId: userId
    };

    let jsonPayload = JSON.stringify(tmp);

    const url = `${urlBase}AddContact.php`;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

    try {
        xhr.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                let res = JSON.parse(xhr.responseText);
                if (res.error && res.error.length > 0) {
                    document.getElementById("contactResult").innerHTML = "Error: " + res.error;
                } else {
                    document.getElementById("contactResult").innerHTML = "Contact added successfully!";
                }
            }
        };
        xhr.send(jsonPayload);
    } catch (err) {
        document.getElementById("contactResult").innerHTML = err.message;
    }
}


/* ================================
   Cookies: save / read / logout
   (Fixed: write 3 separate cookies)
================================== */
function showMsg(el, text, type = 'error') {
  if (!el) return;
  el.textContent = text || '';
  el.classList?.remove('msg--error','msg--success');
  el.classList?.add(type === 'success' ? 'msg--success' : 'msg--error');
}

function saveCookie() {
  const minutes = 20;
  const expires = new Date(Date.now() + minutes * 60 * 1000).toUTCString();

  document.cookie = `userId=${userId}; expires=${expires}; path=/`;
  document.cookie = `firstName=${encodeURIComponent(firstName)}; expires=${expires}; path=/`;
  document.cookie = `lastName=${encodeURIComponent(lastName)}; expires=${expires}; path=/`;
}

function readCookie() {
  userId = -1; firstName = ''; lastName = '';

  const jar = Object.fromEntries(
    document.cookie.split(';').map(c => {
      const [k, ...rest] = c.trim().split('=');
      return [k, rest.join('=')];
    })
  );

  if (jar.userId)    userId    = parseInt(jar.userId, 10);
  if (jar.firstName) firstName = decodeURIComponent(jar.firstName);
  if (jar.lastName)  lastName  = decodeURIComponent(jar.lastName);

  // Gate: if not logged in, go back to sign-in
  if (!userId || userId < 1) {
    window.location.href = 'index.html';
  }
}



function doLogout() {
  userId = 0; firstName = ''; lastName = '';
  document.cookie = 'userId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = 'firstName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.cookie = 'lastName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  window.location.href = 'index.html';
}

/* ================================
   Password eye toggle (login page)
================================== */
function setupPasswordToggle() {
  const loginPassword = document.getElementById('loginPassword');
  const passwordToggle = document.getElementById('passwordToggle');
  if (!loginPassword || !passwordToggle) return;

  passwordToggle.addEventListener('click', () => {
    const type = loginPassword.type === 'password' ? 'text' : 'password';
    loginPassword.type = type;
    passwordToggle.classList.toggle('toggle-active', type === 'text');

    if (typeof triggerGentleRipple === 'function') {
      triggerGentleRipple(passwordToggle);
    }
  });
}

/* ================================
   Modal: Add Contact (open/close)
================================== */
function initAddContactModal() {
  const openBtn = document.getElementById('openAdd');          // FAB +
  const modal   = document.getElementById('addContactModal');  // modal container
  const form    = document.getElementById('addContactForm');   // form inside

  if (!openBtn || !modal || !form) return; // not this page

  function openModal() {
    modal.classList.remove('is-hidden');
    document.body.classList.add('modal-open');
    modal.querySelector('input')?.focus();
  }
  function closeModal() {
    modal.classList.add('is-hidden');
    document.body.classList.remove('modal-open');
    openBtn?.focus();
  }

  // Open on + click
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal();
  });

  // Close on backdrop / X / Cancel
  modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) closeModal();
  });

  // Close on Esc
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('is-hidden')) closeModal();
  });

  // Submit -> call API, then close + reset
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (typeof addContact === 'function') addContact();
    closeModal();
    form.reset();
  });
}

function addContact() {
  const firstNameVal = document.getElementById("firstNameText")?.value.trim() || '';
  const lastNameVal  = document.getElementById("lastNameText")?.value.trim()  || '';
  const email        = document.getElementById("emailText")?.value.trim()     || ''; // UI only
  const phone        = document.getElementById("phoneText")?.value.trim()     || '';
  const resultEl     = document.getElementById("contactAddResult");

  if (resultEl) resultEl.textContent = "";

  const payload = JSON.stringify({
    firstName: firstNameVal,
    lastName : lastNameVal,
    phone,
    userId
  });

  const url = `${urlBase}AddContact.${extension}`;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      if (resultEl) resultEl.textContent = "Contact has been added";

      // Append to table immediately (uses email from UI field)
      const tbody = document.getElementById('contactsBody') || document.querySelector('.tbl-content tbody');
      if (tbody) {
        let data = {};
        try { data = JSON.parse(xhr.responseText || '{}'); } catch {}
        const tr = document.createElement('tr');
        tr.dataset.id = data.id ?? `tmp-${Date.now()}`;
        tr.innerHTML = `
          <td>${firstNameVal}</td>
          <td>${lastNameVal}</td>
          <td>${email}</td>
          <td>${phone}</td>
          <td>
            <div class="action-buttons">
              <button class="edit">Edit</button>
              <button class="delete">Delete</button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      }
    } else {
      if (resultEl) resultEl.textContent = `HTTP ${this.status}`;
    }
  };
  xhr.onerror = () => { if (resultEl) resultEl.textContent = "Network error"; };
  xhr.send(payload);
}



// open modal in Edit mode
function openEditMode(contact) {
  document.getElementById('contactId').value      = contact.id || '';
  document.getElementById('firstNameText').value  = contact.firstName || '';
  document.getElementById('lastNameText').value   = contact.lastName  || '';
  document.getElementById('emailText').value      = contact.email     || '';
  document.getElementById('phoneText').value      = contact.phone     || '';
  const title = document.getElementById('addTitle');
  if (title) title.textContent = 'Edit Contact';

  const modal = document.getElementById('addContactModal');
  modal.classList.remove('is-hidden');
  document.body.classList.add('modal-open');
  modal.querySelector('input')?.focus();
}
function resetModalTitleToAdd() {
  const title = document.getElementById('addTitle');
  if (title) title.textContent = 'Add Contact';
}

async function updateContactUIOnly() {
  const id    = document.getElementById('contactId').value;
  const first = document.getElementById('firstNameText').value.trim();
  const last  = document.getElementById('lastNameText').value.trim();
  const email = document.getElementById('emailText').value.trim();
  const phone = document.getElementById('phoneText').value.trim();
  const tbody = document.getElementById('contactsBody') || document.querySelector('.tbl-content tbody');
  const tr = tbody?.querySelector(`tr[data-id="${id}"]`);
  if (tr) {
    tr.children[0].textContent = first;
    tr.children[1].textContent = last;
    tr.children[2].textContent = email;
    tr.children[3].textContent = phone;
  }
}

async function deleteContactUIOnly(tr) {
  const parent = tr.parentNode;
  const next = tr.nextSibling;
  tr.remove();
}


document.addEventListener('DOMContentLoaded', () => {
  // password eye on login page
  setupPasswordToggle?.();

  // login form submit
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => { e.preventDefault(); doLogin(); return false; });
  }

  // modal wiring
  initAddContactModal?.();

  // logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => { e.preventDefault(); doLogout(); });
  }

  // table Edit/Delete
  const tbody = document.getElementById('contactsBody') || document.querySelector('.tbl-content tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('button.edit');
      if (editBtn) {
        const tr = editBtn.closest('tr');
        const contact = {
          id: tr?.dataset.id || '',
          firstName: tr?.children[0]?.textContent?.trim() || '',
          lastName : tr?.children[1]?.textContent?.trim() || '',
          email    : tr?.children[2]?.textContent?.trim() || '',
          phone    : tr?.children[3]?.textContent?.trim() || '',
        };
        openEditMode(contact);
        return;
      }
      const delBtn = e.target.closest('button.delete');
      if (delBtn) {
        const tr = delBtn.closest('tr');
        if (confirm('Delete this contact?')) deleteContactUIOnly(tr);
      }
    });
  }

  // route modal submit: Update if we have id, else Add
  const form  = document.getElementById('addContactForm');
  const modal = document.getElementById('addContactModal');
  if (form && modal) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('contactId')?.value;
      if (id) await updateContactUIOnly();
      else    addContact();

      modal.classList.add('is-hidden');
      document.body.classList.remove('modal-open');
      form.reset();
      document.getElementById('contactId').value = '';
      resetModalTitleToAdd();
    });

    // reset title when closing without save
    modal.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]')) {
        document.getElementById('contactId').value = '';
        resetModalTitleToAdd();
      }
    });
  }
});


/* ================================
   Search (IDs fixed to searchText)
================================== */
function searchColor() {
  const input = document.getElementById("searchText");
  const srch  = (input?.value || "").trim();

  const resultEl = document.getElementById("colorSearchResult");
  if (resultEl) resultEl.textContent = "";

  const payload = JSON.stringify({ search: srch, userId });
  const url     = `${urlBase}SearchColors.${extension}`;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status !== 200) {
      if (resultEl) resultEl.textContent = `HTTP ${this.status}`;
      return;
    }

    if (resultEl) resultEl.textContent = "Color(s) has been retrieved";

    let json = {};
    try { json = JSON.parse(xhr.responseText || '{}'); } catch {}

    const out = document.getElementById("searchOutput");
    if (out) {
      out.style.display = 'block';
      out.innerHTML = (json.results || []).join("<br>");
    }
  };
  xhr.send(payload);
}

/* ================================
   Page wiring after DOM is ready
================================== */
document.addEventListener('DOMContentLoaded', () => {
  // Login page wiring
  setupPasswordToggle();
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      doLogin();
      return false;
    });
  }

  // Dashboard wiring
  initAddContactModal();

  // Logout button (dashboard)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      doLogout();
    });
  }
});
