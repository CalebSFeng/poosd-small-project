const urlBase = 'http://poosdgroup1.xyz/';
const extension = 'php';

let userId = 0;
let firstName = '';
let lastName = '';

function doLogin() {
  userId = 0; firstName = ''; lastName = '';

  const login = document.getElementById('loginName').value.trim();
  const password = document.getElementById('loginPassword').value;
  const resultEl = document.getElementById('loginResult');

  if (!login || !password) {
    if (resultEl) resultEl.textContent = 'Please enter username and password.';
    return;
  }
  if (resultEl) resultEl.textContent = '';

  const jsonPayload = JSON.stringify({ login, password });
  const url = `${urlBase}Login.${extension}`;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
  xhr.timeout = 10000; // 10s

  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;

    if (this.status !== 200) {
      if (resultEl) resultEl.textContent = `HTTP ${this.status}`;
      return;
    }
    try {
      const jsonObject = JSON.parse(xhr.responseText);
      userId = jsonObject.id || 0;

      if (userId < 1) {
        if (resultEl) resultEl.textContent = 'User/Password combination incorrect';
        return;
      }
      firstName = jsonObject.firstName || '';
      lastName  = jsonObject.lastName  || '';

      saveCookie();
      window.location.href = 'color.html';
    } catch (e) {
      if (resultEl) resultEl.textContent = 'Invalid server response';
      console.error('Parse error:', e, xhr.responseText);
    }
  };

  xhr.onerror = () => { if (resultEl) resultEl.textContent = 'Network error.'; };
  xhr.ontimeout = () => { if (resultEl) resultEl.textContent = 'Request timed out.'; };

  xhr.send(jsonPayload);
}

function doRegister() {
	
	let tmp = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    login: document.getElementById("login").value,
    password: document.getElementById("password").value
  };

  let jsonPayload = JSON.stringify(tmp);

  let url = urlBase + 'Register.php';

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      let response = JSON.parse(xhr.responseText);
     if (response.success) {
	     window.location.href = "index.html";
     }
    }
  };
  xhr.send(jsonPayload);
}

// ---- Password eye ----
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

// ---- Wire up after DOM ready ----
document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();

  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log('Submitting via AJAX');
      doLogin();
      return false;
    });
  } else {
    console.warn('loginForm not found');
  }
});

// ---- Cookie helpers ----
function saveCookie() {
  const minutes = 20;
  const date = new Date();
  date.setTime(date.getTime() + minutes * 60 * 1000);
  document.cookie =
    `firstName=${firstName},lastName=${lastName},userId=${userId};expires=${date.toGMTString()};path=/`;
}

function readCookie() {
  userId = -1;
  const data = document.cookie;
  const splits = data.split(',');
  for (let i = 0; i < splits.length; i++) {
    const [k, v] = splits[i].trim().split('=');
    if (k === 'firstName') firstName = v;
    else if (k === 'lastName') lastName = v;
    else if (k === 'userId') userId = parseInt(v.trim(), 10);
  }

  if (userId < 0) {
    window.location.href = 'index.html';
  }
}

function doLogout() {
  userId = 0;
  firstName = '';
  lastName = '';
  document.cookie = 'firstName=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  window.location.href = 'index.html';
}

function addContact() {
  const firstNameContact = document.getElementById("firstNameText").value.trim();
  const lastNameContact  = document.getElementById("lastNameText").value.trim();
  const email            = document.getElementById("emailText").value.trim();
  const phone            = document.getElementById("phoneText").value.trim();
  const date             = new Date();

  document.getElementById("contactAddResult").textContent = "";

  const jsonPayload = JSON.stringify({
    firstNameContact, lastNameContact, email, phone, date, userId
  });

  const url = `${urlBase}AddContact.${extension}`;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        document.getElementById("contactAddResult").textContent = "Contact has been added";
      } else {
        document.getElementById("contactAddResult").textContent = `HTTP ${this.status}`;
      }
    }
  };
  xhr.send(jsonPayload);
}


function searchContact()
{
	let srch = document.getElementById("searchText").value.trim();
	document.getElementById("contactSearchResult").textContent = "";
	document.getElementById("contactList").innerHTML = "";
	
	const jsonPayload = JSON.stringify({ search: srch, userId: userId });
	
	let url = urlBase + '/SearchContact.' + extension;
	
	let xhr = new XMLHttpRequest();
	xhr.open("POST", url, true);
	xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");
	try
	{
		xhr.onreadystatechange = function() 
		{
			if (this.readyState == 4 && this.status == 200) 
			{
				document.getElementById("contactSearchResult").innerHTML = "Contact(s) retrieved";
				let jsonObject = JSON.parse( xhr.responseText );
				let contactList = "";
				
				if (jsonObject.results && jsonObject.results.length > 0) {
          			for (let i = 0; i < jsonObject.results.length; i++) {
            			let contact = jsonObject.results[i];

            			contactList += `
              			  <div class="contact-item">
			                <strong>${contact.firstNameContact} ${contact.lastNameContact}</strong><br>
			                Email: ${contact.email}<br>
			                Phone: ${contact.phone}<br>
			                Added: ${contact.date}<br>
				   			<button onclick="deleteContact('${escapeHtml(contact.firstNameContact)}', '${escapeHtml(contact.lastNameContact)}', '${escapeHtml(contact.email || '')}', '${escapeHtml(contact.phone || '')}')" class="delete-btn" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">Delete Contact</button>
		  					<button onclick="UpdateContact('${escapeHtml(contact.firstNameContact)}', '${escapeHtml(contact.lastNameContact)}', '${escapeHtml(contact.email || '')}', '${escapeHtml(contact.phone || '')}')" class="update-btn" style="background-color: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">Update Contact</button>
			              </div>
			              <hr>
            			;
          			}
        		} else {
          		  contactList = "No contacts found.";
        		}
				
				document.getElementById("contactList").innerHTML = contactList;
			}
		};
		xhr.send(jsonPayload);
	}
	catch(err)
	{
		document.getElementById("contactSearchResult").textContent = err.message;
	}
	
}


function deleteContact(firstName, lastName, email, phone){
 const jsonPayload = JSON.stringify({ 
    firstNameContact: firstName, 
    lastNameContact: lastName, 
    email: email || "", 
    phone: phone || "", 
    userId: userId 
  });
  const url = urlBase + '/DeleteContact.' + extension;

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  try
  {
  	xhr.onreadystatechange = function() {
   		if (this.readyState == 4 && this.status == 200) {
	 		document.getElementById("contactSearchResult").textContent = "Contact deleted";
      		searchContact(); // refresh list after deletion
		}else {
          document.getElementById("contactSearchResult").textContent = `Error: HTTP ${this.status} - Failed to delete contact`;
        }
  	};
  	xhr.send(jsonPayload);
  }
  catch(err){
  	document.getElementById("contactSearchResult").textContent = `Error: ${err.message}`;
  }
}

function UpdateContact(ogFirstName, ogLastName, ogEmail, ogPhone){
  const newFirstName = prompt("Enter new first name:", originalFirstName);
  if (newFirstName === null) return; // User cancelled
  
  const newLastName = prompt("Enter new last name:", originalLastName);
  if (newLastName === null) return; // User cancelled
  
  const newEmail = prompt("Enter new email:", originalEmail || "");
  if (newEmail === null) return; // User cancelled
  
  const newPhone = prompt("Enter new phone:", originalPhone || "");
  if (newPhone === null) return; // User cancelled
  
  const newDate             = new Date();
  
 const jsonPayload = JSON.stringify({ 
 	ogFirstNameContact: ogFirstNameContact, 
    ogLastNameContact: ogLastNameContact, 
    ogEmail: ogEmail || "", 
    ogPhone: ogPhone || "", 
   
    firstNameContact: newFirstName.trim(), 
    lastNameContact: newLastName.trim(), 
    email: newEmail.trim() "", 
    phone: newPhone.trim() "", 
    userId: userId 
  });
  
  const url = urlBase + '/UpdateContact.' + extension;

  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-type", "application/json; charset=UTF-8");

  try
  {
  	xhr.onreadystatechange = function() {
   		if (this.readyState == 4 && this.status == 200) {
	 		document.getElementById("contactSearchResult").textContent = "Contact updated";
      		searchContact(); // refresh list after deletion
		}else {
          document.getElementById("contactSearchResult").textContent = `Error: HTTP ${this.status} - Failed to update contact`;
        }
  	};
  	xhr.send(jsonPayload);
  }
  catch(err){
  	document.getElementById("contactSearchResult").textContent = `Error: ${err.message}`;
  }
}






