import { useState, useRef, useEffect } from "react";

const EXPERTOS = `Eres SOBERANA — El Espejo de la Esencia.

Tu conocimiento integra los frameworks y metodologías más reconocidos en psicología, neurociencia y bienestar emocional femenino — y cuando ella te escribe, analizas lo que vivió desde cada perspectiva relevante, con claridad, calidez y una chispa de picardía caribeña cuando el momento lo pide.

No eres terapeuta. No diagnosticas. Eres el espejo que muestra lo que ya está ahí.

FRAMEWORKS QUE TIENES INTEGRADOS:
- Metacognición (Flavell) — patrones vs situaciones, variables de persona, tarea y estrategia
- Coaching ontológico y metodología MMK — hechos vs interpretaciones, lealtades invisibles, contratos inconscientes
- Psicología relacional (Gottman, Perel) — dinámicas de pareja, familia y trabajo, los cuatro jinetes
- Neurociencia del trauma (Van der Kolk, Perry) — el cuerpo lleva la cuenta, respuesta somática
- Neurociencia de las emociones — gestión emocional desde la evidencia científica, en español y con calidez
- IFS Sistema de Familia Interna (Schwartz) — partes protectoras, nunca hay un enemigo interno
- Ciclo hormonal femenino (Pelz, Gottfried, Mosconi) — la biología es contexto, no excusa
- Trauma transgeneracional — los patrones que no se resuelven se transmiten
- Teoría del apego (Bowlby, Main) — los vínculos tempranos diseñan los posteriores
- Psicología financiera (Klontz) — el merecimiento, la culpa por prosperar

CÓMO RESPONDES:
1. LEES TODO. Identificas: rol activado, emoción dominante, experto relevante, punto ciego.
2. ANALIZAS en voz alta por secciones — nombre del experto + lo que ve en lo que ella contó.
3. NOMBRAS el punto ciego una sola vez, con calma.
4. CIERRAS con UNA pregunta profunda. Solo una.

FORMATO: Apertura con sus palabras → Secciones por experto → Diagnóstico breve → Una pregunta.

VOZ: Español latinoamericano. Tutea. Calidez real. Humor ligero cuando corresponde. Cero jerga clínica ni positivismo tóxico.

PROHIBIDO: "Es válido", "Me alegra que lo compartas", "Eso es muy valiente", "Recuerda que mereces amor", "Tú eres suficiente", "Gracias por compartir", "Estás haciendo un trabajo increíble", "mi amor", "cariño", "bonita".`;

const buildSystemPrompt = (perfil) => {
  if (!perfil) return EXPERTOS;
  return `${EXPERTOS}

PERFIL DE ESTA MUJER (cargado desde onboarding):
- Nombre: ${perfil.nombre || "no indicado"}
- Edad: ${perfil.edad || "no indicada"}
- Origen: ${perfil.origen || "no indicado"} · Vive en: ${perfil.ciudad || "no indicado"}
- Ciclo: ${perfil.ciclo || "no indicado"} · Último período: ${perfil.periodo || "no indicado"}
- Condición hormonal: ${perfil.condicion || "ninguna indicada"}
- Convive con: ${perfil.convive || "no indicado"}
- Hijos: ${perfil.hijos || "no indicado"}
- Trabajo: ${perfil.trabajo || "no indicado"}
- Por qué llegó a SOBERANA: ${perfil.motivacion || "no indicado"}
- Relación que drena energía: ${perfil.relacion_carga || "no indicada"}
- Algo que quiere cambiar: ${perfil.quiere_cambiar || "no indicado"}
- Cómo se siente con su vida ahora: ${perfil.tres_palabras || "no indicado"}

Usa este perfil para personalizar cada respuesta. No lo menciones explícitamente a menos que sea relevante — solo déjalo informar tu mirada.`;
};

const getWelcome = (perfil) => ({
  role: "assistant",
  content: perfil?.nombre
    ? `Hola, ${perfil.nombre}. ¿Cómo estás hoy? ¿Qué te trae por aquí?`
    : "Hola, ¿cómo estás? ¿Qué te trae por aquí hoy?"
});

const PREGUNTAS = [
  { id: "nombre", label: "¿Cómo te llamas?", placeholder: "Tu nombre...", tipo: "text" },
  { id: "edad", label: "¿Cuántos años tienes?", placeholder: "Tu edad...", tipo: "text" },
  { id: "origen", label: "¿De dónde eres?", placeholder: "País o ciudad de origen...", tipo: "text" },
  { id: "ciudad", label: "¿Dónde vives ahora?", placeholder: "Ciudad donde vives...", tipo: "text" },
  { id: "ciclo", label: "¿Tienes ciclo menstrual regular?", placeholder: "", tipo: "select", opciones: ["Sí, regular", "Irregular", "En perimenopausia", "En menopausia", "Sin ciclo (otro motivo)"] },
  { id: "periodo", label: "¿Cuándo fue tu último período?", placeholder: "Fecha aproximada o 'hace X días'...", tipo: "text", condicional: (p) => !["En menopausia", "Sin ciclo (otro motivo)"].includes(p.ciclo) },
  { id: "condicion", label: "¿Tienes alguna condición hormonal diagnosticada?", placeholder: "Endometriosis, SOP, tiroides... o escribe 'ninguna'", tipo: "text" },
  { id: "convive", label: "¿Con quién vives?", placeholder: "Sola, pareja, familia, compañeras...", tipo: "text" },
  { id: "hijos", label: "¿Tienes hijos?", placeholder: "", tipo: "select", opciones: ["No", "Sí, 1", "Sí, 2", "Sí, 3 o más"] },
  { id: "trabajo", label: "¿En qué trabajas o a qué te dedicas?", placeholder: "Tu trabajo o actividad principal...", tipo: "text" },
  { id: "motivacion", label: "¿Qué te trajo a SOBERANA? ¿Qué quieres entender mejor de ti misma?", placeholder: "Escribe con libertad...", tipo: "textarea" },
  { id: "relacion_carga", label: "¿Hay alguna relación en tu vida que te esté quitando energía ahora mismo?", placeholder: "Pareja, familia, trabajo... o escribe 'ninguna'", tipo: "textarea" },
  { id: "quiere_cambiar", label: "¿Hay algo que llevas tiempo queriendo cambiar pero no has podido?", placeholder: "Lo que sea que venga a tu mente...", tipo: "textarea" },
  { id: "tres_palabras", label: "Tres palabras que describan cómo te sientes con tu vida ahora mismo.", placeholder: "Ej: confundida, cansada, esperanzada...", tipo: "text" },
];

const S = {
  bg: "#0c0a09",
  gold: "#c9a96e",
  goldDim: "rgba(201,169,110,0.2)",
  text: "#c8bdb0",
  textLight: "#e8e0d5",
  textDim: "#6a5a48",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(201,169,110,0.12)",
};

export default function App() {
  const [screen, setScreen] = useState("intro"); // intro | onboarding | chat
  const [perfil, setPerfil] = useState({});
  const [step, setStep] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [messages, setMessages] = useState(() => [getWelcome(null)]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  }, [messages, loading]);

  const preguntasVisibles = PREGUNTAS.filter(p => !p.condicional || p.condicional(perfil));
  const preguntaActual = preguntasVisibles[step];
  const progreso = Math.round((step / preguntasVisibles.length) * 100);

  const avanzar = () => {
    if (!currentAnswer.trim() && preguntaActual.tipo !== "select") return;
    const val = currentAnswer.trim() || (preguntaActual.opciones?.[0] || "");
    setPerfil(prev => ({ ...prev, [preguntaActual.id]: val }));
    setCurrentAnswer("");
    if (step + 1 < preguntasVisibles.length) {
      setStep(s => s + 1);
    } else {
      const finalPerfil = { ...perfil, [preguntaActual.id]: val };
      setPerfil(finalPerfil);
      setMessages([getWelcome(finalPerfil)]);
      setScreen("chat");
    }
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: buildSystemPrompt(perfil),
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.content?.[0]?.text || "..." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Algo no funcionó. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
    }
  };

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (screen === "intro") return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,${S.bg},#111009,#0e0c0a)`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 24px", fontFamily:"Georgia,serif" }}>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 30% 30%,rgba(201,169,110,0.06) 0%,transparent 60%)", pointerEvents:"none" }} />
      <div style={{ maxWidth:"480px", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:"0.75rem", letterSpacing:"0.3em", color:S.goldDim, textTransform:"uppercase", marginBottom:"20px" }}>bienvenida</div>
        <h1 style={{ fontSize:"2.8rem", color:S.gold, letterSpacing:"0.15em", textTransform:"uppercase", fontWeight:"normal", margin:"0 0 8px" }}>SOBERANA</h1>
        <p style={{ fontSize:"0.85rem", color:S.textDim, fontStyle:"italic", letterSpacing:"0.08em", margin:"0 0 40px" }}>El Espejo de la Esencia</p>
        <p style={{ color:S.text, lineHeight:"1.8", fontSize:"0.95rem", margin:"0 0 16px" }}>
          Tu espejo inteligente — basado en neurociencia, psicología relacional y bienestar emocional femenino. Disponible cuando quieras, con tu historia, en tu idioma.
        </p>
        <p style={{ color:S.textDim, lineHeight:"1.8", fontSize:"0.88rem", margin:"0 0 48px" }}>
          Antes de empezar, te hacemos unas preguntas cortas para conocerte. Son unos 5 minutos.
        </p>
        <button onClick={() => setScreen("onboarding")} style={{ background:`linear-gradient(135deg,${S.gold},#a07840)`, border:"none", color:S.bg, padding:"16px 48px", fontSize:"0.95rem", letterSpacing:"0.1em", textTransform:"uppercase", borderRadius:"6px", cursor:"pointer", fontFamily:"Georgia,serif" }}>
          Empezar
        </button>
        <button onClick={() => { setMessages([getWelcome(null)]); setScreen("chat"); }} style={{ display:"block", margin:"16px auto 0", background:"none", border:"none", color:S.textDim, fontSize:"0.8rem", cursor:"pointer", textDecoration:"underline", fontFamily:"Georgia,serif" }}>
          Saltar y entrar directo
        </button>
      </div>
    </div>
  );

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  if (screen === "onboarding") return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,${S.bg},#111009)`, display:"flex", flexDirection:"column", alignItems:"center", fontFamily:"Georgia,serif" }}>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 70% 20%,rgba(201,169,110,0.04) 0%,transparent 60%)", pointerEvents:"none" }} />

      {/* Barra de progreso */}
      <div style={{ width:"100%", height:"2px", background:"rgba(201,169,110,0.1)" }}>
        <div style={{ height:"100%", width:`${progreso}%`, background:S.gold, transition:"width 0.4s ease" }} />
      </div>

      <div style={{ width:"100%", maxWidth:"560px", padding:"48px 24px", position:"relative", zIndex:1, flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ fontSize:"0.7rem", color:S.textDim, letterSpacing:"0.1em", marginBottom:"40px" }}>
          {step + 1} de {preguntasVisibles.length}
        </div>

        <h2 style={{ color:S.textLight, fontSize:"1.2rem", fontWeight:"normal", lineHeight:"1.6", margin:"0 0 32px" }}>
          {preguntaActual?.label}
        </h2>

        {preguntaActual?.tipo === "select" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {preguntaActual.opciones.map(op => (
              <button key={op} onClick={() => { setPerfil(prev=>({...prev,[preguntaActual.id]:op})); setCurrentAnswer(op); }}
                style={{ padding:"14px 20px", background:currentAnswer===op||perfil[preguntaActual.id]===op?"rgba(201,169,110,0.15)":S.card, border:`1px solid ${currentAnswer===op||perfil[preguntaActual.id]===op?S.gold:S.border}`, borderRadius:"8px", color:currentAnswer===op||perfil[preguntaActual.id]===op?S.gold:S.text, textAlign:"left", cursor:"pointer", fontSize:"0.9rem", fontFamily:"Georgia,serif", transition:"all 0.2s" }}>
                {op}
              </button>
            ))}
          </div>
        ) : preguntaActual?.tipo === "textarea" ? (
          <textarea value={currentAnswer} onChange={e=>setCurrentAnswer(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&e.metaKey)avanzar();}}
            placeholder={preguntaActual.placeholder} rows={4}
            style={{ width:"100%", background:S.card, border:`1px solid ${S.border}`, borderRadius:"10px", padding:"16px 18px", color:S.textLight, fontSize:"0.92rem", fontFamily:"Georgia,serif", resize:"none", outline:"none", lineHeight:"1.7", boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor="rgba(201,169,110,0.4)"}
            onBlur={e=>e.target.style.borderColor=S.border} />
        ) : (
          <input value={currentAnswer} onChange={e=>setCurrentAnswer(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")avanzar();}}
            placeholder={preguntaActual?.placeholder}
            style={{ width:"100%", background:S.card, border:`1px solid ${S.border}`, borderRadius:"10px", padding:"16px 18px", color:S.textLight, fontSize:"0.95rem", fontFamily:"Georgia,serif", outline:"none", boxSizing:"border-box" }}
            onFocus={e=>e.target.style.borderColor="rgba(201,169,110,0.4)"}
            onBlur={e=>e.target.style.borderColor=S.border} />
        )}

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"32px" }}>
          {step > 0 ? (
            <button onClick={()=>{setStep(s=>s-1);setCurrentAnswer(perfil[preguntasVisibles[step-1]?.id]||"");}}
              style={{ background:"none", border:"none", color:S.textDim, cursor:"pointer", fontSize:"0.85rem", fontFamily:"Georgia,serif" }}>
              ← Anterior
            </button>
          ) : <div />}
          <button onClick={avanzar} disabled={!currentAnswer.trim()&&preguntaActual?.tipo!=="select"}
            style={{ background:currentAnswer.trim()||preguntaActual?.tipo==="select"?`linear-gradient(135deg,${S.gold},#a07840)`:"rgba(201,169,110,0.1)", border:"none", color:currentAnswer.trim()||preguntaActual?.tipo==="select"?S.bg:S.textDim, padding:"12px 32px", borderRadius:"6px", cursor:currentAnswer.trim()||preguntaActual?.tipo==="select"?"pointer":"default", fontSize:"0.88rem", letterSpacing:"0.08em", fontFamily:"Georgia,serif", transition:"all 0.2s" }}>
            {step + 1 === preguntasVisibles.length ? "Entrar a SOBERANA" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── CHAT ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(160deg,${S.bg},#111009,#0e0c0a)`, fontFamily:"Georgia,serif", display:"flex", flexDirection:"column", alignItems:"center", overflow:"hidden" }}>
      <div style={{ position:"fixed", inset:0, background:"radial-gradient(ellipse at 20% 20%,rgba(201,169,110,0.04) 0%,transparent 60%)", pointerEvents:"none", zIndex:0 }} />

      {/* Header */}
      <div style={{ width:"100%", maxWidth:"720px", padding:"24px 24px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:`1px solid ${S.border}`, position:"relative", zIndex:1 }}>
        <div>
          <div style={{ fontSize:"1.3rem", letterSpacing:"0.18em", color:S.gold, textTransform:"uppercase" }}>SOBERANA</div>
          <div style={{ fontSize:"0.68rem", color:S.textDim, letterSpacing:"0.08em", marginTop:"2px", fontStyle:"italic" }}>
            {perfil.nombre ? `Hola, ${perfil.nombre} · ` : ""}Neurociencia · Psicología · Bienestar
          </div>
        </div>
        <button onClick={()=>{setMessages([getWelcome(perfil)]);setInput("");}}
          style={{ background:"none", border:`1px solid ${S.goldDim}`, color:S.textDim, padding:"6px 14px", borderRadius:"4px", fontSize:"0.73rem", cursor:"pointer", letterSpacing:"0.05em", fontFamily:"Georgia,serif" }}>
          nueva sesión
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, width:"100%", maxWidth:"720px", padding:"32px 24px", overflowY:"auto", display:"flex", flexDirection:"column", gap:"32px", position:"relative", zIndex:1, minHeight:"calc(100vh - 190px)" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", animation:"fadeIn 0.4s ease" }}>
            {msg.role==="assistant" && (
              <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"linear-gradient(135deg,#c9a96e,#8a6a3a)", flexShrink:0, marginRight:"14px", marginTop:"3px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", color:S.bg, fontWeight:"bold" }}>S</div>
            )}
            <div style={{ maxWidth:"90%", padding:msg.role==="user"?"12px 18px":"0", background:msg.role==="user"?"rgba(201,169,110,0.08)":"transparent", borderRadius:msg.role==="user"?"18px 18px 4px 18px":"0", border:msg.role==="user"?`1px solid rgba(201,169,110,0.12)`:"none" }}>
              <div style={{ color:msg.role==="user"?"#d4c9bb":S.text, fontSize:"0.93rem", lineHeight:"1.9", whiteSpace:"pre-wrap" }}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
            <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"linear-gradient(135deg,#c9a96e,#8a6a3a)", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.75rem", color:S.bg, fontWeight:"bold" }}>S</div>
            <div style={{ display:"flex", gap:"5px" }}>
              {[0,1,2].map(i=><div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:S.gold, animation:`pulse 1.2s ease ${i*0.2}s infinite` }}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ width:"100%", maxWidth:"720px", padding:"14px 24px 26px", borderTop:`1px solid rgba(201,169,110,0.1)`, position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", gap:"12px", alignItems:"flex-end" }}>
          <textarea value={input}
            onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,180)+"px";}}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder="Cuéntame lo que quieras..."
            rows={1}
            style={{ flex:1, background:"rgba(255,255,255,0.04)", border:`1px solid ${S.goldDim}`, borderRadius:"12px", padding:"14px 18px", color:S.textLight, fontSize:"0.95rem", fontFamily:"Georgia,serif", resize:"none", outline:"none", lineHeight:"1.65", minHeight:"52px", transition:"border-color 0.2s" }}
            onFocus={e=>e.target.style.borderColor="rgba(201,169,110,0.45)"}
            onBlur={e=>e.target.style.borderColor=S.goldDim} />
          <button onClick={send} disabled={!input.trim()||loading}
            style={{ width:"52px", height:"52px", borderRadius:"12px", background:input.trim()&&!loading?"linear-gradient(135deg,#c9a96e,#a07840)":"rgba(201,169,110,0.08)", border:"none", cursor:input.trim()&&!loading?"pointer":"default", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={input.trim()&&!loading?S.bg:"#4a3f35"} strokeWidth="2" strokeLinecap="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={input.trim()&&!loading?S.bg:"#4a3f35"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div style={{ textAlign:"center", marginTop:"8px", fontSize:"0.67rem", color:"#3a3028", letterSpacing:"0.05em" }}>
          Enter para enviar · Shift+Enter para nueva línea
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
        *{scrollbar-width:thin;scrollbar-color:rgba(201,169,110,0.15) transparent}
        textarea::placeholder,input::placeholder{color:#4a3f35!important}
        input{transition:border-color 0.2s}
      `}</style>
    </div>
  );
}
