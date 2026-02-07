import { useEffect, useState } from "react";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import type { EventItem, GeneralResponse } from "../../api/types";
import { formatTimestampToLocal } from "../../utils/date";
import Modal from "../../components/Modal";

type EventType = "ctftime" | "custom";

type EventSectionProps = {
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
};

export default function EventSection({ selectedEventId, onSelectEvent }: EventSectionProps) {
  const [eventType, setEventType] = useState<EventType>("ctftime");
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalVariant, setModalVariant] = useState<"alert" | "confirm" | "input">("alert");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalInputLabel, setModalInputLabel] = useState("");
  const [modalInputPlaceholder, setModalInputPlaceholder] = useState("");
  const [modalInputDefault, setModalInputDefault] = useState("");
  const [modalConfirmLabel, setModalConfirmLabel] = useState("OK");
  const [modalAction, setModalAction] = useState<(value?: string) => void>(() => () => {});

  const formatErrorDetails = (result: { errorData?: unknown | null }) => {
    if (!result.errorData) return "";
    try {
      return JSON.stringify(result.errorData, null, 2);
    } catch {
      return String(result.errorData);
    }
  };

  const openAlert = (title: string, message: string, details?: string) => {
    setModalTitle(title);
    setModalMessage(details ? `${message}\n${details}` : message);
    setModalVariant("alert");
    setModalConfirmLabel("OK");
    setModalAction(() => () => setModalOpen(false));
    setModalOpen(true);
  };

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalVariant("confirm");
    setModalConfirmLabel("Confirm");
    setModalAction(() => () => onConfirm());
    setModalOpen(true);
  };

  const openInputModal = (
    title: string,
    message: string,
    inputLabel: string,
    inputPlaceholder: string,
    onConfirm: (value: string) => void
  ) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalInputLabel(inputLabel);
    setModalInputPlaceholder(inputPlaceholder);
    setModalInputDefault("");
    setModalVariant("input");
    setModalConfirmLabel("Confirm");
    setModalAction(() => (value?: string) => onConfirm(value ?? ""));
    setModalOpen(true);
  };

  const loadEvents = async (nextType = eventType, nextArchivedOnly = archivedOnly) => {
    setLoading(true);
    const query = new URLSearchParams({
      type: nextType,
      archived: nextArchivedOnly ? "true" : "false",
    }).toString();
    const result = await apiRequest<EventItem[]>(`${API_ENDPOINTS.events.list}?${query}`);
    if (result.ok && result.data) {
      setEvents(result.data);
      const nextSelected =
        result.data.find((event) => event.id === selectedEventId) ?? result.data[0] ?? null;
      setSelected(nextSelected);
      if (nextSelected && nextSelected.id !== selectedEventId) {
        onSelectEvent(nextSelected.id);
      }
      setNotice("");
    } else {
      setEvents([]);
      setSelected(null);
      const detail = formatErrorDetails(result);
      setNotice(detail ? `${result.error ?? "Failed to load events"}\n${detail}` : result.error ?? "Failed to load events");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, archivedOnly]);

  useEffect(() => {
    if (!selectedEventId) return;
    const loadById = async () => {
      const result = await apiRequest<EventItem[]>(API_ENDPOINTS.events.detail(selectedEventId));
      const event = result.ok && result.data ? result.data[0] : null;
      if (!event) {
        return;
      }
      if (event.type !== eventType) {
        setEventType(event.type);
      }
      if (event.archived !== archivedOnly) {
        setArchivedOnly(event.archived);
      }
      setSelected(event);
      setEvents((prev) =>
        prev.some((item) => item.id === event.id)
          ? prev.map((item) => (item.id === event.id ? { ...item, ...event } : item))
          : prev
      );
    };
    loadById();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const handleCreateCustom = async () => {
    openInputModal(
      "Create Custom Event",
      "Enter event title and confirm.",
      "Event Title",
      "Custom event title",
      async (value) => {
      if (!value.trim()) {
        openAlert("Invalid Input", "Please enter a title.");
        return;
      }
      const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.createCustom, {
        method: "POST",
        body: JSON.stringify({ title: value.trim() }),
      });
      if (!result.ok) {
        openAlert("Failed", result.error ?? "Failed to create event", formatErrorDetails(result));
        return;
      }
      openAlert("Success", "Custom event created");
      setEventType("custom");
      await loadEvents("custom", archivedOnly);
    }
    );
  };

  const handleJoin = async () => {
    if (!selected) return;
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.join(selected.id), {
      method: "PATCH",
    });
    openAlert(
      result.ok ? "Success" : "Failed",
      result.ok ? "Join request sent" : result.error ?? "Failed to join event",
      result.ok ? "" : formatErrorDetails(result)
    );
    if (result.ok) {
      const detail = await apiRequest<EventItem[]>(API_ENDPOINTS.events.detail(selected.id));
      const event = detail.ok && detail.data ? detail.data[0] : null;
      if (event) {
        setSelected(event);
        setEvents((prev) =>
          prev.some((item) => item.id === event.id)
            ? prev.map((item) => (item.id === event.id ? { ...item, ...event } : item))
            : prev
        );
      }
    }
  };

  const handleArchive = async () => {
    if (!selected) return;
    openConfirm("Archive Event", "Archive this event? PM permission required.", async () => {
      const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.archive(selected.id), {
        method: "PATCH",
      });
      openAlert(
        result.ok ? "Success" : "Failed",
        result.ok ? "Archive request sent" : result.error ?? "Failed to archive event",
        result.ok ? "" : formatErrorDetails(result)
      );
      if (result.ok) {
        const detail = await apiRequest<EventItem[]>(API_ENDPOINTS.events.detail(selected.id));
        const event = detail.ok && detail.data ? detail.data[0] : null;
        if (event) {
          setSelected(event);
          setEvents((prev) =>
            prev.some((item) => item.id === event.id)
              ? prev.map((item) => (item.id === event.id ? { ...item, ...event } : item))
              : prev
          );
        }
      }
    });
  };

  const handleRelink = async (channelIdValue: string) => {
    if (!selected) return;
    if (!/^\d+$/.test(channelIdValue)) {
      openAlert("Invalid Input", "Please provide a valid channel ID");
      return;
    }
    const result = await apiRequest<GeneralResponse>(API_ENDPOINTS.events.relink(selected.id), {
      method: "PATCH",
      body: JSON.stringify({ channel_id: channelIdValue }),
    });
    openAlert(
      result.ok ? "Success" : "Failed",
      result.ok ? "Relink request sent" : result.error ?? "Failed to relink event",
      result.ok ? "" : formatErrorDetails(result)
    );
    if (result.ok) {
      const detail = await apiRequest<EventItem[]>(API_ENDPOINTS.events.detail(selected.id));
      const event = detail.ok && detail.data ? detail.data[0] : null;
      if (event) {
        setSelected(event);
        setEvents((prev) =>
          prev.some((item) => item.id === event.id)
            ? prev.map((item) => (item.id === event.id ? { ...item, ...event } : item))
            : prev
        );
      }
    }
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2>Events</h2>
        <div className="filters">
          {eventType === "custom" && (
            <button type="button" className="secondary" onClick={handleCreateCustom}>
              New Custom Event
            </button>
          )}
          <div className="segmented">
            <button
              type="button"
              className={eventType === "ctftime" ? "active" : ""}
              onClick={() => setEventType("ctftime")}
            >
              CTFTime
            </button>
            <button
              type="button"
              className={eventType === "custom" ? "active" : ""}
              onClick={() => setEventType("custom")}
            >
              Custom
            </button>
          </div>
          <div className="segmented">
            <button
              type="button"
              className={!archivedOnly ? "active" : ""}
              onClick={() => setArchivedOnly(false)}
            >
              Active
            </button>
            <button
              type="button"
              className={archivedOnly ? "active" : ""}
              onClick={() => setArchivedOnly(true)}
            >
              Archived
            </button>
          </div>
        </div>
      </div>
      {notice && <p className="notice">{notice}</p>}
      <div className="grid">
        <div className="list scrollable">
          {loading && <p className="muted">Loading...</p>}
          {!loading && events.length === 0 && <p className="muted">No events found.</p>}
          {!loading &&
            events.map((event) => (
              <button
                key={event.id}
                type="button"
                className={selected?.id === event.id ? "list-item active" : "list-item"}
                onClick={() => {
                  setSelected(event);
                  onSelectEvent(event.id);
                }}
              >
                <div className="list-title">{event.title}</div>
                <div className="list-meta">
                  <span>{event.type}</span>
                  {event.archived && <span className="badge">Archived</span>}
                </div>
              </button>
            ))}
        </div>
        <div className="detail">
          {selected ? (
            <div className="detail-card">
              <h3>{selected.title}</h3>
              <div className="detail-grid">
                <div>
                  <span className="label">Event ID</span>
                  <span>{selected.event_id ?? "N/A"}</span>
                </div>
                <div>
                  <span className="label">Database ID</span>
                  <span>{selected.id}</span>
                </div>
                <div>
                  <span className="label">Start</span>
                  <span>{formatTimestampToLocal(selected.start)}</span>
                </div>
                <div>
                  <span className="label">Finish</span>
                  <span>{formatTimestampToLocal(selected.finish)}</span>
                </div>
                <div>
                  <span className="label">Channel</span>
                  <span>{selected.channel?.name ?? "N/A"}</span>
                </div>
                <div>
                  <span className="label">Participants</span>
                  <span>{selected.users?.length ?? 0}</span>
                </div>
              </div>
              {selected.channel?.jump_url && (
                <a className="link" href={selected.channel.jump_url} target="_blank" rel="noreferrer">
                  Open Discord Channel
                </a>
              )}
              <div className="actions">
                <button type="button" className="primary" onClick={handleJoin}>
                  Join Channel
                </button>
                <button type="button" className="secondary" onClick={handleArchive}>
                  (PM) Archive
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    openInputModal(
                      "Relink Channel",
                      "Provide a channel ID and confirm.",
                      "Channel ID",
                      "Channel ID",
                      async (value) => {
                        await handleRelink(value);
                      }
                    );
                  }}
                >
                  (PM) Relink
                </button>
              </div>
            </div>
          ) : (
            <p className="muted">Select an event to view details.</p>
          )}
        </div>
      </div>
      <Modal
        open={modalOpen}
        variant={modalVariant}
        title={modalTitle}
        message={modalMessage}
        inputLabel={modalInputLabel}
        inputPlaceholder={modalInputPlaceholder}
        inputDefaultValue={modalInputDefault}
        confirmLabel={modalConfirmLabel}
        onCancel={() => setModalOpen(false)}
        onConfirm={(value) => {
          setModalOpen(false);
          modalAction(value);
        }}
      />
    </section>
  );
}
