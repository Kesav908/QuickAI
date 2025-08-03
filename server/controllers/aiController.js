import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js'


const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/" 
});

export const generateArticle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt, length } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // ✅ Validate prompt & length
    if (!prompt || !length) {
      return res.status(400).json({ success: false, message: "Prompt and length are required." });
    }

    // ✅ Check free usage
    if (plan !== 'premium' && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade to premium."
      });
    }

    // ✅ Generate article using Gemini API
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: length
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ success: false, message: "Failed to generate article." });
    }

    // ✅ Save to DB
    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'article')
    `;

    // ✅ Update free_usage if not premium
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }

    res.json({ success: true, content });

  } catch (error) {
    console.error("generateArticle error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const generateBlogTitle = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    // ✅ Validate prompt & length
    if (!prompt) {
  return res.status(400).json({ success: false, message: "Prompt is required." });
}

    // ✅ Check free usage
    if (plan !== 'premium' && free_usage >= 10) {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade to premium."
      });
    }

    // ✅ Generate article using Gemini API
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ success: false, message: "Failed to generate article." });
    }

    // ✅ Save to DB
    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, ${prompt}, ${content}, 'blog-article')
    `;

    // ✅ Update free_usage if not premium
    if (plan !== "premium") {
      await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
          free_usage: free_usage + 1
        }
      });
    }

    res.json({ success: true, content });

  } catch (error) {
    console.error("generateArticle error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const removeImageBackground = async (req, res) => {
  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "No image file provided"
      });
    }

    if (plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade to premium."
      });
    }
    
    const { secure_url } = await cloudinary.uploader.upload(image.path, {
      transformation: [
        {
          effect: 'background_removal'
        }
      ],
      format: 'png'
    });

    try {
      await sql`
        INSERT INTO creations(user_id, prompt, content, type)
        VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')
      `;
    } catch (dbError) {
      console.error("Database error:", dbError.message);
    }

    // FIX: Use imported fs instead of require
    if (image.path && fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    res.json({ success: true, content: secure_url });

  } catch (error) {
    console.error("removeImageBackground error:", error.message);
    
    // FIX: Use imported fs
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError.message);
      }
    }
    
    res.status(500).json({ success: false, error: error.message });
  }
};
export const generateImage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { prompt,publish } = req.body;
    const plan = req.plan;

    if (!prompt) {
  return res.status(400).json({ success: false, message: "Prompt is required." });
}


    if (plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade to premium."
      });
    }
    const formData = new FormData()
    formData.append('prompt', prompt);
    const {data}=await axios.post("https://clipdrop-api.co/text-to-image/v1",formData,{
      headers:{'x-api-key':process.env.CLIPDROP_API_KEY,},
      responseType:"arraybuffer",
    })
    const base64Image=`data:image/png;base64,${Buffer.from(data,'binary').toString('base64')}`;

    const {secure_url}=await cloudinary.uploader.upload(base64Image);
    // ✅ Save to DB
    await sql`
  INSERT INTO creations(user_id, prompt, content, type, publish)
  VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})
`;


    res.json({ success: true, content:secure_url });

  } catch (error) {
    console.error("generateArticle error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
export const removeImageObject = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file; // FIX: should be req.file, not req.file.image
    const plan = req.plan;

    // FIX: Check for object, not prompt
    if (!object) {
      return res.status(400).json({ success: false, message: "Object to remove is required." });
    }

    if (!image) {
      return res.status(400).json({ success: false, message: "Image file is required." });
    }

    if (plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade to premium."
      });
    }
    
    const {public_id} = await cloudinary.uploader.upload(image.path);
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{
        effect: `gen_remove:${object}`
      }],
      resource_type: 'image'
    });

    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')
    `;

    res.json({ success: true, content: imageUrl });

  } catch (error) {
    console.error("removeImageObject error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const reviewResume = async (req, res) => {
  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    // FIX: Check for resume, not prompt
    if (!resume) {
      return res.status(400).json({ success: false, message: "Resume file is required." });
    }

    if (plan !== 'premium') {
      return res.status(403).json({
        success: false,
        message: "Limit reached. Please upgrade to premium."
      });
    }
    
    if (resume.size > 5 * 1024 * 1024) {
      return res.json({
        success: false, 
        message: "Resume file size exceeds allowed size (5MB)."
      });
    }

    const dataBuffer = fs.readFileSync(resume.path);
    const pdfData = await pdf(dataBuffer);

    const prompt = `Review the following resume and provide constructive feedback on its strength, weaknesses, and area of improvement.Resume Content:\n\n${pdfData.text}`;

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(500).json({ success: false, message: "Failed to review Resume." });
    }

    await sql`
      INSERT INTO creations(user_id, prompt, content, type)
      VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')
    `;

    res.json({ success: true, content });

  } catch (error) {
    console.error("reviewResume error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};