import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  UserPlus,
  Trash2,
  Mail,
  Ticket,
  Loader2,
  CheckCircle2,
  Download,
  Plus,
  Users,
  Hash,
  Crown,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export default function Register() {
  const [attendees, setAttendees] = useState([{ firstName: "", lastName: "", vip: false }]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const qrRef = useRef(null);

  const addAttendee = () => {
    setAttendees([...attendees, { firstName: "", lastName: "", vip: false }]);
    toast.success("Added another guest slot");
  };

  const removeAttendee = (index) => {
    if (attendees.length <= 1) return;
    setAttendees(attendees.filter((_, i) => i !== index));
    toast.success("Guest slot removed");
  };

  const updateAttendee = (index, field, value) => {
    const updated = [...attendees];
    updated[index][field] = value;
    setAttendees(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    for (const a of attendees) {
      if (!a.firstName.trim() || !a.lastName.trim()) {
        toast.error("Please fill in all name fields");
        return;
      }
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, attendees }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
      toast.success("Registration successful! QR code generated.");
    } catch (err) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = 500;
    canvas.height = 500;

    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 500, 500);
      ctx.drawImage(img, 50, 50, 400, 400);
      const link = document.createElement("a");
      link.download = `MovieNight-${result.serial}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("QR code downloaded!");
    };

    img.src =
      "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

  const resetForm = () => {
    setAttendees([{ firstName: "", lastName: "", vip: false }]);
    setEmail("");
    setResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Ticket className="w-4 h-4" />
            Guest Registration
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Register for Movie Night
          </h1>
          <p className="text-neutral-400">
            Fill in your details to receive a unique QR ticket
          </p>
        </div>

        <AnimatePresence mode="wait">
          {!result ? (
            /* Registration Form */
            <motion.form
              key="form"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeUp}
              onSubmit={handleSubmit}
              className="glass-card rounded-2xl p-6 sm:p-8"
            >
              {/* Attendees Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-white">
                      Attendees
                    </h2>
                    <span className="text-xs text-neutral-500 bg-dark-hover px-2 py-0.5 rounded-full">
                      {attendees.length}{" "}
                      {attendees.length === 1 ? "guest" : "guests"}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {attendees.map((attendee, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                      >
                        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-dark-card rounded-xl border border-dark-border">
                          {/* Guest number badge */}
                          <div className="flex items-center gap-3 sm:contents">
                            <div className="w-8 h-8 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">
                                #{index + 1}
                              </span>
                            </div>
                            {attendees.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeAttendee(index)}
                                className="sm:hidden ml-auto p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="First Name"
                              value={attendee.firstName}
                              onChange={(e) =>
                                updateAttendee(
                                  index,
                                  "firstName",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-dark/80 border border-dark-border rounded-lg px-4 py-2.5 text-white placeholder-neutral-600 text-sm transition-all"
                            />
                          </div>
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Last Name"
                              value={attendee.lastName}
                              onChange={(e) =>
                                updateAttendee(
                                  index,
                                  "lastName",
                                  e.target.value,
                                )
                              }
                              className="w-full bg-dark/80 border border-dark-border rounded-lg px-4 py-2.5 text-white placeholder-neutral-600 text-sm transition-all"
                            />
                          </div>

                          {/* VIP Toggle */}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...attendees];
                              updated[index].vip = !updated[index].vip;
                              setAttendees(updated);
                            }}
                            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all border text-sm font-medium ${
                              attendee.vip
                                ? "bg-gold/20 border-gold/40 text-gold shadow-[0_0_12px_rgba(245,197,24,0.15)]"
                                : "bg-transparent border-dark-border text-neutral-600 hover:text-gold hover:border-gold/30"
                            }`}
                            title={attendee.vip ? "VIP ticket" : "Standard ticket"}
                          >
                            <Crown className="w-4 h-4" />
                            <span className="sm:hidden">{attendee.vip ? "VIP Ticket" : "Standard Ticket"}</span>
                          </button>

                          {attendees.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAttendee(index)}
                              className="hidden sm:flex p-2.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors self-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={addAttendee}
                  className="mt-3 w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-dark-border hover:border-primary/50 rounded-xl text-neutral-500 hover:text-primary text-sm font-medium transition-colors bg-transparent cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Guest
                </button>
              </div>

              {/* Email */}
              <div className="mb-8">
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white placeholder-neutral-600 text-sm transition-all"
                />
                <p className="text-xs text-neutral-600 mt-1.5">
                  QR ticket will be sent to this email
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-300 text-sm cursor-pointer border-none glow-red"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating QR Code...
                  </>
                ) : (
                  <>
                    <Ticket className="w-5 h-5" />
                    Generate QR Ticket
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            /* Success Result */
            <motion.div
              key="result"
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="glass-card rounded-2xl p-6 sm:p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.2,
                }}
              >
                <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
              </motion.div>

              <h2 className="text-2xl font-bold text-white mb-1">
                Registration Complete!
              </h2>
              <p className="text-neutral-400 text-sm mb-8">
                Your QR ticket has been generated successfully
              </p>

              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div ref={qrRef} className="qr-container">
                  <QRCodeSVG
                    value={result.qrData}
                    size={220}
                    level="H"
                    fgColor="#0a0a0a"
                    bgColor="#ffffff"
                    imageSettings={{
                      src: "",
                      height: 0,
                      width: 0,
                    }}
                  />
                </div>
              </div>

              {/* Serial Number */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-dark-card border border-dark-border rounded-xl mb-6">
                <Hash className="w-4 h-4 text-gold" />
                <span className="text-xs text-neutral-400 uppercase tracking-wider">
                  Serial:
                </span>
                <span className="text-lg font-bold text-gold tracking-widest">
                  {result.serial}
                </span>
              </div>

              {/* Attendee Names */}
              <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-6 max-w-sm mx-auto">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-2">
                  Registered Guests
                </p>
                {result.attendees.map((a, i) => (
                  <p key={i} className="text-white font-medium flex items-center justify-center gap-2">
                    {a.firstName} {a.lastName}
                    {a.vip && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/20 text-gold text-xs font-bold rounded-full border border-gold/30">
                        <Crown className="w-3 h-3" /> VIP
                      </span>
                    )}
                  </p>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={downloadQR}
                  className="flex items-center gap-2 px-6 py-2.5 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-xl text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download QR
                </button>
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-dark rounded-xl text-white text-sm font-medium transition-colors cursor-pointer border-none"
                >
                  <UserPlus className="w-4 h-4" />
                  Register Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
