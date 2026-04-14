import { useState, useRef, ReactNode, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

type Props = {
  content: ReactNode;
  children: ReactNode;
  delay?: number;
};

export default function Tooltip({ content, children, delay = 400 }: Props) {
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
  }, []);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      updatePosition();
      setVisible(true);
    }, delay);
  }, [delay, updatePosition]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setVisible(false);
  }, []);

  useEffect(() => {
    if (visible) {
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [visible, updatePosition]);

  const tooltipNode = visible && rect ? (
    <div style={{
      position: "fixed",
      zIndex: 999999,
      minWidth: 220,
      maxWidth: 300,
      padding: "12px 16px",
      background: "rgba(20, 22, 30, 0.94)",
      backdropFilter: "blur(16px)",
      borderRadius: 12,
      color: "#e8eaef",
      fontSize: "0.72rem",
      lineHeight: 1.55,
      boxShadow: "0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)",
      pointerEvents: "none",
      animation: "tooltipIn 0.18s ease-out both",
      ...getPosition(rect),
    }}>
      {content}
    </div>
  ) : null;

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", display: "inline-block", width: "100%" }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {tooltipNode && createPortal(tooltipNode, document.body)}
    </div>
  );
}

function getPosition(rect: DOMRect): React.CSSProperties {
  const tooltipH = 120;
  const pad = 10;

  const left = Math.max(pad, Math.min(rect.left + rect.width / 2 - 140, window.innerWidth - 310));

  if (rect.top > tooltipH + pad) {
    return { top: rect.top - tooltipH - 8, left };
  }

  return { top: rect.bottom + 8, left };
}
