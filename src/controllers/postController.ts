import { Request, Response } from "express";
import PostModel from "../models/postModel";;
import { JwtPayload } from "jsonwebtoken";
import cloudinary from "../constants/index";
import mongoose from "mongoose";

// Controlador para subir una imagen o video a Cloudinary
export const uploadMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No se ha subido ningún archivo" });
      return;
    }

    // Subir el archivo a Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto", // Permite subir imágenes o videos
    });

    // Devolver la URL del archivo subido
    res.status(200).json({ url: result.secure_url, type: result.resource_type });
  } catch (error) {
    console.error("Cloudinary Error:", error); // Log para ver el error exacto
    res.status(500).json({ error: "Error al subir el archivo a Cloudinary", details: error });
  }
};

/* Controlador para crear un post
Se tiene que subir la imagen primero y luego utilizamos crearPost. */
// Controlador para crear un post
export const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload | undefined;

    if (!user || typeof user === "string" || !user.id) {
      res.status(401).json({ message: "No autorizado" });
      return;
    }

    const userId = user.id;
    const { title, location, media } = req.body; // `media` incluye la URL obtenida desde Cloudinary

    const newPost = new PostModel({
      user: userId,
      title,
      date: new Date(),
      location,
      media, // Almacena la URL y el tipo en el array de `media`
      comments: [],
      likes: 0,
    });

    await newPost.save();

    res.status(201).json({ message: "Post creado con éxito", post: newPost });
  } catch (error) {
    res.status(500).json({ error: "Error al crear el post" });
  }
};

// Controlador para obtener todos los posts
//ordernar por fecha lo mas nuevos primeros
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const posts = await PostModel.find()
      .populate("user", "username") // Obtenemos todos los posts y poblamos el campo de usuario
      .sort({ date: -1 }); // Ordenamos por fecha de manera descendente (de más nuevo a más viejo)
      
    res.status(200).json(posts);  // Enviamos los posts en la respuesta
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los posts" });
  }
};

// Controlador para obtener un post por su ID
export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = req.params.id;
    const post = await PostModel.findById(postId).populate("user", "username");
    if (!post) {
      res.status(404).json({ message: "Post no encontrado" });
      return
    }
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el post" });
  }
};

// Controlador para obtener todos los posts de un usuario específico
export const getPostsByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user as JwtPayload | undefined;

    if (!user || typeof user === "string" || !user.id) {
      res.status(401).json({ message: "No autorizado" });
      return; // Termina la función aquí
    }

    const userId = user.id;
    const posts = await PostModel.find({ user: userId }) // Buscamos los posts del usuario
      .populate("user", "username") // Poblamos el campo de usuario
      .sort({ date: -1 }); // Ordenamos por fecha de manera descendente

    res.status(200).json(posts); // Enviamos los posts en la respuesta
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los posts del usuario" });
  }
};

// Controlador para eliminar un post
export const deletePost = async (req: Request, res: Response): Promise<void> => {
    try {
      const postId = req.params.id;
      const user = req.user as JwtPayload | undefined;
  
      if (!user || typeof user === "string" || !user.id) {
        res.status(401).json({ message: "No autorizado" });
        return; // Termina la función aquí
      }
  
      const post = await PostModel.findById(postId);
  
      if (!post) {
        res.status(404).json({ message: "Post no encontrado" });
        return; // Termina la función aquí
      }
  
      // Solo el usuario que creó el post puede eliminarlo
      if (post.user.toString() !== user.id) {
        res.status(403).json({ message: "No tienes permiso para eliminar este post" });
        return; // Termina la función aquí
      }
  
      await post.deleteOne();
      res.status(200).json({ message: "Post eliminado con éxito" });
    } catch (error) {
      res.status(500).json({ error: "Error al eliminar el post" });
    }
  };

// Controlador para dar like a un post


export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  const { postId } = req.body;
  const userId = req.user?.id;

  if (!postId || !userId) {
    res.status(400).json({ message: "Faltan datos requeridos" });
    return;
  }

  try {
    const post = await PostModel.findById(postId);

    if (!post) {
      res.status(404).json({ message: "Post no encontrado" });
      return;
    }

    // Verifica si `userId` es válido y crea el ObjectId correctamente
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: "ID de usuario no válido" });
      return;
    }

    const userObjectId = userId as unknown as mongoose.Schema.Types.ObjectId;

    // Verifica si el usuario ya ha dado like
    const userHasLiked = post.likes.some((like) => like.toString() === userObjectId.toString());

    if (userHasLiked) {
      // Si ya ha dado like, lo eliminamos
      post.likes = post.likes.filter((like) => like.toString() !== userObjectId.toString());
      post.likeCount -= 1;
      await post.save();
      res.status(200).json({ message: "Like eliminado", likeCount: post.likeCount });
    } else {
      // Si no ha dado like, lo agregamos
      post.likes.push(userObjectId);
      post.likeCount += 1;
      await post.save();
      res.status(200).json({ message: "Like agregado", likeCount: post.likeCount });
    }
  } catch (error) {
    console.error("Error al actualizar like:", error);
    res.status(500).json({ error: "Error al actualizar like", details: error });
  }
};


export const addComment = async (req: Request, res: Response): Promise<void> => {
  const { postId, text } = req.body; // Obtén el ID del post y el texto del comentario
  const userId = req.user?.id; // ID del usuario autenticado

  if (!postId || !text || !userId) {
      res.status(400).json({ message: "Faltan datos requeridos" });
      return ;
  }

  try {
      // Crea el nuevo comentario
      const comment = {
          user: userId,
          text,
          date: new Date(),
      };

      // Agrega el comentario al post
      const updatedPost = await PostModel.findByIdAndUpdate(
          postId,
          { $push: { comments: comment } },
          { new: true, useFindAndModify: false }
      ).populate("comments.user", "name username"); // Poblamos el usuario del comentario

      if (!updatedPost) {
          res.status(404).json({ message: "Post no encontrado" });
          return;
      }

      res.status(200).json({ message: "Comentario agregado", post: updatedPost });
  } catch (error) {
      console.error("Error al agregar comentario:", error);
      res.status(500).json({ error: "Error al agregar comentario", details: error });
  }
};