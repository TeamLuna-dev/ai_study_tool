import { FileText, Brain, BarChart3, Users } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: FileText,
    title: "Upload and organize notes",
    description:
      "Bring all your study material into one place and keep everything accessible.",
  },
  {
    icon: Brain,
    title: "Generate AI summaries",
    description:
      "Turn long readings into concise, useful study notes in seconds.",
  },
  {
    icon: BarChart3,
    title: "Track learning progress",
    description:
      "See quiz performance, identify weak topics, and improve intentionally.",
  },
  {
    icon: Users,
    title: "Collaborate in study rooms",
    description:
      "Learn with classmates, share context, and stay aligned as a group.",
  },
];

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
            Features
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
            Built for focused, efficient studying
          </h2>
          <p className="mt-5 text-lg text-gray-600 dark:text-gray-300">
            Everything students need to review faster, practice better, and stay organized.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
        >
          {features.map(({ icon: Icon, title, description }) => (
            <motion.div
              key={title}
              variants={item}
              className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 p-3 dark:from-blue-900/30 dark:to-cyan-900/20">
                <Icon className="h-6 w-6 text-blue-700 dark:text-blue-300" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>

              <p className="mt-3 leading-7 text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}