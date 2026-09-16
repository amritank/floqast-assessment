import { mockSession } from "./mock-session.js";

const transactionForm = document.getElementById("create-transactions");

transactionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const msgEl = document.getElementById("status-msg");
  try {
    const amtText = document.getElementById("amount").value.trim();
    if (!amtText) {
      msgEl.textContent = "Amount is a required field";
      return;
    }
    const amount = Number(amtText);
    const type = document.getElementById("type").value.trim();
    const recipientText = document.getElementById("recipient").value;
    if (!recipientText) {
      msgEl.textContent = "Recipient is a required field";
      return;
    }
    const recipient = Number(recipientText);

    if (!Number.isFinite(amount) || amount <= 0) {
      msgEl.textContent = "Invalid amount specified!";
      return;
    }

    if (!Number.isFinite(recipient) || recipient <= 0) {
      msgEl.textContent = "Invalid recipient id specified!";
      return;
    }

    if (recipient === Number(mockSession.user.id)) {
      msgEl.textContent = "Invalid recipient. Cannot transfer to self.";
      return;
    }
    // TODO - call POST transactions backend
    // TODO - needs recipient users name
    msgEl.textContent = `Sucessfully transferred ${amount} to user: Bob`;
    transactionForm.reset();
  } catch (err) {
    msgEl.textContent = err.message;
  }
});
