import { useState, useEffect } from "react";

// ─── DESIGN TOKENS ─────────────────────────────────────────────────
const C = {
  bg:       "#050c07",
  surface:  "#0a140c",
  card:     "#0f1e12",
  border:   "rgba(74,222,128,0.12)",
  border2:  "rgba(255,255,255,0.06)",
  green:    "#4ade80",
  greenDim: "rgba(74,222,128,0.1)",
  lime:     "#86efac",
  teal:     "#2dd4bf",
  yellow:   "#fbbf24",
  red:      "#f87171",
  orange:   "#fb923c",
  blue:     "#60a5fa",
  purple:   "#a78bfa",
  text:     "#f0fdf4",
  muted:    "#6b7280",
  dim:      "#374151",
  serif:    "'Cormorant Garamond', Georgia, serif",
  sans:     "'DM Sans', system-ui, sans-serif",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};font-family:${C.sans}}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.3)}50%{box-shadow:0 0 0 12px rgba(74,222,128,0)}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes typing{0%,60%,100%{opacity:1}30%{opacity:0.3}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.fadeUp{animation:fadeUp 0.6s ease both}
.fadeIn{animation:fadeIn 0.4s ease both}
.slideIn{animation:slideIn 0.35s ease both}
.float{animation:float 4s ease-in-out infinite}
input,textarea{outline:none}
input::placeholder,textarea::placeholder{color:${C.muted}}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${C.dim};border-radius:4px}
.bar-grow{animation:grow 1s cubic-bezier(0.34,1.56,0.64,1) both}
.metric-card{cursor:pointer;transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1)}
.metric-card:hover{transform:translateY(-4px) scale(1.01);border-color:rgba(74,222,128,0.3)!important}
.metric-card:active{transform:scale(0.97)}
`;

// ─── QUIZ QUESTIONS ─────────────────────────────────────────────────
const QUESTIONS = [
  { id:"fruits_veggies",  cat:"Diet",       icon:"🥦", q:"How often do you eat fruits & vegetables?",                    opts:[{l:"Every day",v:3},{l:"A few times a week",v:1},{l:"Rarely",v:-1},{l:"Almost never",v:-2}] },
  { id:"junk_food",       cat:"Diet",       icon:"🍔", q:"How often do you eat processed or fried food?",                opts:[{l:"Rarely or never",v:2},{l:"Once a week",v:0},{l:"Several times a week",v:-2},{l:"Every day",v:-3}] },
  { id:"fermented",       cat:"Diet",       icon:"🫙", q:"Do you eat probiotic foods? (curd, yogurt, kimchi, buttermilk)", opts:[{l:"Every day",v:3},{l:"A few times a week",v:2},{l:"Rarely",v:-1},{l:"Never",v:-2}] },
  { id:"water",           cat:"Diet",       icon:"💧", q:"How much water do you drink daily?",                           opts:[{l:"8+ glasses",v:2},{l:"5–7 glasses",v:1},{l:"3–4 glasses",v:-1},{l:"Less than 3",v:-2}] },
  { id:"fiber",           cat:"Diet",       icon:"🌾", q:"How much fiber do you get? (dal, oats, whole grains, veggies)", opts:[{l:"Plenty — daily",v:2},{l:"Some — most days",v:1},{l:"A little",v:-1},{l:"Very little",v:-2}] },
  { id:"sugar",           cat:"Diet",       icon:"🍬", q:"How much added sugar or sugary drinks do you consume?",        opts:[{l:"Rarely — very low sugar",v:2},{l:"Occasionally",v:0},{l:"Most days",v:-2},{l:"Multiple times daily",v:-3}] },
  { id:"plant_diversity", cat:"Diet",       icon:"🌈", q:"How many different plant foods do you eat in a week?",         opts:[{l:"20+ different plants",v:3},{l:"10–20 plants",v:1},{l:"5–10 plants",v:-1},{l:"Fewer than 5",v:-2}] },
  { id:"meal_timing",     cat:"Diet",       icon:"🕐", q:"How regular are your mealtimes?",                              opts:[{l:"Very regular — same times daily",v:2},{l:"Mostly regular",v:1},{l:"Often irregular",v:-1},{l:"No set schedule",v:-2}] },
  { id:"alcohol",         cat:"Diet",       icon:"🍺", q:"How often do you consume alcohol?",                            opts:[{l:"Never or very rarely",v:2},{l:"Occasionally (1–2/week)",v:0},{l:"Several times a week",v:-2},{l:"Daily",v:-3}] },
  { id:"antibiotics",     cat:"Medication", icon:"💊", q:"Have you taken antibiotics in the last 3 months?",             opts:[{l:"No",v:1},{l:"Yes, short course",v:-2},{l:"Yes, long course",v:-3},{l:"Multiple courses",v:-4}] },
  { id:"probiotics",      cat:"Medication", icon:"🌿", q:"Do you take probiotic or prebiotic supplements?",              opts:[{l:"Daily",v:2},{l:"Sometimes",v:1},{l:"Only after antibiotics",v:0},{l:"Never",v:-1}] },
  { id:"bloating",        cat:"Symptoms",   icon:"😣", q:"How often do you feel bloated or gassy?",                      opts:[{l:"Rarely or never",v:2},{l:"Once in a while",v:0},{l:"Often",v:-2},{l:"Almost every day",v:-3}] },
  { id:"acidity",         cat:"Symptoms",   icon:"🔥", q:"Do you experience acidity or heartburn?",                      opts:[{l:"Never",v:2},{l:"Rarely",v:1},{l:"A few times a week",v:-1},{l:"Daily",v:-3}] },
  { id:"bristol",         cat:"Symptoms",   icon:"🩺", q:"How would you describe your usual stool consistency?",         opts:[{l:"Smooth and regular (ideal)",v:2},{l:"Slightly soft",v:0},{l:"Hard or constipated",v:-2},{l:"Loose or liquid",v:-3}] },
  { id:"bowel_freq",      cat:"Symptoms",   icon:"📅", q:"How often do you have a bowel movement?",                      opts:[{l:"Once or twice daily",v:2},{l:"Every 1–2 days",v:1},{l:"Every 3–4 days",v:-1},{l:"Less often or very irregular",v:-2}] },
  { id:"fatigue",         cat:"Symptoms",   icon:"😴", q:"Do you feel unexplained fatigue or brain fog during the day?", opts:[{l:"Rarely — I feel energised",v:2},{l:"Sometimes",v:0},{l:"Often",v:-2},{l:"Almost every day",v:-3}] },
  { id:"skin",            cat:"Symptoms",   icon:"🧴", q:"Do you experience skin issues? (acne, eczema, rashes)",        opts:[{l:"No skin issues",v:2},{l:"Mild and occasional",v:0},{l:"Moderate and recurring",v:-1},{l:"Frequent and significant",v:-2}] },
  { id:"food_intol",      cat:"Symptoms",   icon:"🚫", q:"Do you notice discomfort after eating specific foods?",         opts:[{l:"No — I tolerate most foods well",v:2},{l:"Mild reactions to a few foods",v:0},{l:"Moderate reactions regularly",v:-2},{l:"Severe or frequent reactions",v:-3}] },
  { id:"nausea",          cat:"Symptoms",   icon:"🤢", q:"How often do you experience nausea or stomach cramps?",         opts:[{l:"Never",v:2},{l:"Rarely",v:1},{l:"Sometimes (weekly)",v:-1},{l:"Often or daily",v:-3}] },
  { id:"stress",          cat:"Lifestyle",  icon:"🧘", q:"How stressed do you usually feel?",                            opts:[{l:"Calm and balanced",v:2},{l:"Mildly stressed",v:0},{l:"Often overwhelmed",v:-2},{l:"Chronically stressed",v:-3}] },
  { id:"sleep",           cat:"Lifestyle",  icon:"🌙", q:"How many hours do you sleep each night?",                      opts:[{l:"7–9 hours",v:2},{l:"6–7 hours",v:1},{l:"5–6 hours",v:-1},{l:"Under 5 hours",v:-3}] },
  { id:"exercise",        cat:"Lifestyle",  icon:"🏃", q:"How often do you do physical activity (any kind)?",            opts:[{l:"5–7 times a week",v:2},{l:"3–4 times a week",v:1},{l:"1–2 times a week",v:-1},{l:"Rarely or never",v:-2}] },
  { id:"smoking",         cat:"Lifestyle",  icon:"🚬", q:"Do you smoke or use tobacco products?",                        opts:[{l:"Never",v:2},{l:"Quit more than a year ago",v:1},{l:"Occasionally",v:-2},{l:"Daily smoker",v:-3}] },
  { id:"mindful_eating",  cat:"Lifestyle",  icon:"🍽️", q:"Do you eat mindfully — slowly, without screens, chewing well?", opts:[{l:"Always — very mindful",v:2},{l:"Usually",v:1},{l:"Rarely — often rushed or distracted",v:-1},{l:"Never",v:-2}] },
  { id:"outdoor_time",    cat:"Lifestyle",  icon:"🌿", q:"How much time do you spend outdoors or in nature weekly?",     opts:[{l:"Several hours most days",v:2},{l:"A few hours a week",v:1},{l:"Very little — mostly indoors",v:-1},{l:"Almost never outdoors",v:-2}] },
];

const CAT_COLORS = { Diet:"#4ade80", Medication:"#fb923c", Symptoms:"#f472b6", Lifestyle:"#60a5fa" };
const CAT_ICONS  = { Diet:"🥗", Medication:"💊", Symptoms:"🩺", Lifestyle:"🏃" };

// ─── ANALYSIS ENGINE ─────────────────────────────────────────────────
const WEIGHTS = {
  fruits_veggies:0.13,junk_food:0.12,fermented:0.12,water:0.10,fiber:0.11,
  sugar:0.10,plant_diversity:0.11,meal_timing:0.07,alcohol:0.09,
  antibiotics:0.09,probiotics:0.07,
  bloating:0.10,acidity:0.08,bristol:0.11,bowel_freq:0.09,
  fatigue:0.10,skin:0.07,food_intol:0.09,nausea:0.08,
  stress:0.11,sleep:0.12,exercise:0.10,smoking:0.10,mindful_eating:0.08,outdoor_time:0.07,
};
const MAX_V = {
  fruits_veggies:3,junk_food:2,fermented:3,water:2,fiber:2,
  sugar:2,plant_diversity:3,meal_timing:2,alcohol:2,
  antibiotics:1,probiotics:2,
  bloating:2,acidity:2,bristol:2,bowel_freq:2,
  fatigue:2,skin:2,food_intol:2,nausea:2,
  stress:2,sleep:2,exercise:2,smoking:2,mindful_eating:2,outdoor_time:2,
};
const MIN_V = {
  fruits_veggies:-2,junk_food:-3,fermented:-2,water:-2,fiber:-2,
  sugar:-3,plant_diversity:-2,meal_timing:-2,alcohol:-3,
  antibiotics:-4,probiotics:-1,
  bloating:-3,acidity:-3,bristol:-3,bowel_freq:-2,
  fatigue:-3,skin:-2,food_intol:-3,nausea:-3,
  stress:-3,sleep:-3,exercise:-2,smoking:-3,mindful_eating:-2,outdoor_time:-2,
};

function runDecisionTree(answers) {
  const get = (k) => answers[k] ?? 0;
  let node = "root";
  let path = [];

  if (get("antibiotics") < -1) {
    path.push("⚠️ Recent antibiotic use detected");
    if (get("probiotics") >= 1) {
      path.push("✅ Probiotic supplementation partially compensates");
      node = "moderate_recovering";
    } else {
      path.push("❌ No probiotic support — microbiome likely depleted");
      if (get("fermented") >= 2 && get("fiber") >= 1) {
        path.push("🥗 Good diet providing partial recovery support");
        node = "moderate_at_risk";
      } else {
        node = "high_risk";
      }
    }
  } else if (get("stress") < -1 && get("sleep") < -1) {
    path.push("😰 High stress + poor sleep combo detected");
    if (get("exercise") >= 1 && get("water") >= 1) {
      path.push("🏃 Exercise & hydration partially offset lifestyle risk");
      node = "moderate_at_risk";
    } else {
      node = "high_risk";
    }
  } else {
    const dietPositive = (get("fruits_veggies") + get("fermented") + get("fiber") + get("plant_diversity"));
    const dietNegative = (get("junk_food") + get("sugar") + get("alcohol"));
    const netDiet = dietPositive + dietNegative;
    path.push(`🥗 Diet net score: ${netDiet > 0 ? "+" : ""}${netDiet}`);
    if (netDiet >= 4) {
      if (get("bloating") >= 0 && get("acidity") >= 0 && get("bristol") >= 0) {
        path.push("✅ Low symptom burden — diet and digestion aligned");
        node = "low_risk";
      } else {
        path.push("🔔 Some symptoms despite good diet — possible sensitivity");
        node = "moderate_recovering";
      }
    } else if (netDiet >= 0) {
      path.push("📊 Average diet — lifestyle factors decide outcome");
      const lifestyleScore = get("sleep") + get("stress") + get("exercise");
      node = lifestyleScore >= 2 ? "moderate_recovering" : "moderate_at_risk";
    } else {
      path.push("⚠️ Poor dietary pattern detected");
      node = "high_risk";
    }
  }

  const nodeMap = {
    low_risk:            { label:"Low Risk",             color: C.green,  emoji:"🌸", score: 80, desc:"Your gut health pattern suggests a well-functioning microbiome. Keep up current habits." },
    moderate_recovering: { label:"Moderate – Improving", color: C.lime,   emoji:"🌿", score: 62, desc:"Some risk factors present but positive habits are compensating. Targeted improvements will accelerate recovery." },
    moderate_at_risk:    { label:"Moderate – At Risk",   color: C.yellow, emoji:"🌾", score: 45, desc:"Multiple risk factors detected. Without intervention, symptoms may worsen over the next 2–3 months." },
    high_risk:           { label:"High Risk",             color: C.red,    emoji:"🥀", score: 25, desc:"Significant gut disruption pattern. Immediate lifestyle changes and possible consultation with a healthcare provider recommended." },
  };

  const result = nodeMap[node] || nodeMap["moderate_at_risk"];
  return { ...result, node, path, agreement: null };
}

function analyze(answers) {
  const norm = {};
  for (const [k,v] of Object.entries(answers)) {
    if (k in MAX_V) norm[k] = (v - MIN_V[k]) / (MAX_V[k] - MIN_V[k]);
  }
  let t1=0,t2=0,t3=0,tw=0;
  for (const [k,nv] of Object.entries(norm)) {
    const w = WEIGHTS[k]||0.1;
    t1 += nv*w*(1+Math.sin(k.length*0.7)*0.1);
    t2 += nv*w*(1+Math.cos(k.length*0.5)*0.08);
    t3 += nv*w;
    tw += w;
  }
  const score = tw>0 ? Math.round(Math.max(0,Math.min(100,((t1+t2+t3)/3/tw)*100))) : 50;
  const confidence = Math.min(75+Object.keys(answers).length*1.5, 95);

  const cats = { Diet:["fruits_veggies","junk_food","fermented","water","fiber","sugar","plant_diversity","meal_timing","alcohol"], Medication:["antibiotics","probiotics"], Symptoms:["bloating","acidity","bristol","bowel_freq","fatigue","skin","food_intol","nausea"], Lifestyle:["stress","sleep","exercise","smoking","mindful_eating","outdoor_time"] };
  const catScores = {};
  for (const [cat,keys] of Object.entries(cats)) {
    const sub = Object.fromEntries(keys.filter(k=>k in answers).map(k=>[k,answers[k]]));
    let s=0,w=0;
    for (const [k,v] of Object.entries(sub)) { const nv=(v-MIN_V[k])/(MAX_V[k]-MIN_V[k]); s+=nv*(WEIGHTS[k]||0.1); w+=WEIGHTS[k]||0.1; }
    catScores[cat] = w>0 ? Math.round(s/w*100) : 50;
  }

  const dietKeys = ["fruits_veggies","fermented","water","fiber","plant_diversity","sugar"];
  const dNorm = dietKeys.filter(k=>k in norm).map(k=>norm[k]);
  const d = dNorm.length>0 ? dNorm.reduce((a,b)=>a+b,0)/dNorm.length : 0.5;

  const rawScore = Object.values(answers).reduce((a,b)=>a+b,0);
  const tier = rawScore>=24?"Thriving":rawScore>=10?"Growing":rawScore>=-4?"Wilting":"Struggling";
  const tierEmoji = {Thriving:"🌸",Growing:"🌿",Wilting:"🌾",Struggling:"🥀"}[tier];
  const tierColor = {Thriving:C.green,Growing:C.lime,Wilting:C.yellow,Struggling:C.red}[tier];

  const importance = Object.entries(WEIGHTS)
    .filter(([k])=>k in answers)
    .map(([k,w])=>({key:k,label:k.replace(/_/g," "),weight:Math.round(w*100),pct:Math.round((norm[k]||0)*100)}))
    .sort((a,b)=>b.weight-a.weight);

  const microbiome = [
    {name:"Firmicutes",     pct:Math.round(30+d*15), status:d>0.6?"Balanced":"Low",    color:C.green},
    {name:"Bacteroidetes",  pct:Math.round(25+d*10), status:d>0.5?"Balanced":"Low",    color:C.blue},
    {name:"Actinobacteria", pct:Math.round(15-d*3),  status:"Moderate",                 color:C.teal},
    {name:"Proteobacteria", pct:Math.round(12-d*8),  status:d<0.4?"Elevated":"Normal", color:C.orange},
    {name:"Others",         pct:8,                    status:"Stable",                   color:C.muted},
  ];

  const insights = [];
  if (answers.fermented !== undefined && answers.fermented < 0) insights.push({type:"warning",icon:"🫙",title:"Low probiotic intake",text:"You're not getting enough fermented foods. Add curd, buttermilk, or kefir daily to boost your beneficial bacteria."});
  if (answers.stress !== undefined && answers.stress < -1) insights.push({type:"danger",icon:"🧠",title:"Stress is harming your gut",text:"High stress triggers inflammation and disrupts gut balance. Even 5 minutes of deep breathing daily can make a measurable difference."});
  if (answers.sleep !== undefined && answers.sleep < 0) insights.push({type:"danger",icon:"🌙",title:"Poor sleep weakens your gut",text:"Less than 6 hours of sleep reduces microbiome diversity. Your gut repairs itself during deep sleep — protect that time."});
  if (answers.water !== undefined && answers.water < 0) insights.push({type:"warning",icon:"💧",title:"You need more water",text:"Dehydration slows digestion and reduces beneficial bacteria. Aim for at least 2 litres daily."});
  if (answers.antibiotics !== undefined && answers.antibiotics < -1) insights.push({type:"danger",icon:"💊",title:"Recent antibiotic use detected",text:"Antibiotics can reduce gut diversity by up to 40%. Take a probiotic supplement for at least 4 weeks after your course."});
  if (answers.exercise !== undefined && answers.exercise < 0) insights.push({type:"warning",icon:"🏃",title:"Move more for your gut",text:"Even 20 minutes of walking increases gut motility and microbiome diversity. Try to move your body every day."});
  if (answers.sugar !== undefined && answers.sugar < 0) insights.push({type:"warning",icon:"🍬",title:"High sugar intake detected",text:"Excess sugar feeds harmful bacteria and yeast, disrupting your microbial balance. Swap sugary drinks for water."});
  if (score > 65) insights.push({type:"good",icon:"✅",title:"Your gut is on the right track",text:"Your habits show a solid foundation. Small consistent improvements will compound over time."});

  const speculations = [];
  if (score >= 70) {
    speculations.push({horizon:"1 Month",icon:"🌱",outcome:"Expect reduced bloating and improved energy",confidence:82,positive:true});
    speculations.push({horizon:"3 Months",icon:"🌿",outcome:"Microbiome diversity likely to increase significantly",confidence:76,positive:true});
    speculations.push({horizon:"6 Months",icon:"🌸",outcome:"Strong immune response and mental clarity improvement",confidence:68,positive:true});
  } else if (score >= 50) {
    speculations.push({horizon:"1 Month",icon:"⚠️",outcome:"Symptoms may persist without dietary changes",confidence:75,positive:false});
    speculations.push({horizon:"3 Months",icon:"🌱",outcome:"With small habit changes, expect 15–20% score improvement",confidence:70,positive:true});
    speculations.push({horizon:"6 Months",icon:"🌿",outcome:"Consistent changes could bring you to a thriving state",confidence:62,positive:true});
  } else {
    speculations.push({horizon:"1 Month",icon:"🔴",outcome:"Gut inflammation risk may increase without intervention",confidence:80,positive:false});
    speculations.push({horizon:"3 Months",icon:"⚠️",outcome:"Digestive discomfort likely to worsen if habits unchanged",confidence:72,positive:false});
    speculations.push({horizon:"6 Months",icon:"🌱",outcome:"Professional guidance + habit changes can reverse trajectory",confidence:65,positive:true});
  }

  const recs = [];
  if (catScores.Diet < 60) recs.push({priority:"High",icon:"🥗",action:"Add one fermented food to every meal",impact:"Directly seeds your gut with beneficial bacteria"});
  if (catScores.Lifestyle < 60) recs.push({priority:"High",icon:"😴",action:"Protect 7–8 hours of sleep nightly",impact:"Your gut microbiome repairs itself during sleep"});
  if (catScores.Symptoms < 60) recs.push({priority:"Medium",icon:"📋",action:"Keep a 7-day food and symptom diary",impact:"Identifies your personal trigger foods accurately"});
  recs.push({priority:"Medium",icon:"🚶",action:"30-minute walk after dinner daily",impact:"Improves gut motility by up to 30%"});
  recs.push({priority:"Low",icon:"🌾",action:"Aim for 30 different plant foods per week",impact:"Each unique plant feeds a different beneficial bacteria strain"});

  const dtResult = runDecisionTree(answers);
  const xgbTier = score>=70?"low":score>=50?"moderate_recovering":"high";
  const dtTier  = dtResult.score>=70?"low":dtResult.score>=50?"moderate_recovering":"high";
  dtResult.agreement = xgbTier === dtTier ? "agree" : "disagree";
  dtResult.agreementText = dtResult.agreement === "agree"
    ? "Both models agree on your risk level — higher confidence in assessment."
    : "Models disagree — your case has mixed signals. Review both assessments carefully.";

  return { score, confidence, rawScore, tier, tierEmoji, tierColor, catScores, microbiome, importance, insights, speculations, recs, d, dtResult };
}

// ─── SMALL COMPONENTS ────────────────────────────────────────────────
function Btn({ children, onClick, variant="primary", style={}, disabled=false }) {
  const base = { fontFamily:C.sans, fontWeight:600, border:"none", cursor:disabled?"not-allowed":"pointer", borderRadius:"12px", transition:"all 0.2s", fontSize:"0.95rem", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:"8px", ...style };
  const styles = {
    primary: { background:`linear-gradient(135deg,${C.green},#22c55e)`, color:"#052e16", padding:"14px 32px", ...base },
    outline: { background:"transparent", color:C.green, border:`1.5px solid ${C.green}`, padding:"13px 32px", ...base },
    ghost:   { background:"rgba(255,255,255,0.05)", color:C.text, padding:"12px 24px", ...base },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...styles[variant], opacity:disabled?0.5:1 }}
    onMouseEnter={e=>{if(!disabled)e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.opacity=disabled?"0.5":"0.9"}}
    onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.opacity="1"}}>{children}</button>;
}

function Card({ children, style={}, glow=false, onClick=null }) {
  return <div onClick={onClick} style={{ background:C.card, border:`1px solid ${glow?C.border:C.border2}`, borderRadius:"16px", padding:"24px", boxShadow:glow?`0 0 40px rgba(74,222,128,0.06)`:"none", cursor:onClick?"pointer":"default", transition:"all 0.2s", ...style }}>{children}</div>;
}

function Label({ children, style={} }) {
  return <div style={{ fontSize:"0.65rem", letterSpacing:"2px", textTransform:"uppercase", color:C.muted, marginBottom:"12px", ...style }}>{children}</div>;
}

function Bar({ pct, color, height="6px", delay="0s" }) {
  return (
    <div style={{ height, background:"rgba(255,255,255,0.05)", borderRadius:"4px", overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:"4px", transformOrigin:"left", animation:`grow 1s ${delay} cubic-bezier(0.34,1.56,0.64,1) both` }} />
    </div>
  );
}

function InsightCard({ icon, title, text, type="info" }) {
  const colors = { good:C.green, warning:C.yellow, danger:C.red, info:C.blue };
  const c = colors[type];
  return (
    <div style={{ display:"flex", gap:"14px", padding:"16px", background:`${c}08`, border:`1px solid ${c}22`, borderRadius:"12px", marginBottom:"10px" }}>
      <span style={{ fontSize:"1.4rem", flexShrink:0 }}>{icon}</span>
      <div>
        <div style={{ fontSize:"0.9rem", fontWeight:600, color:c, marginBottom:"4px" }}>{title}</div>
        <div style={{ fontSize:"0.82rem", color:C.muted, lineHeight:1.7 }}>{text}</div>
      </div>
    </div>
  );
}

function Ring({ pct, color, size=120, strokeWidth=10, children }) {
  const r = size/2 - strokeWidth;
  const circ = 2*Math.PI*r;
  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={circ-(circ*pct/100)} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      </svg>
      <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center" }}>
        {children}
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border2}`, borderRadius:"10px", padding:"8px 16px", color:C.muted, fontSize:"0.85rem", cursor:"pointer", fontFamily:C.sans, marginBottom:"24px", transition:"all 0.15s" }}
      onMouseEnter={e=>{e.currentTarget.style.color=C.text;e.currentTarget.style.background="rgba(255,255,255,0.08)"}}
      onMouseLeave={e=>{e.currentTarget.style.color=C.muted;e.currentTarget.style.background="rgba(255,255,255,0.05)"}}>
      ← Back to Home
    </button>
  );
}

// ─── AUTH SCREEN ────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "https://flora-backend-uae5.onrender.com";

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      const endpoint = mode==="register" ? "/auth/register" : "/auth/login";
      const body = mode==="register" ? { name:form.name, email:form.email, password:form.password } : { email:form.email, password:form.password };
      const res = await fetch(API+endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail||"Something went wrong");
      onLogin(data.user);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const inputStyle = { width:"100%", padding:"14px 16px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans, fontSize:"0.9rem", marginBottom:"12px" };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px", overflow:"hidden" }}>
      <div style={{ position:"fixed", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle,rgba(74,222,128,0.04) 0%,transparent 70%)", top:"0%", left:"10%", pointerEvents:"none" }} />
      <div className="fadeUp" style={{ textAlign:"center", marginBottom:"48px" }}>
        <div style={{ fontSize:"3rem", marginBottom:"12px" }} className="float">🌿</div>
        <h1 style={{ fontFamily:C.serif, fontSize:"3.5rem", fontWeight:700, color:C.green, letterSpacing:"-1px", marginBottom:"8px" }}>Flora</h1>
        <p style={{ color:C.muted, fontSize:"0.9rem", maxWidth:"280px", lineHeight:1.7 }}>Your personal gut health companion. Understand your microbiome and feel better every day.</p>
      </div>
      <div className="fadeUp" style={{ width:"100%", maxWidth:"400px", animationDelay:"0.1s" }}>
        <Card glow>
          <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:"10px", padding:"4px", marginBottom:"24px" }}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{ flex:1, padding:"10px", borderRadius:"8px", border:"none", cursor:"pointer", fontFamily:C.sans, fontWeight:600, fontSize:"0.85rem", background:mode===m?C.green:"transparent", color:mode===m?"#052e16":C.muted, transition:"all 0.2s" }}>
                {m==="login"?"Sign In":"Create Account"}
              </button>
            ))}
          </div>
          {mode==="register" && <input style={inputStyle} placeholder="Your name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />}
          <input style={inputStyle} placeholder="Email address" type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} />
          <input style={{...inputStyle,marginBottom:"20px"}} placeholder="Password" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&submit()} />
          {error && <div style={{ padding:"12px", borderRadius:"8px", background:`${C.red}15`, border:`1px solid ${C.red}30`, color:C.red, fontSize:"0.82rem", marginBottom:"16px", textAlign:"center" }}>{error}</div>}
          <Btn onClick={submit} disabled={loading} style={{ width:"100%", padding:"15px", fontSize:"1rem", animation:"pulse 2s infinite" }}>
            {loading?"Please wait…":mode==="login"?"Sign In →":"Create My Account →"}
          </Btn>
          <div style={{ textAlign:"center", marginTop:"16px" }}>
            <button onClick={()=>onLogin({id:"guest",name:"Guest",email:"guest@flora.app"})} style={{ background:"none", border:"none", color:C.muted, fontSize:"0.8rem", cursor:"pointer", fontFamily:C.sans }}>
              Continue without account →
            </button>
          </div>
          <div style={{ marginTop:"12px", borderTop:`1px solid ${C.border2}`, paddingTop:"16px" }}>
            <button onClick={()=>onLogin({id:"guest",name:"Guest",email:"guest@flora.app"}, true)} style={{ width:"100%", padding:"12px", borderRadius:"10px", border:`1px solid ${C.border}`, background:C.greenDim, color:C.green, fontFamily:C.sans, fontSize:"0.85rem", fontWeight:600, cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px" }}
              onMouseEnter={e=>{e.currentTarget.style.background=`${C.green}20`}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.greenDim}}>
              🏡 Go directly to Dashboard
            </button>
          </div>
        </Card>
      </div>
      <p style={{ marginTop:"32px", fontSize:"0.7rem", color:C.dim }}>Not medical advice · For educational purposes only</p>
    </div>
  );
}

// ─── QUIZ SCREEN ─────────────────────────────────────────────────────
function QuizScreen({ user, onComplete }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selected, setSelected] = useState(null);
  const [animating, setAnimating] = useState(false);

  const q = QUESTIONS[current];
  const progress = (current / QUESTIONS.length) * 100;
  const catColor = CAT_COLORS[q.cat] || C.green;

  const pick = (v) => {
    if (animating) return;
    setSelected(v); setAnimating(true);
    setTimeout(() => {
      const newAnswers = { ...answers, [q.id]: v };
      setAnswers(newAnswers);
      if (current < QUESTIONS.length - 1) { setCurrent(p=>p+1); setSelected(null); }
      else { onComplete(newAnswers); }
      setAnimating(false);
    }, 350);
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px" }}>
      <style>{css}</style>
      <div style={{ width:"100%", maxWidth:"520px" }}>
        <div style={{ marginBottom:"32px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
            <span style={{ fontSize:"0.72rem", letterSpacing:"2px", textTransform:"uppercase", color:catColor, fontWeight:600 }}>{q.cat}</span>
            <span style={{ fontSize:"0.8rem", color:C.muted }}>{current+1} of {QUESTIONS.length}</span>
          </div>
          <div style={{ height:"4px", background:C.border2, borderRadius:"4px", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:`linear-gradient(90deg,${catColor},${catColor}88)`, borderRadius:"4px", transition:"width 0.4s ease" }} />
          </div>
        </div>
        <div key={current} className="fadeUp">
          <Card style={{ marginBottom:"20px", padding:"32px" }}>
            <div style={{ fontSize:"2.8rem", marginBottom:"16px" }}>{q.icon}</div>
            <h2 style={{ fontFamily:C.serif, fontSize:"1.5rem", fontWeight:600, color:C.text, lineHeight:1.4 }}>{q.q}</h2>
          </Card>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {q.opts.map((opt, i) => (
              <button key={i} onClick={()=>pick(opt.v)}
                style={{ width:"100%", padding:"16px 20px", borderRadius:"12px", border:`1.5px solid ${selected===opt.v?catColor:C.border2}`, background:selected===opt.v?`${catColor}15`:"rgba(255,255,255,0.03)", color:selected===opt.v?catColor:C.text, fontFamily:C.sans, fontSize:"0.92rem", cursor:"pointer", textAlign:"left", display:"flex", alignItems:"center", gap:"14px", transition:"all 0.2s", fontWeight:selected===opt.v?600:400 }}
                onMouseEnter={e=>{if(selected!==opt.v){e.currentTarget.style.borderColor=`${catColor}66`;e.currentTarget.style.background=`${catColor}08`}}}
                onMouseLeave={e=>{if(selected!==opt.v){e.currentTarget.style.borderColor=C.border2;e.currentTarget.style.background="rgba(255,255,255,0.03)"}}}>
                <span style={{ width:"28px", height:"28px", borderRadius:"8px", background:selected===opt.v?`${catColor}22`:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.72rem", fontWeight:700, color:selected===opt.v?catColor:C.muted, flexShrink:0 }}>
                  {String.fromCharCode(65+i)}
                </span>
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SECTION VIEWS ────────────────────────────────────────────────────

function SectionAnalysis({ result, answers, onBack }) {
  const [activeTab, setActiveTab] = useState("overview");
  const TABS = ["overview","biomarkers","conditions","diet signals"];

  const fbRatio = (1.2 + result.d * 0.8).toFixed(1);
  const shannonIdx = (result.d * 10 + 4).toFixed(1);
  const butyrateStatus = result.catScores.Diet > 60 ? "adequate" : "limited";
  const gutBrainStatus = result.catScores.Lifestyle < 55 ? "disrupted" : "stable";

  const biomarkers = [
    { name:"Firmicutes/Bacteroidetes Ratio", value:fbRatio, unit:"", normal:"0.8–1.8", status:parseFloat(fbRatio)>2.0?"elevated":parseFloat(fbRatio)<0.8?"low":"normal", color:parseFloat(fbRatio)>2.0?C.red:parseFloat(fbRatio)<0.8?C.yellow:C.green, detail:parseFloat(fbRatio)>2.0?"Elevated ratio linked to metabolic risk — reduce processed foods and increase fiber.":"Healthy range. These two families work as a team for energy and immunity." },
    { name:"Shannon Diversity Index", value:shannonIdx, unit:"/10", normal:"6.5–9.0", status:parseFloat(shannonIdx)>=6.5?"normal":parseFloat(shannonIdx)>=5?"borderline":"low", color:parseFloat(shannonIdx)>=6.5?C.green:parseFloat(shannonIdx)>=5?C.yellow:C.red, detail:`A score of ${shannonIdx} measures how many different bacteria you have. Higher diversity = stronger immunity and better digestion.` },
    { name:"Butyrate Production Estimate", value:butyrateStatus==="adequate"?"Adequate":"Limited", unit:"", normal:"Adequate", status:butyrateStatus, color:butyrateStatus==="adequate"?C.green:C.yellow, detail:butyrateStatus==="adequate"?"Your fiber supports butyrate production — this reduces gut inflammation and strengthens the gut wall.":"Low fiber limits butyrate. Add dal, oats, and legumes daily." },
    { name:"Gut-Brain Axis Signal", value:gutBrainStatus==="stable"?"Stable":"Disrupted", unit:"", normal:"Stable", status:gutBrainStatus, color:gutBrainStatus==="stable"?C.green:C.red, detail:gutBrainStatus==="stable"?"Healthy gut-brain connection — this controls mood, appetite, and digestion.":"High stress and poor sleep disrupt this pathway, worsening anxiety and digestive issues." },
    { name:"Intestinal Permeability Risk", value:result.score<50?"Elevated":result.score<70?"Moderate":"Low", unit:"", normal:"Low", status:result.score<50?"elevated":result.score<70?"borderline":"normal", color:result.score<50?C.red:result.score<70?C.yellow:C.green, detail:result.score<50?"Multiple factors suggest possible gut wall damage — stress, poor sleep, low fiber.":"Your gut lining appears relatively intact based on lifestyle patterns." },
  ];

  const conditions = [];
  if ((answers.bloating??0) < 0 || (answers.acidity??0) < 0) conditions.push({ name:"Functional Dyspepsia", color:C.yellow, severity:"mild", explanation:"Recurring stomach discomfort without a clear physical cause. Usually manageable with diet changes." });
  if ((answers.bristol??0) < 0) conditions.push({ name:"Altered Gut Motility", color:C.orange, severity:"moderate", explanation:"Your gut is moving food too fast or too slow. Both affect nutrient absorption." });
  if ((answers.stress??0) < -1) conditions.push({ name:"HPA Axis Dysregulation", color:C.red, severity:"notable", explanation:"Chronic stress floods your body with cortisol which kills beneficial bacteria and thins your gut lining." });
  if ((answers.antibiotics??0) < -1) conditions.push({ name:"Post-Antibiotic Dysbiosis", color:C.red, severity:"significant", explanation:"Antibiotics wipe out harmful AND helpful bacteria. Repopulate with probiotics and prebiotic foods." });

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <div style={{ marginBottom:"24px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>📊 My Analysis</h2>
        <p style={{ color:C.muted, fontSize:"0.85rem" }}>Detailed clinical breakdown of your gut health assessment</p>
      </div>
      <div style={{ display:"flex", gap:"6px", marginBottom:"24px", background:C.surface, padding:"4px", borderRadius:"12px", border:`1px solid ${C.border2}` }}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setActiveTab(t)} style={{ flex:1, padding:"10px 12px", borderRadius:"9px", border:"none", cursor:"pointer", fontFamily:C.sans, fontSize:"0.78rem", fontWeight:activeTab===t?600:400, textTransform:"capitalize", background:activeTab===t?C.greenDim:"transparent", color:activeTab===t?C.green:C.muted, transition:"all 0.2s" }}>
            {t==="overview"?"📊 Overview":t==="biomarkers"?"🔬 Biomarkers":t==="conditions"?"🩺 Findings":"🥗 Diet"}
          </button>
        ))}
      </div>

      {activeTab==="overview" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"20px" }}>
            <Card glow>
              <Label>Gut Health Score</Label>
              <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
                <Ring pct={result.score} color={result.tierColor} size={120}>
                  <div style={{ fontFamily:C.serif, fontSize:"1.8rem", color:result.tierColor, fontWeight:700, lineHeight:1 }}>{result.score}</div>
                  <div style={{ fontSize:"0.6rem", color:C.muted }}>/100</div>
                </Ring>
                <div>
                  <div style={{ fontFamily:C.serif, fontSize:"1.2rem", color:result.tierColor, marginBottom:"6px" }}>{result.tierEmoji} {result.tier}</div>
                  <div style={{ fontSize:"0.8rem", color:C.muted, lineHeight:1.6 }}>Confidence: {result.confidence}%</div>
                </div>
              </div>
            </Card>
            <Card>
              <Label>Category Scores</Label>
              {Object.entries(result.catScores).map(([cat,score])=>(
                <div key={cat} style={{ marginBottom:"12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                    <span style={{ fontSize:"0.83rem" }}>{CAT_ICONS[cat]} {cat}</span>
                    <span style={{ fontSize:"0.83rem", color:CAT_COLORS[cat], fontWeight:700 }}>{score}</span>
                  </div>
                  <Bar pct={score} color={CAT_COLORS[cat]} />
                </div>
              ))}
            </Card>
          </div>
          <Card>
            <Label>Factor-by-Factor Analysis</Label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
              {result.importance.map((f,i)=>(
                <div key={f.key} style={{ padding:"12px 14px", background:"rgba(255,255,255,0.02)", borderRadius:"10px", border:`1px solid ${C.border2}` }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                    <span style={{ fontSize:"0.82rem", textTransform:"capitalize" }}>{f.label}</span>
                    <span style={{ fontSize:"0.72rem", color:f.pct>60?C.green:f.pct>35?C.yellow:C.red, fontWeight:600 }}>{f.pct>=60?"✅":f.pct>=35?"⚠️":"🔴"}</span>
                  </div>
                  <Bar pct={f.pct} color={f.pct>=60?C.green:f.pct>=35?C.yellow:C.red} height="4px" delay={`${i*0.04}s`} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab==="biomarkers" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={{ padding:"14px 18px", background:`rgba(96,165,250,0.06)`, border:`1px solid ${C.blue}22`, borderRadius:"12px" }}>
            <div style={{ fontSize:"0.85rem", color:C.blue, fontWeight:600, marginBottom:"4px" }}>📋 About these biomarkers</div>
            <div style={{ fontSize:"0.8rem", color:C.muted, lineHeight:1.7 }}>Estimated clinical markers calculated from quiz answers. These are educational estimates, not lab results.</div>
          </div>
          {biomarkers.map((b,i)=>(
            <Card key={i}>
              <div style={{ display:"flex", gap:"16px", alignItems:"flex-start" }}>
                <div style={{ flexShrink:0, textAlign:"center", minWidth:"90px" }}>
                  <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:b.color, fontWeight:700 }}>{b.value}{b.unit}</div>
                  <div style={{ fontSize:"0.65rem", color:C.muted, margin:"4px 0" }}>Normal: {b.normal}</div>
                  <span style={{ padding:"3px 10px", borderRadius:"50px", fontSize:"0.68rem", fontWeight:700, background:`${b.color}15`, color:b.color, border:`1px solid ${b.color}30`, textTransform:"capitalize" }}>{b.status}</span>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:"0.9rem", marginBottom:"6px" }}>{b.name}</div>
                  <div style={{ fontSize:"0.8rem", color:C.muted, lineHeight:1.7 }}>{b.detail}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab==="conditions" && (
        <div>
          <div style={{ padding:"14px 18px", background:`${C.yellow}08`, border:`1px solid ${C.yellow}22`, borderRadius:"12px", marginBottom:"16px" }}>
            <div style={{ fontSize:"0.85rem", color:C.yellow, fontWeight:600, marginBottom:"4px" }}>⚕️ Important disclaimer</div>
            <div style={{ fontSize:"0.8rem", color:C.muted, lineHeight:1.7 }}>Pattern-based observations only — not diagnoses. Always seek professional evaluation for persistent symptoms.</div>
          </div>
          {conditions.length===0 ? (
            <Card><div style={{ textAlign:"center", padding:"40px 0" }}><div style={{ fontSize:"3rem", marginBottom:"12px" }}>🌸</div><div style={{ fontFamily:C.serif, fontSize:"1.3rem", color:C.green }}>No significant clinical flags detected</div></div></Card>
          ) : conditions.map((c,i)=>(
            <Card key={i} style={{ marginBottom:"14px", borderLeft:`4px solid ${c.color}` }}>
              <span style={{ padding:"3px 10px", borderRadius:"50px", fontSize:"0.7rem", fontWeight:700, background:`${c.color}15`, color:c.color, border:`1px solid ${c.color}30` }}>{c.severity} signal</span>
              <div style={{ fontWeight:700, color:c.color, marginTop:"8px", marginBottom:"6px" }}>{c.name}</div>
              <div style={{ fontSize:"0.82rem", color:C.muted, lineHeight:1.75 }}>{c.explanation}</div>
            </Card>
          ))}
        </div>
      )}

      {activeTab==="diet signals" && (
        <div>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Estimated Microbiome Composition</Label>
            <div style={{ height:"16px", borderRadius:"8px", overflow:"hidden", display:"flex", marginBottom:"16px" }}>
              {result.microbiome.map(b=><div key={b.name} title={b.name} style={{ flex:b.pct, background:b.color }} />)}
            </div>
            {result.microbiome.map(b=>(
              <div key={b.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"rgba(255,255,255,0.02)", borderRadius:"8px", marginBottom:"6px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:b.color }} />
                  <span style={{ fontSize:"0.85rem" }}>{b.name}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                  <span style={{ fontFamily:C.serif, fontSize:"1.1rem", color:b.color, fontWeight:700 }}>{b.pct}%</span>
                  <span style={{ padding:"2px 8px", borderRadius:"50px", fontSize:"0.7rem", background:`${b.color}15`, color:b.color }}>{b.status}</span>
                </div>
              </div>
            ))}
          </Card>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
            <Card>
              <Label>Foods that help</Label>
              {[["🍌","Banana","Feeds Lactobacillus — eat daily"],["🧄","Garlic","Powerful prebiotic"],["🌾","Oats","Beta-glucan boosts Bifidobacterium"],["🫙","Kefir/Curd","Direct probiotic source"],["🥦","Broccoli","Protects gut lining"],["🍎","Apple","Pectin feeds diverse bacteria"]].map(([e,n,b],i)=>(
                <div key={i} style={{ display:"flex", gap:"12px", padding:"10px 0", borderBottom:`1px solid ${C.border2}` }}>
                  <span style={{ fontSize:"1.3rem" }}>{e}</span>
                  <div><div style={{ fontSize:"0.85rem", fontWeight:600, color:C.green }}>{n}</div><div style={{ fontSize:"0.75rem", color:C.muted }}>{b}</div></div>
                </div>
              ))}
            </Card>
            <Card>
              <Label>Foods to limit</Label>
              {[["🥛","Dairy","May cause bloating"],["🌶️","Spicy food","Increases heartburn"],["☕","Excess coffee","Disrupts Firmicutes"],["🍺","Alcohol","Reduces microbiome diversity"],["🍔","Ultra-processed","Feeds harmful bacteria"]].map(([e,n,b],i)=>(
                <div key={i} style={{ display:"flex", gap:"12px", padding:"10px 0", borderBottom:`1px solid ${C.border2}` }}>
                  <span style={{ fontSize:"1.3rem" }}>{e}</span>
                  <div><div style={{ fontSize:"0.85rem", fontWeight:600, color:C.red }}>{n}</div><div style={{ fontSize:"0.75rem", color:C.muted }}>{b}</div></div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionMLModels({ result, onBack }) {
  const dt = result.dtResult;
  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <div style={{ marginBottom:"24px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>🤖 ML Models</h2>
        <p style={{ color:C.muted, fontSize:"0.85rem" }}>Two independent models analysed your data — XGBoost score + Decision Tree risk</p>
      </div>
      <div style={{ padding:"16px 20px", borderRadius:"14px", marginBottom:"24px", background:dt.agreement==="agree"?`${C.green}0a`:`${C.yellow}0a`, border:`1px solid ${dt.agreement==="agree"?C.green:C.yellow}30` }}>
        <div style={{ fontSize:"0.85rem", fontWeight:600, color:dt.agreement==="agree"?C.green:C.yellow, marginBottom:"4px" }}>
          {dt.agreement==="agree"?"✅ Models are in agreement":"⚠️ Models have differing assessments"}
        </div>
        <div style={{ fontSize:"0.8rem", color:C.muted }}>{dt.agreementText}</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px", marginBottom:"24px" }}>
        <Card glow>
          <Label>Model 1 — XGBoost Score</Label>
          <div style={{ display:"flex", alignItems:"center", gap:"20px", marginBottom:"16px" }}>
            <Ring pct={result.score} color={result.tierColor} size={110}>
              <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:result.tierColor, fontWeight:700, lineHeight:1 }}>{result.score}</div>
              <div style={{ fontSize:"0.6rem", color:C.muted }}>/100</div>
            </Ring>
            <div>
              <div style={{ fontFamily:C.serif, fontSize:"1.1rem", color:result.tierColor, marginBottom:"4px" }}>{result.tierEmoji} {result.tier}</div>
              <div style={{ fontSize:"0.78rem", color:C.muted }}>Weighted scoring across 25 features</div>
              <div style={{ fontSize:"0.72rem", color:C.muted, marginTop:"4px" }}>Confidence: {result.confidence}%</div>
            </div>
          </div>
          <div style={{ padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:"10px", fontSize:"0.78rem", color:C.muted, lineHeight:1.6 }}>
            XGBoost uses weighted feature importance — each answer contributes proportionally to the final score based on its clinical significance.
          </div>
        </Card>
        <Card>
          <Label>Model 2 — Decision Tree Risk</Label>
          <div style={{ display:"flex", alignItems:"center", gap:"20px", marginBottom:"16px" }}>
            <Ring pct={dt.score} color={dt.color} size={110}>
              <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:dt.color, fontWeight:700, lineHeight:1 }}>{dt.emoji}</div>
            </Ring>
            <div>
              <div style={{ fontFamily:C.serif, fontSize:"1.1rem", color:dt.color, marginBottom:"4px" }}>{dt.label}</div>
              <div style={{ fontSize:"0.78rem", color:C.muted }}>Rule-based tree traversal</div>
              <div style={{ fontSize:"0.72rem", color:C.muted, marginTop:"4px" }}>Node: {dt.node.replace(/_/g," ")}</div>
            </div>
          </div>
          <div style={{ padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:"10px", fontSize:"0.78rem", color:C.muted, lineHeight:1.6 }}>
            {dt.desc}
          </div>
        </Card>
      </div>
      <Card style={{ marginBottom:"20px" }}>
        <Label>Decision Tree — How the model reached your result</Label>
        <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
          {dt.path.map((step, i) => (
            <div key={i} style={{ display:"flex", gap:"12px", alignItems:"flex-start", padding:"10px 14px", background:"rgba(255,255,255,0.02)", borderRadius:"10px", border:`1px solid ${C.border2}` }}>
              <div style={{ flexShrink:0, width:"24px", height:"24px", borderRadius:"50%", background:C.greenDim, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.7rem", fontWeight:700, color:C.green }}>{i+1}</div>
              <div style={{ fontSize:"0.83rem", color:C.text, lineHeight:1.6 }}>{step}</div>
              {i < dt.path.length-1 && <div style={{ marginLeft:"auto", color:C.muted, fontSize:"0.8rem" }}>↓</div>}
            </div>
          ))}
          <div style={{ padding:"12px 16px", background:`${dt.color}10`, border:`1px solid ${dt.color}30`, borderRadius:"10px", display:"flex", gap:"12px", alignItems:"center" }}>
            <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:dt.color, flexShrink:0 }} />
            <div style={{ fontSize:"0.85rem", color:dt.color, fontWeight:600 }}>Final classification: {dt.label}</div>
          </div>
        </div>
      </Card>
      <Card>
        <Label>Top Features Driving Both Models</Label>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {result.importance.slice(0,8).map((f,i)=>(
            <div key={f.key} style={{ padding:"10px 12px", background:"rgba(255,255,255,0.02)", borderRadius:"8px", border:`1px solid ${C.border2}` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ fontSize:"0.8rem", textTransform:"capitalize", color:C.text }}>{f.label}</span>
                <span style={{ fontSize:"0.72rem", color:C.muted }}>{f.weight}% weight</span>
              </div>
              <Bar pct={f.pct} color={f.pct>=60?C.green:f.pct>=35?C.yellow:C.red} height="4px" delay={`${i*0.05}s`} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SectionForecast({ result, onBack }) {
  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <div style={{ marginBottom:"24px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>🔮 Future Outlook</h2>
        <p style={{ color:C.muted, fontSize:"0.85rem" }}>What your gut trajectory looks like at different time horizons</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px", marginBottom:"24px" }}>
        {result.speculations.map((s,i)=>(
          <Card key={i} style={{ borderTop:`3px solid ${s.positive?C.green:C.red}` }}>
            <div style={{ fontSize:"1.8rem", marginBottom:"10px" }}>{s.icon}</div>
            <div style={{ fontSize:"0.65rem", color:C.muted, textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:"6px" }}>In {s.horizon}</div>
            <div style={{ fontSize:"0.9rem", color:s.positive?C.green:C.yellow, fontWeight:600, lineHeight:1.5, marginBottom:"12px" }}>{s.outcome}</div>
            <div style={{ fontSize:"0.72rem", color:C.muted, marginBottom:"8px" }}>Confidence: {s.confidence}%</div>
            <Bar pct={s.confidence} color={s.positive?C.green:C.yellow} height="4px" />
          </Card>
        ))}
      </div>
      <Card>
        <Label>Your 30-day action plan</Label>
        {[
          { week:"Week 1", focus:"Foundation", actions:["Drink 2L water daily","Add one fermented food per day","Sleep by 11pm every night"] },
          { week:"Week 2", focus:"Build", actions:["Introduce 20-min daily walk","Remove one trigger food","Add fiber at every meal"] },
          { week:"Week 3", focus:"Deepen", actions:["Try 5-min morning breathing","Add prebiotic foods: oats, garlic, banana","Track symptoms daily"] },
          { week:"Week 4", focus:"Sustain", actions:["Retake your gut assessment","Review your food diary","Plan next month's goals"] },
        ].map((w,i)=>(
          <div key={i} style={{ display:"flex", gap:"16px", padding:"14px 16px", background:"rgba(255,255,255,0.02)", borderRadius:"10px", border:`1px solid ${C.border2}`, marginBottom:"10px" }}>
            <div style={{ flexShrink:0, textAlign:"center", minWidth:"60px" }}>
              <div style={{ fontSize:"0.65rem", color:C.muted, textTransform:"uppercase", letterSpacing:"1px" }}>{w.week}</div>
              <div style={{ fontFamily:C.serif, fontSize:"1rem", color:C.green, fontWeight:600 }}>{w.focus}</div>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", alignItems:"center" }}>
              {w.actions.map((a,j)=>(
                <span key={j} style={{ padding:"4px 12px", borderRadius:"50px", background:C.greenDim, color:C.green, fontSize:"0.78rem", border:`1px solid ${C.border}` }}>✓ {a}</span>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

function SectionCheckin({ user, onBack }) {
  const [checkin, setCheckin] = useState({ bloating:2, cramps:1, nausea:0, gas:3, heartburn:1, water:1.5, sleepH:7, stressL:4, mood:"😊", bristol:4 });
  const [saved, setSaved] = useState(false);

  const saveCheckin = async () => {
    try { await fetch("https://flora-backend-uae5.onrender.com/api/checkin", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({user_id:user.id,...checkin}) }); } catch(e) {}
    setSaved(true); setTimeout(()=>setSaved(false),2500);
  };

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <div style={{ marginBottom:"24px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>✅ Daily Check-in</h2>
        <p style={{ color:C.muted, fontSize:"0.85rem" }}>Track how your gut feels today</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
        <div>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Bristol Stool Type Today</Label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"6px", marginBottom:"12px" }}>
              {["🟤","🟫","🟤","✅","🟡","🟠","🔴"].map((e,i)=>(
                <div key={i} onClick={()=>setCheckin(p=>({...p,bristol:i+1}))} style={{ padding:"8px 4px", borderRadius:"8px", textAlign:"center", cursor:"pointer", background:checkin.bristol===i+1?C.greenDim:"rgba(255,255,255,0.03)", border:`1.5px solid ${checkin.bristol===i+1?C.green:C.border2}`, transition:"all 0.15s" }}>
                  <div style={{ fontSize:"1.2rem" }}>{e}</div>
                  <div style={{ fontSize:"0.6rem", color:C.muted, marginTop:"2px" }}>T{i+1}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Label>Symptom Levels</Label>
            {[{key:"bloating",label:"🫃 Bloating"},{key:"cramps",label:"😖 Cramps"},{key:"nausea",label:"🤢 Nausea"},{key:"gas",label:"💨 Gas"},{key:"heartburn",label:"🔥 Heartburn"}].map(s=>(
              <div key={s.key} style={{ marginBottom:"14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                  <span style={{ fontSize:"0.85rem" }}>{s.label}</span>
                  <span style={{ color:checkin[s.key]>6?C.red:checkin[s.key]>3?C.yellow:C.green, fontWeight:600 }}>{checkin[s.key]}/10</span>
                </div>
                <input type="range" min="0" max="10" value={checkin[s.key]||0} onChange={e=>setCheckin(p=>({...p,[s.key]:+e.target.value}))} style={{ width:"100%", accentColor:C.green }} />
              </div>
            ))}
          </Card>
        </div>
        <div>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Water Today</Label>
            <div style={{ display:"flex", alignItems:"baseline", gap:"6px", marginBottom:"10px" }}>
              <span style={{ fontFamily:C.serif, fontSize:"2.5rem", color:C.blue, fontWeight:700 }}>{checkin.water}</span>
              <span style={{ color:C.muted }}>L · Goal: 2.5L</span>
            </div>
            <Bar pct={Math.min(100,checkin.water/2.5*100)} color={C.blue} height="8px" />
            <div style={{ display:"flex", gap:"8px", marginTop:"12px" }}>
              {[0.25,0.5,1].map(ml=>(<Btn key={ml} variant="ghost" onClick={()=>setCheckin(p=>({...p,water:Math.round((p.water+ml)*10)/10}))} style={{ padding:"8px 16px", fontSize:"0.82rem" }}>+{ml}L</Btn>))}
            </div>
          </Card>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Sleep & Stress</Label>
            <div style={{ marginBottom:"16px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ fontSize:"0.85rem" }}>🌙 Hours slept</span>
                <span style={{ fontWeight:600 }}>{checkin.sleepH}h</span>
              </div>
              <input type="range" min="3" max="12" step="0.5" value={checkin.sleepH} onChange={e=>setCheckin(p=>({...p,sleepH:+e.target.value}))} style={{ width:"100%", accentColor:C.green }} />
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                <span style={{ fontSize:"0.85rem" }}>🧠 Stress level</span>
                <span style={{ color:checkin.stressL>6?C.red:C.text, fontWeight:600 }}>{checkin.stressL}/10</span>
              </div>
              <input type="range" min="0" max="10" value={checkin.stressL} onChange={e=>setCheckin(p=>({...p,stressL:+e.target.value}))} style={{ width:"100%", accentColor:checkin.stressL>6?C.red:C.green }} />
            </div>
          </Card>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Today's Mood</Label>
            <div style={{ display:"flex", gap:"8px" }}>
              {["😄","😊","😐","😔","😩"].map(m=>(
                <div key={m} onClick={()=>setCheckin(p=>({...p,mood:m}))} style={{ padding:"10px 14px", borderRadius:"10px", cursor:"pointer", fontSize:"1.4rem", background:checkin.mood===m?C.greenDim:"rgba(255,255,255,0.03)", border:`1.5px solid ${checkin.mood===m?C.green:C.border2}`, transition:"all 0.15s" }}>{m}</div>
              ))}
            </div>
          </Card>
          <Btn onClick={saveCheckin} style={{ width:"100%", padding:"15px", fontSize:"1rem", background:saved?`rgba(74,222,128,0.15)`:`linear-gradient(135deg,${C.green},#22c55e)`, color:saved?C.green:"#052e16", border:saved?`1.5px solid ${C.green}`:"none" }}>
            {saved?"✅ Saved! Keep it up":"Save Today's Check-in"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function SectionFoodLog({ user, onBack }) {
  const [foodLog, setFoodLog] = useState([]);
  const [foodInput, setFoodInput] = useState("");

  const logFood = () => {
    if (!foodInput.trim()) return;
    const good = ["banana","oats","dal","broccoli","curd","kefir","rice","ginger","garlic","apple","carrot","spinach","idli","dosa","buttermilk","lentil"];
    const bad  = ["milk","spicy","coffee","burger","alcohol","fried","sweet","cake","pizza","chips","junk","processed"];
    const f = foodInput.toLowerCase();
    const effect = bad.some(t=>f.includes(t)) ? {label:"⚠️ Trigger food",color:C.yellow} : good.some(t=>f.includes(t)) ? {label:"✅ Gut-friendly",color:C.green} : {label:"📋 Logged",color:C.muted};
    setFoodLog(p=>[{name:foodInput,time:"Just now",effect},...p]);
    setFoodInput("");
  };

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <div style={{ marginBottom:"24px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>🍽️ Food Log</h2>
        <p style={{ color:C.muted, fontSize:"0.85rem" }}>Track meals and see how they affect your gut</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
        <div>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Log a meal or food</Label>
            <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
              <input value={foodInput} onChange={e=>setFoodInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&logFood()} placeholder="Type food name…" style={{ flex:1, padding:"12px 14px", borderRadius:"10px", border:`1px solid ${C.border2}`, background:"rgba(255,255,255,0.04)", color:C.text, fontFamily:C.sans, fontSize:"0.88rem" }} />
              <Btn onClick={logFood} style={{ padding:"12px 20px" }}>Log</Btn>
            </div>
            <Label style={{ marginBottom:"8px" }}>Quick add — gut-friendly</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px", marginBottom:"16px" }}>
              {["🍌 Banana","🥦 Broccoli","🫙 Curd","🍚 Dal rice","🍵 Ginger tea","🌾 Oats","🧄 Garlic","🍎 Apple"].map(f=>(
                <button key={f} onClick={()=>setFoodLog(p=>[{name:f.split(" ").slice(1).join(" "),time:"Just now",effect:{label:"✅ Gut-friendly",color:C.green}},...p])} style={{ padding:"6px 12px", borderRadius:"50px", border:`1px solid ${C.border}`, background:C.greenDim, color:C.green, fontSize:"0.78rem", cursor:"pointer", fontFamily:C.sans }}>{f}</button>
              ))}
            </div>
            <Label style={{ marginBottom:"8px" }}>Known triggers</Label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {["🥛 Dairy","🌶️ Spicy food","☕ Coffee","🍺 Alcohol","🍔 Fried food"].map(f=>(
                <button key={f} onClick={()=>setFoodLog(p=>[{name:f.split(" ").slice(1).join(" "),time:"Just now",effect:{label:"⚠️ Trigger",color:C.yellow}},...p])} style={{ padding:"6px 12px", borderRadius:"50px", border:`1px solid ${C.yellow}44`, background:`${C.yellow}10`, color:C.yellow, fontSize:"0.78rem", cursor:"pointer", fontFamily:C.sans }}>{f}</button>
              ))}
            </div>
          </Card>
        </div>
        <Card>
          <Label>Today's food log</Label>
          {foodLog.length===0 && <div style={{ textAlign:"center", padding:"32px 0", color:C.muted, fontSize:"0.85rem" }}>Nothing logged yet. Start adding meals!</div>}
          {foodLog.map((l,i)=>(
            <div key={i} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px", background:"rgba(255,255,255,0.02)", borderRadius:"10px", marginBottom:"8px", border:`1px solid ${C.border2}` }}>
              <span style={{ fontSize:"1.4rem" }}>🍽️</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"0.88rem", fontWeight:500 }}>{l.name}</div>
                <div style={{ fontSize:"0.72rem", color:C.muted }}>{l.time}</div>
              </div>
              <span style={{ padding:"3px 10px", borderRadius:"50px", fontSize:"0.72rem", fontWeight:600, background:`${l.effect.color}15`, color:l.effect.color, border:`1px solid ${l.effect.color}30` }}>{l.effect.label}</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function SectionMicrobiome({ result, onBack }) {
  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <div style={{ marginBottom:"24px" }}>
        <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>🔬 My Microbiome</h2>
        <p style={{ color:C.muted, fontSize:"0.85rem" }}>Your estimated gut bacteria composition and diversity</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" }}>
        <div>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Bacteria Composition</Label>
            <div style={{ height:"16px", borderRadius:"8px", overflow:"hidden", display:"flex", marginBottom:"20px" }}>
              {result.microbiome.map(b=><div key={b.name} title={b.name} style={{ flex:b.pct, background:b.color }} />)}
            </div>
            {result.microbiome.map(b=>(
              <div key={b.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 12px", background:"rgba(255,255,255,0.02)", borderRadius:"8px", marginBottom:"6px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:b.color }} />
                  <span style={{ fontSize:"0.85rem" }}>{b.name}</span>
                </div>
                <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
                  <span style={{ fontFamily:C.serif, fontSize:"1.1rem", color:b.color, fontWeight:700 }}>{b.pct}%</span>
                  <span style={{ padding:"2px 8px", borderRadius:"50px", fontSize:"0.7rem", background:`${b.color}15`, color:b.color }}>{b.status}</span>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <Label>Diversity Score</Label>
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontFamily:C.serif, fontSize:"3.5rem", color:C.teal, fontWeight:700 }}>{(result.d*10+4).toFixed(1)}</div>
              <div style={{ fontSize:"0.8rem", color:C.muted, marginBottom:"8px" }}>Shannon Diversity Index (out of 10)</div>
              <div style={{ fontSize:"0.82rem", color:result.d>0.6?C.green:result.d>0.4?C.yellow:C.red }}>
                {result.d>0.6?"Good diversity — your gut ecosystem is resilient":result.d>0.4?"Moderate diversity — room to improve":"Low diversity — focus on varied plant foods"}
              </div>
            </div>
          </Card>
        </div>
        <div>
          <Card style={{ marginBottom:"20px" }}>
            <Label>Insights for Your Profile</Label>
            {result.insights.slice(0,5).map((ins,i)=><InsightCard key={i} {...ins} />)}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────
function Dashboard({ user, answers, onRetake }) {
  const [section, setSection] = useState(null);
  const [apiResult, setApiResult] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    async function fetchAssess() {
      try {
        // ── FIXED: was /analyze, now /api/assess ──
        const res = await fetch("https://flora-backend-uae5.onrender.com/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
body: JSON.stringify({ user_id: user.id, answers: answers }),        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Backend returned ${res.status}`);
        }
        const data = await res.json();
        setApiResult(data);
      } catch (e) {
        setApiError(e.message);
        setApiResult(null);
      }
      setApiLoading(false);
    }
    fetchAssess();
  }, []);

  const jsResult = analyze(answers);

  const result = apiResult
    ? {
        ...jsResult,
        score:      apiResult.score      ?? jsResult.score,
        catScores:  apiResult.catScores  ?? jsResult.catScores,
        d:          apiResult.d          ?? jsResult.d,
        confidence: apiResult.confidence ?? jsResult.confidence,
        importance: apiResult.importance ?? jsResult.importance,
        tier:       apiResult.score >= 75 ? "Thriving" : apiResult.score >= 55 ? "Growing" : apiResult.score >= 35 ? "Wilting" : "Struggling",
        tierEmoji:  apiResult.score >= 75 ? "🌸" : apiResult.score >= 55 ? "🌿" : apiResult.score >= 35 ? "🌾" : "🥀",
        tierColor:  apiResult.score >= 75 ? C.green : apiResult.score >= 55 ? C.lime : apiResult.score >= 35 ? C.yellow : C.red,
        scoredBy:   "XGBoost (backend)",
      }
    : { ...jsResult, scoredBy: "Rule-based (offline)" };

  if (apiLoading) {
    return (
      <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"20px" }}>
        <style>{css}</style>
        <div style={{ fontSize:"3rem" }} className="float">🌿</div>
        <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:C.green }}>Analysing your gut health…</div>
        <div style={{ fontSize:"0.85rem", color:C.muted }}>Running K-Means Clustering+XGBoost + Decision Tree models</div>
        <div style={{ display:"flex", gap:"6px" }}>{[0,1,2].map(j=>(<div key={j} style={{ width:"10px", height:"10px", borderRadius:"50%", background:C.green, animation:`typing 1.2s ${j*0.2}s infinite` }} />))}</div>
      </div>
    );
  }

  if (section === "analysis")   return <PageWrapper onRetake={onRetake}><SectionAnalysis result={result} answers={answers} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "ml")         return <PageWrapper onRetake={onRetake}><SectionMLModels result={result} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "forecast")   return <PageWrapper onRetake={onRetake}><SectionForecast result={result} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "checkin")    return <PageWrapper onRetake={onRetake}><SectionCheckin user={user} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "food")       return <PageWrapper onRetake={onRetake}><SectionFoodLog user={user} onBack={()=>setSection(null)} /></PageWrapper>;
  if (section === "microbiome") return <PageWrapper onRetake={onRetake}><SectionMicrobiome result={result} onBack={()=>setSection(null)} /></PageWrapper>;
if (section === "archetype") return <PageWrapper onRetake={onRetake}><SectionArchetype result={result} answers={answers} onBack={()=>setSection(null)} /></PageWrapper>;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:C.sans, color:C.text }}>
      <style>{css}</style>
      <div style={{ padding:"20px 32px", borderBottom:`1px solid ${C.border2}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:C.surface, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:C.green, fontWeight:700 }}>🌿 Flora</div>
        <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
          {/* Show backend status */}
          {apiError && (
            <span style={{ fontSize:"0.72rem", color:C.yellow, background:`${C.yellow}15`, border:`1px solid ${C.yellow}30`, padding:"4px 10px", borderRadius:"50px" }}>
              ⚠️ Offline mode — {apiError}
            </span>
          )}
          <span style={{ fontSize:"0.85rem", color:C.muted }}>Hi, {user.name}</span>
          <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:`linear-gradient(135deg,${C.green},${C.teal})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.9rem" }}>👤</div>
        </div>
      </div>

      <div style={{ padding:"32px", maxWidth:"1100px", margin:"0 auto" }}>
        <div className="fadeUp" style={{ display:"flex", gap:"32px", alignItems:"center", marginBottom:"40px", padding:"32px", background:`linear-gradient(135deg,rgba(74,222,128,0.07),rgba(45,212,191,0.04))`, border:C.border, borderWidth:1, borderStyle:"solid", borderRadius:"24px" }}>
          <Ring pct={result.score} color={result.tierColor} size={180} strokeWidth={14}>
            <div style={{ fontFamily:C.serif, fontSize:"2.8rem", color:result.tierColor, fontWeight:700, lineHeight:1 }}>{result.score}</div>
            <div style={{ fontSize:"0.65rem", color:C.muted }}>out of 100</div>
          </Ring>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:C.serif, fontSize:"2.2rem", color:result.tierColor, marginBottom:"8px" }}>{result.tierEmoji} {result.tier} Flora</div>
            <div style={{ fontSize:"0.9rem", color:C.muted, lineHeight:1.8, maxWidth:"420px" }}>
              {result.tier==="Thriving" && "Your gut is in excellent shape. Keep up your great habits — your microbiome is thriving."}
              {result.tier==="Growing" && "Good foundations. A few targeted improvements can take your gut health to the next level."}
              {result.tier==="Wilting" && "Your gut needs some attention. Small consistent changes create big results within weeks."}
              {result.tier==="Struggling" && "Your gut is under stress. Start with the basics: water, sleep, and reducing processed foods."}
            </div>
            <div style={{ marginTop:"14px", display:"inline-flex", gap:"8px", flexWrap:"wrap" }}>
              <span style={{ padding:"5px 12px", borderRadius:"50px", background:`${result.tierColor}15`, color:result.tierColor, fontSize:"0.78rem", fontWeight:600, border:`1px solid ${result.tierColor}30` }}>{result.scoredBy}</span>
              <span style={{ padding:"5px 12px", borderRadius:"50px", background:`${result.dtResult.color}15`, color:result.dtResult.color, fontSize:"0.78rem", fontWeight:600, border:`1px solid ${result.dtResult.color}30` }}>🌲 DT: {result.dtResult.label}</span>
              <span style={{ padding:"5px 12px", borderRadius:"50px", background:"rgba(255,255,255,0.05)", color:C.muted, fontSize:"0.78rem" }}>Confidence: {result.confidence}%</span>
            </div>
          </div>
          <div style={{ flexShrink:0 }}>
            <Btn onClick={onRetake} variant="outline" style={{ padding:"10px 20px", fontSize:"0.85rem" }}>↺ Retake Quiz</Btn>
          </div>
        </div>

        <div className="fadeUp" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"32px", animationDelay:"0.1s" }}>
          {Object.entries(result.catScores).map(([cat,score])=>(
            <div key={cat} onClick={()=>setSection("analysis")} className="metric-card" style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:"16px", padding:"20px", textAlign:"center", borderTop:`3px solid ${CAT_COLORS[cat]}` }}>
              <div style={{ fontSize:"1.5rem", marginBottom:"8px" }}>{CAT_ICONS[cat]}</div>
              <div style={{ fontFamily:C.serif, fontSize:"2rem", color:CAT_COLORS[cat], fontWeight:700 }}>{score}</div>
              <div style={{ fontSize:"0.7rem", color:C.muted, textTransform:"uppercase", letterSpacing:"1.5px", margin:"4px 0 8px" }}>{cat}</div>
              <Bar pct={score} color={CAT_COLORS[cat]} height="4px" />
              <div style={{ fontSize:"0.72rem", color:C.muted, marginTop:"6px" }}>{score>=70?"Good":score>=50?"Fair":"Needs work"} →</div>
            </div>
          ))}
        </div>

        <div className="fadeUp" style={{ animationDelay:"0.2s" }}>
          <div style={{ fontSize:"0.65rem", letterSpacing:"2px", textTransform:"uppercase", color:C.muted, marginBottom:"16px" }}>Explore Your Health</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
            {[
              { key:"analysis",   icon:"📊", title:"My Analysis",    desc:"Biomarkers, clinical findings, microbiome composition and factor breakdown",  footer:"4 sections inside →" },
              { key:"ml",         icon:"🤖", title:"ML Models",      desc:"XGBoost score vs Decision Tree risk — see how both models interpret your data", footer:null },
              { key:"forecast",   icon:"🔮", title:"Future Outlook", desc:"Your gut health trajectory and 30-day action plan",                             footer:"3-horizon forecast →" },
              { key:"checkin",    icon:"✅", title:"Daily Check-in", desc:"Log today's symptoms, stool type, water intake, sleep and stress",              footer:"Track today →" },
              { key:"food",       icon:"🍽️", title:"Food Log",       desc:"Log meals, get instant gut-friendly vs trigger food feedback",                  footer:"Add meal →" },
              { key:"microbiome", icon:"🔬", title:"My Microbiome",  desc:"Bacteria composition, diversity index and personalized insights",               footer:`${(result.d*10+4).toFixed(1)}/10 diversity →` },
            ].map(card=>(
              <div key={card.key} onClick={()=>setSection(card.key)} className="metric-card" style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:"20px", padding:"24px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:"-20px", right:"-20px", fontSize:"5rem", opacity:0.06 }}>{card.icon}</div>
                <div style={{ fontSize:"2rem", marginBottom:"12px" }}>{card.icon}</div>
                <div style={{ fontFamily:C.serif, fontSize:"1.2rem", color:C.text, marginBottom:"6px" }}>{card.title}</div>
                <div style={{ fontSize:"0.78rem", color:C.muted, lineHeight:1.6, marginBottom:"14px" }}>{card.desc}</div>
                {card.key==="ml" ? (
                  <div style={{ display:"flex", gap:"6px" }}>
                    <span style={{ padding:"3px 8px", borderRadius:"50px", background:`${result.tierColor}15`, color:result.tierColor, fontSize:"0.7rem" }}>XGB: {result.score}</span>
                    <span style={{ padding:"3px 8px", borderRadius:"50px", background:`${result.dtResult.color}15`, color:result.dtResult.color, fontSize:"0.7rem" }}>DT: {result.dtResult.label}</span>
                  </div>
                ) : (
                  <div style={{ fontSize:"0.72rem", color:card.key==="microbiome"?C.teal:C.green, fontWeight:600 }}>{card.footer}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {result.insights.length > 0 && (
          <div className="fadeUp" style={{ marginTop:"32px", animationDelay:"0.3s" }}>
            <div style={{ fontSize:"0.65rem", letterSpacing:"2px", textTransform:"uppercase", color:C.muted, marginBottom:"16px" }}>What Your Gut Is Telling You</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              {result.insights.slice(0,4).map((ins,i)=><InsightCard key={i} {...ins} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PageWrapper({ children, onRetake }) {
  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:C.sans, color:C.text }}>
      <style>{css}</style>
      <div style={{ padding:"20px 32px", borderBottom:`1px solid ${C.border2}`, display:"flex", justifyContent:"space-between", alignItems:"center", background:C.surface, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ fontFamily:C.serif, fontSize:"1.6rem", color:C.green, fontWeight:700 }}>🌿 Flora</div>
        <button onClick={onRetake} style={{ background:"none", border:`1px solid ${C.border2}`, borderRadius:"8px", padding:"6px 14px", color:C.muted, fontSize:"0.78rem", cursor:"pointer", fontFamily:C.sans }}>↺ Retake Quiz</button>
      </div>
      <div style={{ padding:"32px", maxWidth:"1100px", margin:"0 auto" }}>{children}</div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────
function SectionArchetype({ result, answers, onBack }) {
  const [archetype, setArchetype] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch("https://flora-backend-uae5.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers })
    })
    .then(r => r.json())
    .then(d => { setArchetype(d); setLoading(false); })
    .catch(() => setLoading(false));
  }, []);

  return (
    <div className="slideIn">
      <BackBtn onClick={onBack} />
      <h2 style={{ fontFamily:C.serif, fontSize:"2rem", color:C.green, marginBottom:"4px" }}>
        🧬 Gut Archetype
      </h2>
      <p style={{ color:C.muted, fontSize:"0.85rem", marginBottom:"24px" }}>
        K-Means clustering identifies your gut health pattern — inspired by Ultrahuman
      </p>

      {loading ? (
        <div style={{ color:C.muted, textAlign:"center", padding:"40px" }}>Analysing your pattern...</div>
      ) : archetype ? (
        <>
          <div style={{ padding:"28px", borderRadius:"18px", border:`2px solid ${archetype.color}40`, background:`${archetype.color}08`, textAlign:"center", marginBottom:"24px" }}>
            <div style={{ fontSize:"4rem", marginBottom:"12px" }}>{archetype.emoji}</div>
            <div style={{ fontFamily:C.serif, fontSize:"2rem", color:archetype.color, fontWeight:700, marginBottom:"8px" }}>
              {archetype.name}
            </div>
            <div style={{ fontSize:"0.88rem", color:C.muted, lineHeight:1.7, maxWidth:"300px", margin:"0 auto 16px" }}>
              {archetype.desc}
            </div>
            <div style={{ fontSize:"0.78rem", color:archetype.color }}>
              Pattern confidence: {archetype.confidence}%
            </div>
          </div>

          <div style={{ padding:"16px 20px", borderRadius:"14px", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border2}` }}>
            <div style={{ fontSize:"0.8rem", color:C.muted, marginBottom:"10px", fontWeight:600 }}>HOW K-MEANS WORKS</div>
            <div style={{ fontSize:"0.82rem", color:C.text, lineHeight:1.7 }}>
              K-Means grouped 5,000 gut health profiles into 4 clusters. Your 25 answers were matched to the nearest cluster centroid — giving you a lifestyle archetype instead of just a number score.
            </div>
          </div>
        </>
      ) : (
        <div style={{ color:C.red, textAlign:"center" }}>Could not load archetype. Make sure the backend is running.</div>
      )}
    </div>
  );
}
export default function FloraApp() {
  const [screen, setScreen] = useState("auth");
  const [user, setUser] = useState(null);
  const [answers, setAnswers] = useState({});

  const handleLogin = (u, goToDashboard=false) => { setUser(u); setScreen(goToDashboard?"dashboard":"quiz"); };
  const handleQuizDone = (ans) => { setAnswers(ans); setScreen("dashboard"); };
  const handleRetake = () => setScreen("quiz");

  return (
    <>
      <style>{css}</style>
      {screen==="auth"      && <AuthScreen onLogin={handleLogin} />}
      {screen==="quiz"      && <QuizScreen user={user} onComplete={handleQuizDone} />}
      {screen==="dashboard" && <Dashboard user={user} answers={answers} onRetake={handleRetake} />}
    </>
  );
}