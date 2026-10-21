import React, { useContext } from "react";
import assets from "../assets/assets";
import { FriendContext } from "../../context/FriendContext";
import { formatSidebarTime } from "../lib/utils";

const smallBtn =
  "text-xs px-3 py-1.5 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const RequestRow = ({ request, children }) => (
  <div className="flex items-center gap-3 p-2 pl-3 rounded-lg hover:bg-[#282142]/40">
    <img
      src={request.user.profilePic || assets.avatar_icon}
      alt=""
      className="w-[38px] aspect-square rounded-full object-cover shrink-0"
    />
    <div className="flex flex-col leading-5 min-w-0 flex-1">
      <p className="truncate">{request.user.fullName}</p>
      <p className="text-xs text-gray-400 truncate">
        {request.user.username && <span className="text-violet-300">@{request.user.username} · </span>}
        {formatSidebarTime(request.createdAt)}
      </p>
    </div>
    <div className="flex gap-1.5 shrink-0">{children}</div>
  </div>
);

// Friend requests I received and sent
const RequestsPanel = ({ onOpenChat, onDiscover }) => {
  const { incoming, outgoing, busy, acceptRequest, declineRequest, cancelRequest } =
    useContext(FriendContext);

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="text-center text-sm text-gray-400 mt-10 px-4">
        <p>No pending requests.</p>
        <button
          type="button"
          onClick={onDiscover}
          className="mt-3 text-violet-400 hover:underline cursor-pointer"
        >
          Find people to chat with
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {incoming.length > 0 && (
        <section>
          <p className="text-xs text-gray-400 mb-2 px-1">Received ({incoming.length})</p>
          <div className="flex flex-col gap-1">
            {incoming.map((request) => {
              const isBusy = !!busy[request.user._id];
              return (
                <RequestRow key={request._id} request={request}>
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
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => declineRequest(request)}
                    className={`${smallBtn} border border-gray-500 text-gray-300 hover:border-red-400 hover:text-red-300`}
                  >
                    Decline
                  </button>
                </RequestRow>
              );
            })}
          </div>
        </section>
      )}

      {outgoing.length > 0 && (
        <section>
          <p className="text-xs text-gray-400 mb-2 px-1">Sent ({outgoing.length})</p>
          <div className="flex flex-col gap-1">
            {outgoing.map((request) => (
              <RequestRow key={request._id} request={request}>
                <button
                  type="button"
                  disabled={!!busy[request.user._id]}
                  onClick={() => cancelRequest(request)}
                  className={`${smallBtn} border border-gray-500 text-gray-300 hover:border-red-400 hover:text-red-300`}
                >
                  Cancel
                </button>
              </RequestRow>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default RequestsPanel;
