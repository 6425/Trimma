/**
 * Comprehensive trilingual Agent Portal guide steps (EN, SI, TA).
 */

export const AGENT_GUIDE_STEPS = {
  en: [
    {
      title: "Sign in to the Agent Portal",
      body: "Open trimma.io/agent/login on your phone or laptop. Enter the email and password Trimma admin gave you. Salon owners and customers sign in with Google — field agents use email and password only. After login you land on the Agent Cockpit (Dashboard).",
      screen: "Agent login — email + password",
    },
    {
      title: "Your role as a Trimma Field Agent",
      body: "You are Trimma's on-the-ground partner in Sri Lanka. Your job is to discover salons in your assigned territories, visit them in person, verify accurate business information, invite owners to activate their Trimma salon account, enable bookings, and submit complete profiles for admin approval. You earn booking commissions and subscription conversion rewards on every salon you successfully onboard.",
      tip: "Work only in territories assigned to you. You cannot see salons outside your assignment.",
    },
    {
      title: "Professional standards",
      body: "Always visit the salon before submitting data. Use the owner's real Gmail (not yours). Confirm WhatsApp numbers with the owner. Be honest in agent notes. Do not promise commission rates that differ from your Trimma tier. Dress professionally and represent Trimma as a trusted national platform.",
      tip: "First impressions matter — owners trust agents who know the product and follow the process.",
    },
    {
      title: "Portal navigation",
      body: "Desktop: dark sidebar with Overview (Dashboard, Profile, Agent Help), Salons (My Salons, Territory Explorer, Add Manual Lead, Salon Creation, Salon Approval), and Performance (Commissions). Mobile: bottom nav for Home, Salons, Editor, and Profile. Header has search and notifications.",
      screen: "Agent sidebar + mobile bottom nav",
    },
    {
      title: "Agent Cockpit (Dashboard)",
      body: "Start every workday here. Review KPI cards: Assigned Salons, In Progress, Live Salons, and Total Earnings. Check Today's Priorities, Recent Assigned Salons, Territory Explorer shortcut, Referral Earnings, and Salons Needing Action. Use View Lead Sheet to jump to Salon Creation.",
      screen: "Agent Cockpit — KPI cards and priorities",
    },
    {
      title: "Understanding KPI cards",
      body: "Assigned Salons = total salons linked to you. In Progress = not yet live on marketplace. Live Salons = AGENT_APPROVED or VERIFIED — can receive bookings. Total Earnings = booking commissions + subscription conversion rewards recorded in your ledger.",
      screen: "Dashboard KPI row",
    },
    {
      title: "My Salons — your salon roster",
      body: "Open My Salons to see every business assigned to you. Summary cards show Total, In progress, Needs action, and Live counts. The table lists salon name, status badge, contact, owner Gmail, subscription plan, and actions.",
      screen: "My Salons table",
    },
    {
      title: "My Salons — filters and search",
      body: "Filter tabs: All · In progress · Needs action · Live. Search by salon name, phone, owner Gmail, address, or category. Click Manage to open the Field Editor. Click View on live salons to see the public marketplace listing. Use Add Salon to create a manual lead.",
      tip: "Needs action = Assigned, Field verified, or Owner invited — follow up with the owner today.",
    },
    {
      title: "Status badges explained",
      body: "Assigned = new lead, needs Field Editor. Field verified = you confirmed data on site. Owner invited = email + WhatsApp sent. Owner activated = owner logged in and completed profile. Pending admin verification = you submitted to admin. Live/Verified = public on marketplace. Rejected = needs admin review.",
      screen: "Status badges on My Salons",
    },
    {
      title: "Territory Explorer — discover leads",
      body: "Map tool to find businesses not yet on Trimma. Select Business Category, your Assigned Territory, and Results to Show (10–250). Click Search Businesses. Results appear in the sidebar with name, category, address, phone, and rating. Export CSV for field visit planning.",
      tip: "If no territories appear, contact Trimma admin to assign your district.",
      screen: "Territory Explorer map + sidebar",
    },
    {
      title: "Territory Explorer — field visit workflow",
      body: "Export results, plan your route, visit salons in person, confirm the owner is interested, then either wait for admin to assign the Google lead or create an Add Manual Lead yourself. Refresh Map to reload boundaries. Use fullscreen on mobile for navigation.",
      screen: "Export CSV + map fullscreen",
    },
    {
      title: "Google Leads vs Manual Salon Leads",
      body: "Google Leads are salons Trimma admin assigns from territory discovery — they appear on Salon Creation under the Google Leads tab. Manual Salon Leads are businesses you add via Add Manual Lead when you find them in the field. Both use the same Field Editor and onboarding pipeline.",
      screen: "Salon Creation — Google + Manual tabs",
    },
    {
      title: "Add Manual Lead — complete the form",
      body: "Use when you discover a salon in the field. Fill in: salon name, category (max 2), full address, WhatsApp (+94), owner Gmail, optional website and summary. Add up to 6 services with price and duration. Add up to 2 staff via Add Professional. Select amenities. Save as Draft or Send to Salon Owner for Review.",
      screen: "Add Manual Lead form",
    },
    {
      title: "Salon Creation hub",
      body: "Your Field Editor command centre. Stats show My Salons, Verified, and Owner Invited counts. Google Leads tab: Assigned · Published · Invited sub-tabs with lead cards showing completion %. Salon Leads tab: your manual entries. Click any card or use /agent/leads?open={id} to auto-open Field Editor.",
      screen: "Salon Creation hub",
    },
    {
      title: "Field Editor — Section 1: Salon & Owner Details",
      body: "Verify salon name, category, full address, WhatsApp, owner Gmail, hero image, and business summary. Hero image should be a clear front-of-shop or interior photo. Owner Gmail must be the account they will use to sign in with Google.",
      screen: "Field Editor Section 1",
    },
    {
      title: "Field Editor — Section 2: Agent Field Data",
      body: "Add internal agent notes (manager name, visit date, interest level). Set working hours OPEN/CLOSED for each day — these drive booking slots when live. Add map coordinates or Google Maps link and latitude/longitude if available.",
      tip: "Accurate hours prevent customer booking complaints after go-live.",
      screen: "Field Editor Section 2",
    },
    {
      title: "Field Editor — Section 3: Included Services",
      body: "Add up to 6 services with name, price (LKR), and duration (minutes). Match what the salon actually offers. Example: Classic Haircut LKR 750, 30 min. Services appear on the marketplace when the salon goes live.",
      screen: "Field Editor Section 3",
    },
    {
      title: "Field Editor — Section 4: Add Staff",
      body: "Add up to 2 professionals with name, photo, role, and schedule. Customers can pick a stylist when booking. If the salon has one main stylist, add them here.",
      screen: "Field Editor Section 4",
    },
    {
      title: "Field Editor — Section 5: Amenities & Facilities",
      body: "Check amenities that apply: AC, parking, WiFi, card payment, wheelchair access, kids area, etc. Add quantity where relevant. Accurate amenities help customers choose the right salon.",
      screen: "Field Editor Section 5",
    },
    {
      title: "Save, invite, and resend",
      body: "Save — stores draft without changing status. Send to Salon Owner for Review — requires phone + owner Gmail. Send Invitation — moves status to Owner invited; owner gets email + WhatsApp. Resend Invitation — if owner has not activated within 48 hours.",
      tip: "Never send invitation without visiting the salon and confirming the owner wants Trimma.",
      screen: "Field Editor action buttons",
    },
    {
      title: "Owner activation — what happens next",
      body: "The owner clicks the invite link, signs in with Google using the Gmail you entered, and completes their salon dashboard profile (bank details, branding, extra services). Status changes to Owner activated. You will see this on My Salons and Salon Approval.",
      screen: "Owner activated status badge",
    },
    {
      title: "Salon Approval queue",
      body: "When status is Owner activated, the salon appears on Salon Approval. Review owner contact, services, bank details, and branding on the approval page. Your main action is in Field Editor: Enable Booking & Send to Admin when the profile is complete and accurate.",
      screen: "Salon Approval — Pending Review",
    },
    {
      title: "Enable booking and submit to admin",
      body: "In Field Editor, when owner has activated and profile looks complete, click Enable Booking & Send to Admin. This enables the booking calendar and queues the salon for Trimma platform admin verification. Status becomes Pending admin verification.",
      screen: "Enable Booking & Send to Admin button",
    },
    {
      title: "Admin verification to live salon",
      body: "Trimma admin reviews the listing for quality and compliance. When approved, status becomes Verified and the salon is public on trimma.io marketplace. Customers can search, book, pay deposit, and leave reviews. You earn commissions on bookings at this salon.",
      screen: "Verified / Live status",
    },
    {
      title: "Commissions — booking and subscription",
      body: "Open Commissions for your weekly referral ledger. See booking commission % and subscription conversion % at the top. Navigate weeks, view Booking Commissions (per completed/confirmed booking with reservation fee) and Subscription Commissions (conversion reward when referred salon pays Trimma subscription).",
      screen: "Commissions ledger",
    },
    {
      title: "Dynamic Work Queue",
      body: "Prioritized tasks from real salon states: owner follow-ups, stalled onboarding, commission alerts. Tabs: All Work · Leads · Salons · Commissions · Alerts. HIGH priority = urgent owner follow-up. Click recommended action to jump to the right page. Refresh Sync to reload.",
      screen: "Work Queue tabs",
    },
    {
      title: "My Profile",
      body: "Update profile photo (500×500 crop), full name, and phone (+947, 8 digits). Email and Assigned Territories are set by admin and read-only. Role shows Field Agent. Keep phone current — owners and admin may contact you.",
      screen: "Agent profile page",
    },
    {
      title: "Full onboarding pipeline",
      body: "Assigned → Field verified → Owner invited → Owner activated → Pending admin verification → Live/Verified. Track every salon through each stage without stalling. Rejected salons need admin follow-up — do not re-invite without admin guidance.",
      screen: "Pipeline flow diagram",
    },
    {
      title: "Common mistakes to avoid",
      body: "Wrong owner Gmail (owner cannot log in). Missing services or zero prices. Skipping field visit. Sending invitation before owner agrees. Incorrect working hours. Forgetting to follow up at Owner invited stage. Submitting incomplete profiles to admin.",
      tip: "Use the checklist on Salon Creation cards — aim for 100% completion before inviting.",
    },
    {
      title: "Support and escalation",
      body: "Territory not assigned, commission disputes, blocked admin approvals, or technical issues: email agents@trimma.com with salon name, owner Gmail, and screenshot. WhatsApp Agent Support Line for urgent field issues. Read Agent Help in the portal for the full interactive guide and Word downloads in English, Sinhala, and Tamil.",
      screen: "Support contacts",
    },
  ],
  si: [
    {
      title: "Agent Portal වෙත Sign in කරන්න",
      body: "trimma.io/agent/login වෙත යන්න. Trimma admin ලබා දුන් email සහ password ඇතුළත් කරන්න. Salon owners සහ customers Google භාවිතා කරයි — field agents email/password පමණක්. Login වීමෙන් පසු Agent Cockpit (Dashboard) වෙත යයි.",
      screen: "Agent login",
    },
    {
      title: "Trimma Field Agent ලෙස ඔබගේ role",
      body: "ඔබ ශ්‍රී ලංකාවේ Trimma හි on-the-ground සහකාරයායි. Assigned territories හි සැලුන් සොයන්න, site එකේ verify කරන්න, owners ආරාධනා කරන්න, bookings enable කරන්න, admin වෙත submit කරන්න. සාර්ථකව onboard කළ සෑම salon එකකටම booking commissions සහ subscription rewards ලැබේ.",
      tip: "Admin assign කළ territories පමණක් වැඩ කරන්න.",
    },
    {
      title: "වෘත්තීය ප්‍රමිති",
      body: "Submit කිරීමට පෙර සැලුනට අනිවාර්යයෙන්ම පිවිසෙන්න. Owner ගේ සැබෑ Gmail භාවිතා කරන්න. WhatsApp number owner සමඟ confirm කරන්න. Agent notes හි සත්‍ය තොරතුරු ලියන්න. Trimma tier එකට අනුකූල commission rates පමණක් පොරොන්දු වන්න.",
      tip: "පළමු හැඟීම වැදගත් — process එක හොඳින් දන්න agents වෙත owners විශ්වාස කරයි.",
    },
    {
      title: "Portal navigation",
      body: "Desktop: dark sidebar — Overview (Dashboard, Profile, Agent Help), Salons (My Salons, Territory Explorer, Add Manual Lead, Salon Creation, Salon Approval), Performance (Commissions). Mobile: bottom nav — Home, Salons, Editor, Profile.",
      screen: "Sidebar + mobile nav",
    },
    {
      title: "Agent Cockpit (Dashboard)",
      body: "සෑම වැඩ දිනකම මෙතැන්ගෙන් ආරම්භ කරන්න. KPI cards, Today's Priorities, Recent Assigned Salons, Territory shortcut, Referral Earnings, Salons Needing Action බලන්න. View Lead Sheet මගින් Salon Creation වෙත යන්න.",
      screen: "Agent Cockpit",
    },
    {
      title: "KPI cards අර්ථ දැක්වීම",
      body: "Assigned Salons = ඔබට linked සැලුන්. In Progress = තවම live නොවූ. Live Salons = marketplace හි bookings ලබා ගත හැක. Total Earnings = booking + subscription commissions.",
      screen: "KPI cards",
    },
    {
      title: "My Salons — salon ලැයිස්තුව",
      body: "ඔබට assign කළ සියලු සැලුන් බලන්න. Summary cards සහ table එකේ name, status, contact, owner Gmail, subscription, actions ඇත.",
      screen: "My Salons",
    },
    {
      title: "My Salons — filters සහ search",
      body: "Filter: All · In progress · Needs action · Live. Name, phone, Gmail, address, category මගින් search කරන්න. Manage = Field Editor. View = live listing. Add Salon = manual lead.",
      tip: "Needs action = Assigned, Field verified, Owner invited — අදම owner follow-up කරන්න.",
    },
    {
      title: "Status badges",
      body: "Assigned → Field verified → Owner invited → Owner activated → Pending admin verification → Live/Verified. Rejected = admin follow-up අවශ්‍ය.",
      screen: "Status badges",
    },
    {
      title: "Territory Explorer — leads සොයන්න",
      body: "Map මත Trimma හි නැති businesses සොයන්න. Category, territory, result limit තෝරා Search Businesses ඔබන්න. Sidebar හි results. CSV export කර field visits සැලසුම් කරන්න.",
      tip: "Territories නැත්නම් admin වෙත සම්බන්ධ වන්න.",
      screen: "Territory Explorer",
    },
    {
      title: "Territory Explorer — field visits",
      body: "CSV export, route සැලසුම් කර, site එකට ගොස් owner interest confirm කරන්න. Admin Google lead assign කරන තුරු රැඳී සිටින්න හෝ Add Manual Lead සාදන්න.",
      screen: "CSV + map",
    },
    {
      title: "Google Leads vs Manual Leads",
      body: "Google Leads = admin assign කළ salons (Google Leads tab). Manual Leads = field එකේ ඔබ සොයා add කළ salons. දෙකම එකම Field Editor pipeline භාවිතා කරයි.",
      screen: "Salon Creation tabs",
    },
    {
      title: "Add Manual Lead — form සම්පූර්ණ කරන්න",
      body: "Name, category, address, WhatsApp, owner Gmail, website, summary. Services 6 දක්වා, staff 2 දක්වා, amenities. Save as Draft හෝ Send to Salon Owner for Review.",
      screen: "Add Manual Lead",
    },
    {
      title: "Salon Creation hub",
      body: "Field Editor command centre. Google Leads සහ Salon Leads tabs. Completion % සහ checklist. Card click කිරීමෙන් Field Editor විවෘත වේ.",
      screen: "Salon Creation",
    },
    {
      title: "Field Editor — කොටස 1: Salon & Owner",
      body: "Name, category, address, WhatsApp, owner Gmail, hero image, summary verify කරන්න. Owner Gmail = Google sign-in account.",
      screen: "Section 1",
    },
    {
      title: "Field Editor — කොටස 2: Agent Field Data",
      body: "Agent notes, working hours (OPEN/CLOSED), map link, coordinates. Hours = live වූ පසු booking slots.",
      tip: "නිවැරදි hours = customer complaints අඩු වේ.",
      screen: "Section 2",
    },
    {
      title: "Field Editor — කොටස 3: Services",
      body: "Services 6 දක්වා — name, price (LKR), duration. උදා: Classic Haircut LKR 750, 30 min.",
      screen: "Section 3",
    },
    {
      title: "Field Editor — කොටස 4: Staff",
      body: "Staff 2 දක්වා — name, photo, role, schedule. Customers booking වෙලාවට stylist තෝරයි.",
      screen: "Section 4",
    },
    {
      title: "Field Editor — කොටස 5: Amenities",
      body: "AC, parking, WiFi, card payment ආදිය tick කරන්න. Customers නිවැරදි තොරතුරු ලබා ගනී.",
      screen: "Section 5",
    },
    {
      title: "Save, invite, resend",
      body: "Save = draft. Send to Owner for Review = phone + Gmail අවශ්‍ය. Send Invitation = Owner invited. Resend = 48 පැයට activate නොවුවහොත්.",
      tip: "Owner Trimma එකට එකඟ වූ පසු පමණක් invite කරන්න.",
      screen: "Action buttons",
    },
    {
      title: "Owner activation",
      body: "Owner invite link click කර Google sign-in කර profile complete කරයි. Status = Owner activated. My Salons සහ Salon Approval හි දකින්න.",
      screen: "Owner activated",
    },
    {
      title: "Salon Approval queue",
      body: "Owner activated salons Pending Review ලැයිස්තුවේ. Services, bank, branding review කර Field Editor හි Enable Booking & Send to Admin භාවිතා කරන්න.",
      screen: "Salon Approval",
    },
    {
      title: "Enable booking & admin submit",
      body: "Enable Booking & Send to Admin = booking calendar on + admin queue. Status = Pending admin verification.",
      screen: "Enable Booking button",
    },
    {
      title: "Admin verification → Live",
      body: "Admin approve කළ පසු Verified — marketplace හි public. Customers book කර commissions ඔබට ලැබේ.",
      screen: "Verified status",
    },
    {
      title: "Commissions",
      body: "Weekly ledger — booking % සහ subscription %. Booking Commissions + Subscription Commissions. Week navigation සහ all-time volume.",
      screen: "Commissions",
    },
    {
      title: "Work Queue",
      body: "Prioritized tasks — follow-ups, stalled onboarding, alerts. HIGH = urgent. Recommended action click කර correct page වෙත යන්න.",
      screen: "Work Queue",
    },
    {
      title: "My Profile",
      body: "Photo, name, phone update. Email සහ territories admin-managed. Phone current තබා ගන්න.",
      screen: "Profile",
    },
    {
      title: "Onboarding pipeline",
      body: "Assigned → Field verified → Owner invited → Owner activated → Admin verification → Live/Verified. සෑම stage එකම stall නොකර complete කරන්න.",
      screen: "Pipeline",
    },
    {
      title: "වැළැක්විය යුතු දෝෂ",
      body: "වැරදි owner Gmail. Services/ prices missing. Field visit නොකිරීම. Owner එකඟතාවයින් පෙර invite. වැරදි working hours. Owner invited හි stall.",
      tip: "Salon Creation checklist — invite කිරීමට පෙර 100% completion.",
    },
    {
      title: "Support",
      body: "agents@trimma.com — territory, commission, approval issues. Salon name + owner Gmail එක් කරන්න. Agent Help හි full guide සහ EN/SI/TA Word downloads.",
      screen: "Support",
    },
  ],
  ta: [
    {
      title: "Agent Portal இல் Sign in செய்யுங்கள்",
      body: "trimma.io/agent/login திறக்கவும். Trimma admin வழங்கிய email மற்றும் password உள்ளிடவும். Salon owners மற்றும் customers Google பயன்படுத்துகிறார்கள் — agents email/password மட்டும். Login பிறகு Agent Cockpit (Dashboard) திறக்கும்.",
      screen: "Agent login",
    },
    {
      title: "Trimma Field Agent பாத்திரம்",
      body: "நீங்கள் இலங்கையில் Trimma இன் on-the-ground பங்குதாரர். Territories இல் salons கண்டறியுங்கள், site இல் verify செய்யுங்கள், owners ஐ invite செய்யுங்கள், bookings enable செய்யுங்கள், admin விற்கு submit செய்யுங்கள். வெற்றிகரமாக onboard செய்த salons இல் commissions கிடைக்கும்.",
      tip: "Admin assign செய்த territories மட்டுமே வேலை செய்யுங்கள்.",
    },
    {
      title: "தொழில்முறை தரநிலைகள்",
      body: "Submit செய்வதற்கு முன் salon ஐ நேரில் பார்வையிடுங்கள். Owner இன் உண்மையான Gmail பயன்படுத்துங்கள். WhatsApp எண்ணை confirm செய்யுங்கள். Agent notes இல் உண்மையான தகவல் எழுதுங்கள். Trimma tier க்கு ஏற்ப commission rates மட்டும் promise செய்யுங்கள்.",
      tip: "முதல் impression முக்கியம் — process ஐ அறிந்த agents ஐ owners நம்புவார்கள்.",
    },
    {
      title: "Portal navigation",
      body: "Desktop: dark sidebar — Overview (Dashboard, Profile, Agent Help), Salons (My Salons, Territory Explorer, Add Manual Lead, Salon Creation, Salon Approval), Performance (Commissions). Mobile: bottom nav — Home, Salons, Editor, Profile.",
      screen: "Sidebar + mobile nav",
    },
    {
      title: "Agent Cockpit (Dashboard)",
      body: "ஒவ்வொரு வேலை நாளும் இங்கிருந்து தொடங்குங்கள். KPI cards, Today's Priorities, Recent Salons, Territory shortcut, Earnings, Salons Needing Action பாருங்கள். View Lead Sheet மூலம் Salon Creation க்கு செல்லுங்கள்.",
      screen: "Agent Cockpit",
    },
    {
      title: "KPI cards விளக்கம்",
      body: "Assigned Salons = உங்களுக்கு linked salons. In Progress = இன்னும் live அல்ல. Live Salons = marketplace bookings. Total Earnings = booking + subscription commissions.",
      screen: "KPI cards",
    },
    {
      title: "My Salons — salon பட்டியல்",
      body: "உங்களுக்கு assign செய்யப்பட்ட அனைத்து salons. Summary cards மற்றும் table — name, status, contact, owner Gmail, subscription, actions.",
      screen: "My Salons",
    },
    {
      title: "My Salons — filters & search",
      body: "Filter: All · In progress · Needs action · Live. Name, phone, Gmail, address, category மூலம் search. Manage = Field Editor. View = live listing. Add Salon = manual lead.",
      tip: "Needs action = Assigned, Field verified, Owner invited — இன்றே owner follow-up.",
    },
    {
      title: "Status badges",
      body: "Assigned → Field verified → Owner invited → Owner activated → Pending admin verification → Live/Verified. Rejected = admin follow-up தேவை.",
      screen: "Status badges",
    },
    {
      title: "Territory Explorer — leads கண்டறிதல்",
      body: "Map இல் Trimma இல் இல்லாத businesses கண்டறியுங்கள். Category, territory, limit தேர்ந்தெடுத்து Search Businesses. Sidebar results. CSV export செய்து field visits திட்டமிடுங்கள்.",
      tip: "Territories இல்லையெனில் admin ஐ தொடர்பு கொள்ளுங்கள்.",
      screen: "Territory Explorer",
    },
    {
      title: "Territory Explorer — field visits",
      body: "CSV export, route plan, site visit, owner interest confirm. Admin Google lead assign செய்யும் வரை காத்திருக்கவும் அல்லது Add Manual Lead உருவாக்கவும்.",
      screen: "CSV + map",
    },
    {
      title: "Google Leads vs Manual Leads",
      body: "Google Leads = admin assign (Google Leads tab). Manual Leads = field இல் நீங்கள் add செய்தவை. இரண்டும் ஒரே Field Editor pipeline.",
      screen: "Salon Creation tabs",
    },
    {
      title: "Add Manual Lead — form பூர்த்தி",
      body: "Name, category, address, WhatsApp, owner Gmail, website, summary. Services 6 வரை, staff 2 வரை, amenities. Save as Draft அல்லது Send to Salon Owner for Review.",
      screen: "Add Manual Lead",
    },
    {
      title: "Salon Creation hub",
      body: "Field Editor command centre. Google Leads + Salon Leads tabs. Completion % மற்றும் checklist. Card click = Field Editor open.",
      screen: "Salon Creation",
    },
    {
      title: "Field Editor — பிரிவு 1: Salon & Owner",
      body: "Name, category, address, WhatsApp, owner Gmail, hero image, summary verify. Owner Gmail = Google sign-in account.",
      screen: "Section 1",
    },
    {
      title: "Field Editor — பிரிவு 2: Agent Field Data",
      body: "Agent notes, working hours (OPEN/CLOSED), map link, coordinates. Hours = live பிறகு booking slots.",
      tip: "சரியான hours = customer complaints குறைவு.",
      screen: "Section 2",
    },
    {
      title: "Field Editor — பிரிவு 3: Services",
      body: "Services 6 வரை — name, price (LKR), duration. எ.கா: Classic Haircut LKR 750, 30 min.",
      screen: "Section 3",
    },
    {
      title: "Field Editor — பிரிவு 4: Staff",
      body: "Staff 2 வரை — name, photo, role, schedule. Customers booking இல் stylist தேர்வு.",
      screen: "Section 4",
    },
    {
      title: "Field Editor — பிரிவு 5: Amenities",
      body: "AC, parking, WiFi, card payment tick செய்யுங்கள். Customers சரியான தகவல் பெறுவர்.",
      screen: "Section 5",
    },
    {
      title: "Save, invite, resend",
      body: "Save = draft. Send to Owner for Review = phone + Gmail. Send Invitation = Owner invited. Resend = 48 மணி activate இல்லையெனில்.",
      tip: "Owner Trimma க்கு ஒப்புக்கொண்ட பிறகு மட்டும் invite.",
      screen: "Action buttons",
    },
    {
      title: "Owner activation",
      body: "Owner invite link click, Google sign-in, profile complete. Status = Owner activated. My Salons & Salon Approval இல் காணலாம்.",
      screen: "Owner activated",
    },
    {
      title: "Salon Approval queue",
      body: "Owner activated salons Pending Review. Services, bank, branding review. Field Editor இல் Enable Booking & Send to Admin.",
      screen: "Salon Approval",
    },
    {
      title: "Enable booking & admin submit",
      body: "Enable Booking & Send to Admin = booking on + admin queue. Status = Pending admin verification.",
      screen: "Enable Booking",
    },
    {
      title: "Admin verification → Live",
      body: "Admin approve பிறகு Verified — marketplace public. Customers book, commissions உங்களுக்கு.",
      screen: "Verified",
    },
    {
      title: "Commissions",
      body: "Weekly ledger — booking % & subscription %. Booking + Subscription Commissions. Week navigation & all-time volume.",
      screen: "Commissions",
    },
    {
      title: "Work Queue",
      body: "Prioritized tasks — follow-ups, stalled onboarding, alerts. HIGH = urgent. Recommended action click.",
      screen: "Work Queue",
    },
    {
      title: "My Profile",
      body: "Photo, name, phone update. Email & territories admin-managed. Phone current வைத்திருங்கள்.",
      screen: "Profile",
    },
    {
      title: "Onboarding pipeline",
      body: "Assigned → Field verified → Owner invited → Owner activated → Admin verification → Live/Verified. ஒவ்வொரு stage-உம் stall இல்லாமல்.",
      screen: "Pipeline",
    },
    {
      title: "தவிர்க்க வேண்டிய பிழைகள்",
      body: "தவறான owner Gmail. Services/prices missing. Field visit இல்லை. Owner ஒப்புதல் இல்லாமல் invite. தவறான hours. Owner invited இல் stall.",
      tip: "Salon Creation checklist — invite முன் 100% completion.",
    },
    {
      title: "Support",
      body: "agents@trimma.com — territory, commission, approval. Salon name + owner Gmail சேர்க்கவும். Agent Help இல் full guide & EN/SI/TA Word downloads.",
      screen: "Support",
    },
  ],
};
