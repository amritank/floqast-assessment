import express from "express";
import {
  userIdByEmail,
  usersById,
  getNextUserId,
  transactionsByUserId,
} from "../data/store.js";

const router = express.Router();
const emailFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const supportedName = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/;

router.post("/", async (req, res) => {
  let { name, email, accountType } = req.body;
  if (
    !name.trim() ||
    !email.trim() ||
    !accountType.trim() ||
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof accountType !== "string"
  ) {
    return res.status(400).json({
      error: "Invalid request: name, email and accountType are required!",
    });
  }
  name = name.trim();
  email = email.trim().toLowerCase();

  if (!emailFormat.test(email)) {
    return res.status(400).json({
      error: "Invalid email format",
    });
  }

  if (!supportedName.test(name)) {
    return res.status(400).json({
      error: "Invalid name format",
    });
  }

  if (!["basic", "premium"].includes(accountType)) {
    return res
      .status(400)
      .json({ error: "Unsupported account type specified" });
  }

  if (userIdByEmail.has(email)) {
    return res.status(409).json({ error: "Duplicate user record found" });
  }

  const userId = getNextUserId();
  const newUser = {
    id: userId,
    name,
    email,
    accountType,
  };

  usersById.set(userId, newUser);
  userIdByEmail.set(email, userId);
  transactionsByUserId.set(userId, []);
  return res.status(201).json(newUser);
});
router.get("/:id", async (req, res) => {
  const id = req.params.id;
  if (usersById.has(id)) {
    return res.status(200).json(usersById.get(id));
  } else {
    return res.status(400).json({ error: "Failed to find user" });
  }
});

export default router;
