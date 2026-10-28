import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import "./overlay.css";
import { AudioLines, Clock3, Fingerprint, Lightbulb, MessageCircle, Shield, Sparkles, Vote } from "lucide-react";

export const Route = createFileRoute("/overlay")({
  head: () => ({
    meta: [
      { title: "CrowdCase — Stream overlay" },
      { name: "description", content: "Browser-source overlay for CrowdCase live mystery games." },
    ],
  }),
  component: CrowdCaseOverlay,
});

const fallback = {
  chapter: 2,
  voteActive: true,
  voteCount: 87,
  isTwitchConnected: false,
  clues: [
    { id: 1, number: "CLUE 01", title: "Silver dust on the window sill", body: "The window was likely not used as an entry point." },
    { id: 2, number: "CLUE 02", title: "The gallery clock stopped at 9:17", body: "The blackout began at 9:16 PM." },
    { id: 3, number: "CLUE 03", title: "A faint blue fiber on the latch", body: "A thread is caught where the display case locks." },
  ],
  theories: [
    { id: "curator", title: "The curator used the blackout to unlock the case", votes: 42 },
    { id: "window", title: "The thief entered through the gallery window", votes: 28 },
    { id: "guard", title: "The night guard staged the blackout", votes: 17 },
  ],
  messages: [
    { id: 1, name: "lunarbyte", text: "the clock stopped at 9:17?? that's too specific", time: "9:17:03" },
    { id: 2, name: "moss.exe", text: "the curator has access to every room 👀", time: "9:17:08" },
    { id: 3, name: "pixelpilgrim", text: "BLUE FIBER ON THE LATCH", time: "9:17:14" },
  ],
};

function CrowdCaseOverlay() {
  const [data, setData] = useState(fallback);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("crowdcase-overlay-state");
      if (saved) setData({ ...fallback, ...JSON.parse(saved) });
    } catch {
      // Keep the static demo state when storage is unavailable.
    }
    if (typeof BroadcastChannel === "undefined") return undefined;
    const channel = new BroadcastChannel("crowdcase-live");
    channel.onmessage = (event) => {
      if (!event.data || typeof event.data !== "object") return;
      setData((prev) => ({ ...prev, ...event.data }));
      setConnected(true);
    };
    return () => channel.close();
  }, []);

  const theories = [...(data.theories || fallback.theories)].sort((a, b) => b.votes - a.votes).slice(0, 3);
  const leader = theories[0];
  const clues = data.clues || fallback.clues;
  const latestMessages = [...(data.messages || fallback.messages)].slice(-3).reverse();

  return (
    <main className="overlay-root">
      <header className="overlay-header">
        <div className="overlay-brand"><span className="overlay-mark"><Fingerprint size={20}/></span><div><strong>CrowdCase</strong><small>THE CHAT IS THE DETECTIVE</small></div></div>
        <div className="overlay-case"><span className="overlay-live-dot"/><span>CASE #0042</span><b>THE MIDNIGHT GALLERY HEIST</b></div>
        <div className="overlay-demo"><span className="overlay-demo-dot"/>{data.isTwitchConnected ? "LIVE TWITCH CHAT" : connected ? "LOCAL DEMO SYNC" : "SIMULATED DEMO"}</div>
      </header>

      <section className="overlay-hero">
        <div className="overlay-hero-copy"><div className="overlay-label"><Sparkles size={13}/> COMMUNITY INVESTIGATION <span>·</span> CHAPTER {data.chapter || 2} / 4</div>
          <h1>The Midnight Gallery Heist</h1><p>A priceless clockwork bird vanished during a 47-second blackout. Chat, connect the clues.</p>
        </div>
        <div className="overlay-progress"><div className="overlay-progress-label"><span>CASE PROGRESS</span><strong>{(data.chapter || 2) * 25}%</strong></div><div className="overlay-progress-track"><i style={{ width: ((data.chapter || 2) * 25) + "%" }}/></div><div className="overlay-progress-foot"><span><Clock3 size={12}/> Blackout: 9:16 PM</span><span>{clues.length} clues revealed</span></div></div>
      </section>

      <section className="overlay-main-grid">
        <div className="overlay-panel overlay-evidence">
          <div className="overlay-panel-heading"><div><div className="overlay-eyebrow"><Fingerprint size={13}/> EVIDENCE WALL</div><h2>What we know so far</h2></div><span className="overlay-count">{clues.length} CLUES</span></div>
          <div className="overlay-clue-list">{clues.slice(-3).reverse().map((clue, i) => <article className="overlay-clue" key={clue.id}><div className={"overlay-clue-icon overlay-clue-icon-" + i}>{clue.id === 2 ? <Clock3 size={22}/> : clue.id === 3 ? <AudioLines size={22}/> : <Fingerprint size={22}/>}</div><div className="overlay-clue-copy"><span>{clue.number || ("CLUE 0" + clue.id)}</span><strong>{clue.title}</strong><p>{clue.body}</p></div><div className="overlay-clue-index">{String(clue.id).padStart(2, "0")}</div></article>)}</div>
        </div>
        <div className="overlay-panel overlay-voting">
          <div className="overlay-panel-heading"><div><div className="overlay-eyebrow"><Vote size={13}/> COMMUNITY VOTE</div><h2>{data.voteActive ? "Who did it?" : "Voting is paused"}</h2></div><span className={"overlay-vote-status " + (data.voteActive ? "is-open" : "")}>{data.voteActive ? "VOTE OPEN" : "VOTE CLOSED"}</span></div>
          <div className="overlay-theories">{theories.map((t, i) => <div className="overlay-theory" key={t.id}><div className="overlay-theory-title"><span className={"overlay-rank rank-" + i}>{String(i + 1).padStart(2, "0")}</span><strong>{t.title}</strong><span>{t.votes}</span></div><div className="overlay-theory-track"><i style={{ width: Math.round(t.votes / Math.max(1, theories[0]?.votes || 1) * 100) + "%" }}/></div></div>)}</div>
          <div className="overlay-vote-footer"><span><MessageCircle size={13}/> Community signal</span><strong>{data.voteCount || 0} votes recorded</strong></div>
        </div>
        <div className="overlay-panel overlay-chat">
          <div className="overlay-panel-heading"><div><div className="overlay-eyebrow"><MessageCircle size={13}/> CHAT SIGNAL</div><h2>Latest from the detectives</h2></div><span className="overlay-count">LIVE FEED</span></div>
          <div className="overlay-chat-list">{latestMessages.map((m, i) => <div className="overlay-chat-row" key={m.id || i}><span className={"overlay-chat-avatar avatar-" + i}>{(m.name || "C").slice(0, 1).toUpperCase()}</span><div><strong>{m.name}</strong><p>{m.text}</p></div><time>{m.time || ""}</time></div>)}</div>
        </div>
        <div className="overlay-panel overlay-leader">
          <div className="overlay-leader-icon"><Lightbulb size={22}/></div><div className="overlay-leader-body"><span>COMMUNITY LEADING THEORY</span><strong>{leader?.title || "The chat is still investigating"}</strong><p>Theories and votes shown here update from the CrowdCase dashboard demo.</p></div><div className="overlay-leader-badge"><Vote size={13}/> {leader?.votes || 0} votes</div>
        </div>
      </section>
      <footer className="overlay-footer"><span><Shield size={12}/> CrowdCase · stream overlay prototype</span><span>{data.isTwitchConnected ? "Twitch chat connected · case state is local to the dashboard" : "Simulated chat — Twitch integration not connected"}</span></footer>
    </main>
  );
}
