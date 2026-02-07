import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { GeneralResponse, User } from "../../api/types";
import { RHYTHM_OPTIONS, SKILL_OPTIONS, STATUS_OPTIONS } from "../../constants/userOptions";
import Modal from "../../components/Modal";

export default function MeSection() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [status, setStatus] = useState<string>("");
  const [skills, setSkills] = useState<string[]>([]);
  const [rhythmGames, setRhythmGames] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  const loadProfile = async () => {
    setLoading(true);
    const result = await apiRequest<User>(API_ENDPOINTS.auth.me);
    if (result.ok && result.data) {
      setUser(result.data);
      setStatus(result.data.status);
      setSkills(result.data.skills ?? []);
      setRhythmGames(result.data.rhythm_games ?? []);
      setNotice("");
    } else {
      setUser(null);
      const detail = result.errorData
        ? `\n${JSON.stringify(result.errorData, null, 2)}`
        : "";
      setNotice(detail ? `${result.error ?? "Failed to load profile"}${detail}` : result.error ?? "Failed to load profile");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleItem = (value: string, list: string[], setter: (next: string[]) => void) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      status,
      skills,
      rhythm_games: rhythmGames,
    };
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.auth.me, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setModalTitle(result.ok ? "Success" : "Failed");
    const detail = result.ok
      ? ""
      : result.errorData
        ? `\n${JSON.stringify(result.errorData, null, 2)}`
        : "";
    setModalMessage(
      result.ok
        ? "Profile updated"
        : `${result.error ?? "Failed to update profile"}${detail}`
    );
    setModalOpen(true);
    await loadProfile();
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2>Me</h2>
      </div>
      {notice && <p className="notice">{notice}</p>}
      {loading && <p className="muted">Loading...</p>}
      {user && (
        <div className="grid">
          <div className="detail-card">
            <h3>{user.discord?.display_name ?? user.discord?.name ?? "User"}</h3>
            <p className="muted">Discord ID: {user.discord_id}</p>
            <p>Status: {user.status}</p>
            <p>Skills: {(user.skills ?? []).join(", ") || "N/A"}</p>
            <p>Rhythm Games: {(user.rhythm_games ?? []).join(", ") || "N/A"}</p>
          </div>
          <form className="detail-card form" onSubmit={handleSubmit}>
            <h3>Update Profile</h3>
            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="label">Skills</span>
              <div className="tag-grid">
                {SKILL_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={skills.includes(option) ? "tag active" : "tag"}
                    onClick={() => toggleItem(option, skills, setSkills)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="label">Rhythm Games</span>
              <div className="tag-grid">
                {RHYTHM_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={rhythmGames.includes(option) ? "tag active" : "tag"}
                    onClick={() => toggleItem(option, rhythmGames, setRhythmGames)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" className="primary">
              Save Changes
            </button>
          </form>
        </div>
      )}
      <Modal
        open={modalOpen}
        variant="alert"
        title={modalTitle}
        message={modalMessage}
        onCancel={() => setModalOpen(false)}
        onConfirm={() => setModalOpen(false)}
      />
    </section>
  );
}
