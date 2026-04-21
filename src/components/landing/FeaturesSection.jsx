import { FileText, Brain, BarChart3, Users } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Upload Notes",
    description:
      "Keep your study materials organized and ready for AI-powered processing.",
  },
  {
    icon: Brain,
    title: "AI Summaries",
    description:
      "Turn long notes into short, clear summaries that are easier to review.",
  },
  {
    icon: BarChart3,
    title: "Track Progress",
    description:
      "Monitor quiz results and identify weak topics over time.",
  },
  {
    icon: Users,
    title: "Study Rooms",
    description:
      "Collaborate with classmates and learn together in shared spaces.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            Everything you need to study better
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Built to help students save time, stay organized, and learn more efficiently.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                <Icon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}