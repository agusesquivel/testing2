// types/express.d.ts
import { JwtPayload } from "jsonwebtoken";
import { AuthPayload } from "../../middlewares/auth";
import { File } from "multer";

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload | undefined; // O define el tipo adecuado que esperas en el token decodificado
      files?: {
        profilePicture?: File[]; // Cambiado a File[] para múltiples archivos
        coverPicture?: File[]; // Cambiado a File[] para múltiples archivos
      };
    }
  }
}

// Si necesitas un tipo específico para tu aplicación
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthPayload; // Asegúrate de que AuthPayload esté definido correctamente
  }
}