import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function CTASection() {
  const navigate = useNavigate();

  return (
     <section id="cta" className="px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-6xl overflow-hidden rounded-[36px] bg-gradient-to-br from-blue-600 via-cyan-500 to-purple-600 p-[1px] shadow-2xl"
      >
        <div className="rounded-[35px] bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg px-8 py-16 text-center text-white sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            Start studying smarter
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-300">
            Upload your notes, generate summaries, create quizzes, and track your
            progress — all in one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {/* Primary CTA */}
            <button
              onClick={() => navigate("/login")}
              className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:scale-[1.02] hover:bg-gray-100"
            >
              Get started
            </button>

            {/* Secondary CTA */}
            <button
              onClick={() => {
                const section = document.getElementById("features");
                section?.scrollIntoView({ behavior: "smooth" });
              }}
              className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              Learn more
            </button>
          </div>

        
        </div>
      </motion.div>
    </section>
  );
}