"use client";

import type { AdvicePlan } from "@/lib/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  loading: boolean;
  message: string;
  answer: string;
  messages: ChatMessage[];
  plan: AdvicePlan;
  onClose: () => void;
  onMessageChange: (value: string) => void;
  onSendChat: (question?: string) => void;
}

export function ChatPanel({
  loading,
  message,
  answer,
  messages,
  plan,
  onClose,
  onMessageChange,
  onSendChat,
}: ChatPanelProps) {
  const questions = [...new Set([...plan.tips, ...plan.followUps])];
  return (
    <aside
      id="assistant-panel"
      className="chat-panel"
      aria-label="BreatheEasy assistant"
    >
      <div className="chat-head">
        <strong>BreatheEasy Assistant</strong>
        <button aria-label="Close assistant" onClick={onClose}>
          ×
        </button>
      </div>
      <span className="chat-mode">
        {plan.smartMode === "live"
          ? "AI · Gemini"
          : `Rules · ${(plan.smartModeReason ?? "offline").replaceAll("_", " ")}`}
      </span>
      <div className="chat-answer" aria-live="polite" aria-busy={loading}>
        {messages.length > 0 ? (
          messages.map((entry, index) => (
            <p
              className={`chat-message chat-message-${entry.role}`}
              key={`${entry.role}-${index}`}
            >
              <strong>{entry.role === "user" ? "You" : "BreatheEasy"}</strong>
              {entry.content}
            </p>
          ))
        ) : (
          <p>{answer || "Ask me how to protect your family."}</p>
        )}
        {loading && <p role="status">Thinking…</p>}
      </div>
      {questions.length > 0 && (
        <div className="chat-tips">
          {questions.map((question) => (
            <button key={question} onClick={() => onSendChat(question)}>
              {question}
            </button>
          ))}
        </div>
      )}
      <div className="chat-input">
        <input
          value={message}
          onChange={(event) => onMessageChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.nativeEvent.isComposing &&
              !loading
            )
              onSendChat();
          }}
          placeholder="Ask a question…"
          aria-label="Chat message"
        />
        <button
          onClick={() => onSendChat()}
          disabled={loading || !message.trim()}
        >
          Send
        </button>
      </div>
    </aside>
  );
}
