import { Request, Response } from "express";
import User from "../models/userModel";
import cloudinary from "../constants/index";
import Post from "../models/postModel";

//busca usuario por nombre y apellido
export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  const { name, surname } = req.query; // Recibe los parámetros de búsqueda desde la query string

  // Validación de parámetros
  if (!name || !surname || typeof name !== "string" || typeof surname !== "string") {
    res.status(400).json({ message: "Los parámetros 'name' y 'surname' son requeridos y deben ser cadenas de texto" });
    return;
  }

  try {
    // Buscamos usuarios cuyo nombre o apellido coincidan con los valores proporcionados
    const users = await User.find({
      name: { $regex: name, $options: "i" }, // $regex para buscar coincidencia parcial, con opción 'i' para insensibilidad a mayúsculas/minúsculas
      surname: { $regex: surname, $options: "i" }
    });

    if (users.length === 0) {
      res.status(404).json({ message: "No se encontraron usuarios con ese nombre y apellido" });
      return;
    }

    res.status(200).json(users); // Devuelve la lista de usuarios encontrados
  } catch (error) {
    console.error("Error al buscar usuarios:", error);
    res.status(500).json({ error: "Error al buscar usuarios", details: error });
  }
};

// Controlador para obtener todos los usuarios
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await User.find().select("-password"); // Excluye el campo `password` por seguridad
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los usuarios", details: error });
    }
  };
  
  // Controlador para obtener un usuario en particular por ID
  export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await User.findById(req.params.id).select("-password"); // Excluye el campo `password`
      
      if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }
  
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener el usuario", details: error });
    }
};  




// Actualiza solo los datos de texto del perfil del usuario
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "No autorizado" });
            return;
        }

        const updatedData = req.body;
        const allowedUpdates = ["name", "surname", "username", "bio", "gender"];
        const updates = Object.keys(updatedData).filter(field => allowedUpdates.includes(field));

        if (updates.length === 0) {
            res.status(400).json({ message: "No se especificaron campos válidos para actualizar." });
            return;
        }

        const user = await User.findByIdAndUpdate(userId, updatedData, { new: true, runValidators: true });

        if (!user) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }

        res.status(200).json({ message: "Perfil actualizado con éxito", user });
    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.status(500).json({ error: "Error al actualizar el perfil", details: error });
    }
};

// Subir la imagen de perfil a Cloudinary
export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "No autorizado" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: "No se subió ninguna imagen de perfil" });
            return;
        }

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "image",
            folder: "user_profiles",
        });

        const user = await User.findByIdAndUpdate(userId, { profilePicture: uploadResult.secure_url }, { new: true });

        res.status(200).json({ message: "Imagen de perfil actualizada con éxito", user });
    } catch (error) {
        console.error("Error al subir la imagen de perfil:", error);
        res.status(500).json({ message: "Error al subir la imagen de perfil", details: error });
    }
};

// Subir la imagen de portada a Cloudinary
export const uploadCoverPicture = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: "No autorizado" });
            return;
        }

        if (!req.file) {
            res.status(400).json({ message: "No se subió ninguna imagen de portada" });
            return;
        }

        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            resource_type: "image",
            folder: "user_profiles",
        });

        const user = await User.findByIdAndUpdate(userId, { coverPicture: uploadResult.secure_url }, { new: true });

        res.status(200).json({ message: "Imagen de portada actualizada con éxito", user });
    } catch (error) {
        console.error("Error al subir la imagen de portada:", error);
        res.status(500).json({ message: "Error al subir la imagen de portada", details: error });
    }
};





// Controlador para seguir a otro usuario
export const followUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const targetUserId = req.params.id;

    if (!userId || userId === targetUserId) {
      res.status(400).json({ message: "No se puede seguir a sí mismo o no autorizado" });
      return;
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      res.status(404).json({ message: "Usuario a seguir no encontrado" });
      return;
    }

    await User.findByIdAndUpdate(userId, { $addToSet: { following: targetUserId } });
    res.status(200).json({ message: "Usuario seguido con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al seguir al usuario", details: error });
  }
};

// Controlador para dejar de seguir a otro usuario
export const unfollowUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.id;
      const targetUserId = req.params.id;
  
      if (!userId || userId === targetUserId) {
        res.status(400).json({ message: "No se puede dejar de seguir a sí mismo o no autorizado" });
        return;
      }
  
      const user = await User.findById(targetUserId);
      if (!user) {
        res.status(404).json({ message: "Usuario a dejar de seguir no encontrado" });
        return;
      }
  
      // Elimina el usuario objetivo de la lista de seguidores
      await User.findByIdAndUpdate(userId, { $pull: { following: targetUserId } });
      res.status(200).json({ message: "Usuario dejado de seguir con éxito" });
    } catch (error) {
      res.status(500).json({ error: "Error al dejar de seguir al usuario", details: error });
    }
};

//trae a las personas que un usuario sigue
export const getUserFollowers = async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUserId = req.params.id; // Obtén el ID del usuario cuya lista de seguidores deseas consultar
  
      // Verifica si el ID del usuario está presente
      if (!targetUserId) {
        res.status(400).json({ message: "ID del usuario es necesario" });
        return;
      }
  
      // Busca todos los usuarios que tienen al `targetUserId` en su lista de 'followers'
      const followers = await User.find({ followers: targetUserId }).select("name username");
  
      if (followers.length === 0) {
        res.status(404).json({ message: "Este usuario no tiene seguidores aún." });
        return;
      }
  
      res.status(200).json({ followers });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener los seguidores del usuario", details: error });
    }
};
  

  export const getUserFollowing = async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUserId = req.params.id; // Obtén el ID del usuario cuya lista de "seguimiento" deseas consultar
  
      // Verifica si el ID del usuario está presente
      if (!targetUserId) {
        res.status(400).json({ message: "ID del usuario es necesario" });
        return;
      }
  
      // Busca el usuario con `targetUserId` y obtiene su lista de 'following'
      const user = await User.findById(targetUserId).select("following");
  
      if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }
  
      // Busca los usuarios que están en la lista de 'following' de este usuario
      const following = await User.find({ _id: { $in: user.following } }).select("name username");
  
      if (following.length === 0) {
        res.status(404).json({ message: "Este usuario no sigue a nadie." });
        return;
      }
  
      res.status(200).json({ following });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener las personas que sigue el usuario", details: error });
    }
  };
  
  


  






  ///A partir de acá manejamos la lista de favoritos

  // Agregar post a favoritos
export const addPostToFavorites = async (req: Request, res: Response): Promise<void> => {
    try {
    const userId = req.user?.id; // Obtén el ID del usuario autenticado
    const postId = req.params.postId; // Obtén el ID del post desde los parámetros de la solicitud

    // Verifica si el post existe
    const postExists = await Post.findById(postId);
    if (!postExists) {
        res.status(404).json({ message: "Post no encontrado" });
        return;
    }

    // Agrega el post a la lista de favoritos del usuario
    const user = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { favorites: postId } }, // Usa $addToSet para evitar duplicados
        { new: true }
    );

    if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
    }

    res.status(200).json({ message: "Post agregado a favoritos", favorites: user.favorites });
    } catch (error) {
    console.error("Error al agregar post a favoritos:", error);
    res.status(500).json({ error: "Error al agregar post a favoritos", details: error });
    }
};

// Quitar post de favoritos
export const removePostFromFavorites = async (req: Request, res: Response): Promise<void> => {
try {
    const userId = req.user?.id; // Obtén el ID del usuario autenticado
    const postId = req.params.postId; // Obtén el ID del post desde los parámetros de la solicitud

    // Quita el post de la lista de favoritos del usuario
    const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { favorites: postId } }, // Usa $pull para eliminar el post de favoritos
        { new: true }
    );

    if (!user) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
    }

    res.status(200).json({ message: "Post quitado de favoritos", favorites: user.favorites });
} catch (error) {
    console.error("Error al quitar post de favoritos:", error);
    res.status(500).json({ error: "Error al quitar post de favoritos", details: error });
}
};

export const getUserFavorites = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.params.userId; // Obtén el ID del usuario desde los parámetros de la solicitud

        // Busca al usuario y popula la lista de favoritos
        const user = await User.findById(userId).populate("favorites"); // Asegúrate de que el modelo de Post esté correctamente referenciado

        if (!user) {
            res.status(404).json({ message: "Usuario no encontrado" });
            return;
        }

        res.status(200).json({ favorites: user.favorites });
    } catch (error) {
        console.error("Error al obtener favoritos del usuario:", error);
        res.status(500).json({ error: "Error al obtener favoritos del usuario", details: error });
    }
};