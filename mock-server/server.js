import express from "express";
import userRoutes from "./routes/users.js";
import transactionRoutes from "./routes/transactions.js";
import resetRoute from "./routes/test-support.js";
import { createServerLogger } from "./middleware/logger.js";

const PORT = process.env.PORT ?? 3001;
const app = express();
app.use(createServerLogger());
app.use(express.json());
app.use(express.static("mock-ui"));
app.use("/api/users", userRoutes);
app.use("/api/transactions/", transactionRoutes);
app.use("/test", resetRoute);

app.listen(PORT, () => {
  console.log(`App is listening on port: ${PORT}`);
});
