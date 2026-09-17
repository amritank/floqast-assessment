import express from "express";
import { usersById, transactionsByUserId } from "../data/store.js";
import { randomUUID } from "node:crypto";

import {
  checkAuth,
  requireCustomerRole,
  requirePermissions,
} from "../middleware/auth.js";

const router = express.Router();

router.post(
  "/",
  checkAuth,
  requireCustomerRole("customer"),
  async (req, res) => {
    let { amount, transactionType, recipientId } = req.body;
    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      typeof transactionType != "string" ||
      typeof recipientId != "string" ||
      !amount ||
      !transactionType.trim() ||
      !recipientId.trim()
    ) {
      return res.status(400).json({ error: "Invalid request." });
    }

    transactionType = transactionType.trim();
    recipientId = recipientId.trim();

    // check for valid recipient
    if (!usersById.has(recipientId)) {
      return res.status(404).json({ error: "Recipient does not exist" });
    }

    if (recipientId === req.user.id) {
      return res
        .status(400)
        .json({ error: "Incorrect recipient. Cannot transfer to self." });
    }

    if (!["transfer"].includes(transactionType)) {
      return res
        .status(400)
        .json({ error: "Invalid transaction type specified." });
    }

    const amountCents = Math.round(amount * 100);
    const recoveredAmount = amountCents / 100;

    if (Math.abs(amount - recoveredAmount) > 0.000000001) {
      return res.status(400).json({
        error: "Amount can have at most two decimal places",
      });
    }

    // check if sender has enough funds
    const sender = usersById.get(req.user.id);
    const reciever = usersById.get(recipientId);
    const curBal = sender.balanceCents;
    if (curBal < amountCents) {
      return res.status(422).json({
        error: "Insufficient funds available",
      });
    }
    const newUserBal = curBal - amountCents;
    const newRecieverBal = reciever.balanceCents + amountCents;

    // update the amounts
    reciever.balanceCents = newRecieverBal;
    sender.balanceCents = newUserBal;

    const transactionRecord = {
      id: randomUUID(),
      senderId: req.user.id,
      recipientId: recipientId,
      amountCents: amountCents,
      transactionType: transactionType,
      createdAt: new Date().toISOString(),
    };

    transactionsByUserId.get(req.user.id).push(transactionRecord);
    transactionsByUserId.get(recipientId).push(transactionRecord);

    return res.status(201).json(transactionRecord);
  },
);

router.get(
  "/:userId",
  checkAuth,
  requirePermissions("customer", "userId"),
  async (req, res) => {
    const id = req.params.userId;

    if (usersById.has(id)) {
      return res.status(200).json(transactionsByUserId.get(id));
    } else {
      return res.status(404).json({ error: "Failed to find user" });
    }
  },
);

export default router;
