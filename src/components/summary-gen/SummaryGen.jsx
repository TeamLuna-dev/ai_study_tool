import { useState } from "react";

export default function SummaryGen() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSummarize = async () => {
    if (!text.trim()) {
      setError("Please enter some text to summarize.");
      return;
    }

    setLoading(true);
    setError("");
    setSummary("");

    try {
      const response = await fetch("http://127.0.0.1:5001/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok) {
        setSummary(data.summary);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-md bg-white max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-2">AI Text Summarizer</h2>

      <textarea
        className="w-full p-2 border rounded mb-2"
        rows={5}
        placeholder="Enter text to summarize..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleSummarize}
        disabled={loading}
      >
        {loading ? "Summarizing..." : "Summarize"}
      </button>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {summary && (
        <div className="mt-4 p-2 border-l-4 border-blue-500 bg-gray-50 rounded">
          <h3 className="font-semibold mb-1">Summary:</h3>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}