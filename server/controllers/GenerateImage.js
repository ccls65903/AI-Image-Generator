import * as dotenv from "dotenv";
import { createError } from "../error.js";
import fetch from "node-fetch";

dotenv.config();

// Controller to generate Image
export const generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          options: {
            wait_for_model: true
          }
        }),
      }
    );

    // Check if response is HTML (error page)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      throw new Error("API returned an error page. Please check your API key and try again.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || `API Error: ${response.status}`);
      } catch (e) {
        throw new Error(`API Error: ${errorText}`);
      }
    }

    const imageBuffer = await response.buffer();
    const base64Image = imageBuffer.toString('base64');
    res.status(200).json({ photo: base64Image });
  } catch (error) {
    console.error("Image generation error:", error);
    next(
      createError(
        500,
        error?.message || "Failed to generate image. Please try again."
      )
    );
  }
};
