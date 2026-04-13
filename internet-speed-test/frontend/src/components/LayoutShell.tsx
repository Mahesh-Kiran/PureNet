import { ReactNode } from "react";

export default function LayoutShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fb" }}>
      {children}
    </div>
  );
}
