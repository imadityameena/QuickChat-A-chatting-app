import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import { FriendContext } from "../../context/FriendContext";
import { formatLastSeen, formatMonthYear, getErrorMessage, memberDuration } from "../lib/utils";
import { cardButton } from "../lib/ui";
import { ChatIcon, CheckIcon, ClockIcon, UserPlusIcon, XIcon } from "./icons";

const Stat = ({ value, label }) => (
  <div className="flex-1 text-center px-2">
    <p className="text-lg font-semibold text-white leading-tight">{value}</p>
    <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
  </div>
);

// Popup with someone's profile: photo, bio, stats and the right action button
const ProfileModal = () => {
  const { axios, onlineUsers } = useContext(AuthContext);
  const { selectUser } = useContext(ChatContext);
  const {
    profileUserId,
    friendsVersion,
    closeProfile,
    busy,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  } = useContext(FriendContext);
  const navigate = useNavigate();
  const closeRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load the profile when the popup opens, and again after any friend change
  useEffect(() => {
    if (!profileUserId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    axios
      .get(`/api/friends/profile/${profileUserId}`)
      .then(({ data }) => {
        if (!cancelled && data.success) setProfile(data.profile);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(getErrorMessage(error));
          closeProfile();
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [profileUserId, friendsVersion, axios, closeProfile]);

  // Close with Escape; move focus into the popup
  useEffect(() => {
    if (!profileUserId) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && closeProfile();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [profileUserId, closeProfile]);

  if (!profileUserId) return null;

  const showSkeleton = !profile || profile._id !== profileUserId;
  const isOnline = profile && onlineUsers.includes(profile._id);
  const isBusy = profile && !!busy[profile._id];
  const request = profile && { _id: profile.requestId, user: profile };

  const message = () => {
    selectUser(profile);
    closeProfile();
  };

  const actions = () => {
    switch (profile.relationship) {
      case "self":
        return (
          <button type="button" onClick={() => { closeProfile(); navigate("/profile"); }} className={cardButton.primary}>
            Edit profile
          </button>
        );
      case "friends":
        return (
          <>
            <button type="button" onClick={message} className={cardButton.primary}>
              <ChatIcon /> Message
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                if (window.confirm(`Remove ${profile.fullName} from your friends?`)) removeFriend(profile);
              }}
              className={cardButton.ghost}
            >
              Remove friend
            </button>
          </>
        );
      case "sent":
        return (
          <button type="button" disabled={isBusy} onClick={() => cancelRequest(request)} className={`${cardButton.ghost} group/btn`}>
            <ClockIcon className="w-4 h-4 group-hover/btn:hidden" />
            <XIcon className="w-4 h-4 hidden group-hover/btn:block" />
            <span className="group-hover/btn:hidden">Request sent</span>
            <span className="hidden group-hover/btn:inline">Cancel request</span>
          </button>
        );
      case "received":
        return (
          <>
            <button type="button" disabled={isBusy} onClick={() => acceptRequest(request)} className={cardButton.success}>
              <CheckIcon /> Accept request
            </button>
            <button type="button" disabled={isBusy} onClick={() => declineRequest(request)} className={cardButton.ghost}>
              Decline
            </button>
          </>
        );
      default:
        return (
          <button type="button" disabled={isBusy} onClick={() => sendRequest(profile)} className={cardButton.primary}>
            <UserPlusIcon /> Add friend
          </button>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && closeProfile()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={profile ? `${profile.fullName}'s profile` : "Profile"}
        className="relative w-full sm:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#1a1730] border border-white/10 shadow-2xl text-white pb-[env(safe-area-inset-bottom)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={closeProfile}
          aria-label="Close profile"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center cursor-pointer"
        >
          <XIcon />
        </button>

        <div className="h-28 bg-gradient-to-r from-violet-600/60 via-fuchsia-500/40 to-indigo-600/60" />

        {showSkeleton ? (
          <div className="flex flex-col items-center px-6 pb-8 -mt-14 animate-pulse">
            <div className="w-28 h-28 rounded-full bg-white/10 ring-4 ring-[#1a1730]" />
            <div className="mt-4 h-4 w-40 rounded bg-white/10" />
            <div className="mt-2 h-3 w-24 rounded bg-white/10" />
            <div className="mt-6 h-12 w-full rounded-xl bg-white/10" />
            <div className="mt-6 h-10 w-full rounded-full bg-white/10" />
          </div>
        ) : (
          <div className={`flex flex-col items-center text-center px-6 pb-6 -mt-14 ${loading ? "opacity-80" : ""}`}>
            <div className="relative">
              <img
                src={profile.profilePic || assets.avatar_icon}
                alt=""
                className="w-28 h-28 rounded-full object-cover ring-4 ring-[#1a1730] bg-[#1a1730]"
              />
              {isOnline && (
                <span className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-green-500 ring-[3px] ring-[#1a1730]" />
              )}
            </div>

            <h2 className="mt-3 text-xl font-semibold break-words max-w-full">{profile.fullName}</h2>
            {profile.username && <p className="text-sm text-violet-300">@{profile.username}</p>}
            <p className={`text-xs mt-1 ${isOnline ? "text-green-400" : "text-gray-400"}`}>
              {profile.relationship === "self" ? "This is you" : isOnline ? "Online now" : formatLastSeen(profile.lastSeen)}
            </p>

            <p className="mt-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
              {profile.bio || <span className="text-gray-500 italic">No bio yet</span>}
            </p>

            <div className="mt-5 w-full flex divide-x divide-white/10 rounded-xl bg-white/5 border border-white/10 py-3">
              <Stat value={profile.friendCount} label={profile.friendCount === 1 ? "Friend" : "Friends"} />
              {profile.relationship !== "self" && <Stat value={profile.mutualCount} label="Mutual" />}
              <Stat value={memberDuration(profile.createdAt)} label="On QuickChat" />
            </div>
            <p className="mt-2 text-[11px] text-gray-500">Joined {formatMonthYear(profile.createdAt)}</p>

            {profile.mutualFriends?.length > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <div className="flex -space-x-2">
                  {profile.mutualFriends.map((f) => (
                    <img
                      key={f._id}
                      src={f.profilePic || assets.avatar_icon}
                      alt={f.fullName}
                      title={f.fullName}
                      className="w-6 h-6 rounded-full object-cover ring-2 ring-[#1a1730]"
                    />
                  ))}
                </div>
                <span className="text-left">
                  Friends with {profile.mutualFriends[0].fullName}
                  {profile.mutualCount > 1 && ` and ${profile.mutualCount - 1} other${profile.mutualCount > 2 ? "s" : ""}`}
                </span>
              </div>
            )}

            <div className="mt-6 w-full flex gap-2">{actions()}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;
