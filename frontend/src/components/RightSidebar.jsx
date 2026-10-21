import React, { useContext, useMemo } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);

  // All images shared in this conversation, newest first
  const msgImages = useMemo(
    () => messages.filter((msg) => msg.image).map((msg) => msg.image).reverse(),
    [messages]
  );

  if (!selectedUser) return null;

  return (
    <div className="bg-[#8185B2]/10 text-white w-full h-full flex flex-col overflow-hidden border-l border-white/10 max-xl:hidden">
      <div className="pt-12 flex flex-col items-center gap-2 text-xs font-light px-6 text-center">
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=""
          className="w-20 aspect-square rounded-full object-cover"
        />
        <h1 className="text-xl font-medium flex items-center gap-2">
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          )}
          {selectedUser.fullName}
        </h1>
        {selectedUser.bio && <p className="text-gray-300 break-words">{selectedUser.bio}</p>}
      </div>

      <hr className="border-[#ffffff50] my-4" />

      <div className="px-5 text-xs flex-1 min-h-0 flex flex-col">
        <p>Media</p>
        {msgImages.length === 0 ? (
          <p className="mt-2 text-gray-400">No media shared yet</p>
        ) : (
          <div className="mt-2 overflow-y-auto grid grid-cols-2 gap-3 opacity-90 pb-2">
            {msgImages.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="rounded">
                <img src={url} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-md" />
              </a>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={logout}
        className="mx-auto my-5 shrink-0 bg-gradient-to-r from-purple-400 to-violet-600 text-white text-sm font-light py-2 px-16 rounded-full cursor-pointer"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
