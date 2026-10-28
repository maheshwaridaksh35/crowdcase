import React from "react";

export function DefaultCatchBoundary({error, reset}) {
  const message = error instanceof Error ? error.message : "An unexpected application error occurred.";
  return (
    <main role="alert" style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"2rem",background:"#0c0c13",color:"#e9e6f7",fontFamily:"sans-serif"}}>
      <section style={{maxWidth:"38rem"}}>
        <p style={{fontSize:"0.8rem",letterSpacing:"0.18em",color:"#ffbd78"}}>CROW CASE / SYSTEM ALERT</p>
        <h1 style={{fontSize:"2rem",margin:"0.5rem 0"}}>The investigation hit an error.</h1>
        <p style={{color:"#aaa7bc",lineHeight:1.6}}>The page could not be loaded. You can retry or return to the dashboard.</p>
        {import.meta.env.DEV && <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",padding:"1rem",borderRadius:"0.5rem",background:"#181722"}}>{message}</pre>}
        <div style={{display:"flex",gap:"0.75rem",flexWrap:"wrap",marginTop:"1rem"}}>
          <button onClick={()=>reset?.()} style={{padding:"0.75rem 1rem",borderRadius:"0.5rem",border:0,background:"#9c87f5",color:"#181522",fontWeight:700,cursor:"pointer"}}>Retry</button>
          <a href="/" style={{display:"inline-block",padding:"0.75rem 1rem",borderRadius:"0.5rem",background:"#22202e",color:"#e9e6f7",textDecoration:"none"}}>Back to CrowdCase</a>
        </div>
      </section>
    </main>
  );
}