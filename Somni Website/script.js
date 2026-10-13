const modal = document.querySelector('#waitlist-modal');
const form = document.querySelector('#waitlist-form');
const formView = document.querySelector('#modal-form-view');
const successView = document.querySelector('#modal-success-view');
const firstNameInput = document.querySelector('#first-name');
const emailInput = document.querySelector('#email');
const firstNameError = document.querySelector('#first-name-error');
const emailError = document.querySelector('#email-error');
const sleepNeedsField = document.querySelector('#sleep-needs-field');
const sleepNeedsInputs = [...form.querySelectorAll('input[name="sleepNeeds"]')];
const sleepNeedsError = document.querySelector('#sleep-needs-error');
const submitError = document.querySelector('#submit-error');
const submitButton = form.querySelector('button[type="submit"]');
const waitlistButton = document.querySelector('#waitlist-fab');

const waitlistDismissedKey = 'somniWaitlistDismissed';
const waitlistJoinedKey = 'somniWaitlistJoined';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resetModal() {
  form.reset();
  formView.hidden = false;
  successView.hidden = true;
  firstNameError.textContent = '';
  emailError.textContent = '';
  sleepNeedsError.textContent = '';
  submitError.textContent = '';
  firstNameInput.removeAttribute('aria-invalid');
  emailInput.removeAttribute('aria-invalid');
  sleepNeedsField.removeAttribute('aria-invalid');
  submitButton.disabled = false;
  submitButton.textContent = 'Join waitlist';
}

function readStorage(storageName, key) {
  try {
    return window[storageName].getItem(key) === 'true';
  } catch {
    return false;
  }
}

function writeStorage(storageName, key) {
  try {
    window[storageName].setItem(key, 'true');
  } catch {
    // The experience still works if a browser blocks storage.
  }
}

function hasJoinedWaitlist() {
  return readStorage('localStorage', waitlistJoinedKey);
}

function hasDismissedThisSession() {
  return readStorage('sessionStorage', waitlistDismissedKey);
}

function updateWaitlistButton() {
  waitlistButton.hidden = hasJoinedWaitlist() || !hasDismissedThisSession() || modal.open;
}

function openModal() {
  if (modal.open) return;
  resetModal();
  modal.showModal();
  document.body.classList.add('modal-open');
  updateWaitlistButton();
  window.setTimeout(() => firstNameInput.focus(), 50);
}

function closeModal() {
  if (modal.open) modal.close();
  document.body.classList.remove('modal-open');
  updateWaitlistButton();
}

function dismissWaitlist() {
  // A dismissal lasts for this browser session, then exposes the floating reminder.
  writeStorage('sessionStorage', waitlistDismissedKey);
  closeModal();
}

document.querySelectorAll('[data-open-waitlist]').forEach((button) => {
  button.addEventListener('click', openModal);
});

document.querySelectorAll('[data-dismiss-waitlist]').forEach((button) => {
  button.addEventListener('click', dismissWaitlist);
});

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', closeModal);
});

sleepNeedsInputs.forEach((input) => {
  input.addEventListener('change', () => {
    if (sleepNeedsInputs.some((option) => option.checked)) {
      sleepNeedsError.textContent = '';
      sleepNeedsField.removeAttribute('aria-invalid');
    }
  });
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) dismissWaitlist();
});

modal.addEventListener('cancel', (event) => {
  event.preventDefault();
  dismissWaitlist();
});

modal.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  updateWaitlistButton();
});

function validate() {
  const firstName = firstNameInput.value.trim();
  const email = emailInput.value.trim();
  let valid = true;

  firstNameError.textContent = '';
  emailError.textContent = '';
  sleepNeedsError.textContent = '';
  firstNameInput.removeAttribute('aria-invalid');
  emailInput.removeAttribute('aria-invalid');
  sleepNeedsField.removeAttribute('aria-invalid');

  if (!firstName) {
    firstNameError.textContent = 'Please enter your name.';
    firstNameInput.setAttribute('aria-invalid', 'true');
    valid = false;
  }

  if (!email) {
    emailError.textContent = 'Please enter your email address.';
    emailInput.setAttribute('aria-invalid', 'true');
    valid = false;
  } else if (!emailPattern.test(email)) {
    emailError.textContent = 'Please enter a valid email address.';
    emailInput.setAttribute('aria-invalid', 'true');
    valid = false;
  }

  if (!sleepNeedsInputs.some((input) => input.checked)) {
    sleepNeedsError.textContent = 'Please select at least one option.';
    sleepNeedsField.setAttribute('aria-invalid', 'true');
    valid = false;
  }

  return valid;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitError.textContent = '';

  if (!validate()) return;

  submitButton.disabled = true;
    submitButton.textContent = 'Joining waitlist…';

  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstNameInput.value.trim(),
        email: emailInput.value.trim(),
        sleepNeeds: sleepNeedsInputs.filter((input) => input.checked).map((input) => input.value),
        company: form.elements.company.value,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'We couldn’t add you right now. Please try again.');

    // A confirmed signup persists across visits so the invitation does not auto-open again.
    writeStorage('localStorage', waitlistJoinedKey);
    updateWaitlistButton();
    formView.hidden = true;
    successView.hidden = false;
    successView.querySelector('button').focus();
  } catch (error) {
    submitError.textContent = error.message;
    submitButton.disabled = false;
    submitButton.textContent = 'Join waitlist';
  }
});

document.querySelector('#current-year').textContent = new Date().getFullYear();

// Show the invitation after every fresh page load, including after a refresh.
window.setTimeout(() => {
  if (!modal.open) openModal();
}, 250);
