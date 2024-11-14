import { Request, Response } from "express";
import UserModel from "../models/userModel";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { JWT_SECRET, EMAIL_USER, EMAIL_PASS} from "../constants";
import nodemailer from "nodemailer";
import cloudinary from "../constants/index";


export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userData } = req.body;
    if (!userData) {
      res.status(400).json({ error: "Los datos de usuario son requeridos" });
      return;
    }

    const profilePicture = req.file; // Accede al archivo subido
    console.log("Archivos recibidos:", profilePicture);

    const { email, name, surname, username, password, gender } = JSON.parse(userData);

    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      res.status(400).json({ error: "El usuario ya existe" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let profilePictureUrl = "";

    if (profilePicture) {
      console.log("Subiendo imagen a Cloudinary...");
      try {
        // Usar upload_stream para subir el archivo desde el buffer
        await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error: any, result: any) => {
              if (error) {
                reject(error);
              }
              profilePictureUrl = result.secure_url;
              resolve(result);
            }
          ).end(profilePicture.buffer);
        });
        console.log("URL de la imagen de perfil:", profilePictureUrl);
      } catch (cloudinaryError) {
        console.error("Error uploading image to Cloudinary:", cloudinaryError);
        res.status(500).json({ error: "Error uploading profile picture" });
        return;
      }
    }

    const newUser = new UserModel({
      email,
      name,
      surname,
      username,
      password: hashedPassword,
      gender,
      profilePicture: profilePictureUrl,
    });

    await newUser.save();
    res.status(201).json({ message: "Usuario creado" });

  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};





export const login = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const user = await UserModel.findOne({ $or: [{ email }, { username }] });
    if (!user) {
      return res.status(404).json({ error: "Credenciales inválidas" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  const { newPassword } = req.body; // Recibimos la nueva contraseña
  const token = req.headers.authorization?.split(" ")[1]; // Extraemos el token del encabezado Authorization

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    // Verificar el token
    const decodedToken = jwt.verify(token, JWT_SECRET) as { id: string };

    // Buscar al usuario por ID extraído del token
    const user = await UserModel.findById(decodedToken.id);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la contraseña" });
  }
};


///////A partir de acá manejamos la lógica de FogotPassword////

////////////1 enviamos el código por correo//////////////////

// Guarda los códigos de verificación temporalmente
const verificationCodes: { [key: string]: string } = {};

// Configuración de Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Usa el servicio SMTP de tu preferencia
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Envia el código de verificación por correo
export const sendVerificationCode = async (req: Request, res: Response): Promise<void> => {
  const { emailOrUsername } = req.body;

  try {
    // Busca usuario por email o username
    const user = await UserModel.findOne({ 
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }] 
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return
    }

    //Acá generamos un código de verificación de 6 dígitos
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes[user.email] = verificationCode; // Guardar el código asociado al email

    //acá enviamos el correo electrónico con el código
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "VibeShare - Código de verificación para iniciar sesión",
      text: `Hola,

      Recibimos una solicitud para iniciar sesión en tu cuenta de VibeShare. Usa el siguiente código de verificación para completar el proceso de inicio de sesión:

      Código de verificación: ${verificationCode}

      Este código es válido solo por un tiempo limitado. Si no solicitaste este código, puedes ignorar este mensaje de manera segura.

      Gracias,
      El equipo de VibeShare`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Correo enviado con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al enviar el correo" });
  }
};

////////2) Acá Validamos el código y generamos un JWT///////////////////////////////

export const loginWithCode = async (req: Request, res: Response) : Promise<void> => {
  const { emailOrUsername, code } = req.body;

  try {
    // Busca al usuario por email o username
    const user = await UserModel.findOne({ 
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }] 
    });

    if (!user) {
      res.status(404).json({ error: "Usuario no encontrado" });
      return
    }

    // Verifica si el código de verificación coincide
    const savedCode = verificationCodes[user.email];
    if (savedCode !== code) {
      res.status(400).json({ error: "Código de verificación incorrecto" });
      return 
    }

    // Genera un token JWT para el usuario
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    // Elimina el código después de usarlo
    delete verificationCodes[user.email];

    // Retorna el token para que el usuario pueda iniciar sesión
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
