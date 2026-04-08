import { useEffect, useState } from "react";
import { getQuizHistory } from "../../services/quizService";
import { useAuth } from "../../hooks/useAuth";
// You need to install chart.js and react-chartjs-2: npm install chart.js react-chartjs-2
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const TOPIC_OPTIONS = [
  "Calculus",
  "Biology",
  "Chemistry",
  "Physics",
  "History",
  "Computer Science",
  "Psychology",
  "English",
  "Economics",
  "Other",
];

export default function QuizProgressChart() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("all");

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const data = await getQuizHistory(user?.uid);
        setHistory(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (user?.uid) fetchHistory();
  }, [user]);

  if (loading) return <div className="text-gray-500 text-center py-8">Loading progress chart...</div>;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;
  if (!history.length) return <div className="text-gray-400 text-center py-8">No quiz attempts yet.</div>;

  // Merge predefined topics with any additional topics from history
  const historyTopics = history.map((h) => h.topic).filter(Boolean);
  const topics = [...new Set([...TOPIC_OPTIONS, ...historyTopics])];

  // Filter by selected topic
  const filtered = selectedTopic === "all"
    ? history
    : history.filter((h) => h.topic === selectedTopic);

  // Prepare data for chart — convert raw score to percentage
  const sorted = [...filtered].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const labels = sorted.map((h, i) => h.timestamp ? new Date(h.timestamp).toLocaleDateString() : `Attempt ${i+1}`);
  const scores = sorted.map((h) => {
    if (h.percentage != null) return Math.round(h.percentage);
    if (h.total_questions) return Math.round((h.score / h.total_questions) * 100);
    return h.score;
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Quiz Score (%)",
        data: scores,
        fill: false,
        borderColor: "#2563eb",
        backgroundColor: "#2563eb",
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Quiz Score Trend Over Time" },
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: "Score (%)" } },
      x: { title: { display: true, text: "Attempt Date" } },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Quiz Score Trend</h3>
        {topics.length > 0 && (
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Subjects</option>
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
