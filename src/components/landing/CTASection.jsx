import { useNavigate } from "react-router-dom";

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-5xl rounded-3xl bg-blue-600 px-8 py-14 text-center text-white shadow-xl">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Start studying smarter today
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
          Organize your notes, generate summaries, and create quizzes with AI in one place.
        </p>

        <button
          onClick={() => navigate("/login")}
          className="mt-8 rounded-xl bg-white px-6 py-3 font-semibold text-blue-600 transition hover:bg-blue-50"
        >
          Get Started
        </button>
      </div>
    </section>
  );
}