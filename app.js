import express, { json, urlencoded } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cron from "node-cron";
import authRoutes from './backend/routes/authroutes.js';


const app = express();
dotenv.config();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 5001;
const databaseUrl = process.env.MONGODB_URL;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173/" || "http://localhost:5000/";



app.use(cors()); // First CORS configuration
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

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

export default app;
