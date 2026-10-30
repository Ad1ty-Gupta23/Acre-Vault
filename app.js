import express, { json, urlencoded } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cron from "node-cron";
import authRoutes from './backend/routes/authroutes.js';
import inheritanceRoutes from './backend/routes/inheritanceroutes.js';


const app = express();
dotenv.config();

const PORT = process.env.PORT || 5001;
const databaseUrl = process.env.MONGODB_URL;
const CLIENT_URLS = (process.env.CLIENT_URL || "http://localhost:5173").split(",");

app.use(cors({
  origin: CLIENT_URLS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(json());
app.use(urlencoded({ extended: true }));



mongoose
  .connect(databaseUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: "landrecords"  
  })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  });


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use('/api/auth', authRoutes);
app.use('/api/inheritance', inheritanceRoutes);

export default app;
