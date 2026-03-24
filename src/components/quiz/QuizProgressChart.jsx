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

export default function QuizProgressChart() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <div>Loading progress chart...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!history.length) return <div>No quiz attempts yet.</div>;

  // Prepare data for chart
  const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const labels = sorted.map((h, i) => h.timestamp ? new Date(h.timestamp).toLocaleDateString() : `Attempt ${i+1}`);
  const scores = sorted.map((h) => h.score);

  const data = {
    labels,
    datasets: [
      {
        label: "Quiz Score",
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
      title: { display: true, text: "Quiz Attempt Progress Over Time" },
    },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: "Score" } },
      x: { title: { display: true, text: "Attempt Date" } },
    },
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 8px #0001" }}>
      <Line data={data} options={options} />
    </div>
  );
}
