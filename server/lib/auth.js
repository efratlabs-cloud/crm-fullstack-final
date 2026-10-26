import bcrypt from "bcrypt";
import connectDB from "../config/db";
import { getSessionUserId } from "./session";
import User, { userSchema } from "../models/User";

export const AFTER_AUTH_REDIRECT = "/";

const SALT_ROUNDS = 12;

export async function createUserWithPassword({ name, email, password }) {
  await connectDB();
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User with that email already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const user = await User.create({
      name,
      email,
      passwordHash,
    });
    return user;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function findOrCreateGoogleUser({ name, email, googleId }) {
  await connectDB();
  const user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
    return user;
  }
  await User.create({
    name,
    email,
    googleId,
  });
}

export async function getSessionUser() {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }

  await connectDB();
  const user = await User.findById(userId).select("name email");

  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
