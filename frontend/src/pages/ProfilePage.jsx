import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { readFileAsDataURL, validateImageFile } from "../lib/utils";
import { formatName, normalizeUsername } from "../lib/validation";
import UsernameInput from "../components/UsernameInput";
import { ArrowLeftIcon } from "../components/icons";
import { formButton, input } from "../lib/ui";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio || "");
  const [username, setUsername] = useState(authUser.username || "");
  const [usernameStatus, setUsernameStatus] = useState("idle");
  const [saving, setSaving] = useState(false);

  // Create (and clean up) a preview URL for the chosen image
  useEffect(() => {
    if (!selectedImg) return setPreviewUrl(null);
    const url = URL.createObjectURL(selectedImg);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImg]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      e.target.value = "";
      return;
    }
    setSelectedImg(file);
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
      if (await updateProfile(body)) navigate("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const avatar = previewUrl || authUser.profilePic || assets.avatar_icon;

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

          <label htmlFor="avatar" className="flex items-center gap-3 cursor-pointer w-fit">
            <input
              onChange={handleImageChange}
              type="file"
              id="avatar"
              accept="image/png, image/jpeg, image/webp"
              hidden
            />
            <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover bg-surface-2" />
            <span className="text-sm font-medium text-accent-text hover:underline">
              {authUser.profilePic || selectedImg ? "Change profile image" : "Upload profile image"}
            </span>
          </label>

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
        </form>

        <img
          className="w-40 max-w-40 aspect-square rounded-full object-cover mx-10 max-sm:mt-8 bg-surface-2 ring-4 ring-accent-soft"
          src={previewUrl || authUser.profilePic || assets.logo_icon}
          alt=""
        />
      </div>
    </div>
  );
};

export default ProfilePage;
