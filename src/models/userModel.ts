import mongoose, { Schema, Document } from "mongoose";

interface IUser extends Document {
  email: string;
  name: string;
  surname: string;
  username: string;
  password: string;
  gender: "male" | "female" | "other";
  bio?: string;              // Nueva propiedad opcional
  profilePicture?: string;    // Imagen de perfil
  coverPicture?: string;      // Nueva propiedad opcional
  followers: mongoose.Schema.Types.ObjectId[]; // Array de seguidores (referencia a otros usuarios)
  following: mongoose.Schema.Types.ObjectId[]; // Array de usuarios que sigue
  favorites: mongoose.Schema.Types.ObjectId[];
}

const userSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  gender: { type: String, enum: ["male", "female", "other"], required: true },
  bio: { type: String },
  profilePicture: { type: String },
  coverPicture: { type: String },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User " }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }] 
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
