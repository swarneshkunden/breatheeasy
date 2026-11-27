"use client";

import type { AdvicePlan } from "@/lib/types";

interface ChatPanelProps {
  loading: boolean;
  message: string;
  answer: string;
  plan: AdvicePlan;
  onClose: () => void;
  onMessageChange: (value: string) => void;
  onSendChat: () => void;
  onTipClick: (title: string) => void;
}

export function ChatPanel({
  loading,
  message,
  answer,
  plan,
  onClose,
  onMessageChange,
  onSendChat,
  onTipClick,
}: ChatPanelProps) {
  return (
    <aside id="assistant-panel" className="chat-panel" aria-label="BreatheEasy assistant">
      <div className="chat-head"><strong>BreatheEasy Assistant</strong><button aria-label="Close assistant" onClick={onClose}>×</button></div>
      <div className="chat-answer" aria-live="polite" aria-busy={loading}>{loading ? "Thinking…" : answer || "Ask me how to protect your family."}</div>
      {plan.indoor.length > 0 && <div className="chat-tips">{plan.indoor.map((tip) => <button key={tip.title} onClick={() => onTipClick(tip.title)}>{tip.title}</button>)}</div>}
      <div className="chat-input">
        <input value={message} onChange={(event) => onMessageChange(event.target.value)} onKeyDown={(event) => event.key === "Enter" && onSendChat()} placeholder="Ask a question…" aria-label="Chat message" />
        <button onClick={onSendChat}>Send</button>
      </div>
    </aside>
  );
}
