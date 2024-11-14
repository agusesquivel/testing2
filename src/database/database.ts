import mongoose from "mongoose";
import { MONGODB_URI } from "../constants";

export async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Conectado a la base de datos");
  } catch (error) {
    console.error("Error al conectarse a la base de datos:", error);
  }
}
