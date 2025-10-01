"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import React from "react";

type Task = { text: string; completed: boolean };

export default function CampfireSite() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState<string | null>(null);
  const [users, setUsers] = useState<{ name: string; email: string }[]>([]);
  const [sessionUserEmail, setSessionUserEmail] = useState<string | null>(null);
  const [showTaskLog, setShowTaskLog] = useState(false);

  // Get current user's email from localStorage/sessionStorage if you store it there
  useEffect(() => {
    // If you store the email in sessionStorage, retrieve it here
    // Otherwise, you can get it from Supabase auth if you use it
    const email = sessionStorage.getItem("campfireUserEmail");
    setSessionUserEmail(email);
  }, []);

  // Real-time subscription for tasks and users
  useEffect(() => {
    const campfireCode = typeof window !== "undefined" ? sessionStorage.getItem("campfireCode") : null;
    setCode(campfireCode);

    if (campfireCode) {
      fetchSession(campfireCode);

      // Subscribe to changes in this session's tasks and users
      const channel = supabase
        .channel("campfire-tasks")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "campfire_sessions",
            filter: `code=eq.${campfireCode}`,
          },
          (payload) => {
            let updatedTasks = payload.new.tasks;
            if (typeof updatedTasks === "string") updatedTasks = JSON.parse(updatedTasks);
            setTasks(updatedTasks || []);
            let updatedUsers = payload.new.users;
            if (typeof updatedUsers === "string") updatedUsers = JSON.parse(updatedUsers);
            setUsers(updatedUsers || []);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  async function fetchSession(campfireCode: string) {
    setLoading(true);
    const { data, error } = await supabase
      .from("campfire_sessions")
      .select("*")
      .eq("code", campfireCode)
      .single();

    if (error || !data) {
      setLoading(false);
      // Optionally redirect or show error
      alert("Campfire session not found!");
      router.push("/fire");
      return;
    }

    let fetchedTasks = data.tasks || [];
    if (typeof fetchedTasks === "string") fetchedTasks = JSON.parse(fetchedTasks);
    setTasks(fetchedTasks);

    let fetchedUsers = data.users || [];
    if (typeof fetchedUsers === "string") fetchedUsers = JSON.parse(fetchedUsers);
    setUsers(fetchedUsers);

    setLoading(false);
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim() || !code) return;
    const updatedTasks = [...tasks, { text: newTask, completed: false }];
    setTasks(updatedTasks);
    setNewTask("");
    await supabase
      .from("campfire_sessions")
      .update({ tasks: JSON.stringify(updatedTasks) })
      .eq("code", code);
  }

  async function handleToggleTask(index: number) {
    const updatedTasks = tasks.map((task, i) =>
      i === index ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    if (code) {
      await supabase
        .from("campfire_sessions")
        .update({ tasks: JSON.stringify(updatedTasks) })
        .eq("code", code);
    }
  }

  async function handleEndSession() {
    if (code) {
      await supabase
        .from("campfire_sessions")
        .delete()
        .eq("code", code);
      sessionStorage.removeItem("campfireCode");
    }
    router.push("/fire");
  }

  // Host is always users[0], friend is users[1] (if present)
  const host = users[0];
  const friend = users[1];

  // Detect if any task is completed
  const anyTaskCompleted = tasks.some(task => task.completed);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-yellow-400">
        <div className="mb-4">
          <svg className="animate-spin h-12 w-12 text-yellow-400" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        </div>
        <div>Loading campfire session...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Campfire image as background */}
      <img
        src="/campfire.png"
        alt="Campfire"
        className="fixed inset-0 w-full h-full object-cover z-0"
        style={{ objectFit: "cover" }}
      />

      {/* Usernames above characters */}
      {/* Host (left) */}
      {host && (
        <div
          style={{
            position: "absolute",
            left: "35%",
            top: "38%",
            transform: "translate(-50%, -100%)",
            zIndex: 10,
            color: "#fff",
            fontWeight: "bold",
            fontSize: "0.95rem", // smaller font
            textShadow: "0 2px 8px #000, 0 0 6px #000, 0 0 2px #000",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            letterSpacing: "0.03em",
          }}
        >
          {host.name}
        </div>
      )}
      {/* Friend (right) */}
      {friend && (
        <div
          style={{
            position: "absolute",
            left: "77%",
            top: "46%",
            transform: "translate(-50%, -100%)",
            zIndex: 10,
            color: "#fff",
            fontWeight: "bold",
            fontSize: "0.95rem", // smaller font
            textShadow: "0 2px 8px #000, 0 0 6px #000, 0 0 2px #000",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            letterSpacing: "0.03em",
          }}
        >
          {friend.name}
        </div>
      )}

      {/* Task log and End Campfire (top left) */}
      <div className="absolute top-6 left-6 z-10 flex flex-col items-start">
        {/* Minimized task log button */}
        {!showTaskLog && (
          <button
            className="bg-[#fff8e1] text-black rounded-lg px-4 py-2 font-bold shadow hover:bg-[#ffeec1] transition mb-2"
            onClick={() => setShowTaskLog(true)}
          >
            Open Task Log
          </button>
        )}

        {/* Expanded task log */}
        {showTaskLog && (
          <div className="bg-[#fff8e1] text-black rounded-xl p-6 shadow-lg w-80 mb-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold">Shared Task Log</h2>
              <button
                className="text-gray-600 hover:text-black font-bold"
                onClick={() => setShowTaskLog(false)}
                title="Minimize"
              >
                &minus;
              </button>
            </div>
            <form onSubmit={handleAddTask} className="flex">
              <input
                className="border p-2 rounded w-full"
                placeholder="Add a task"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
              />
              <button className="ml-2 bg-[#bfa77a] rounded px-3 py-1" type="submit">
                Add
              </button>
            </form>
            <ul className="mt-4 max-h-40 overflow-y-auto">
              {tasks.map((task, i) => (
                <li
                  key={i}
                  className={`mb-1 cursor-pointer select-none ${task.completed ? "line-through text-gray-400" : ""}`}
                  onClick={() => handleToggleTask(i)}
                  title="Click to mark as done"
                >
                  - {task.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* "End Campfire" button */}
        <button
          className="bg-red-600 text-white rounded px-4 py-2 font-bold shadow"
          onClick={handleEndSession}
        >
          End Campfire
        </button>
      </div>

      {/* Flame + Halo + Sparks */}
      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "62%",
          transform: "translate(-50%, -50%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {/* Halo */}
        <div
          className={`flame-halo ${anyTaskCompleted ? "flicker-fast" : "flicker-slow"}`}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: "340px",
            height: "340px",
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,230,120,0.35) 0%, rgba(255,180,60,0.15) 60%, transparent 100%)",
            filter: "blur(18px)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        {/* Flame GIF */}
        <img
          src="/Flame.gif"
          alt="Flame"
          style={{
            width: "300px",
            height: "auto",
            display: "block",
            zIndex: 2,
            position: "relative",
            animation: anyTaskCompleted ? "flamePulse 0.5s infinite" : "flamePulse 1.2s infinite",
          }}
        />
        {/* Sparks */}
        <div className="sparks-container">
          {[...Array(7)].map((_, i) => (
            <span key={i} className={`spark spark-${i} ${anyTaskCompleted ? "spark-fast" : ""}`} />
          ))}
        </div>
      </div>
    </div>
  );
}