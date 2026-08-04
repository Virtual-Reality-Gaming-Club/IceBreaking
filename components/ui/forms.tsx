import type { ButtonHTMLAttributes, InputHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  isLoading = false,
  className = "",
  style = {},
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
          color: "white",
          boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          fontWeight: 700,
        };
      case "secondary":
        return {
          background: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          color: "#e2e8f0",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          fontWeight: 600,
        };
      case "danger":
        return {
          background: "rgba(239, 68, 68, 0.12)",
          color: "#fca5a5",
          border: "1px solid rgba(239, 68, 68, 0.35)",
          fontWeight: 600,
        };
      case "ghost":
        return {
          background: "transparent",
          color: "#94a3b8",
          border: "none",
          fontWeight: 500,
        };
      default:
        return {};
    }
  };

  return (
    <button
      disabled={isLoading || props.disabled}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
        fontWeight: 600,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: (isLoading || props.disabled) ? "not-allowed" : "pointer",
        opacity: (isLoading || props.disabled) ? 0.5 : 1,
        padding: "10px 18px",
        fontSize: "0.875rem",
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {isLoading ? (
        <svg
          style={{ animation: "spin 1s linear infinite", marginLeft: "-4px", marginRight: "8px", height: "16px", width: "16px", color: "currentColor" }}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      {children}
    </button>
  );
}

export function Input({
  className = "",
  style = {},
  error,
  onFocus,
  onBlur,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div style={{ width: "100%" }}>
      <input
        className={className}
        style={{
          width: "100%",
          backgroundColor: "rgba(15, 20, 35, 0.95)",
          border: error ? "1.5px solid #ef4444" : "1.5px solid rgba(148, 163, 184, 0.45)",
          borderRadius: "12px",
          padding: "14px 18px",
          color: "#ffffff",
          fontSize: "1rem",
          fontWeight: 500,
          outline: "none",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          boxSizing: "border-box",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? "#ef4444" : "#a78bfa";
          e.currentTarget.style.boxShadow = error
            ? "0 0 0 3px rgba(239, 68, 68, 0.2)"
            : "0 0 0 3px rgba(124, 58, 237, 0.35), 0 0 16px rgba(124, 58, 237, 0.25)";
          onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? "#ef4444" : "rgba(148, 163, 184, 0.45)";
          e.currentTarget.style.boxShadow = "none";
          onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <p
          role="alert"
          style={{ marginTop: "6px", fontSize: "0.82rem", color: "#f87171", fontWeight: 600 }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
