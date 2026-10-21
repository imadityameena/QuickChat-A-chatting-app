import React from "react";
import assets from "../assets/assets";

// Profile card used on the Discover and Requests pages.
// `badge` is a small label on the cover, `meta` a line under the username,
// and `children` the action buttons at the bottom.
const PersonCard = ({ user, online, badge, meta, onOpen, children }) => (
  <article className="group flex flex-col rounded-2xl border border-line bg-surface hover:border-accent/50 hover:shadow-lg hover:shadow-black/10 transition overflow-hidden">
    <div className="relative h-16 bg-gradient-to-r from-accent/40 via-fuchsia-500/25 to-indigo-500/40">
      {badge && (
        <span className="absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full bg-surface text-accent-text shadow-sm">
          {badge}
        </span>
      )}
    </div>

    <div className="flex flex-col items-center text-center flex-1 px-4 pb-4 -mt-9">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${user.fullName}'s profile`}
        className="relative rounded-full cursor-pointer"
      >
        <img
          src={user.profilePic || assets.avatar_icon}
          alt=""
          className="w-[72px] h-[72px] rounded-full object-cover ring-4 ring-surface bg-surface-2"
        />
        {online && (
          <span
            title="Online"
            className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-online ring-2 ring-surface"
          />
        )}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="mt-2 font-semibold text-fg truncate max-w-full hover:underline cursor-pointer"
      >
        {user.fullName}
      </button>
      {user.username && <p className="text-sm text-accent-text truncate max-w-full">@{user.username}</p>}
      {meta && <p className="mt-0.5 text-xs text-subtle truncate max-w-full">{meta}</p>}

      <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2 min-h-[2.75rem] break-words">
        {user.bio || "Hey there! I'm on QuickChat."}
      </p>

      <div className="mt-auto pt-4 w-full flex gap-2">{children}</div>
    </div>
  </article>
);

// Placeholder card shown while loading
export const PersonCardSkeleton = () => (
  <div className="rounded-2xl border border-line bg-surface overflow-hidden animate-pulse">
    <div className="h-16 bg-surface-3" />
    <div className="flex flex-col items-center px-4 pb-4 -mt-9">
      <div className="w-[72px] h-[72px] rounded-full bg-surface-3 ring-4 ring-surface" />
      <div className="mt-3 h-3 w-24 rounded bg-surface-3" />
      <div className="mt-2 h-2.5 w-16 rounded bg-surface-3" />
      <div className="mt-4 h-2.5 w-full rounded bg-surface-3" />
      <div className="mt-1.5 h-2.5 w-3/4 rounded bg-surface-3" />
      <div className="mt-5 h-9 w-full rounded-full bg-surface-3" />
    </div>
  </div>
);

export default PersonCard;
