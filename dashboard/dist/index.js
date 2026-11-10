/* ASTRA Command Center for Hermes Dashboard · no bundler / no React copy */
(function () {
  "use strict";
  const SDK = window.__HERMES_PLUGIN_SDK__;
  const registry = window.__HERMES_PLUGINS__;
  if (!SDK || !registry) { console.warn("ASTRA: Hermes Plugin SDK not found"); return; }
  const React = SDK.React;
  const h = React.createElement;
  const { useState, useEffect, useRef } = React;
  const PROFILES = [
    {id:"astra", label:"ASTRA", role:"LEITENDER KI-AGENT", symbol:"✧", tagline:"Organisation · Koordination · Überblick"},
    {id:"tu-long", label:"TU LONG", role:"KAMPFKUNSTSCHULE", symbol:"龍", tagline:"Kurse · Workshops · Kommunikation"},
    {id:"dozent-ki", label:"DOZENT KI", role:"BILDUNGSAGENT", symbol:"▤", tagline:"Unterricht · Materialien · Prüfungen"},
    {id:"ailunor", label:"AILUNOR", role:"AUTOMATISIERUNG", symbol:"◇", tagline:"Prozesse · Projekte · KI-Beratung"}
  ];
  const STARTERS = [
    {profile:"astra", name:"Tagesübersicht", prompt:"Erstelle meine heutige Tagesübersicht mit Terminen, Aufgaben und Prioritäten. Verwende nur verbundene Datenquellen."},
    {profile:"tu-long", name:"Workshop planen", prompt:"Entwirf einen Tai-Chi-Einsteigerworkshop für Tu Long mit Ablauf und Werbetext. Verwende nur bestätigte Schuldaten."},
    {profile:"dozent-ki", name:"Unterricht planen", prompt:"Erstelle einen praxisorientierten Unterrichtsplan für Betreuungskräfte auf DQR-Niveau 2. Frage nach dem Lernfeld, falls es fehlt."},
    {profile:"ailunor", name:"Prozess analysieren", prompt:"Hilf mir, einen manuellen Geschäftsprozess für ein kleines Unternehmen zu analysieren und Automatisierungsmöglichkeiten zu finden."}
  ];
  const recognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

  function fmtTime(value) { return new Date(value).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}); }
  function L(node, cls, children, extra) { return h(node, Object.assign({className:cls},extra||{}), children); }

  function CommandCenter() {
    const [profile,setProfile] = useState("astra");
    const [messages,setMessages] = useState({astra:[],"tu-long":[],"dozent-ki":[],ailunor:[]});
    const [draft,setDraft] = useState("");
    const [sending,setSending] = useState(false);
    const [status,setStatus] = useState({checking:true,available:false,server:false,message:"Verbindung wird geprüft"});
    const [speaking,setSpeaking] = useState(false);
    const [voiceOn,setVoiceOn] = useState(true);
    const [listening,setListening] = useState(false);
    const [wakeOn,setWakeOn] = useState(false);
    const [voiceNote,setVoiceNote] = useState("");
    const [now,setNow] = useState(Date.now());
    const transcriptBox = useRef(null);
    const recog = useRef(null);
    const wakeRef = useRef(false);
    const voiceRef = useRef(true);
    const busyRef = useRef(false);
    const currentProfile = PROFILES.find(x=>x.id===profile)||PROFILES[0];
    const chat = messages[profile]||[];

    useEffect(()=>{
      const timer = setInterval(()=>setNow(Date.now()),1000);
      checkStatus();
      return ()=>{
        clearInterval(timer);
        wakeRef.current=false;
        try{recog.current?.abort();}catch(_e){}
        window.speechSynthesis?.cancel();
      };
    },[]);
    useEffect(()=>{ if(transcriptBox.current) transcriptBox.current.scrollTop=transcriptBox.current.scrollHeight; },[messages,profile]);
    useEffect(()=>{voiceRef.current=voiceOn;},[voiceOn]);
    useEffect(()=>{wakeRef.current=wakeOn; if(!wakeOn){ try{recog.current?.stop()}catch(_e){};setListening(false);}},[wakeOn]);

    function checkStatus(){
      setStatus({checking:true,available:false,server:false,message:"Prüfe Hermes-Verbindung …"});
      SDK.fetchJSON("/api/plugins/astra-command-center/health")
        .then(v=>setStatus({checking:false,available:!!v.cli_available,server:true,message:v.cli_available?"HERMES VERBUNDEN":"CLI auf diesem Server nicht verfügbar"}))
        .catch(_=>setStatus({checking:false,available:false,server:false,message:"Plugin-Backend nicht erreichbar"}));
    }

    function say(text){
      if(!voiceRef.current || !window.speechSynthesis) return;
      try{
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text.replace(/```[\s\S]*?```/g,"Codeblock ausgelassen").replace(/[*_#`]/g,"").slice(0,1800));
        utter.lang="de-DE"; utter.rate=.98; utter.pitch=1;
        const german = window.speechSynthesis.getVoices().find(v=>v.lang?.toLowerCase().startsWith("de"));
        if(german) utter.voice=german;
        utter.onend=()=>setSpeaking(false); utter.onerror=()=>setSpeaking(false);
        setSpeaking(true);
        window.speechSynthesis.speak(utter);
      }catch(_){setSpeaking(false);}
    }
    function stopSpeech(){try{window.speechSynthesis?.cancel()}catch(_e){};setSpeaking(false);}

    function sendMessage(){
      const text = draft.trim(); if(!text || busyRef.current) return;
      const selected = profile;
      const previous = (messages[selected]||[]).slice(-6);
      setDraft("");
      const userItem={role:"user",text,at:Date.now()};
      setMessages(x=>({...x,[selected]:[...(x[selected]||[]),userItem]}));
      setSending(true);busyRef.current=true;setVoiceNote("");
      SDK.fetchJSON("/api/plugins/astra-command-center/chat", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({profile:selected,message:text,history:previous.map(x=>({role:x.role,text:x.text.slice(0,2000)}))})
      }).then(r=>{
        if(!r.ok || typeof r.reply!=="string") throw new Error("Unerwartete Serverantwort");
        setMessages(x=>({...x,[selected]:[...(x[selected]||[]),{role:"assistant",text:r.reply,at:Date.now()}]}));
        if(selected===profile) say(r.reply);
      }).catch(e=>{
        setMessages(x=>({...x,[selected]:[...(x[selected]||[]),{role:"error",text:"Keine Antwort von Hermes: "+(e?.message||String(e))+". Du kannst den offiziellen Hermes-Chat verwenden.",at:Date.now()}]}));
      }).finally(()=>{setSending(false);busyRef.current=false;});
    }

    function beginRecognition(mode){
      if(!recognitionCtor){setVoiceNote("Dein Browser unterstützt hier keine Spracherkennung. Verwende Chrome oder Edge.");return;}
      try{recog.current?.abort();}catch(_e){}
      const r = new recognitionCtor();r.lang="de-DE";r.interimResults=false;r.continuous=mode==="wake";
      let awakened=false;
      r.onstart=()=>{setListening(true);setVoiceNote(mode==="wake"?"Aktivierungswort wird erkannt (nur bei geöffneter Seite) …":"Bitte sprechen …");};
      r.onresult=(evt)=>{
        const recent=Array.from(evt.results).slice(evt.resultIndex).map(x=>x[0]?.transcript||"").join(" ").trim();
        if(!recent) return;
        if(mode==="wake"){
          const match=recent.match(/(?:hey|hallo)\s+astra[,.! ]*(.*)/i);
          if(match){awakened=true;setVoiceNote("ASTRA hört zu …");if(match[1]) setDraft(p=>[p,match[1]].filter(Boolean).join(" "));}
          else if(awakened){setDraft(p=>[p,recent].filter(Boolean).join(" "));setVoiceNote("Befehl erkannt – zum Senden auf den Pfeil klicken.");}
        }else{setDraft(p=>[p,recent].filter(Boolean).join(" "));setVoiceNote("Erkannt – bitte zum Senden auf den Pfeil klicken.");}
      };
      r.onerror=(e)=>{setVoiceNote("Mikrofon: "+(e.error||"nicht verfügbar"));setListening(false);if(mode==="wake")setWakeOn(false);};
      r.onend=()=>{
        setListening(false);
        // Re-start only for explicit wake mode, when browser allows it.
        if(mode==="wake" && wakeRef.current && document.visibilityState==="visible"){
          try{setTimeout(()=>{if(wakeRef.current&&document.visibilityState==="visible")beginRecognition("wake");},800);}catch(_e){}
        }
      };
      recog.current=r;r.start();
    }
    function toggleMic(){
      if(listening){try{recog.current?.stop()}catch(_e){}setListening(false);return;}
      if(wakeRef.current)setWakeOn(false);
      beginRecognition("push");
    }
    function toggleWake(){
      if(wakeOn){setWakeOn(false);setVoiceNote("Aktivierungswort deaktiviert.");}
      else{setWakeOn(true);wakeRef.current=true;beginRecognition("wake");}
    }
    function changeProfile(id){if(busyRef.current)return;stopSpeech();setProfile(id);setDraft("");setVoiceNote("");}
    function goBuiltIn(){window.location.assign("/chat?profile="+encodeURIComponent(profile));}

    const chip=(label,kind)=>L("span","astra-chip "+(kind||""),label);
    const btn=(label,handler,cls,props)=>h("button",Object.assign({type:"button",className:"astra-btn "+(cls||""),onClick:handler},props||{}),label);

    return h("div",{className:"astra-shell"},
      h("div",{className:"astra-backdrop-grid","aria-hidden":"true"}),
      h("header",{className:"astra-head"},
        L("div","astra-brand",[
          L("div","astra-logo", "A"),
          L("div","astra-brandtext",[
            L("div","astra-eyebrow","PERSONAL AI // COMMAND SYSTEM"),
            L("div","astra-title","ASTRA "+"COMMAND CENTER")
          ])
        ]),
        L("div","astra-header-right",[
          chip(status.checking?"VERBINDUNG WIRD GEPRÜFT":status.available?"HERMES LIVE":"SETUP ERFORDERLICH",status.available?"live":"attention"),
          L("div","astra-clock",fmtTime(now))
        ])
      ),
      h("div",{className:"astra-grid"},
        h("aside",{className:"astra-panel astra-agents"},
          L("div","astra-section-tag","// AGENTEN-NETZWERK"),
          ...PROFILES.map(item=>btn([
            L("span","astra-agent-symbol",item.symbol),
            L("span","astra-agent-info",[
              L("strong","",item.label),
              L("small","",item.role)
            ]),
            L("span","astra-agent-dot","")
          ],()=>changeProfile(item.id),"astra-agent-card "+(item.id===profile?"selected":""),{key:item.id,"aria-pressed":item.id===profile})),
          L("div","astra-sideline","ASTRA koordiniert die Fachagenten. Die eigentliche Delegation benötigt eingerichtete Hermes-Profile und Kanban."),
          btn("HERMES ORIGINAL-CHAT ↗",goBuiltIn,"astra-textlink")
        ),
        h("section",{className:"astra-middle"},
          h("div",{className:"astra-core-panel"},
            L("div","astra-section-tag","// NEURALE SCHNITTSTELLE"),
            h("div",{className:"astra-orb-area"},
              L("div","astra-orbit ring-1",""),
              L("div","astra-orbit ring-2",""),
              L("div","astra-orbit ring-3",""),
              L("div","astra-orb "+(sending?"working":listening?"hearing":speaking?"speaking":""),[
                L("div","astra-orb-center",currentProfile.symbol)
              ]),
              L("div","astra-orb-connector","")),
            L("div","astra-core-name",currentProfile.label),
            L("div","astra-core-role",currentProfile.role),
            L("div","astra-core-tagline",currentProfile.tagline),
            L("div","astra-core-state",sending?"ANTWORT WIRD ERSTELLT":listening?"SPRACHE WIRD ERKANNT":speaking?"SPRACHAUSGABE LÄUFT":status.available?"BEREIT FÜR DEINEN AUFTRAG":"VERBINDUNG PRÜFEN"),
            L("div","astra-voice-row",[
              btn(listening?"■ ZUHÖREN BEENDEN":"◉ SPRECHEN",toggleMic,listening?"astra-btn-primary active":"astra-btn-primary",{disabled:sending}),
              btn(voiceOn?"♪ STIMME AN":"♪ STIMME AUS",()=>{setVoiceOn(v=>!v);if(voiceOn)stopSpeech();},"astra-btn-ghost"),
              btn(wakeOn?"HEY ASTRA: AN":"HEY ASTRA: AUS",toggleWake,wakeOn?"astra-btn-wake active":"astra-btn-wake",{disabled:!recognitionCtor})
            ]),
            voiceNote&&L("div","astra-voice-note",voiceNote),
            L("div","astra-voice-warning","Sprachaktivierung funktioniert nur bei geöffneter Browseroberfläche. Browser- und Mikrofonberechtigungen erforderlich.")
          ),
          h("div",{className:"astra-panel astra-actions"},
            L("div","astra-section-tag","// SCHNELLBEFEHLE"),
            L("div","astra-action-grid",STARTERS.map(item=>btn(item.name,()=>{if(busyRef.current)return;setProfile(item.profile);setDraft(item.prompt);},"astra-quick",{key:item.name})))
          )
        ),
        h("section",{className:"astra-panel astra-chat"},
          L("div","astra-chat-top",[
            L("div","astra-section-tag","// LIVE-KOMMUNIKATION"),
            btn("↻ STATUS",checkStatus,"astra-mini")
          ]),
          h("div",{className:"astra-thread",ref:transcriptBox,role:"log","aria-label":"Nachrichtenverlauf"},
            chat.length?chat.map((item,i)=>L("div","astra-message "+item.role,[
              L("div","astra-message-meta",(item.role==="user"?"DU":item.role==="assistant"?currentProfile.label:"SYSTEM")+"  ·  "+fmtTime(item.at)),
              L("div","astra-message-text",item.text)
            ],{key:i})):L("div","astra-empty",[
              L("div","astra-empty-icon","✧"),
              L("strong","","Verbindung zum digitalen Assistenzsystem"),
              L("p","","Schreibe oder diktiere einen Auftrag. Antworten kommen direkt aus Hermes, sofern die lokale CLI des Servers verfügbar ist.")
            ]),
            sending&&L("div","astra-message assistant astra-typing",[L("div","astra-message-meta",currentProfile.label),L("div","astra-message-text","ASTRA verarbeitet deine Anfrage …")])
          ),
          h("form",{className:"astra-composer",onSubmit:e=>{e.preventDefault();sendMessage();}},
            h("textarea",{value:draft,onChange:e=>setDraft(e.target.value),placeholder:"Nachricht an "+currentProfile.label+" …",rows:3,"aria-label":"Nachricht an Agent",maxLength:6000,onKeyDown:e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}),
            L("div","astra-compose-controls",[
              L("span","astra-compose-hint","Enter: senden · Shift+Enter: neue Zeile"),
              h("button",{className:"astra-send",type:"submit",disabled:sending||!draft.trim(),"aria-label":"Nachricht senden"},sending?"…":"➤")
            ])
          ),
          L("div","astra-chat-foot","Antworten sind echte Hermes-Einzelaufrufe. Der sichtbare Kurzverlauf wird als Kontext übergeben; dies ist kein persistentes Hermes-Chat-Resume.")
        )
      ),
      L("footer","astra-footer",[
        L("span","","ASTRA OS 01  //  HERMES DASHBOARD PLUGIN"),
        L("span","",status.message),
        L("span","","IONOS · HTTPS · V1.0")
      ])
    );
  }
  registry.register("astra-command-center",CommandCenter);
})();
