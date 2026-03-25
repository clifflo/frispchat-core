"use client";

import Link from "next/link";
import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";

interface Message {
  id: number;
  sender: "me" | "other";
  text: string;
  timestamp: string;
}

const DEMO_MESSAGES: Message[] = [
  {
    id: 1,
    sender: "other",
    text: "Hey! Welcome to FrispChat 👋",
    timestamp: "09:00",
  },
  {
    id: 2,
    sender: "other",
    text: "Start a conversation below.",
    timestamp: "09:00",
  },
];

function formatCurrentTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(DEMO_MESSAGES.length + 1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;

    const newMessage: Message = {
      id: nextId.current++,
      sender: "me",
      text,
      timestamp: formatCurrentTime(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendMessage();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            FC
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              FrispChat Room
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">General</p>
          </div>
        </div>
        <Link
          href="/signup"
          className="rounded-full border border-zinc-300 dark:border-zinc-600 px-4 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
        >
          Sign Up
        </Link>
      </header>

      {/* Message list */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-2xl px-4 py-2 text-sm shadow-sm ${
                msg.sender === "me"
                  ? "rounded-br-sm bg-indigo-600 text-white"
                  : "rounded-bl-sm bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-100"
              }`}
            >
              <p className="leading-relaxed">{msg.text}</p>
              <p
                className={`mt-1 text-right text-[10px] ${
                  msg.sender === "me"
                    ? "text-indigo-200"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3"
      >
        <textarea
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-h-32"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M3.478 2.405a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.405Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
