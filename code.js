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
  const loginEl = document.getElementById('loginName');
  const passwordEl = document.getElementById('loginPassword');
  const resultEl = document.getElementById('loginResult');

  const login = (loginEl?.value || '').trim();
  const password = (passwordEl?.value || '').trim();

  if (!login || !password) {
    return showMsg(resultEl, 'Please enter username and password.');
  }

  // Clear previous messages
  showMsg(resultEl, '', 'success');

  const payload = JSON.stringify({ login, password });
  const url = `${urlBase}Login.${extension}`;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
  xhr.timeout = 10000;
  xhr.withCredentials = true;

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status !== 200) {
      return showMsg(resultEl, `Login failed (HTTP ${this.status}).`);
    }

    let json = {};
    try {
      json = JSON.parse(xhr.responseText || '{}');
    } catch {
      return showMsg(resultEl, 'Invalid server response.');
    }

    // Show backend error if any
    if (json.error && json.error.length > 0) {
      return showMsg(resultEl, json.error);
    }

    // Invalid login check
    if (!json.id || json.id < 1) {
      return showMsg(resultEl, 'User/Password combination incorrect.');
    }

    // Successful login: store session info
    const userId = json.id;
    const firstName = json.firstName || '';
    const lastName = json.lastName || '';

    sessionStorage.setItem('userId', userId);
    sessionStorage.setItem('firstName', firstName);
    sessionStorage.setItem('lastName', lastName);

    // Optional: save cookie if your app uses it
    saveCookie();

    // Redirect to contacts page
    window.location.href = 'color.html';
  };

  xhr.onerror = () => showMsg(resultEl, 'Network error.');
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
  xhr.withCredentials = true;
  xhr.send(jsonPayload);
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

function readSession() {
  userId = parseInt(sessionStorage.getItem('userId'), 10) || -1;
  firstName = sessionStorage.getItem('firstName') || '';
  lastName  = sessionStorage.getItem('lastName') || '';

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
  let loginPassword = document.getElementById('loginPassword');
  if (!loginPassword) {
    loginPassword = document.getElementById('password');
  }
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
function openModal() {
  const modal = document.getElementById('addContactModal');
  if (!modal) return;
  modal.classList.remove('is-hidden');
  document.body.classList.add('modal-open');
  modal.querySelector('input')?.focus();
}

function closeModal() {
  const modal = document.getElementById('addContactModal');
  const openBtn = document.getElementById('openAdd');
  if (!modal) return;
  modal.classList.add('is-hidden');
  document.body.classList.remove('modal-open');
  openBtn?.focus();
}

/* ================================
   Modal: Add Contact (open/close)
================================== */
function initAddContactModal() {
  const openBtn = document.getElementById('openAdd');          
  const modal   = document.getElementById('addContactModal');  
  const form    = document.getElementById('addContactForm');   

  if (!openBtn || !modal || !form) return;

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

  // Submit -> add or update contact
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("contactId")?.value;
    if (id) {
      updateContact().then(() => {
        closeModal();
        form.reset();
      });
    } else {
      addContact().then(() => {
        closeModal();
        form.reset();
      });
    }
  });
}


async function addContact() {
  const firstNameVal = document.getElementById("firstNameText")?.value.trim() || '';
  const lastNameVal  = document.getElementById("lastNameText")?.value.trim()  || '';
  const email        = document.getElementById("emailText")?.value.trim()     || '';
  const phone        = document.getElementById("phoneText")?.value.trim()     || '';
  const resultEl     = document.getElementById("contactAddResult");

  if (resultEl) resultEl.textContent = "";

  const payload = JSON.stringify({
    firstName: firstNameVal,
    lastName : lastNameVal,
    email,
    phone
  });

  const url = `${urlBase}AddContact.${extension}`;
  fetch('http://poosdgroup1.xyz/AddContact.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include'
  });

  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status === 200) {
      let data = {};
      try { data = JSON.parse(xhr.responseText || '{}'); } catch {}

      if (data.error) {
        if (resultEl) resultEl.textContent = data.error;
        return;
      }

      if (resultEl) resultEl.textContent = "Contact has been added";

      // Append new row to table
      const tbody = document.getElementById('contactsBody');
      if (tbody) {
        const tr = document.createElement('tr');
        tr.dataset.id = data.id;
        tr.innerHTML = `
          <td>${data.firstName}</td>
          <td>${data.lastName}</td>
          <td>${data.email}</td>
          <td>${data.phone}</td>
          <td>
            <div class="action-buttons">
              <button class="edit">
                <!-- pencil icon -->
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
                    <path d="M21.41 6.34a1.25 1.25 0 0 0 0-1.77l-1.98-1.98a1.25 1.25 0 0 0-1.77 0L15.83 4.42l3.75 3.75 1.83-1.83z"/>
                  </svg>
                <span>Edit</span>
              </button>
              <button class="delete">
                <!-- trash icon -->
                  <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                    <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  <span>Delete</span>
              </button>
            </div>
          </td>`;
        tbody.appendChild(tr);
      }

      // Optionally clear inputs
      document.getElementById("firstNameText").value = "";
      document.getElementById("lastNameText").value = "";
      document.getElementById("emailText").value = "";
      document.getElementById("phoneText").value = "";
    } else {
      if (resultEl) resultEl.textContent = `HTTP ${this.status}`;
    }
  };
  xhr.onerror = () => { if (resultEl) resultEl.textContent = "Network error"; };
  xhr.withCredentials = true;
  xhr.send(payload);
}




// open modal in Edit mode
function openEditMode(contact) {
  // document.getElementById('contactId').value      = contact.id || '';
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

function updateContact() {
    const id        = document.getElementById("contactId").value;
    const firstName = document.getElementById("firstNameText").value.trim();
    const lastName  = document.getElementById("lastNameText").value.trim();
    const email     = document.getElementById("emailText").value.trim();
    const phone     = document.getElementById("phoneText").value.trim();

    const payload = { id, firstName, lastName, email, phone };

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "UpdateContact.php", true);
    xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
    xhr.withCredentials = true;
    xhr.onload = () => {
        if (xhr.status === 200) {
            const res = JSON.parse(xhr.responseText);
            if (res.success) {
                // Update table row
                const row = document.querySelector(`tr[data-id="${id}"]`);
                if (row) {
                    row.children[0].textContent = firstName;
                    row.children[1].textContent = lastName;
                    row.children[2].textContent = email;
                    row.children[3].textContent = phone;
                }
                closeModal();
            } else {
                alert("Error: " + res.error);
            }
        } else {
            alert("HTTP error: " + xhr.status);
        }
    };
    xhr.send(JSON.stringify(payload));
}


// Run on color.html only
document.addEventListener("DOMContentLoaded", () => {
    const tbody = document.getElementById("contactsBody");
    if (!tbody) return; // stop if this page doesn't have the table

    // Event delegation for delete buttons
    tbody.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete")) {
            const row = e.target.closest("tr");
            const contactId = row.dataset.id;

            if (!contactId) return;
            if (!confirm("Are you sure you want to delete this contact?")) return;

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "DeleteContact.php", true);
            xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
            xhr.withCredentials = true;
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const res = JSON.parse(xhr.responseText);
                    if (res.success) row.remove();
                    else alert("Error: " + res.error);
                } else {
                    alert("HTTP error: " + xhr.status);
                }
            };
            xhr.send(JSON.stringify({ contactId }));
        }
      if (e.target.classList.contains("edit")) {
        const row = e.target.closest("tr");
        const contactId = row.dataset.id;

        // Fill modal fields
        document.getElementById("contactId").value = contactId;
        document.getElementById("firstNameText").value = row.children[0].textContent;
        document.getElementById("lastNameText").value  = row.children[1].textContent;
        document.getElementById("emailText").value     = row.children[2].textContent;
        document.getElementById("phoneText").value     = row.children[3].textContent;

        openModal(); // your function to show modal
      }

      document.getElementById("addContactForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("contactId").value;
      if (id) updateContact();
      else addContact();

      document.getElementById("addContactForm").reset();
      closeModal();
    });
});
});

document.addEventListener('DOMContentLoaded', () => {
  // password eye on login page
  setupPasswordToggle();

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

  // route modal submit: Update if we have id, else Add
  const form  = document.getElementById('addContactForm');
  const modal = document.getElementById('addContactModal');
  if (form && modal) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('contactId')?.value;
      if (id) await updateContact();
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

async function loadContacts() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "GetContacts.php", true);
    xhr.withCredentials = true; // important for session
    xhr.onload = () => {
        if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            const tbody = document.getElementById("contactsBody");
            if (!tbody) return;
            tbody.innerHTML = ""; // clear table
            data.forEach(contact => {
                const tr = document.createElement("tr");
                tr.dataset.id = contact.ID;
                tr.innerHTML = `
                    <td>${contact.FirstName}</td>
                    <td>${contact.LastName}</td>
                    <td>${contact.Email}</td>
                    <td>${contact.Phone}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit">
                              <!-- pencil icon -->
                                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
                                  <path d="M21.41 6.34a1.25 1.25 0 0 0 0-1.77l-1.98-1.98a1.25 1.25 0 0 0-1.77 0L15.83 4.42l3.75 3.75 1.83-1.83z"/>
                                </svg>
                                <span>Edit</span>
                            </button>
                            <button class="delete">
                              <!-- trash icon -->
                                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                                  <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                                </svg>
                                <span>Delete</span>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            console.error("Failed to load contacts:", xhr.status);
        }
    };
    xhr.send();
}

window.addEventListener("DOMContentLoaded", () => {
    loadContacts();
});


/* ================================
   Search (IDs fixed to search)
================================== */
function searchContacts() {
  const searchInput = document.getElementById("search");

  if (searchInput) {
      searchInput.addEventListener("input", () => {
          const filter = searchInput.value.toLowerCase();
          const tbody = document.getElementById("contactsBody");
          if (!tbody) return;

          Array.from(tbody.rows).forEach(row => {
              const firstName = row.cells[0].textContent.toLowerCase();
              const lastName  = row.cells[1].textContent.toLowerCase();
              const email     = row.cells[2].textContent.toLowerCase();
              const phone     = row.cells[3].textContent.toLowerCase();

              if (
                  firstName.includes(filter) ||
                  lastName.includes(filter) ||
                  email.includes(filter) ||
                  phone.includes(filter)
              ) {
                  row.style.display = ""; // show
              } else {
                  row.style.display = "none"; // hide
              }
          });
      });
  }

}

/* ================================
   Page wiring after DOM is ready
================================== */
document.addEventListener('DOMContentLoaded', () => {
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
