import { useState } from "react";
import type { User } from "../types";

// TODO: Wire to real API when endpoint exists.
interface RosterMember {
  id: string;
  name: string;
  avatar_url: string | null;
  tier: "admin" | "moderator" | "user";
  isOwner?: boolean;
}

const INITIAL_ROSTER: RosterMember[] = [
  { id: "mem-1", name: "waaaarkzi", avatar_url: null, tier: "admin", isOwner: true },
  { id: "mem-2", name: "DJ Söze", avatar_url: null, tier: "moderator" },
  { id: "mem-3", name: "Nightowl", avatar_url: null, tier: "user" },
  { id: "mem-4", name: "Cassiopeia", avatar_url: null, tier: "user" },
  { id: "mem-5", name: "The Hermit", avatar_url: null, tier: "moderator" },
];

interface AdminProps {
  user: User;
}

export default function Admin({ user }: AdminProps) {
  const [roster, setRoster] = useState<RosterMember[]>(INITIAL_ROSTER);

  // Internal admin tier guard
  if (user.tier !== "admin") {
    return (
      <div className="main-container p-8 lg:p-10 w-full h-full flex items-center justify-center">
        <section className="paper-sculpted-panel p-8 text-center flex flex-col items-center gap-4 max-w-md">
          <h2 className="stamped-title text-2xl text-[#FF410D]">ACCESS DENIED</h2>
          <p className="font-mono text-sm text-[#C6C6C6]">
            ADMINISTRATIVE PERMISSION REQUIRED.
          </p>
        </section>
      </div>
    );
  }

  const handlePromote = (id: string) => {
    setRoster((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, tier: "moderator" };
        }
        return m;
      })
    );
  };

  const handleDemote = (id: string) => {
    setRoster((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          return { ...m, tier: "user" };
        }
        return m;
      })
    );
  };

  const handleAddMember = () => {
    const name = prompt("Enter member name:");
    if (!name) return;
    const newMember: RosterMember = {
      id: `mem-${Date.now()}`,
      name: name.trim(),
      avatar_url: null,
      tier: "user",
    };
    setRoster((prev) => [...prev, newMember]);
  };

  // Stacked nameplate rotation angles matching admin.html
  const getRotationStyle = (index: number) => {
    const rotations = [-0.4, 0.3, -0.2, 0.4, -0.3];
    const rot = rotations[index % rotations.length];
    return { transform: `rotate(${rot}deg)` };
  };

  return (
    <section className="admin-roster-panel paper-sculpted-panel flex flex-col p-8 gap-4 w-full h-full">
      {/* Admin Header */}
      <div className="admin-header flex items-end justify-between mb-2">
        <div className="admin-header-title-box flex flex-col gap-1">
          <h2 className="admin-title stamped-title text-3xl">Admin</h2>
          <span className="admin-subtitle text-xs font-mono tracking-widest text-[#55503E]">
            ROSTER MANAGEMENT
          </span>
        </div>

        <button className="add-member-btn" onClick={handleAddMember}>
          <span>+ Add Member</span>
        </button>
      </div>

      <div className="deco-divider mb-4" />

      {/* Stacked Brass Nameplates Roster */}
      <div className="nameplates-list flex-1 flex flex-col gap-4 items-center overflow-y-auto py-2">
        {roster.map((member, idx) => (
          <div
            key={member.id}
            className="brass-nameplate flex items-center justify-between px-7 py-4"
            style={getRotationStyle(idx)}
          >
            <div className="member-info-left flex items-center gap-5">
              <span className="member-name stamped-title text-lg">{member.name}</span>
              {member.tier === "admin" && (
                <span className="stamped-role-tag tag-admin">ADMIN</span>
              )}
              {member.tier === "moderator" && (
                <span className="stamped-role-tag tag-mod">MODERATOR</span>
              )}
              {member.tier === "user" && (
                <span className="stamped-role-tag tag-member">MEMBER</span>
              )}
            </div>

            {member.isOwner ? (
              <span className="owner-guild-label text-xs font-mono tracking-widest text-[#8A55B3]">
                GUILD OWNER
              </span>
            ) : member.tier === "moderator" ? (
              <button
                className="mech-toggle-btn btn-demote"
                onClick={() => handleDemote(member.id)}
              >
                Demote
              </button>
            ) : (
              <button
                className="mech-toggle-btn btn-promote"
                onClick={() => handlePromote(member.id)}
              >
                Promote
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer info strip */}
      <div className="flex items-center justify-between text-xs font-mono text-[#C6C6C6] pt-2 border-t border-[#FFEFD7]/10">
        <div>ADMIN ROSTER · {roster.length} MEMBERS REGISTERED</div>
        <div>ADMINISTRATIVE TIER ONLY</div>
      </div>
    </section>
  );
}
