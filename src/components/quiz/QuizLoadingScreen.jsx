export default function QuizLoadingScreen({ topic, questionCount }) {
  return (
    <div className="
        min-h-screen flex items-center justify-center px-4
        bg-gray-50 dark:bg-gray-950
        text-gray-900 dark:text-white
        transition-colors
      ">
      <div className="text-center">
        {/* Icon */}
        <div className="mb-4 text-5xl animate-spin">⚙️</div>

        {/* Title */}
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Generating your quiz...
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {questionCount} questions on{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {topic}
          </span>
        </p>
      </div>
    </div>
  );
}
