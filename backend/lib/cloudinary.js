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

// Turn ".../upload/v123/quickchat/avatars/abc.jpg" into "quickchat/avatars/abc"
const publicIdFromUrl = (url) => {
  const match = typeof url === "string" && url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return match ? match[1] : null;
};

// Delete uploaded images by their URLs. Best effort: failures are logged, not thrown.
export const deleteImages = async (urls) => {
  const ids = [...new Set(urls.map(publicIdFromUrl).filter(Boolean))];
  for (let i = 0; i < ids.length; i += 100) {
    try {
      await cloudinary.api.delete_resources(ids.slice(i, i + 100));
    } catch (err) {
      console.error("Cloudinary cleanup failed:", err.message);
    }
  }
};

export default cloudinary;
