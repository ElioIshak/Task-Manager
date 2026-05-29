import { Router } from "express";
import authRoutes from "./routes/auth";
import tasksRoutes from "./routes/tasks";
import usersRoutes from "./routes/users";
import { setUserJWT } from "./middleware/auth.middleware";

const api = Router();

api.use("/auth", authRoutes);
api.use(setUserJWT);
api.use("/users", usersRoutes);
api.use("/tasks", tasksRoutes);


export default api;
