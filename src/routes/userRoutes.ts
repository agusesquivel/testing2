import { Router } from "express";
import { searchUsers, addPostToFavorites, removePostFromFavorites, getUserFavorites, updateUserProfile, getUserFollowing, followUser, unfollowUser, getUserFollowers, getAllUsers, getUserById, uploadProfilePicture, uploadCoverPicture } from "../controllers/userController";
import { validateJwt } from "../middlewares/auth";
import multer from "multer";

const upload = multer({ dest: "uploads/" }); // Configuración de multer para cargar imágenes

const router = Router();
router.get("/search", searchUsers); // Ruta para buscar usuarios por nombre y apellido

// Ruta para obtener todos los usuarios
router.get("/all", validateJwt, getAllUsers);

// Ruta para obtener un usuario específico
router.get("/:id", validateJwt, getUserById);

// Ruta para actualizar solo los datos de perfil (texto)
router.put("/profile", validateJwt, updateUserProfile);

// Ruta para subir la imagen de perfil
router.post("/profile-picture", validateJwt, upload.single("profilePicture"), uploadProfilePicture);

// Ruta para subir la imagen de portada
router.post("/cover-picture", validateJwt, upload.single("coverPicture"), uploadCoverPicture);

// Ruta para seguir a un usuario
router.post("/:id/follow", validateJwt, followUser);
//Para dejar de seguir a un usuario
router.post("/:id/unfollow", validateJwt, unfollowUser);

//traer el listado de seguidores que tiene un usuario 
router.get("/:id/followers", validateJwt, getUserFollowers);

// Ruta para obtener las personas que sigue un usuario específico por ID
router.get("/:id/following", getUserFollowing);


router.post("/favorites/:postId", validateJwt, addPostToFavorites); // Agregar post a favoritos
router.delete("/favorites/:postId", validateJwt, removePostFromFavorites); // Quitar post de favoritos
router.get("/favorites/:userId", validateJwt, getUserFavorites); // Trae los favoritos de un usuario específico
export default router;