import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a base64 data-URL image and return its secure URL
export const uploadImage = async (dataUrl, folder) => {
  const result = await cloudinary.uploader.upload(dataUrl, { folder: `quickchat/${folder}` });
  return result.secure_url;
};

export default cloudinary;
