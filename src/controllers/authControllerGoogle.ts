import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import UserModel from "../models/userModel";
import jwt from "jsonwebtoken";
import { JWT_SECRET, GOOGLE_CLIENT_ID } from "../constants";

// Creamos el cliente de OAuth2 usando el CLIENT_ID
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.body; // 'token' es el token de ID enviado desde el frontend
  // Este token de ID es proporcionado por Google después de que el usuario ha iniciado sesión y ha concedido los permisos necesarios.
  try {
    // Verifica el token de Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID, // Audience es el CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ error: "Token inválido" });
      return;
    }

    const { email, name } = payload;

    // Verificar si el usuario ya existe en la base de datos
    let user = await UserModel.findOne({ email });
    if (!user) {
      // Crear un nuevo usuario si no existe
      user = new UserModel({
        email,
        name,
        username: email,
      });
      await user.save();
    }

    // Crear el token JWT para el usuario
    const jwtToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token: jwtToken });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
