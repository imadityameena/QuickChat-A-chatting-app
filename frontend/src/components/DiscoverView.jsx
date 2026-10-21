import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { FriendContext } from "../../context/FriendContext";
import { formatLastSeen } from "../lib/utils";
import PageShell, { CardGrid, EmptyState, FilterChips } from "./PageShell";
import PersonCard, { PersonCardSkeleton } from "./PersonCard";
import { cardButton } from "../lib/ui";
import { CheckIcon, ClockIcon, SearchIcon, UserPlusIcon, UsersIcon, XIcon } from "./icons";

// Full-page grid of people to add as friends
const DiscoverView = () => {
  const { onlineUsers } = useContext(AuthContext);
  const {
    discoverUsers,
    discoverLoading,
    busy,
    searchDiscover,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    openProfile,
  } = useContext(FriendContext);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  // Search on the server once typing pauses
  useEffect(() => {
    const id = setTimeout(() => searchDiscover(search.trim()), search ? 300 : 0);
    return () => clearTimeout(id);
  }, [search, searchDiscover]);

  const isOnline = (u) => onlineUsers.includes(u._id);
  const counts = {
    all: discoverUsers.length,
    online: discoverUsers.filter(isOnline).length,
    received: discoverUsers.filter((u) => u.status === "received").length,
    sent: discoverUsers.filter((u) => u.status === "sent").length,
  };
  const shown = discoverUsers
    .filter((u) => filter === "all" || (filter === "online" ? isOnline(u) : u.status === filter))
    // online people first, otherwise keep the server's newest-first order
    .sort((a, b) => Number(isOnline(b)) - Number(isOnline(a)));

  const actions = (user) => {
    const isBusy = !!busy[user._id];
    const request = { _id: user.requestId, user };

    if (user.status === "received") {
      return (
        <>
          <button type="button" disabled={isBusy} onClick={() => acceptRequest(request)} className={cardButton.success}>
            <CheckIcon /> Accept
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => declineRequest(request)}
            aria-label={`Decline ${user.fullName}`}
            title="Decline"
            className={`${cardButton.ghost} flex-none w-9`}
          >
            <XIcon />
          </button>
        </>
      );
    }
    if (user.status === "sent") {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => cancelRequest(request)}
          title="Cancel request"
          className={`${cardButton.ghost} group/btn`}
        >
          <ClockIcon className="w-4 h-4 group-hover/btn:hidden" />
          <XIcon className="w-4 h-4 hidden group-hover/btn:block" />
          <span className="group-hover/btn:hidden">Requested</span>
          <span className="hidden group-hover/btn:inline">Cancel request</span>
        </button>
      );
    }
    return (
      <button type="button" disabled={isBusy} onClick={() => sendRequest(user)} className={cardButton.primary}>
        <UserPlusIcon /> Add friend
      </button>
    );
  };

  const toolbar = (
    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
      <label className="flex items-center gap-2 w-full lg:max-w-sm bg-[#282142] rounded-full px-4 py-2.5 focus-within:ring-2 focus-within:ring-violet-500">
        <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="search"
          placeholder="Search by name or @username"
          className="flex-1 min-w-0 bg-transparent outline-none text-base sm:text-sm placeholder-gray-400"
        />
      </label>
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { id: "all", label: "All", count: counts.all },
          { id: "online", label: "Online", count: counts.online },
          ...(counts.received ? [{ id: "received", label: "Wants to connect", count: counts.received }] : []),
          ...(counts.sent ? [{ id: "sent", label: "Requested", count: counts.sent }] : []),
        ]}
      />
    </div>
  );

  let content;
  if (discoverLoading && discoverUsers.length === 0) {
    content = (
      <CardGrid>
        {Array.from({ length: 8 }, (_, i) => (
          <PersonCardSkeleton key={i} />
        ))}
      </CardGrid>
    );
  } else if (shown.length === 0) {
    content = search.trim() ? (
      <EmptyState Icon={SearchIcon} title="No one found" text={`Nobody matches "${search.trim()}". Try another name or username.`} />
    ) : filter !== "all" ? (
      <EmptyState Icon={UsersIcon} title="Nobody here right now" text="Try a different filter." />
    ) : (
      <EmptyState Icon={UsersIcon} title="You're friends with everyone here 🎉" text="New people will show up here when they join QuickChat." />
    );
  } else {
    content = (
      <CardGrid>
        {shown.map((user) => (
          <PersonCard
            key={user._id}
            user={user}
            onOpen={() => openProfile(user)}
            online={isOnline(user)}
            badge={user.status === "received" ? "Wants to connect" : null}
            meta={isOnline(user) ? "Online now" : formatLastSeen(user.lastSeen)}
          >
            {actions(user)}
          </PersonCard>
        ))}
      </CardGrid>
    );
  }

  return (
    <PageShell
      title="Discover people"
      subtitle="Find friends on QuickChat. Once they accept your request, you can start chatting."
      toolbar={toolbar}
    >
      {content}
    </PageShell>
  );
};

export default DiscoverView;
