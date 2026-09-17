import express from "express";
import { resetStore } from "../data/store.js";

const router = express.Router();

router.post("/reset", (req, res) => {
  resetStore();
  return res.status(204).end();
});
export default router;
