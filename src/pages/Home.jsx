import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Ticket, ScanLine, Users, Sparkles, ChevronRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};

const features = [
  {
    icon: Ticket,
    title: "Instant QR Tickets",
    desc: "Generate unique QR codes with serial numbers for each guest or group.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: ScanLine,
    title: "Smart Check-In",
    desc: "Scan QR codes to verify authenticity and prevent duplicate entries.",
    color: "text-gold",
    bg: "bg-gold/10",
  },
  {
    icon: Users,
    title: "Guest Management",
    desc: "Track all registered attendees, check-in status, and event stats.",
    color: "text-success",
    bg: "bg-success/10",
  },
];

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Hero Section */}
      <section className="pt-20 pb-16 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 rounded-3xl blur-2xl" />
            <img
              src="/logo.png"
              alt="Club Logo"
              className="relative w-36 h-36 sm:w-44 sm:h-44 mx-auto rounded-3xl object-contain ring-2 ring-primary/30 shadow-2xl shadow-primary/20"
            />
          </div>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0.5}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          Event Management System
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-4"
        >
          Movie{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
            Night
          </span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={2}
          className="text-lg text-neutral-400 max-w-xl mx-auto mb-10 leading-relaxed"
        >
          Register guests, generate unique QR tickets, and seamlessly check them
          in at the door. All in one beautiful interface.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            to="/register"
            className="group flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-all duration-300 no-underline glow-red"
          >
            <Ticket className="w-5 h-5" />
            Register Now
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            to="/checkin"
            className="flex items-center gap-2 px-8 py-3.5 bg-dark-card hover:bg-dark-hover text-white font-semibold rounded-xl border border-dark-border transition-all duration-300 no-underline"
          >
            <ScanLine className="w-5 h-5" />
            Check-In Scanner
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 4}
              className="glass-card rounded-2xl p-6 hover:border-dark-border transition-all duration-300 group"
            >
              <div
                className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}
              >
                <f.icon className={`w-6 h-6 ${f.color}`} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Decorative Film Strip */}
      <div className="fixed top-0 left-0 w-2 h-full film-strip opacity-30 pointer-events-none" />
      <div className="fixed top-0 right-0 w-2 h-full film-strip opacity-30 pointer-events-none" />
    </div>
  );
}
