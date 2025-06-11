import { useState, useEffect } from "react";
import localforage from "localforage";
import "./App.css";

function App() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

  useEffect(() => {
    localforage.getItem("ai-history").then((saved) => {
      if (saved) {
        setHistory(saved);
        setFilteredHistory(saved);
      }
    });
  }, []);

  useEffect(() => {
    localforage.setItem("ai-history", history);
    filterHistory(searchTerm);
  }, [history]);

  const filterHistory = (term) => {
    if (!term) {
      setFilteredHistory(history);
    } else {
      const lower = term.toLowerCase();
      setFilteredHistory(
        history.filter(
          (item) =>
            item.prompt.toLowerCase().includes(lower) ||
            item.response.toLowerCase().includes(lower)
        )
      );
    }
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError("");
    setOutputText("");

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:5173",
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful writing assistant." },
            { role: "user", content: inputText },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "API Error");

      const reply = data.choices?.[0]?.message?.content || "No response.";
      setOutputText(reply);
      const newEntry = { prompt: inputText, response: reply };
      const updated = [newEntry, ...history];
      setHistory(updated);
      setInputText("");
    } catch (err) {
      setError("API Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (index) => {
    const updated = [...history];
    updated.splice(index, 1);
    setHistory(updated);
  };

  const handleClearAll = () => {
    setHistory([]);
    setFilteredHistory([]);
    localforage.removeItem("ai-history");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    filterHistory(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="app">
      <h1>✍️ AI Writing Assistant</h1>

      <textarea
        rows="5"
        placeholder="Type a paragraph or question..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate ✨"}
      </button>

      <input
        type="text"
        placeholder="🔍 Search history..."
        value={searchTerm}
        onChange={handleSearch}
        className="search"
      />

      <button className="clear" onClick={handleClearAll}>Clear All History 🗑️</button>

      {error && <div className="error">{error}</div>}

      {outputText && (
        <div className="output">
          <h3>🧠 AI Response:</h3>
          <p>{outputText}</p>
        </div>
      )}

      {filteredHistory.length > 0 && (
        <div className="history">
          <h3>🕘 Prompt History</h3>
          {filteredHistory.map((item, i) => (
            <div key={i} className="history-item">
              <p><strong>Prompt:</strong> {item.prompt}</p>
              <pre><strong>Response:</strong> {item.response}</pre>
              <button onClick={() => handleDelete(i)}>Delete ❌</button>
              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
