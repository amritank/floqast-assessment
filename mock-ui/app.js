const form = document.getElementById("add-user-form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const msgEl = document.getElementById("status-msg");
  // a very basic email format check. TBD - can be improved
  const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const supportedName = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

  try {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const accountType = document.getElementById("account-type").value;

    if (!name || !email) {
      msgEl.textContent = "All fields are required";
      return;
    }

    if (!supportedName.test(name)) {
      msgEl.textContent = "Enter a valid name";
      return;
    }
    if (!emailFormat.test(email)) {
      msgEl.textContent = "Enter a valid email address";
      return;
    }
    //TODO api call
    msgEl.textContent = "Added user with user id: user-1";
    form.reset();
  } catch (err) {
    msgEl.textContent = err.message;
  }
});
