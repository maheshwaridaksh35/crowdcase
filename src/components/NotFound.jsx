import React from "react";

export function NotFound() {
  return (
    <main role="main" style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"2rem",background:"#0c0c13",color:"#e9e6f7",fontFamily:"sans-serif",textAlign:"center"}}>
      <section>
        <p style={{fontSize:"0.8rem",letterSpacing:"0.18em",color:"#a99bff"}}>CROW CASE / 404</p>
        <h1 style={{fontSize:"2rem",margin:"0.5rem 0"}}>Case not found</h1>
        <p style={{color:"#aaa7bc",maxWidth:"28rem",lineHeight:1.6}}>This page is not part of the current investigation. Return to the CrowdCase dashboard to continue.</p>
        <a href="/" style={{display:"inline-block",marginTop:"1rem",padding:"0.75rem 1rem",borderRadius:"0.5rem",background:"#9c87f5",color:"#181522",textDecoration:"none",fontWeight:700}}>Back to CrowdCase</a>
      </section>
    </main>
  );
}