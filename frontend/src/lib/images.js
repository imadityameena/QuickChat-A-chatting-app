import assets from "../assets/assets";

// Cloudinary can resize and compress images on the fly when you add
// transformation options to the URL (".../upload/<options>/..."), so we
// download small, modern-format images instead of the full original upload.
export function cloudinaryUrl(url, options) {
  if (typeof url !== "string" || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }
  return url.replace("/upload/", `/upload/${options}/`);
}

// Profile picture cropped to a square at about twice the display size (sharp on retina screens)
export function avatarSrc(user, size = 48) {
  if (!user?.profilePic) return assets.avatar_icon;
  const px = Math.round(size * 2);
  return cloudinaryUrl(user.profilePic, `f_auto,q_auto,c_fill,g_face,w_${px},h_${px}`);
}

// Shared photo shown in the chat or media grid, never upscaled
export function imageSrc(url, width = 600) {
  return cloudinaryUrl(url, `f_auto,q_auto,c_limit,w_${width}`);
}
