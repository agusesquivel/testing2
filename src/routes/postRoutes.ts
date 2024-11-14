import { Router } from "express";
import { createPost, toggleLike, addComment, getAllPosts, deletePost, getPostById, getPostsByUserId, uploadMedia} from "../controllers/postController";
import { validateJwt } from "../middlewares/auth";
import multer from 'multer';

const upload = multer({ dest: "uploads/" }); // Configuración de multer para manejar archivos

const router = Router();
/* primero se tiene que subir archivo antes de crear el post
ruta para subir media (requiere autenticación) */
router.post("/posts/upload", validateJwt, upload.single("media"), uploadMedia);

//ruta para crear un post (requiere autenticación)
router.post("/posts", validateJwt, createPost);

// Ruta para obtener todos los posts (público)
router.get("/posts", getAllPosts);

// Ruta para obtener todos los posts de un usuario (requiere autenticación)
router.get("/posts/user", validateJwt, getPostsByUserId); // Nueva ruta

router.delete("/posts/:id", validateJwt, deletePost);

router.get("/posts/:id", validateJwt, getPostById);

router.post("/posts/:postId/comment", validateJwt, addComment);

// Ruta para agregar un like a un post
router.post('/posts/like', validateJwt, toggleLike);

export default router;
