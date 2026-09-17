import { mockSession } from "./mock-session.js";
import { createTransactions } from "./api.js";

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
    const recipient = document.getElementById("recipient").value.trim();
    if (!recipient) {
      msgEl.textContent = "Recipient is a required field";
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      msgEl.textContent = "Invalid amount specified!";
      return;
    }

    const recipientNumber = Number(recipient);
    if (!Number.isFinite(recipientNumber) || recipientNumber <= 0) {
      msgEl.textContent = "Invalid recipient id specified!";
      return;
    }

    if (recipient === mockSession.user.id) {
      msgEl.textContent = "Invalid recipient. Cannot transfer to self.";
      return;
    }

    const res = await createTransactions(
      amount,
      type,
      recipient,
      mockSession.accessToken,
    );

    msgEl.textContent = `Transfer of amount: ${res.amountCents} completed successfully.`;
    transactionForm.reset();
  } catch (err) {
    msgEl.textContent = err.message;
  }
});
