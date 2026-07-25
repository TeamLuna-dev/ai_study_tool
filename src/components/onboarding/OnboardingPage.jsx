import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { saveUserProfile } from "../../services/userService";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Input } from "../common/Input";

const LEVEL_LABELS = {
  high_school: "High School",
  undergraduate: "Undergraduate",
  graduate: "Graduate / Postgrad",
};

export default function OnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    displayName: "", // empty string to allow controlled input with placeholder (finally fixed bug)
    major: "",
    academicLevel: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
// function to update form state, using the input's name attribute to identify which field to update. Also clears error on change.
  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }
// async function to handle form submission. Validates that all fields are filled, then saves the profile and navigates to dashboard. Shows error message if something goes wrong.
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.displayName.trim()) { setError("Please enter your name."); return; }
    if (!form.major) { setError("Please select your major."); return; }
    if (!form.academicLevel) { setError("Please select your academic level."); return; }

    setLoading(true);
    try {
      await saveUserProfile(user.uid, {
        displayName: form.displayName.trim(),
        major: form.major,
        academicLevel: form.academicLevel,
        email: user.email,
      });
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6 transition-colors duration-300 dark:bg-gray-950">
      <Card className="w-full max-w-[460px] overflow-hidden">
        <div className="p-7 sm:p-10">
          <form onSubmit={handleSubmit}>
            <div className="mb-8">
              <div className="mb-4 inline-block rounded-full bg-gilt-wash px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gilt-ink dark:bg-gilt-950 dark:text-gilt-400">
                One quick step
              </div>
              <h1 className="font-display mb-2 text-[26px] font-extrabold leading-tight text-ink dark:text-white">
                Hey there!
              </h1>
              <p className="text-sm leading-relaxed text-ink-soft dark:text-gray-400">
                Let's personalise your experience!
              </p>
            </div>


            <div className="mb-5">
              <label htmlFor="displayName" className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-gray-400">
                Your name
              </label>
              <Input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="e.g. Matt Murdock"
                value={form.displayName}
                onChange={handleChange}
              />
            </div>

            <div className="mb-5">

              <label htmlFor="major" className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-gray-400">
                Subject / Major
              </label>
              <select id="major"
                name="major"
                value={form.major}
                onChange={handleChange}
                className="w-full cursor-pointer appearance-none rounded-xl border border-hairline bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-gilt-600 focus:ring-2 focus:ring-gilt-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select your major…</option>
                <option>Biology</option>
                <option>Business</option>
                <option>Computer Science</option>
                <option>Economics</option>
                <option>Engineering</option>
                <option>Mathematics</option>
                <option>Psychology</option>
                <option>Philosophy</option>
                <option>Other</option>
              </select>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-ink-soft dark:text-gray-400">Academic Level</label>
              <div className="flex flex-wrap gap-2.5">
                {["high_school", "undergraduate", "graduate"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => { setForm((prev) => ({ ...prev, academicLevel: level })); setError(""); }}
                    className={`min-w-[100px] flex-1 rounded-xl border px-3.5 py-2.5 text-center text-sm font-medium transition-all duration-150 ease-out ${
                      form.academicLevel === level
                        ? "border-gilt-600 bg-gilt-600 text-white dark:border-gilt-400 dark:bg-gilt-400 dark:text-gray-950"
                        : "border-hairline bg-white text-ink-soft hover:border-gilt-600 hover:text-gilt-ink dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gilt-400 dark:hover:text-gilt-400"
                    }`}
                  >
                    {LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </p>
            )}

            <div className="mt-7 flex gap-3">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving…" : "Continue →"}
              </Button>
            </div>
          </form>

        </div>

      </Card>
    </div>
  );
}
