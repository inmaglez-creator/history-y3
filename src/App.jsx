import { useState, useRef, useEffect } from "react";

const TOPICS = [
  {
    id: "stoneage",
    label: "Stone Age to Iron Age",
    icon: "\ud83e\udea8",
    color: "#B45309",
    light: "#FFFBEB",
    description: "Early Britain, from hunters to farmers",
    topics: ["The Stone Age", "From hunters to farmers", "The Bronze Age", "The Iron Age & hillforts"],
  },
  {
    id: "egypt",
    label: "Ancient Egypt",
    icon: "\ud83c\udffa",
    color: "#F59E0B",
    light: "#FEF9C3",
    description: "Life by the Nile, pharaohs and pyramids",
    topics: ["Life by the River Nile", "Pharaohs & pyramids", "Mummies & the afterlife", "Egyptian writing (hieroglyphs)"],
  },
  {
    id: "romans",
    label: "The Romans",
    icon: "\ud83c\udfdb\ufe0f",
    color: "#EF4444",
    light: "#FEF2F2",
    description: "The Roman Empire and Britain",
    topics: ["The Roman Empire", "Romans invade Britain", "Roman towns & roads", "Boudica's rebellion"],
  },
  {
    id: "skills",
    label: "Working as a Historian",
    icon: "\ud83d\udd0e",
    color: "#6C63FF",
    light: "#EEF0FF",
    description: "Chronology, sources and evidence",
    topics: ["Putting events in order (chronology)", "Using sources & evidence", "Then & now", "Asking historical questions"],
  },
];

const SYSTEM_PROMPT = `You are a friendly, very encouraging KS2 History tutor for a Year 3 student (age 7-8) at a British curriculum school.\n\nYour job:\n1. Ask simple history questions and quizzes for the topic requested.\n2. Check answers and praise effort always.\n3. Tell short, vivid facts and explain ideas simply for a 7-8 year old.\n4. Use British English and simple Year 3 History vocabulary.\n5. Keep responses short, warm and easy to read. Use emojis sparingly.\n\nWhen generating exercises:\n- Ask ONE question at a time. After the child answers, say if it is correct and explain simply, then ask the next one.\n- Mix types: true/false, multiple choice, put in order, 'why do you think'.\n- After the question, add a small friendly hint marked with 💡\n\nWhen correcting:\n- Mark each answer ✅ or ❌\n- For wrong answers, give the right answer with a simple, interesting reason\n- End with a cheerful, motivating sentence\n\nTopic context you'll receive: the specific KS2 Year 3 subtopic to focus on.\n\nIMPORTANT FORMATTING RULE: Never use markdown. No asterisks, no hashtags, no backticks. Plain text only. Use numbered lists and emoji where helpful.`;

export default function HistoryApp() {
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeSubtopic, setActiveSubtopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("home"); // home | topic | chat
  const [visitas, setVisitas] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    fetch("/api/visitas")
      .then((r) => r.json())
      .then((d) => setVisitas(d.visitas))
      .catch(() => {});
  }, []);

  const startPractice = async (topic, subtopic) => {
    setActiveTopic(topic);
    setActiveSubtopic(subtopic);
    setMessages([]);
    setMode("chat");
    setLoading(true);

    const initMessage = `Generate 1 practice exercise (a single question) for: "${subtopic}" (part of ${topic.label}). Make it suitable for a Year 3 child (age 7-8) in KS2.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: initMessage }],
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Something went wrong. Try again!";
      setMessages([
        { role: "assistant", content: reply, subtopic },
      ]);
    } catch {
      setMessages([{ role: "assistant", content: "Connection error. Please try again." }]);
    }
    setLoading(false);
  };

  const sendMessage = async (text) => {
    const userMsg = (typeof text === "string" ? text : input).trim();
    if (!userMsg || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
    apiMessages[0] = {
      role: "user",
      content: `Topic: ${activeTopic?.label} — Subtopic: ${activeSubtopic}\n\n${apiMessages[0].content}`,
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Something went wrong.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error." }]);
    }
    setLoading(false);
  };

  // HOME
  if (mode === "home") {
    return (
      <div style={{ minHeight: "100vh", background: "#FFFBEB", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📜</div>
            <a href="https://y3-hub.vercel.app/" style={{ position: "fixed", top: 12, left: 12, zIndex: 50, background: "#fff", color: "#475569", textDecoration: "none", fontWeight: 700, fontSize: 13, padding: "6px 12px", borderRadius: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.12)", border: "1px solid #e5e7eb" }}>← Hub</a>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#7C2D12", margin: 0 }}>History Y3</h1>
            <p style={{ color: "#6B7280", marginTop: 6, fontSize: 15 }}>Pick a topic and travel back in time with your AI tutor</p>
          </div>

          {TOPICS.map((topic) => (
            <div
              key={topic.id}
              style={{ background: "#fff", borderRadius: 16, marginBottom: 16, border: `2px solid ${topic.light}`, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <div style={{ background: topic.light, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 28, width: 40, textAlign: "center" }}>{topic.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: topic.color }}>{topic.label}</div>
                  <div style={{ fontSize: 13, color: "#6B7280" }}>{topic.description}</div>
                </div>
              </div>
              <div style={{ padding: "12px 20px 16px", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {topic.topics.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => startPractice(topic, sub)}
                    style={{
                      background: topic.color,
                      color: "#fff",
                      border: "none",
                      borderRadius: 20,
                      padding: "7px 16px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseOver={(e) => (e.target.style.opacity = 0.85)}
                    onMouseOut={(e) => (e.target.style.opacity = 1)}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {visitas !== null && (
            <div style={{ textAlign: "center", marginTop: 24, fontSize: 12, color: "#9CA3AF" }}>
              Visitas: {visitas}
            </div>
          )}
        </div>
      </div>
    );
  }

  // CHAT
  return (
    <div style={{ minHeight: "100vh", background: "#FFFBEB", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <div style={{ background: activeTopic.color, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button
          onClick={() => setMode("home")}
          style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}
        >
          ← Back
        </button>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{activeTopic.label}</div>
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>{activeSubtopic}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", maxWidth: 680, margin: "0 auto", width: "100%" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: 16, display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: activeTopic.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, marginRight: 8, flexShrink: 0, alignSelf: "flex-end" }}>
                📜
              </div>
            )}
            <div
              style={{
                background: msg.role === "user" ? activeTopic.color : "#fff",
                color: msg.role === "user" ? "#fff" : "#1F2937",
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                padding: "12px 16px",
                maxWidth: "80%",
                fontSize: 14,
                lineHeight: 1.6,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                whiteSpace: "pre-wrap",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: activeTopic.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📜</div>
            <div style={{ background: "#fff", borderRadius: "18px 18px 18px 4px", padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: activeTopic.color, animation: "bounce 1s infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: "8px 16px 0", maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["More exercises", "Explain again", "Hint", "Make it harder"].map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            style={{ background: activeTopic.light, color: activeTopic.color, border: `1px solid ${activeTopic.color}30`, borderRadius: 16, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            {q}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 16px 20px", maxWidth: 680, margin: "0 auto", width: "100%", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your answer or ask a question..."
          style={{ flex: 1, border: "2px solid #E5E7EB", borderRadius: 24, padding: "10px 18px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          onFocus={(e) => (e.target.style.borderColor = activeTopic.color)}
          onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{ background: activeTopic.color, color: "#fff", border: "none", borderRadius: "50%", width: 44, height: 44, fontSize: 20, cursor: loading ? "not-allowed" : "pointer", opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0 }}
        >
          ↑
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
