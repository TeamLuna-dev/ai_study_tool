import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function LandingNavbar() {
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg text-white"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate("/")}
          className="text-xl font-semibold tracking-tight text-white-900"
        >
          AI Study Tool
        </button>

        <div className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollToSection("features")}
            className="text-sm text-white-600 transition hover:text-gray-400"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection("how-it-works")}
            className="text-sm text-white-600 transition hover:text-gray-400"
          >
            How it works
          </button>
          <button
            onClick={() => scrollToSection("cta")}
            className="text-sm text-white-600 transition hover:text-gray-400"
          >
            Get started
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl px-4 py-2 text-sm font-medium text-white-700 transition hover:bg-gray-400"
          >
            Login
          </button>

          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] hover:bg-gray-400"
          >
            Start free
          </button>
        </div>
      </nav>
    </motion.header>
  );
}