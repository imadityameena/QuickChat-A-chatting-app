import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { FriendContext } from "../../context/FriendContext";

const smallBtn =
  "text-xs px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0";

// Find people and send them friend requests
const DiscoverPanel = ({ onOpenChat }) => {
  const { onlineUsers } = useContext(AuthContext);
  const {
    discoverUsers,
    discoverLoading,
    busy,
    searchDiscover,
    sendRequest,
    acceptRequest,
    cancelRequest,
  } = useContext(FriendContext);
  const [search, setSearch] = useState("");

  // Search on the server, waiting until typing pauses
  useEffect(() => {
    const id = setTimeout(() => searchDiscover(search.trim()), search ? 300 : 0);
    return () => clearTimeout(id);
  }, [search, searchDiscover]);

  const actionFor = (user) => {
    const isBusy = !!busy[user._id];
    const request = { _id: user.requestId, user };

    if (user.status === "sent") {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => cancelRequest(request)}
          className={`${smallBtn} border border-gray-500 text-gray-300 hover:border-red-400 hover:text-red-300`}
          title="Cancel request"
        >
          Requested
        </button>
      );
    }
    if (user.status === "received") {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={async () => {
            const friend = await acceptRequest(request);
            if (friend) onOpenChat(friend);
          }}
          className={`${smallBtn} bg-green-600 hover:bg-green-500`}
        >
          Accept
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled={isBusy}
        onClick={async () => {
          const friend = await sendRequest(user);
          if (friend) onOpenChat(friend);
        }}
        className={`${smallBtn} bg-violet-600 hover:bg-violet-500`}
      >
        + Add
      </button>
    );
  };

  return (
    <>
      <div className="bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4">
        <img src={assets.search_icon} alt="" className="w-3" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="search"
          className="bg-transparent border-none outline-none text-white text-base sm:text-xs placeholder-[#c8c8c8] flex-1 min-w-0"
          placeholder="Search by name or @username..."
        />
      </div>

      <p className="text-xs text-gray-400 mt-4 mb-2 px-1">
        {search.trim() ? "Search results" : "People on QuickChat"}
      </p>

      <div className="flex flex-col gap-1">
        {discoverLoading && discoverUsers.length === 0 && (
          <div className="mx-auto mt-6 w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        )}

        {!discoverLoading && discoverUsers.length === 0 && (
          <p className="text-center text-sm text-gray-400 mt-6">
            {search.trim() ? "No one matches your search" : "You're friends with everyone here 🎉"}
          </p>
        )}

        {discoverUsers.map((user) => (
          <div key={user._id} className="flex items-center gap-3 p-2 pl-3 rounded-lg hover:bg-[#282142]/40">
            <div className="relative shrink-0">
              <img
                src={user.profilePic || assets.avatar_icon}
                alt=""
                className="w-[38px] aspect-square rounded-full object-cover"
              />
              {onlineUsers.includes(user._id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-[#1d1838]" />
              )}
            </div>
            <div className="flex flex-col leading-5 min-w-0 flex-1">
              <p className="truncate">{user.fullName}</p>
              <p className="text-xs text-neutral-400 truncate">
                {user.username && <span className="text-violet-300">@{user.username}</span>}
                {user.username && " · "}
                {user.status === "received" ? "Wants to be your friend" : user.bio || "Hey there! I'm on QuickChat"}
              </p>
            </div>
            {actionFor(user)}
          </div>
        ))}
      </div>
    </>
  );
};

export default DiscoverPanel;
