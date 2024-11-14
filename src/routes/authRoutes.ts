import { Router } from "express";
import { register, login, sendVerificationCode, loginWithCode,updatePassword } from "../controllers/authController";
import { googleLogin } from "../controllers/authControllerGoogle";
const router = Router();
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

//ruta de registro
router.post('/register', upload.single('profilePicture'), register);

router.post("/login", (req, res, next) => {
  login(req, res).catch(next); 
});
//login con goolge
router.post("/googlelogin", googleLogin);

//ruta para enviar el código de verificación al correo
router.post("/send-code", sendVerificationCode);

//ruta para iniciar sesión usando el código de verificación
router.post("/login-with-code", loginWithCode);

//ruta para actualizar la contraseña
router.post("/update-password", (req, res, next) => {
  updatePassword(req, res).catch(next); // Manejo de errores con next()
  });

export default router;