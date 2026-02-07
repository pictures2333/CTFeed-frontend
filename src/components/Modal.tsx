import { useEffect, useState } from "react";

type ModalVariant = "alert" | "confirm" | "input";

type ModalProps = {
  open: boolean;
  variant: ModalVariant;
  title: string;
  message: string;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputDefaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
};

export default function Modal({
  open,
  variant,
  title,
  message,
  inputLabel = "",
  inputPlaceholder = "",
  inputDefaultValue = "",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ModalProps) {
  const [value, setValue] = useState(inputDefaultValue);

  useEffect(() => {
    if (open) {
      setValue(inputDefaultValue);
    }
  }, [open, inputDefaultValue]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <div className="modal-message">
            {message.split("\n").map((line, index) => (
              <span key={`${index}-${line}`} className="modal-message-line">
                {line}
              </span>
            ))}
          </div>
          {variant === "input" && (
            <label className="modal-field">
              <span className="label">{inputLabel}</span>
              <input
                type="text"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={inputPlaceholder}
              />
            </label>
          )}
        </div>
        <div className="modal-actions">
          {variant !== "alert" && (
            <button type="button" className="secondary" onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            className="primary"
            onClick={() => onConfirm(variant === "input" ? value : undefined)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
