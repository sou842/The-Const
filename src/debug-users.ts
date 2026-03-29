import connectDB from "./lib/db";
import { User } from "./models/User";

async function run() {
  await connectDB();
  const users = await User.find({}, "name email role");
  console.log("Users in DB:", JSON.stringify(users, null, 2));
  process.exit(0);
}

run();
