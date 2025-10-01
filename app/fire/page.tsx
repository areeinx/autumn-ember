"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./fireFlicker.css";
import { signIn, useSession } from "next-auth/react";
import { supabase } from "../../lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

const moods = [
  { key: "trash", label: "Trash", img: "/trash.png", flame: "/purpleflame.gif", halo: "#a259f7" },
  { key: "meh", label: "Meh", img: "/meh.png", flame: "/blueflame.gif", halo: "#4fc3f7" },
  { key: "ok", label: "Ok", img: "/ok.png", flame: "/greenflame.gif", halo: "#81c784" },
  { key: "cool", label: "Cool", img: "/cool.png", flame: "/pinkflame.gif", halo: "#f06292" },
  { key: "lit", label: "Lit", img: "/lit.png", flame: "/redflame.gif", halo: "#ff5252" },
];

export default function FirePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [fireZoomedOut, setFireZoomedOut] = useState(false);
  const [showContainers, setShowContainers] = useState(false);
  const [showTaskLog, setShowTaskLog] = useState(false);
  const [showMoodLog, setShowMoodLog] = useState(false);
  const [showCampfire, setShowCampfire] = useState(false);

  const [flameGif, setFlameGif] = useState("/Flame.gif");
  const [fireColor, setFireColor] = useState("#ffefaa");
  const [coloredMode, setColoredMode] = useState(false);

  const [soundMuted, setSoundMuted] = useState(false);
  const [endingFire, setEndingFire] = useState(false);
  const [showSmoke, setShowSmoke] = useState(false);
  const [hideFire, setHideFire] = useState(false);

  function handleEndFire() {
    if (endingFire) return;
    setEndingFire(true);
    setShowContainers(false);
    setFireZoomedOut(false); // Zoom fire in

    // Wait for zoom-in animation (adjust to your CSS duration, e.g. 700ms)
    setTimeout(() => {
      setHideFire(true); // Hide fire after zoom-in
      setShowSmoke(true); // Show smoke
      // Wait for smoke to stay visible (e.g. 3500ms)
      setTimeout(() => {
        router.push("/");
      }, 3500);
    }, 700);
  }

  // campfire session logic
  const [username, setUsername] = useState("");
  const [usernameSet, setUsernameSet] = useState(false);
  const [inviteCode] = useState(uuidv4().slice(0, 6).toUpperCase());
  const [joinCode, setJoinCode] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [loading, setLoading] = useState(false);

  // tasks
  const [tasks, setTasks] = useState<{ text: string; completed: boolean }[]>([]);
  const [newTask, setNewTask] = useState("");

  // sparks
  const [sparks, setSparks] = useState<{ id: number; left: number; delay: number }[]>([]);

  useEffect(() => {
    if (coloredMode) {
      const interval = setInterval(() => {
        setSparks((prev) => [
          ...prev,
          { id: Date.now(), left: Math.random() * 250 - 125, delay: Math.random() * 2 },
        ]);
        setSparks((prev) => prev.filter((s) => Date.now() - s.id < 4000));
      }, 500);
      return () => clearInterval(interval);
    }
  }, [coloredMode]);

  // auto zoom out
  useEffect(() => {
    if (!endingFire) {
      const timer = setTimeout(() => {
        setFireZoomedOut(true);
        setShowContainers(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [endingFire]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks([...tasks, { text: newTask, completed: false }]);
    setNewTask("");
  };

  const handleToggleTask = (idx: number) => {
    setTasks((tasks) =>
      tasks.map((t, i) => (i === idx ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="flex min-h-screen bg-black page-fade-in relative overflow-hidden">
      {/* Settings */}
      {showContainers && (
        <div className="absolute top-4 left-4 flex gap-4 z-20 slide-in-left text-white">
          <button title="Account">👤</button>
          <button title="Info">ℹ️</button>
          <button title="Help">❔</button>
          <button
            title={soundMuted ? "Unmute" : "Mute"}
            onClick={() => setSoundMuted(!soundMuted)}
          >
            {soundMuted ? "🔇" : "🔊"}
          </button>
          <input type="range" min={0} max={100} defaultValue={80} title="Volume" />
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar / Containers */}
        {showContainers && (
          <div className="flex flex-col justify-between py-12 pl-8 w-1/3 max-w-xs gap-6 slide-in-left text-white">
            {/* menu */}
            {!showTaskLog && !showMoodLog && !showCampfire && (
              <>
                <button className="glow-btn" onClick={() => setShowTaskLog(true)}>Task Log</button>
                <button className="glow-btn" onClick={() => setShowMoodLog(true)}>Mood Log</button>
                <button className="glow-btn" onClick={() => setShowCampfire(true)}>Campfire Site</button>
              </>
            )}

            {/* Task Log */}
            {showTaskLog && (
              <div
                className="panel glow"
                style={{
                  color: fireColor,
                  width: 420, // wider container
                  minWidth: 320,
                  maxWidth: 520,
                  fontSize: "1.2rem",
                  padding: "2rem",
                }}
              >
                <h2 className="font-bold text-xl mb-4">🔥 Task Log</h2>
                <form onSubmit={handleAddTask} className="flex mb-4">
                  <input
                    className="border p-2 rounded w-full bg-black/40 text-white"
                    placeholder="Add a task"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                  />
                  <button className="ml-2 glow-btn" type="submit">Add</button>
                </form>
                <ul className="mt-2 max-h-40 overflow-y-auto">
                  {tasks.map((task, i) => (
                    <li
                      key={i}
                      className={`task-item cursor-pointer ${
                        task.completed ? "line-through text-gray-400" : "text-white"
                      }`}
                      onClick={() => handleToggleTask(i)}
                    >
                      • {task.text}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setShowTaskLog(false)} className="mt-4 glow-btn">Close</button>
              </div>
            )}

            {/* Mood Log */}
            {showMoodLog && (
              <div
                className="panel glow"
                style={{
                  color: fireColor,
                  width: 520, // wider container
                  minWidth: 320,
                  maxWidth: 620,
                  fontSize: "1.2rem",
                  padding: "2rem",
                }}
              >
                <h2 className="font-bold text-xl mb-4">🌙 Mood Log</h2>
                <div className="flex gap-4 justify-around">
                  {moods.map((mood) => (
                    <button
                      key={mood.key}
                      className="flex flex-col items-center"
                      onClick={() => {
                        setFlameGif(mood.flame);
                        setFireColor(mood.halo);
                        setColoredMode(true);
                        setTimeout(() => {
                          setFlameGif("/Flame.gif");
                          setFireColor("#ffefaa");
                          setColoredMode(false);
                        }, 5000);
                      }}
                    >
                      <img src={mood.img} alt={mood.label} className="w-12 h-12 mb-2" />
                      <span>{mood.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowMoodLog(false)} className="mt-4 glow-btn">Close</button>
              </div>
            )}

            {/* Campfire Site */}
            {showCampfire && (
              <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                <div className="panel glow bg-black text-white min-w-[320px]" style={{ color: fireColor }}>
                  {status === "loading" ? (
                    <div>Loading...</div>
                  ) : !session ? (
                    <>
                      <h2 className="font-bold text-xl mb-4">Sign in to join a Campfire</h2>
                      <button className="glow-btn" onClick={() => signIn("google")}>
                        Sign in with Google
                      </button>
                      <button onClick={() => setShowCampfire(false)} className="ml-2 glow-btn">
                        Close
                      </button>
                    </>
                  ) : !usernameSet ? (
                    <>
                      <h2 className="font-bold text-xl mb-4">Set your Campfire Username</h2>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (username.trim()) setUsernameSet(true);
                        }}
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        <input
                          className="border p-2 rounded mb-2 bg-black/40 text-white"
                          placeholder="Enter username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                          style={{ marginRight: "0.75rem" }} // <-- add this line
                        />
                        <button
                          className="glow-btn"
                          type="submit"
                          style={{ padding: "0.5rem 1.2rem", fontSize: "1rem" }}
                        >
                          Continue
                        </button>
                        <button
                          type="button"
                          className="ml-2 glow-btn"
                          onClick={() => setShowCampfire(false)}
                          style={{ padding: "0.5rem 1.2rem", fontSize: "1rem" }}
                        >
                          Cancel
                        </button>
                      </form>
                    </>
                  ) : (
                    <>
                      <h2 className="font-bold text-xl mb-4">Campfire Session</h2>
                      <div className="mb-6">
                        <p>Your invite code:</p>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg">{inviteCode}</span>
                          <button
                            className="glow-btn"
                            onClick={() => navigator.clipboard.writeText(inviteCode)}
                          >
                            Copy
                          </button>
                          <button
                            className="glow-btn"
                            disabled={loading}
                            onClick={async () => {
                              setLoading(true);
                              setInviteError("");
                              const { error } = await supabase.from("campfire_sessions").insert([
                                {
                                  code: inviteCode,
                                  users: JSON.stringify([{ name: username, email: session?.user?.email }]),
                                  tasks: JSON.stringify([]),
                                },
                              ]);
                              if (error) {
                                setInviteError("Error creating session. Try again.");
                                setLoading(false);
                                return;
                              }
                              sessionStorage.setItem("campfireCode", inviteCode);
                              setLoading(false);
                              setShowCampfire(false);
                              router.push("/campfire-site");
                            }}
                          >
                            Start Campfire
                          </button>
                        </div>
                      </div>
                      <div className="mb-6">
                        <p>Or join a friend's campfire:</p>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setLoading(true);
                            setInviteError("");
                            const { data, error } = await supabase
                              .from("campfire_sessions")
                              .select("*")
                              .eq("code", joinCode)
                              .single();
                            if (!data || error) {
                              setInviteError("Invalid code!");
                              setLoading(false);
                              return;
                            }
                            let users = data.users || [];
                            if (typeof users === "string") users = JSON.parse(users);
                            if (!users.some((u: { email: string }) => u.email === session?.user?.email)) {
                              users.push({ name: username, email: session?.user?.email });
                              await supabase
                                .from("campfire_sessions")
                                .update({ users: JSON.stringify(users) })
                                .eq("code", joinCode);
                            }
                            sessionStorage.setItem("campfireCode", joinCode);
                            setLoading(false);
                            setShowCampfire(false);
                            router.push("/campfire-site");
                          }}
                        >
                          <input
                            className="border p-2 rounded mr-2 bg-black/40 text-white"
                            placeholder="Enter invite code"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            required
                          />
                          <button className="glow-btn" type="submit" disabled={loading}>
                            Join
                          </button>
                          <button type="button" className="ml-2 glow-btn" onClick={() => setShowCampfire(false)}>
                            Cancel
                          </button>
                        </form>
                      </div>
                      {inviteError && <div className="text-red-500">{inviteError}</div>}
                      {loading && <div className="text-yellow-400">Loading...</div>}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* End Fire */}
            <div className="flex flex-col gap-4 mt-auto">
              <button className="glow-btn" onClick={handleEndFire} disabled={endingFire}>
                End Fire
              </button>
            </div>
          </div>
        )}

        {/* Fire Zone */}
        <div className={`relative flex items-center justify-center flex-1 fire-zoom-transition ${fireZoomedOut ? "fire-zoomed" : ""}`}>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            {/* Halo Inner */}
            {!hideFire && (
              <div
                className="fire-halo"
                style={{
                  width: 480,
                  height: 480,
                  borderRadius: "50%",
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%,-50%)",
                  background: coloredMode
                    ? `radial-gradient(circle, ${fireColor} 0%, transparent 80%)`
                    : `radial-gradient(circle, #ffefaa 0%, transparent 80%)`,
                  filter: "blur(60px)",
                  transition: "background 0.5s",
                  zIndex: 0,
                }}
              />
            )}
            {/* Halo Outer */}
            {!hideFire && (
              <div
                className="fire-halo"
                style={{
                  width: 650,
                  height: 650,
                  borderRadius: "50%",
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%,-50%)",
                  background: coloredMode ? `${fireColor}33` : `#ffefaa33`,
                  filter: "blur(90px)",
                  zIndex: 0,
                }}
              />
            )}

            {/* Sparks */}
            {!hideFire && coloredMode && (
              <div className="sparks">
                {sparks.map((spark) => (
                  <div
                    key={spark.id}
                    className="spark"
                    style={{
                      backgroundColor: fireColor,
                      left: `${spark.left}px`,
                      top: "0px",
                      animationDelay: `${spark.delay}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Flame */}
            {!hideFire && (
              <img
                src={flameGif}
                alt="Fire"
                width={480}
                height={480}
                style={{ zIndex: 1, position: "relative" }}
              />
            )}

            {/* Smoke */}
            {showSmoke && (
              <Image
                src="/Smoke.gif"
                alt="Smoke"
                width={480}
                height={480}
                style={{ zIndex: 2, position: "relative" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
