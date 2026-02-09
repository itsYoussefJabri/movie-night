import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Users,
  RefreshCw,
  CheckCircle2,
  Clock,
  Hash,
  Mail,
  UserCheck,
  Ticket,
  Search,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const modalContent = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30, delay: 0.05 },
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};

export default function Attendees() {
  const [attendees, setAttendees] = useState([]);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchAttendees = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendees");
      const data = await res.json();
      setAttendees(data.attendees || []);
      setStats({ total: data.total || 0, checkedIn: data.checkedIn || 0 });
    } catch {
      toast.error("Failed to load attendees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/attendees/${deleteTarget.serial}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`${deleteTarget.names} has been removed`);
      setDeleteTarget(null);
      fetchAttendees();
    } catch {
      toast.error("Failed to delete registration");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = attendees.filter(
    (a) =>
      a.names.toLowerCase().includes(search.toLowerCase()) ||
      a.serial.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()),
  );

  const checkedInPercent =
    stats.total > 0 ? Math.round((stats.checkedIn / stats.total) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-success/10 border border-success/20 text-success text-sm font-medium mb-4">
            <Users className="w-4 h-4" />
            Guest Management
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Attendees
          </h1>
          <p className="text-neutral-400">
            Overview of all registered guests and check-in status
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Registered",
              value: stats.total,
              icon: Ticket,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              label: "Checked In",
              value: stats.checkedIn,
              icon: UserCheck,
              color: "text-success",
              bg: "bg-success/10",
            },
            {
              label: "Pending",
              value: stats.total - stats.checkedIn,
              icon: Clock,
              color: "text-gold",
              bg: "bg-gold/10",
            },
            {
              label: "Check-In %",
              value: `${checkedInPercent}%`,
              icon: CheckCircle2,
              color: "text-neutral-300",
              bg: "bg-neutral-800",
            },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}
                >
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-neutral-500 uppercase tracking-wider">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by name, serial, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-card border border-dark-border rounded-xl pl-10 pr-4 py-3 text-white placeholder-neutral-600 text-sm transition-all"
            />
          </div>
          <button
            onClick={fetchAttendees}
            className="p-3 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Attendee List */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-neutral-500 mx-auto animate-spin mb-3" />
              <p className="text-neutral-400 text-sm">Loading attendees...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
              <p className="text-neutral-400 font-medium">No attendees found</p>
              <p className="text-neutral-600 text-sm mt-1">
                {search
                  ? "Try a different search"
                  : "Register some guests to get started"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-dark-border">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs text-neutral-500 uppercase tracking-wider bg-dark-card/50">
                <div className="col-span-3">Names</div>
                <div className="col-span-2">Serial</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Registered</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>

              {/* Rows */}
              {filtered.map((a, i) => (
                <motion.div
                  key={a.serial}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-dark-hover/50 transition-colors items-center"
                >
                  {/* Names */}
                  <div className="md:col-span-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-white text-sm font-medium truncate">
                      {a.names}
                    </span>
                  </div>

                  {/* Serial */}
                  <div className="md:col-span-2 flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-gold md:hidden" />
                    <span className="text-gold text-sm font-mono tracking-wider">
                      {a.serial}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="md:col-span-3 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-neutral-500 md:hidden" />
                    <span className="text-neutral-400 text-sm truncate">
                      {a.email}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="md:col-span-2 flex items-center">
                    <span className="text-neutral-500 text-xs">
                      {new Date(a.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="md:col-span-1 flex items-center justify-start md:justify-center">
                    {a.checked_in ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success text-xs font-medium rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        In
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800 text-neutral-400 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Delete */}
                  <div className="md:col-span-1 flex items-center justify-start md:justify-center">
                    <button
                      onClick={() => setDeleteTarget(a)}
                      className="p-2 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200 cursor-pointer bg-transparent border-none"
                      title="Delete registration"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              key="modal-overlay"
              variants={modalOverlay}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => !deleting && setDeleteTarget(null)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              {/* Modal */}
              <motion.div
                key="modal-content"
                variants={modalContent}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md glass-card rounded-2xl border border-dark-border overflow-hidden"
              >
                {/* Close button */}
                <button
                  onClick={() => !deleting && setDeleteTarget(null)}
                  className="absolute top-4 right-4 p-1.5 text-neutral-500 hover:text-white hover:bg-dark-hover rounded-lg transition-colors cursor-pointer bg-transparent border-none"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="p-6 sm:p-8 text-center">
                  {/* Warning Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 20,
                      delay: 0.1,
                    }}
                    className="w-16 h-16 mx-auto mb-5 bg-red-500/10 rounded-2xl flex items-center justify-center"
                  >
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </motion.div>

                  <h3 className="text-xl font-bold text-white mb-2">
                    Delete Registration
                  </h3>
                  <p className="text-neutral-400 text-sm mb-2">
                    Are you sure you want to remove this registration?
                  </p>

                  {/* Info card */}
                  <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-white text-sm font-medium">
                        {deleteTarget.names}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-gold" />
                      <span className="text-gold text-xs font-mono tracking-wider">
                        {deleteTarget.serial}
                      </span>
                    </div>
                  </div>

                  <p className="text-neutral-500 text-xs mb-6">
                    This action cannot be undone.
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteTarget(null)}
                      disabled={deleting}
                      className="flex-1 py-3 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-xl text-white text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
                    >
                      No, Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-semibold transition-all duration-200 cursor-pointer border-none disabled:opacity-50"
                    >
                      {deleting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {deleting ? "Deleting..." : "Yes, Delete"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
