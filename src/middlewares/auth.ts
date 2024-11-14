import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../constants";

interface AuthPayload extends JwtPayload {
  id: string; // Agrega el campo `id` que esperas en el token
}

// Añadir el middleware con el tipo AuthPayload
export const validateJwt = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "No autorizado" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload; // Type assertion
    req.user = decoded; // Asigna el payload decodificado al objeto `req`
    next();
  } catch (err) {
    res.status(401).json({ message: "Token inválido" });
  }
};