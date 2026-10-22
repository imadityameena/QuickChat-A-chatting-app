import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { readFileAsDataURL, validateImageFile } from "../lib/utils";
import { formatName, normalizeUsername } from "../lib/validation";
import UsernameInput from "../components/UsernameInput";
import DeleteAccountModal from "../components/DeleteAccountModal";
import BlockedUsers from "../components/BlockedUsers";
import { ArrowLeftIcon, CameraIcon, TrashIcon } from "../components/icons";
import { button, formButton, input } from "../lib/ui";
import { avatarSrc } from "../lib/images";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio || "");
  const [username, setUsername] = useState(authUser.username || "");
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Create (and clean up) a preview URL for the chosen image
  useEffect(() => {
    if (!selectedImg) return setPreviewUrl(null);
    const url = URL.createObjectURL(selectedImg);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImg]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    const error = validateImageFile(file);
    if (error) return toast.error(error);
    setSelectedImg(file);
    setRemovePhoto(false);
  };

  // Drop a newly picked photo, or mark the saved one for removal
  const handleRemovePhoto = () => {
    if (selectedImg) setSelectedImg(null);
    else setRemovePhoto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (usernameStatus === "taken" || usernameStatus === "invalid" || !username) {
      toast.error("Please choose a valid, available username");
      return;
    }
    if (usernameStatus === "checking") {
      toast("Still checking your username, try again in a moment");
      return;
    }
    setSaving(true);
    try {
      const body = { fullName: formatName(name), bio: bio.trim(), username: normalizeUsername(username) };
      if (selectedImg) body.profilePic = await readFileAsDataURL(selectedImg);
      else if (removePhoto) body.removeProfilePic = true;
      if (await updateProfile(body)) navigate("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasSavedPhoto = !!authUser.profilePic && !removePhoto;
  const hasPhoto = !!selectedImg || hasSavedPhoto;
  const bigAvatar = previewUrl || (hasSavedPhoto ? avatarSrc(authUser, 160) : assets.avatar_icon);

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-2xl bg-surface text-fg border border-line shadow-xl shadow-black/10 flex items-center justify-between max-sm:flex-col-reverse rounded-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6 sm:p-10 flex-1 w-full">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <button
              type="button"
              aria-label="Back to chats"
              onClick={() => navigate("/")}
              className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-muted hover:text-fg hover:bg-surface-3 cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            Edit profile
          </h1>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Profile photo</p>
            <input
              onChange={handleImageChange}
              type="file"
              id="avatar"
              accept="image/png, image/jpeg, image/webp"
              hidden
            />
            <div className="flex flex-wrap gap-2">
              <label htmlFor="avatar" className={button.secondary}>
                <CameraIcon className="w-4 h-4" />
                {hasPhoto ? "Change photo" : "Upload photo"}
              </label>
              {hasPhoto && (
                <button type="button" onClick={handleRemovePhoto} className={button.danger}>
                  <TrashIcon className="w-4 h-4" />
                  Remove
                </button>
              )}
              {removePhoto && !selectedImg && (
                <button type="button" onClick={() => setRemovePhoto(false)} className={button.secondary}>
                  Undo
                </button>
              )}
            </div>
            <p className="text-xs text-subtle">
              {selectedImg
                ? "New photo selected. Click Save to apply it."
                : removePhoto
                ? "Your photo will be removed when you click Save."
                : "JPG, PNG or WebP, up to 5MB."}
            </p>
          </div>

          <input
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setName((n) => formatName(n))}
            value={name}
            type="text"
            required
            maxLength={50}
            placeholder="Your name"
            className={`${input} border-line`}
          />

          <div className="flex flex-col gap-1">
            <UsernameInput
              id="profile-username"
              value={username}
              onChange={setUsername}
              name={name}
              currentUsername={authUser.username}
              showErrors
              onStatusChange={setUsernameStatus}
            />
          </div>

          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            maxLength={200}
            rows={4}
            className={`${input} border-line resize-none`}
          />

          <button
            type="submit"
            disabled={saving}
            className={formButton}
          >
            {saving ? "Saving…" : "Save"}
          </button>

          <div className="mt-4 pt-5 border-t border-line">
            <BlockedUsers />
          </div>

          <div className="pt-5 border-t border-line flex flex-col gap-2">
            <p className="text-sm font-medium text-danger">Delete account</p>
            <p className="text-xs text-muted">
              Permanently delete your account, chats and photos. This can't be undone.
            </p>
            <button type="button" onClick={() => setDeleteOpen(true)} className={`${button.ghost} w-fit`}>
              <TrashIcon className="w-4 h-4" />
              Delete my account
            </button>
          </div>
        </form>

        {/* Big avatar: click it to pick a new photo */}
        <label
          htmlFor="avatar"
          title="Change profile photo"
          className="relative group shrink-0 cursor-pointer mx-10 max-sm:mt-8 rounded-full"
        >
          <img
            className="w-40 h-40 rounded-full object-cover bg-surface-2 ring-4 ring-accent-soft"
            src={bigAvatar}
            alt="Profile photo"
          />
          <span className="absolute inset-0 rounded-full bg-black/45 text-white flex flex-col items-center justify-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <CameraIcon className="w-6 h-6" />
            Change
          </span>
          <span className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-accent text-accent-fg border-4 border-surface flex items-center justify-center">
            <CameraIcon className="w-4 h-4" />
          </span>
        </label>
      </div>
      <DeleteAccountModal open={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </div>
  );
};

export default ProfilePage;
