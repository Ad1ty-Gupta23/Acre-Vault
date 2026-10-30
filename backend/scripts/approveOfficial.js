// Approve a government official from the command line. Needed to bootstrap
// the first official, since approvals otherwise come from existing officials.
// Usage: npm run approve-official -- official@example.gov
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/usermodel.js";

dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("Usage: npm run approve-official -- <email>");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URL, { dbName: "landrecords" });

const user = await User.findOne({ email });
if (!user) {
  console.error(`No user found with email ${email}`);
} else if (user.role !== "government") {
  console.error(`${email} is a ${user.role} account, not a government official`);
} else {
  user.isVerified = true;
  await user.save();
  console.log(`Approved government official ${user.name} <${email}>`);
}

await mongoose.disconnect();
