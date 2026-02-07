import { useEffect, useRef, useState } from "react";
import { APP_CONFIG } from "../config";

type SectionKey = "events" | "me" | "users" | "config";

type TopBarProps = {
  section: SectionKey;
  onSectionChange: (section: SectionKey) => void;
  onLogout: () => void;
  userName: string;
};

const MENU_ITEMS: { key: SectionKey; label: string }[] = [
  { key: "events", label: "Events" },
  { key: "me", label: "Me" },
  { key: "users", label: "Users" },
  { key: "config", label: "Config" },
];

export default function TopBar({ section, onSectionChange, onLogout, userName }: TopBarProps) {
  const menuItems = MENU_ITEMS.map((item) =>
    item.key === "me" ? { ...item, label: userName } : item
  );
  const orderedMenuItems = [
    ...menuItems.filter((item) => item.key !== "me"),
    ...menuItems.filter((item) => item.key === "me"),
  ];
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <header className="top-bar">
      <button
        type="button"
        className="brand"
        onClick={() => onSectionChange("events")}
      >
        <img className="logo small" src={APP_CONFIG.logoUrl} alt={APP_CONFIG.appTitle} />
        <span>{APP_CONFIG.appTitle}</span>
      </button>
      <nav className="menu">
        {orderedMenuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={section === item.key ? "menu-item active" : "menu-item"}
            onClick={() => onSectionChange(item.key)}
          >
            {item.label}
          </button>
        ))}
        <button type="button" className="menu-item danger" onClick={onLogout}>
          Logout
        </button>
      </nav>
      <div className="menu-dropdown" ref={dropdownRef}>
        <button
          type="button"
          className="menu-trigger"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          Menu
          <span className="menu-caret" aria-hidden="true" />
        </button>
        {open && (
          <div className="menu-panel" role="menu">
            {orderedMenuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className={section === item.key ? "menu-panel-item active" : "menu-panel-item"}
                onClick={() => {
                  onSectionChange(item.key);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              role="menuitem"
              className="menu-panel-item danger"
              onClick={() => {
                onLogout();
                setOpen(false);
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
