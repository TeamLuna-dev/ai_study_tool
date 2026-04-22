import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Upload your materials",
    description:
      "Import your notes, PDFs, or study content into one organized workspace.",
  },
  {
    number: "02",
    title: "Generate AI study tools",
    description:
      "Create summaries, quizzes, and focused insights from your content instantly.",
  },
  {
    number: "03",
    title: "Review and improve",
    description:
      "Track weak areas, revisit difficult topics, and improve over time.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-gray-50 px-6 py-24 dark:bg-gray-900/40"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400">
            Process
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            From notes to mastery in three steps
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="text-sm font-bold tracking-[0.3em] text-blue-600 dark:text-blue-400">
                {step.number}
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-4 leading-7 text-gray-600 dark:text-gray-300">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}