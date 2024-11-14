import dotenv from "dotenv";
import cloudinary from 'cloudinary';
dotenv.config();

export const PORT = process.env.PORT || 3000;
export const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://agustinesquivvel:9WpcnizVKicMMUrL@myapp.6tv31.mongodb.net/";
export const JWT_SECRET = process.env.JWT_SECRET || "this_is_my_secret";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "208172994015-qa2omqpdao2ucm0h5906h3vakd4ioitg.apps.googleusercontent.com";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "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";
// Autentiacación para usar con Nodemailer:
export const EMAIL_USER= process.env.EMAIL_USER || "neobytear@gmail.com";
export const EMAIL_PASS= process.env.EMAIL_PASS || "ctzkvpvgnjbqyonc";

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "df4snql3e",
    api_key: process.env.CLOUDINARY_API_KEY || "968982776583155",
    api_secret: process.env.CLOUDINARY_API_SECRET || "PemqsOhIYb5Ixlk4O1YcoJh9PpY"
  });
 
  export default cloudinary.v2;