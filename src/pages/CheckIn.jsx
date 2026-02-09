import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  ScanLine,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Hash,
  Users,
  RotateCcw,
  Keyboard,
  Crown,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function CheckIn() {
  const [mode, setMode] = useState("idle"); // idle | scanning | manual
  const [manualSerial, setManualSerial] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const startCamera = async () => {
    try {
      setMode("scanning");
      setScanResult(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Attempt QR scanning via canvas (basic approach)
      scanIntervalRef.current = setInterval(() => {
        scanFrame();
      }, 500);
    } catch {
      toast.error("Camera access denied. Try manual entry.");
      setMode("manual");
    }
  };

  const scanFrame = () => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    // Use BarcodeDetector API if available
    if ("BarcodeDetector" in window) {
      const detector = new BarcodeDetector({ formats: ["qr_code"] });
      detector
        .detect(canvas)
        .then((codes) => {
          if (codes.length > 0) {
            handleScan(codes[0].rawValue);
          }
        })
        .catch(() => {});
    }
  };

  const handleScan = async (rawValue) => {
    stopCamera();
    setMode("idle");

    try {
      const data = JSON.parse(rawValue);
      if (data.serial) {
        await verifySerial(data.serial);
      } else {
        throw new Error("Invalid QR");
      }
    } catch {
      setScanResult({
        valid: false,
        message: "Invalid QR code format",
      });
      toast.error("Invalid QR code format");
    }
  };

  const verifySerial = async (serial) => {
    setLoading(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial }),
      });
      const data = await res.json();
      setScanResult(data);

      if (data.valid) {
        toast.success(`Welcome, ${data.names}!`);
      } else if (data.alreadyUsed) {
        toast.error("This ticket was already used");
      } else {
        toast.error("Invalid ticket");
      }
    } catch {
      toast.error("Verification failed — check server connection");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualSerial.trim()) {
      toast.error("Please enter a serial number");
      return;
    }
    verifySerial(manualSerial.trim());
  };

  const reset = () => {
    stopCamera();
    setMode("idle");
    setScanResult(null);
    setManualSerial("");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-10">
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-sm font-medium mb-4">
            <ScanLine className="w-4 h-4" />
            Event Check-In
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Check-In Scanner
          </h1>
          <p className="text-neutral-400">
            Scan a QR ticket or enter serial manually to verify
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* Idle / Scanner Controls */}
          {mode === "idle" && !scanResult && (
            <motion.div
              key="controls"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeUp}
              className="glass-card rounded-2xl p-8 text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gold/10 rounded-2xl flex items-center justify-center pulse-ring">
                <ScanLine className="w-10 h-10 text-gold" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Ready to Scan
              </h2>
              <p className="text-neutral-400 text-sm mb-8">
                Choose how you want to verify the ticket
              </p>

              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <button
                  onClick={startCamera}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gold hover:bg-gold-dark text-dark font-semibold rounded-xl transition-all duration-300 text-sm cursor-pointer border-none glow-gold"
                >
                  <Camera className="w-5 h-5" />
                  Scan QR Code
                </button>
                <button
                  onClick={() => {
                    setMode("manual");
                    setScanResult(null);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-dark-card hover:bg-dark-hover text-white font-semibold rounded-xl border border-dark-border transition-all duration-300 text-sm cursor-pointer"
                >
                  <Keyboard className="w-5 h-5" />
                  Enter Serial
                </button>
              </div>
            </motion.div>
          )}

          {/* Camera Scanner */}
          {mode === "scanning" && (
            <motion.div
              key="scanner"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeUp}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className="relative rounded-xl overflow-hidden mb-4 bg-black aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scan overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-52 h-52 border-2 border-gold/50 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-3 border-l-3 border-gold rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-3 border-r-3 border-gold rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-3 border-l-3 border-gold rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-3 border-r-3 border-gold rounded-br-lg" />
                    <div className="absolute left-0 right-0 h-0.5 bg-gold/60 scan-line" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-neutral-400 mb-4">
                Position the QR code within the frame
              </p>
              <button
                onClick={reset}
                className="px-6 py-2.5 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-xl text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Manual Entry */}
          {mode === "manual" && !scanResult && (
            <motion.div
              key="manual"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={fadeUp}
              className="glass-card rounded-2xl p-6 sm:p-8"
            >
              <form onSubmit={handleManualSubmit}>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-3">
                  <Hash className="w-4 h-4 text-gold" />
                  Serial Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. MN-2026-A1B2C3D4"
                  value={manualSerial}
                  onChange={(e) =>
                    setManualSerial(e.target.value.toUpperCase())
                  }
                  className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white placeholder-neutral-600 text-sm font-mono tracking-wider mb-4 transition-all"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 py-3 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-xl text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold hover:bg-gold-dark text-dark font-semibold rounded-xl transition-all text-sm cursor-pointer border-none"
                  >
                    {loading ? "Verifying..." : "Verify Ticket"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Scan Result */}
          {scanResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, type: "spring" }}
              className={`glass-card rounded-2xl p-6 sm:p-8 text-center border-2 ${
                scanResult.valid
                  ? "border-success/30"
                  : scanResult.alreadyUsed
                    ? "border-gold/30"
                    : "border-primary/30"
              }`}
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  delay: 0.2,
                }}
                className="mb-4"
              >
                {scanResult.valid ? (
                  <CheckCircle2 className="w-20 h-20 text-success mx-auto" />
                ) : scanResult.alreadyUsed ? (
                  <AlertTriangle className="w-20 h-20 text-gold mx-auto" />
                ) : (
                  <XCircle className="w-20 h-20 text-primary mx-auto" />
                )}
              </motion.div>

              <h2
                className={`text-2xl font-bold mb-2 ${
                  scanResult.valid
                    ? "text-success"
                    : scanResult.alreadyUsed
                      ? "text-gold"
                      : "text-primary"
                }`}
              >
                {scanResult.valid
                  ? "Access Granted!"
                  : scanResult.alreadyUsed
                    ? "Already Used"
                    : "Invalid Ticket"}
              </h2>
              <p className="text-neutral-400 text-sm mb-6">
                {scanResult.message}
              </p>

              {scanResult.names && (
                <div className="bg-dark-card border border-dark-border rounded-xl p-4 mb-4 max-w-sm mx-auto">
                  <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 uppercase tracking-wider mb-2">
                    <Users className="w-3.5 h-3.5" />
                    Attendees
                  </div>
                  <p className="text-white font-semibold text-lg">
                    {scanResult.names}
                  </p>
                  {scanResult.hasVip && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold/15 border border-gold/30 rounded-full">
                      <Crown className="w-4 h-4 text-gold" />
                      <span className="text-gold text-sm font-bold tracking-wide">VIP Ticket</span>
                    </div>
                  )}
                </div>
              )}

              {scanResult.serial && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg mb-6">
                  <Hash className="w-3.5 h-3.5 text-gold" />
                  <span className="text-sm font-mono text-gold tracking-wider">
                    {scanResult.serial}
                  </span>
                </div>
              )}

              <div className="block">
                <button
                  onClick={reset}
                  className="flex items-center justify-center gap-2 mx-auto px-8 py-3 bg-dark-card hover:bg-dark-hover border border-dark-border rounded-xl text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Scan Another
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
