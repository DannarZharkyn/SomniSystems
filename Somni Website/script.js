const modal = document.querySelector('#waitlist-modal');
const form = document.querySelector('#waitlist-form');
const formView = document.querySelector('#modal-form-view');
const successView = document.querySelector('#modal-success-view');
const firstNameInput = document.querySelector('#first-name');
const emailInput = document.querySelector('#email');
const firstNameError = document.querySelector('#first-name-error');
const emailError = document.querySelector('#email-error');
const submitError = document.querySelector('#submit-error');
const submitButton = form.querySelector('button[type="submit"]');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resetModal() {
  form.reset();
  formView.hidden = false;
  successView.hidden = true;
  firstNameError.textContent = '';
  emailError.textContent = '';
  submitError.textContent = '';
  firstNameInput.removeAttribute('aria-invalid');
  emailInput.removeAttribute('aria-invalid');
  submitButton.disabled = false;
  submitButton.textContent = 'Join the waitlist';
}

function openModal() {
  resetModal();
  modal.showModal();
  document.body.classList.add('modal-open');
  window.setTimeout(() => firstNameInput.focus(), 50);
}

function closeModal() {
  modal.close();
  document.body.classList.remove('modal-open');
}

document.querySelectorAll('[data-open-waitlist]').forEach((button) => {
  button.addEventListener('click', openModal);
});

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', closeModal);
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});

modal.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
});

function validate() {
  const firstName = firstNameInput.value.trim();
  const email = emailInput.value.trim();
  let valid = true;

  firstNameError.textContent = '';
  emailError.textContent = '';
  firstNameInput.removeAttribute('aria-invalid');
  emailInput.removeAttribute('aria-invalid');

  if (!firstName) {
    firstNameError.textContent = 'Please enter your first name.';
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

  return valid;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  submitError.textContent = '';

  if (!validate()) return;

  submitButton.disabled = true;
  submitButton.textContent = 'Joining…';

  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: firstNameInput.value.trim(),
        email: emailInput.value.trim(),
        company: form.elements.company.value,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'We couldn’t add you right now. Please try again.');

    formView.hidden = true;
    successView.hidden = false;
    successView.querySelector('button').focus();
  } catch (error) {
    submitError.textContent = error.message;
    submitButton.disabled = false;
    submitButton.textContent = 'Join the waitlist';
  }
});

document.querySelector('#current-year').textContent = new Date().getFullYear();
