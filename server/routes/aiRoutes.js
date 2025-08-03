// routes/aiRoutes.js
import express from 'express';
import { generateArticle, generateBlogTitle, generateImage, removeImageBackground, removeImageObject, reviewResume } from '../controllers/aiController.js';
import { auth } from '../middlewares/auth.js';
import { upload } from '../configs/multer.js';

const aiRouter = express.Router();

aiRouter.post('/generate-article', auth, generateArticle);
aiRouter.post('/generate-blog-title', auth, generateBlogTitle);
aiRouter.post('/generate-image', auth, generateImage);

// FIX: auth middleware must come BEFORE upload middleware
aiRouter.post('/remove-image-background', auth, upload.single('image'), removeImageBackground);
aiRouter.post('/remove-image-object', auth, upload.single('image'), removeImageObject);
aiRouter.post('/review-resume', auth, upload.single('resume'), reviewResume);

export default aiRouter;