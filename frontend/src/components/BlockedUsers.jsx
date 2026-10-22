import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FriendContext } from "../../context/FriendContext";
import { avatarSrc } from "../lib/images";
import { button } from "../lib/ui";

// List of people you've blocked, with an Unblock button for each (Edit profile page)
const BlockedUsers = () => {
  const { axios } = useContext(AuthContext);
  const { unblockUser, busy } = useContext(FriendContext);
  const [users, setUsers] = useState(null); // null while loading

  useEffect(() => {
    axios
      .get("/api/friends/blocked")
      .then(({ data }) => setUsers(data.success ? data.users : []))
      .catch(() => setUsers([]));
  }, [axios]);

  const unblock = async (user) => {
    if (await unblockUser(user)) setUsers((prev) => prev.filter((u) => u._id !== user._id));
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Blocked people</p>
      {users === null ? (
        <p className="text-xs text-subtle">Loading…</p>
      ) : users.length === 0 ? (
        <p className="text-xs text-muted">You haven't blocked anyone.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {users.map((user) => (
            <li key={user._id} className="flex items-center gap-3 py-1.5">
              <img src={avatarSrc(user, 32)} alt="" className="w-8 h-8 rounded-full object-cover bg-surface-2" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{user.fullName}</p>
                {user.username && <p className="text-xs text-subtle truncate">@{user.username}</p>}
              </div>
              <button
                type="button"
                disabled={!!busy[user._id]}
                onClick={() => unblock(user)}
                className={`${button.secondary} !h-8 !px-3 text-xs`}
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BlockedUsers;
