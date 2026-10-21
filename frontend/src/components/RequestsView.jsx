import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import { FriendContext } from "../../context/FriendContext";
import { timeAgo } from "../lib/utils";
import PageShell, { CardGrid, EmptyState, FilterChips } from "./PageShell";
import PersonCard from "./PersonCard";
import { cardButton } from "../lib/ui";
import { CheckIcon, CompassIcon, InboxIcon, XIcon } from "./icons";

// Full-page view of friend requests received and sent
const RequestsView = () => {
  const { onlineUsers } = useContext(AuthContext);
  const { setView } = useContext(ChatContext);
  const { incoming, outgoing, busy, loadRequests, acceptRequest, declineRequest, cancelRequest } =
    useContext(FriendContext);
  const { openProfile } = useContext(FriendContext);
  const [tab, setTab] = useState(() => (incoming.length === 0 && outgoing.length > 0 ? "sent" : "received"));

  // Refresh when the page opens
  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const list = tab === "received" ? incoming : outgoing;

  const findPeople = (
    <button type="button" onClick={() => setView("discover")} className={`${cardButton.primary} px-5`}>
      <CompassIcon /> Discover people
    </button>
  );

  return (
    <PageShell
      title="Friend requests"
      subtitle="Accept a request to add someone to your chats."
      toolbar={
        <FilterChips
          value={tab}
          onChange={setTab}
          options={[
            { id: "received", label: "Received", count: incoming.length },
            { id: "sent", label: "Sent", count: outgoing.length },
          ]}
        />
      }
    >
      {list.length === 0 ? (
        <EmptyState
          Icon={InboxIcon}
          title={tab === "received" ? "No new requests" : "No pending requests"}
          text={
            tab === "received"
              ? "When someone sends you a friend request, it will show up here."
              : "Requests you send will show up here until they're accepted."
          }
          action={findPeople}
        />
      ) : (
        <CardGrid>
          {list.map((request) => {
            const { user } = request;
            const isBusy = !!busy[user._id];
            return (
              <PersonCard
                key={request._id}
                user={user}
                onOpen={() => openProfile(user)}
                online={onlineUsers.includes(user._id)}
                meta={`${tab === "received" ? "Received" : "Sent"} ${timeAgo(request.createdAt)}`}
              >
                {tab === "received" ? (
                  <>
                    <button type="button" disabled={isBusy} onClick={() => acceptRequest(request)} className={cardButton.success}>
                      <CheckIcon /> Accept
                    </button>
                    <button type="button" disabled={isBusy} onClick={() => declineRequest(request)} className={cardButton.ghost}>
                      Decline
                    </button>
                  </>
                ) : (
                  <button type="button" disabled={isBusy} onClick={() => cancelRequest(request)} className={cardButton.ghost}>
                    <XIcon /> Cancel request
                  </button>
                )}
              </PersonCard>
            );
          })}
        </CardGrid>
      )}
    </PageShell>
  );
};

export default RequestsView;
