import { Link, useLocation } from "react-router-dom";
import { Film, UserPlus, ScanLine, Users } from "lucide-react";
import { motion } from "framer-motion";

const navLinks = [
  { to: "/", label: "Home", icon: Film },
  { to: "/register", label: "Register", icon: UserPlus },
  { to: "/checkin", label: "Check In", icon: ScanLine },
  { to: "/attendees", label: "Attendees", icon: Users },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Movie <span className="text-primary">Night</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navLinks.map(({ to, label, icon: NavIcon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className="relative px-3 py-2 rounded-lg text-sm font-medium no-underline transition-colors duration-200"
                  style={{ color: active ? "#fff" : "#999" }}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 bg-dark-hover rounded-lg"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <NavIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
