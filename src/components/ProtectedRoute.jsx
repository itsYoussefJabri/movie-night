import { useState } from "react";
import PasswordGate from "./PasswordGate";

export default function ProtectedRoute({ children }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem("mn_auth") === "1"
  );

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />;
  }

  return children;
}
