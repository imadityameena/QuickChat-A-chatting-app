import React from "react";
import assets from "../assets/assets";

// Profile card used on the Discover and Requests pages.
// `badge` is a small label on the cover, `meta` a line under the username,
// and `children` the action buttons at the bottom.
const PersonCard = ({ user, online, badge, meta, onOpen, children }) => (
  <article className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] hover:border-violet-400/40 transition-colors overflow-hidden">
    <div className="relative h-16 bg-gradient-to-r from-violet-600/50 via-fuchsia-500/30 to-indigo-600/50">
      {badge && (
        <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-black/40 text-violet-100 backdrop-blur-sm">
          {badge}
        </span>
      )}
    </div>

    <div className="flex flex-col items-center text-center flex-1 px-4 pb-4 -mt-9">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${user.fullName}'s profile`}
        className="relative rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-violet-400"
      >
        <img
          src={user.profilePic || assets.avatar_icon}
          alt=""
          className="w-[72px] h-[72px] rounded-full object-cover ring-4 ring-[#1a1730] bg-[#1a1730] group-hover:ring-violet-500/40 transition"
        />
        {online && (
          <span
            title="Online"
            className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 ring-2 ring-[#1a1730]"
          />
        )}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="mt-2 font-medium text-white truncate max-w-full hover:underline cursor-pointer"
      >
        {user.fullName}
      </button>
      {user.username && <p className="text-xs text-violet-300 truncate max-w-full">@{user.username}</p>}
      {meta && <p className="mt-0.5 text-[11px] text-gray-400 truncate max-w-full">{meta}</p>}

      <p className="mt-2 text-xs text-gray-400 leading-relaxed line-clamp-2 min-h-[2.5rem] break-words">
        {user.bio || "Hey there! I'm on QuickChat."}
      </p>

      <div className="mt-auto pt-4 w-full flex gap-2">{children}</div>
    </div>
  </article>
);

// Grey placeholder card shown while loading
export const PersonCardSkeleton = () => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden animate-pulse">
    <div className="h-16 bg-white/10" />
    <div className="flex flex-col items-center px-4 pb-4 -mt-9">
      <div className="w-[72px] h-[72px] rounded-full bg-white/10 ring-4 ring-[#1a1730]" />
      <div className="mt-3 h-3 w-24 rounded bg-white/10" />
      <div className="mt-2 h-2.5 w-16 rounded bg-white/10" />
      <div className="mt-4 h-2.5 w-full rounded bg-white/10" />
      <div className="mt-1.5 h-2.5 w-3/4 rounded bg-white/10" />
      <div className="mt-5 h-9 w-full rounded-full bg-white/10" />
    </div>
  </div>
);

export default PersonCard;
