import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import CheckIn from "./pages/CheckIn";
import Attendees from "./pages/Attendees";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-dark hero-gradient">
        <Navbar />
        <main className="pb-12">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/attendees" element={<Attendees />} />
          </Routes>
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#141414",
              color: "#e5e5e5",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "14px 20px",
            },
            success: {
              iconTheme: { primary: "#46d369", secondary: "#141414" },
            },
            error: {
              iconTheme: { primary: "#e50914", secondary: "#141414" },
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
}
