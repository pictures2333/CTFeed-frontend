import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { User } from "../../api/types";

type UserSectionProps = {
  selectedUserId: string | null;
  onSelectUser: (id: string) => void;
};

export default function UserSection({ selectedUserId, onSelectUser }: UserSectionProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const load = async () => {
      const result = await apiRequest<User[]>(API_ENDPOINTS.users.list);
      if (result.ok && result.data) {
        setUsers(result.data);
        const nextSelected =
          result.data.find((user) => user.discord_id === selectedUserId) ??
          result.data[0] ??
          null;
        setSelected(nextSelected);
        if (nextSelected && nextSelected.discord_id !== selectedUserId) {
          onSelectUser(nextSelected.discord_id);
        }
        setNotice("");
      } else {
        setUsers([]);
        setSelected(null);
        setNotice(result.error ?? "Failed to load users");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    const loadById = async () => {
      const result = await apiRequest<User[]>(API_ENDPOINTS.users.detail(selectedUserId));
      const user = result.ok && result.data ? result.data[0] : null;
      if (!user) return;
      setSelected(user);
      setUsers((prev) =>
        prev.some((item) => item.discord_id === user.discord_id)
          ? prev.map((item) => (item.discord_id === user.discord_id ? user : item))
          : prev
      );
    };
    loadById();
  }, [selectedUserId]);

  return (
    <section className="section">
      <div className="section-header">
        <h2>Users</h2>
      </div>
      {notice && <p className="notice">{notice}</p>}
      <div className="grid">
        <div className="list scrollable">
          {users.length === 0 && <p className="muted">No users found.</p>}
          {users.map((user) => (
            <button
              key={user.discord_id}
              type="button"
              className={selected?.discord_id === user.discord_id ? "list-item active" : "list-item"}
              onClick={() => {
                setSelected(user);
                onSelectUser(user.discord_id);
              }}
            >
              <div className="list-title">
                {user.discord?.display_name ?? user.discord?.name ?? `User ${user.discord_id}`}
              </div>
              <div className="list-meta">
                <span>{user.status}</span>
                <span>{(user.events ?? []).length} events</span>
              </div>
            </button>
          ))}
        </div>
        <div className="detail">
          {selected ? (
            <div className="detail-card">
              <h3>{selected.discord?.display_name ?? selected.discord?.name ?? "User"}</h3>
              <p className="muted">Discord ID: {selected.discord_id}</p>
              <p>Status: {selected.status}</p>
              <p>Skills: {(selected.skills ?? []).join(", ") || "N/A"}</p>
              <p>Rhythm Games: {(selected.rhythm_games ?? []).join(", ") || "N/A"}</p>
              <div className="detail-sub">
                <span className="label">Events</span>
                <ul>
                  {(selected.events ?? []).map((event) => (
                    <li key={event.id}>{event.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="muted">Select a user to view details.</p>
          )}
        </div>
      </div>
    </section>
  );
}
