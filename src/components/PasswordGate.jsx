import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldAlert, Eye, EyeOff } from "lucide-react";

const SECRET = "youssefzouin";

export default function PasswordGate({ onSuccess }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const handleChange = (e) => {
    const val = e.target.value;
    // Only allow letters — no numbers, no special chars
    if (/^[a-zA-Z]*$/.test(val)) {
      setCode(val);
      setError("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError("Please enter the access code");
      triggerShake();
      return;
    }

    if (code.toLowerCase() === SECRET) {
      sessionStorage.setItem("mn_auth", "1");
      onSuccess();
    } else {
      setError("Invalid access code");
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: shake ? [0, -10, 10, -10, 10, 0] : 0,
        }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Access Required
          </h2>
          <p className="text-white/50 text-center text-sm mb-8">
            Enter the access code to continue
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={code}
                onChange={handleChange}
                placeholder="Enter access code"
                autoComplete="off"
                autoFocus
                className="w-full bg-dark border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <ShieldAlert className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98]"
            >
              Unlock
            </button>
          </form>

          <p className="text-white/20 text-xs text-center mt-6">
            Letters only, no numbers
          </p>
        </div>
      </motion.div>
    </div>
  );
}
