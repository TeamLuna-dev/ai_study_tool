import { layoutStyle } from "./quizStyles";

export default function QuizLoadingScreen({ topic, questionCount }) {
  return (
    <div style={layoutStyle}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚙️</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
          Generating your quiz...
        </h2>
        <p style={{ color: "#6b7280", fontSize: 15 }}>
          {questionCount} questions on <strong>{topic}</strong>
        </p>
      </div>
    </div>
  );
}
