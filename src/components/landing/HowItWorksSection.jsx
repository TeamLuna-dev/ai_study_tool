const steps = [
  {
    number: "01",
    title: "Upload your notes",
    description:
      "Add your study materials so the app can organize and process them.",
  },
  {
    number: "02",
    title: "Let AI do the work",
    description:
      "Generate summaries, quizzes, and study insights from your content.",
  },
  {
    number: "03",
    title: "Review and improve",
    description:
      "Practice smarter, track progress, and focus on weak areas.",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="bg-gray-50 px-6 py-20 dark:bg-gray-900/40">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            How it works
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            A simple flow that helps you go from raw notes to better studying.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950"
            >
              <span className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-300">
                {step.number}
              </span>

              <h3 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}