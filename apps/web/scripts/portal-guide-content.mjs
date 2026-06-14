/**
 * Trilingual Word guide content for Agent and Regional Head portals.
 */

import { AGENT_GUIDE_STEPS } from "./agent-guide-steps.mjs";

export { AGENT_GUIDE_STEPS };

export const AGENT_GUIDE_META = {
  en: {
    fileName: "trimma-agent-guide-en.docx",
    coverTitle: "Trimma Agent Portal Guide",
    coverSubtitle: "Field Agent Handbook — Onboard Salons & Earn Commissions",
    coverTagline: "Complete walkthrough for Trimma field agents in Sri Lanka",
    footer: "© Trimma — The Salon Engine · trimma.io · agents@trimma.com",
    stepsLabel: "Step",
    tipLabel: "Pro tip",
    screenLabel: "Screen",
  },
  si: {
    fileName: "trimma-agent-guide-si.docx",
    coverTitle: "ට්‍රිම්මා Agent Portal මාර්ගෝපදේශය",
    coverSubtitle: "Field Agent Handbook — සැලුන් Onboard කර Commissions උපයන්න",
    coverTagline: "ශ්‍රී ලංකා Trimma field agents සඳහා සම්පූර්ණ මාර්ගෝපදේශය",
    footer: "© Trimma — The Salon Engine · trimma.io · agents@trimma.com",
    stepsLabel: "පියවර",
    tipLabel: "උපදෙස්",
    screenLabel: "තිරය",
  },
  ta: {
    fileName: "trimma-agent-guide-ta.docx",
    coverTitle: "ட்ரிம்மா Agent Portal வழிகாட்டி",
    coverSubtitle: "Field Agent Handbook — சலூன்களை Onboard செய்து Commissions சம்பாதிக்கவும்",
    coverTagline: "இலங்கை ட்ரிம்மா field agents க்கான முழுமையான வழிகாட்டி",
    footer: "© Trimma — The Salon Engine · trimma.io · agents@trimma.com",
    stepsLabel: "படி",
    tipLabel: "உதவிக்குறிப்பு",
    screenLabel: "திரை",
  },
};

export const REGIONAL_HEAD_GUIDE_META = {
  en: {
    fileName: "trimma-regional-head-guide-en.docx",
    coverTitle: "Trimma Regional Head Portal Guide",
    coverSubtitle: "Regional Head Handbook — Lead Agents & Grow Your Territory",
    coverTagline: "Complete walkthrough for Trimma regional heads in Sri Lanka",
    footer: "© Trimma — The Salon Engine · trimma.io · agents@trimma.com",
    stepsLabel: "Step",
    tipLabel: "Pro tip",
    screenLabel: "Screen",
  },
  si: {
    fileName: "trimma-regional-head-guide-si.docx",
    coverTitle: "ට්‍රිම්මා Regional Head Portal මාර්ගෝපදේශය",
    coverSubtitle: "Regional Head Handbook — Agents නිලවත් කර Territory වර්ධනය කරන්න",
    coverTagline: "ශ්‍රී ලංකා Trimma regional heads සඳහා සම්පූර්ණ මාර්ගෝපදේශය",
    footer: "© Trimma — The Salon Engine · trimma.io · agents@trimma.com",
    stepsLabel: "පියවර",
    tipLabel: "උපදෙස්",
    screenLabel: "තිරය",
  },
  ta: {
    fileName: "trimma-regional-head-guide-ta.docx",
    coverTitle: "ட்ரிம்மா Regional Head Portal வழிகாட்டி",
    coverSubtitle: "Regional Head Handbook — Agents ஐ வழிநடத்தி Territory வளர்க்கவும்",
    coverTagline: "இலங்கை ட்ரிம்மா regional heads க்கான முழுமையான வழிகாட்டி",
    footer: "© Trimma — The Salon Engine · trimma.io · agents@trimma.com",
    stepsLabel: "படி",
    tipLabel: "உதவிக்குறிப்பு",
    screenLabel: "திரை",
  },
};

/** @type {Record<'en'|'si'|'ta', Array<{ title: string; body: string; tip?: string; screen?: string }>>} */
export const REGIONAL_HEAD_GUIDE_STEPS = {
  en: [
    { title: "Sign in to the Regional Head Portal", body: "Go to trimma.io/agent/login (same login as agents). Use your regional head email and password. After login you are redirected to /regional-head — your dedicated portal.", screen: "Agent login → Regional Head portal" },
    { title: "Regional Head role & responsibilities", body: "You lead a team of sub-agents in your province/district. You: onboard salons directly (same tools as agents), coach sub-agents, set commission split percentages, monitor team performance, and earn commissions on your own referred salons plus oversight of team activity.", tip: "You have all agent tools PLUS My Team management." },
    { title: "Portal layout", body: "Dark sidebar: Dashboard, Profile, Help under Overview. Salons section: My Salons, Territory Explorer, Add Manual Lead, Salon Creation, Salon Approval. Performance: Commissions, My Team. Mobile bottom nav mirrors key pages.", screen: "Regional Head sidebar" },
    { title: "Dashboard (Agent Cockpit)", body: "Same cockpit as agents but scoped to your regional portfolio — assigned salons, live count, earnings, and priorities across your territory and team.", screen: "Regional Head dashboard" },
    { title: "My Team", body: "View all sub-agents assigned under you. See each agent's salon count, live salons, booking volume, and earnings. Set commission split % (0–100) — the share of their commission that goes to the sub-agent vs retained by regional structure. Save per agent.", tip: "Review team splits monthly and align with Trimma admin commission policy.", screen: "My Team table with split % editor" },
    { title: "Coaching your agents", body: "Use My Salons and Salon Creation to monitor team pipeline health. Follow up when agents stall at Owner invited or Owner activated. Share this guide with new sub-agents and verify their Field Editor quality before admin submission.", screen: "Team performance overview" },
    { title: "My Salons", body: "Full roster of salons in your regional scope — yours and your team's referred salons. Filter, search, manage Field Editor, view live listings.", screen: "My Salons" },
    { title: "Territory Explorer", body: "Map discovery across your assigned territories. Export leads CSV and assign field visit plans for yourself and sub-agents.", screen: "Territory Explorer" },
    { title: "Add Manual Lead & Salon Creation", body: "Same workflow as agents: create manual leads, process Google leads, complete 5-section Field Editor, invite owners.", screen: "Salon Creation hub" },
    { title: "Field Editor & owner invitation", body: "Verify salon data on site. Complete all 5 sections. Send Invitation to owner Gmail. Resend if owner has not activated within 48 hours.", screen: "Field Editor" },
    { title: "Salon Approval & admin submission", body: "When owner activates, review on Salon Approval page. Enable Booking & Send to Admin when profile is complete.", screen: "Salon Approval queue" },
    { title: "Commissions", body: "Your personal referral ledger: booking commissions + subscription rewards. Week navigation, per-booking detail, all-time volume. Team agent earnings are visible on My Team.", screen: "Commissions ledger" },
    { title: "My Profile", body: "Update photo, name, phone. Email and territories are admin-managed. Role shows Regional Head.", screen: "Profile page" },
    { title: "Full onboarding pipeline", body: "Assigned → Field verified → Owner invited → Owner activated → Pending admin verification → Live/Verified. Ensure every salon in your region progresses through each stage without stalling.", screen: "Status pipeline" },
    { title: "Support & escalation", body: "Territory assignment issues, commission disputes, or blocked admin approvals: email agents@trimma.com. Include salon name and booking reference.", screen: "Support contacts" },
  ],
  si: [
    { title: "Regional Head Portal වෙත Sign in", body: "trimma.io/agent/login වෙත යන්න. Regional head email + password භාවිතා කර /regional-head වෙත redirect වේ.", screen: "Login" },
    { title: "Regional Head role සහ වගකීම්", body: "Sub-agents කණ්ඩායම නිලවත් කරන්න, සැලුන් onboard කරන්න, commission splits set කරන්න, team performance monitor කරන්න.", tip: "Agent tools + My Team management." },
    { title: "Portal layout", body: "Sidebar: Dashboard, Profile, Help, Salons tools, Commissions, My Team.", screen: "Sidebar" },
    { title: "Dashboard", body: "Regional portfolio KPIs — salons, earnings, priorities.", screen: "Dashboard" },
    { title: "My Team", body: "Sub-agents list, salon counts, earnings, commission split % set කර Save කරන්න.", tip: "Splits මාසිකව review කරන්න.", screen: "My Team" },
    { title: "Agents coach කිරීම", body: "Pipeline health monitor කර Field Editor quality verify කරන්න.", screen: "Team coaching" },
    { title: "My Salons", body: "Regional scope හි සියලු සැලුන් — ඔබේ සහ team සැලුන්.", screen: "My Salons" },
    { title: "Territory Explorer", body: "Map discovery සහ CSV export.", screen: "Territory Explorer" },
    { title: "Manual Lead & Salon Creation", body: "Agents හා සමාන workflow.", screen: "Salon Creation" },
    { title: "Field Editor & owner invitation", body: "5 sections සම්පූර්ණ කර owner ආරාධනා කරන්න.", screen: "Field Editor" },
    { title: "Salon Approval", body: "Owner activated පසු review කර admin වෙත submit කරන්න.", screen: "Approval" },
    { title: "Commissions", body: "Personal ledger + team earnings My Team හි.", screen: "Commissions" },
    { title: "My Profile", body: "Photo, name, phone update.", screen: "Profile" },
    { title: "Onboarding pipeline", body: "Assigned → Verified දක්වා සෑම stage එකම complete කරන්න.", screen: "Pipeline" },
    { title: "Support", body: "agents@trimma.com — territory, commission, approval issues.", screen: "Support" },
  ],
  ta: [
    { title: "Regional Head Portal Sign in", body: "trimma.io/agent/login — regional head email + password. /regional-head க்கு redirect.", screen: "Login" },
    { title: "Regional Head பாத்திரம்", body: "Sub-agents குழுவை வழிநடத்துங்கள், salons onboard செய்யுங்கள், commission splits set செய்யுங்கள்.", tip: "Agent tools + My Team." },
    { title: "Portal layout", body: "Sidebar: Dashboard, Profile, Help, Salons, Commissions, My Team.", screen: "Sidebar" },
    { title: "Dashboard", body: "Regional KPIs — salons, earnings, priorities.", screen: "Dashboard" },
    { title: "My Team", body: "Sub-agents list, commission split % set செய்து Save.", tip: "Splits மாதாந்திர review.", screen: "My Team" },
    { title: "Agents ஐ coach செய்தல்", body: "Pipeline health monitor, Field Editor quality verify.", screen: "Coaching" },
    { title: "My Salons", body: "Regional scope salons — yours + team.", screen: "My Salons" },
    { title: "Territory Explorer", body: "Map discovery + CSV export.", screen: "Territory Explorer" },
    { title: "Salon Creation", body: "Agents போன்ற workflow.", screen: "Salon Creation" },
    { title: "Field Editor & invitation", body: "5 sections + owner invite.", screen: "Field Editor" },
    { title: "Salon Approval", body: "Owner activated பிறகு admin submit.", screen: "Approval" },
    { title: "Commissions", body: "Personal ledger + team on My Team.", screen: "Commissions" },
    { title: "My Profile", body: "Photo, name, phone update.", screen: "Profile" },
    { title: "Pipeline", body: "Assigned → Verified வரை ஒவ்வொரு stage-உம்.", screen: "Pipeline" },
    { title: "Support", body: "agents@trimma.com", screen: "Support" },
  ],
};
