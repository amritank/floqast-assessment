const form = document.getElementById("add-user-form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const msgEl = document.getElementById("status-msg");
  try {
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const accountType = document.getElementById("account-type").value;
    //TODO api call
    msgEl.textContent = "Added user with user id: user-1";
    form.reset();
  } catch (err) {
    msgEl.textContent = err.message;
  }
});
