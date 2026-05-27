import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "no" | "sv" | "da";

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  // Sidebar
  home: { en: "Home", no: "Hjem", sv: "Hem", da: "Hjem" },
  crm_leads: { en: "CRM & Leads", no: "CRM & Leads", sv: "CRM & Leads", da: "CRM & Leads" },
  commerce: { en: "Commerce", no: "Handel", sv: "Handel", da: "Handel" },
  system: { en: "System", no: "System", sv: "System", da: "System" },
  dashboard: { en: "Dashboard", no: "Oversikt", sv: "Översikt", da: "Kontrolpanel" },
  contacts: { en: "Contacts", no: "Kontakter", sv: "Kontakter", da: "Kontakter" },
  customers: { en: "Customers", no: "Kunder", sv: "Kunder", da: "Kunder" },
  suppliers: { en: "Suppliers", no: "Leverandører", sv: "Leverantörer", da: "Leverandører" },
  custom_types: { en: "Custom Types", no: "Egendefinerte typer", sv: "Anpassade typer", da: "Brugerdefinerede typer" },
  pipeline: { en: "Pipeline", no: "Salgstrakt", sv: "Säljpipeline", da: "Salgspipeline" },
  quotes: { en: "Quotes", no: "Tilbud", sv: "Offerter", da: "Tilbud" },
  invoices: { en: "Invoices", no: "Fakturaer", sv: "Fakturor", da: "Fakturaer" },
  products: { en: "Products", no: "Produkter", sv: "Produkter", da: "Produkter" },
  payments: { en: "Payments", no: "Betalinger", sv: "Betalningar", da: "Betalinger" },
  outreach: { en: "Outreach", no: "Utsendelser", sv: "Utskick", da: "Udsendelser" },
  reports: { en: "Reports", no: "Rapporter", sv: "Rapporter", da: "Rapporter" },
  settings: { en: "Settings", no: "Innstillinger", sv: "Inställningar", da: "Indstillinger" },
  
  // Dashboard
  welcome_back: { en: "Welcome back", no: "Velkommen tilbake", sv: "Välkommen tillbaka", da: "Velkommen tilbage" },
  good_morning: { en: "Good morning", no: "God morgen", sv: "God morgon", da: "Godmorgen" },
  good_afternoon: { en: "Good afternoon", no: "God ettermiddag", sv: "God eftermiddag", da: "God eftermiddag" },
  good_evening: { en: "Good evening", no: "God kveld", sv: "God kväll", da: "God aften" },
  proactive_briefing: { en: "Here is your proactive briefing and overview.", no: "Her er din proaktive orientering og oversikt.", sv: "Här är din proaktiva orientering och översikt.", da: "Her er din proaktive briefing og oversigt." },
  daily_briefing_chat: { en: "Your Daily Briefing Chat", no: "Din daglige brief-chat", sv: "Din dagliga brief-chatt", da: "Din daglige briefing-chat" },
  planning_your_day: { en: "Your AI Assistant is planning your day...", no: "AI-assistenten din planlegger dagen din...", sv: "Din AI-assistent planerar din dag...", da: "Din AI-assistent planlægger din dag..." },
  ask_anything: { en: "Ask me anything about your day...", no: "Spør meg om hva som helst om dagen din...", sv: "Fråga mig vad som helst om din dag...", da: "Spørg mig om hvad som helst om din dag..." },
  listening: { en: "Listening...", no: "Lytter...", sv: "Lyssnar...", da: "Lytter..." },
  todays_overview: { en: "here's what's happening today.", no: "her er hva som skjer i dag.", sv: "här är vad som händer idag.", da: "her er hvad der sker i dag." },
  total_revenue: { en: "Total Revenue", no: "Total Omsetning", sv: "Total Omsättning", da: "Total Omsætning" },
  total_customers: { en: "Total Customers", no: "Antall Kunder", sv: "Antal Kunder", da: "Antal Kunder" },
  active_invoices: { en: "Active Invoices", no: "Aktive Fakturaer", sv: "Aktiva Fakturor", da: "Aktive Fakturaer" },
  conversion_rate: { en: "Conversion Rate", no: "Konverteringsrate", sv: "Konverteringsgrad", da: "Konverteringsrate" },
  revenue_overview: { en: "Revenue Overview", no: "Omsetningsoversikt", sv: "Omsättningsöversikt", da: "Omsætningsoversigt" },
  ai_smart_insights: { en: "AI Smart Insights", no: "Smarte AI-innsikter", sv: "Smarta AI-insikter", da: "Smarte AI-indsigter" },
  lead_generation: { en: "Lead Generation", no: "Lead-generering", sv: "Lead-generering", da: "Lead-generering" },
  from_last_month: { en: "from last month", no: "fra forrige måned", sv: "från förra månaden", da: "fra sidste måned" },

  // Actions
  add_customer: { en: "Add Customer", no: "Legg til kunde", sv: "Lägg till kund", da: "Tilføj kunde" },
  add_supplier: { en: "Add Supplier", no: "Legg til leverandør", sv: "Lägg till leverantör", da: "Tilføj leverandør" },
  add_custom_type: { en: "Add Contact", no: "Legg til kontakt", sv: "Lägg till kontakt", da: "Tilføj kontakt" },
  create_invoice: { en: "Create Invoice", no: "Opprett faktura", sv: "Skapa faktura", da: "Opret faktura" },
  save: { en: "Save", no: "Lagre", sv: "Spara", da: "Gem" },
  cancel: { en: "Cancel", no: "Avbryt", sv: "Avbryt", da: "Annuller" },
  delete: { en: "Delete", no: "Slett", sv: "Radera", da: "Slet" },
  edit: { en: "Edit", no: "Rediger", sv: "Redigera", da: "Rediger" },
  search: { en: "Search", no: "Søk", sv: "Sök", da: "Søg" },
  export_csv: { en: "Export CSV", no: "Eksporter CSV", sv: "Exportera CSV", da: "Eksporter CSV" },

  // Auth
  sign_in: { en: "Sign In", no: "Logg inn", sv: "Logga in", da: "Log ind" },
  sign_out: { en: "Sign Out", no: "Logg ut", sv: "Logga ut", da: "Log ud" },
  email: { en: "Email", no: "E-post", sv: "E-post", da: "E-mail" },
  password: { en: "Password", no: "Passord", sv: "Lösenord", da: "Adgangskode" },

  // Customers
  name: { en: "Name", no: "Navn", sv: "Namn", da: "Navn" },
  company: { en: "Company", no: "Firma", sv: "Företag", da: "Virksomhed" },
  status: { en: "Status", no: "Status", sv: "Status", da: "Status" },
  phone: { en: "Phone", no: "Telefon", sv: "Telefon", da: "Telefon" },
  last_contact: { en: "Last Contact", no: "Siste kontakt", sv: "Senaste kontakt", da: "Sidste kontakt" },
  actions: { en: "Actions", no: "Handlinger", sv: "Åtgärder", da: "Handlinger" },
  active: { en: "Active", no: "Aktiv", sv: "Aktiv", da: "Aktiv" },
  lead: { en: "Lead", no: "Lead", sv: "Lead", da: "Lead" },
  inactive: { en: "Inactive", no: "Inaktiv", sv: "Inaktiv", da: "Inaktiv" },

  // Invoices
  amount: { en: "Amount", no: "Beløp", sv: "Belopp", da: "Beløb" },
  paid: { en: "Paid", no: "Betalt", sv: "Betald", da: "Betalt" },
  pending: { en: "Pending", no: "Venter", sv: "Väntar", da: "Afventer" },
  overdue: { en: "Overdue", no: "Forfalt", sv: "Förfallen", da: "Forfaldet" },
  
  // Quotes
  accepted: { en: "Accepted", no: "Akseptert", sv: "Accepterad", da: "Accepteret" },
  expired: { en: "Expired", no: "Utløpt", sv: "Utgått", da: "Udløbet" },
  
  // General UI
  new_invoice: { en: "New Invoice", no: "Ny faktura", sv: "Ny faktura", da: "Ny faktura" },
  new_quote: { en: "New Quote", no: "Nytt tilbud", sv: "Ny offert", da: "Nyt tilbud" },
  filters: { en: "Filters", no: "Filtre", sv: "Filter", da: "Filtre" },
  search_placeholder: { en: "Search...", no: "Søk...", sv: "Sök...", da: "Søg..." },
  no_results: { en: "No results match your search.", no: "Ingen resultater samsvarer med søket ditt.", sv: "Inga resultat matchar din sökning.", da: "Ingen resultater matcher din søgning." },
  create_first: { en: "Create your first one to get started.", no: "Opprett din første for å komme i gang.", sv: "Skapa din första för att komma igång.", da: "Opret din første for at komme i gang." },
  customer_details: { en: "Enter the customer's details below.", no: "Skriv inn kundens detaljer nedenfor.", sv: "Ange kundens uppgifter nedan.", da: "Indtast kundens detaljer nedenfor." },
  supplier_details: { en: "Enter the supplier's details below.", no: "Skriv inn leverandørens detaljer nedenfor.", sv: "Ange leverantörens uppgifter nedan.", da: "Indtast leverandørens detaljer nedenfor." },
  custom_type_details: { en: "Enter the contact's details below.", no: "Skriv inn kontaktens detaljer nedenfor.", sv: "Ange kontaktens uppgifter nedan.", da: "Indtast kontaktens detaljer nedenfor." },
  edit_customer: { en: "Edit Customer", no: "Rediger kunde", sv: "Redigera kund", da: "Rediger kunde" },
  edit_supplier: { en: "Edit Supplier", no: "Rediger leverandør", sv: "Redigera leverantör", da: "Rediger leverandør" },
  edit_custom_type: { en: "Edit Contact", no: "Rediger kontakt", sv: "Redigera kontakt", da: "Rediger kontakt" },

  // AI Assistant
  ai_assistant_title: { en: "CRM Agent", no: "CRM-agent", sv: "CRM-agent", da: "CRM-agent" },
  ai_assistant_placeholder: { en: "Ask me to create a customer...", no: "Be meg opprette en kunde...", sv: "Be mig skapa en kund...", da: "Bed mig om at oprette en kunde..." },
  ai_draft: { en: "AI Draft", no: "AI-utkast", sv: "AI-utkast", da: "AI-udkast" },
  welcome_message: { 
    en: "Hello! I'm your Aiappsy CRM assistant. I can help you manage customers, create invoices, and even send outreach messages. How can I help you today?", 
    no: "Hei! Jeg er din assistent i Aiappsy CRM. Jeg kan hjelpe deg med å håndtere kunder, opprette fakturaer og sende kampanjer. Hva kan jeg hjelpe deg med i dag?", 
    sv: "Hej! Jag är din assistent i Aiappsy CRM. Jag kan hjälpa dig att hantera kunder, skapa fakturor och skicka utskick. Vad kan jag hjälpa dig med idag?", 
    da: "Hej! Jeg er din assistent i Aiappsy CRM. Jeg kan hjælpe dig med at håndtere kunder, oprette fakturaer og udsende kampagner. Hvad kan jeg hjælpe dig med i dag?" 
  },
  thinking: { en: "Thinking...", no: "Tenker...", sv: "Tänker...", da: "Tænker..." },
  
  // Settings
  company_profile: { en: "Company Profile", no: "Firmaprofil", sv: "Företagsprofil", da: "Virksomhedsprofil" },
  company_profile_desc: { en: "Update your company information and branding.", no: "Oppdater firmainformasjon og merkevarebygging.", sv: "Uppdatera företagsinformation och varumärke.", da: "Opdater din virksomhedsinformation og branding." },
  company_name: { en: "Company Name", no: "Firmanavn", sv: "Företagsnamn", da: "Virksomhedsnavn" },
  website: { en: "Website", no: "Nettsted", sv: "Webbplats", da: "Hjemmeside" },
  save_changes: { en: "Save Changes", no: "Lagre endringer", sv: "Spara ändringar", da: "Gem ændringer" },
  notifications: { en: "Notifications", no: "Varslinger", sv: "Aviseringar", da: "Notifikationer" },
  notifications_desc: { en: "Configure how you receive alerts and updates.", no: "Konfigurer hvordan du mottar varsler og oppdateringer.", sv: "Konfigurera hur du tar emot varningar och uppdateringar.", da: "Konfigurer hvordan du modtager advarsler og opdateringer." },
  email_notifications: { en: "Email Notifications", no: "E-postvarslinger", sv: "E-postaviseringar", da: "E-mail notifikationer" },
  email_notifications_desc: { en: "Receive daily summaries and alerts via email.", no: "Motta daglige oppsummeringer og varsler via e-post.", sv: "Ta emot dagliga sammanfattningar och varningar via e-post.", da: "Modtag daglige resuméer og advarsler via e-mail." },
  push_notifications: { en: "Push Notifications", no: "Push-varslinger", sv: "Push-aviseringar", da: "Push-notifikationer" },
  push_notifications_desc: { en: "Get real-time updates in your browser.", no: "Få sanntidsoppdateringer i nettleseren din.", sv: "Få realtidsuppdateringar i din webbläsare.", da: "Få opdateringer i realtid i din browser." },
  enabled: { en: "Enabled", no: "Aktivert", sv: "Aktiverad", da: "Aktiveret" },
  disabled: { en: "Disabled", no: "Deaktivert", sv: "Inaktiverad", da: "Deaktiveret" },
  api_keys: { en: "API Keys", no: "API-nøkler", sv: "API-nycklar", da: "API-nøgler" },
  api_keys_desc: { en: "Manage your personal API keys for AI services.", no: "Administrer dine personlige API-nøkler for AI-tjenester.", sv: "Hantera dina personliga API-nycklar för AI-tjänster.", da: "Administrer dine personlige API-nøgler til AI-tjenester." },
  gemini_api_key: { en: "Gemini API Key", no: "Gemini API-nøkkel", sv: "Gemini API-nyckel", da: "Gemini API-nøgle" },
  gemini_api_key_desc: { en: "Used for AI insights and assistant features.", no: "Brukt for AI-innsikt og assistentfunksjoner.", sv: "Används för AI-insikter och assistentfunktioner.", da: "Bruges til AI-indsigt og assistentfunktioner." },
  smtp_settings: { en: "SMTP Settings", no: "SMTP-innstillinger", sv: "SMTP-inställningar", da: "SMTP-indstillinger" },
  smtp_settings_desc: { en: "Configure your own email server for outreach.", no: "Konfigurer din egen e-postserver for oppfølging.", sv: "Konfigurera din egen e-postserver för utskick.", da: "Konfigurer din egen e-mail-server til opsøgende arbejde." },
  smtp_host: { en: "SMTP Host", no: "SMTP-vert", sv: "SMTP-värd", da: "SMTP-vært" },
  smtp_port: { en: "SMTP Port", no: "SMTP-port", sv: "SMTP-port", da: "SMTP-port" },
  smtp_user: { en: "SMTP User", no: "SMTP-bruker", sv: "SMTP-användare", da: "SMTP-bruger" },
  smtp_pass: { en: "SMTP Password", no: "SMTP-passord", sv: "SMTP-lösenord", da: "SMTP-adgangskode" },
  use_gmail_defaults: { en: "Use Gmail Defaults", no: "Bruk Gmail-standarder", sv: "Använd Gmail-standarder", da: "Brug Gmail-standarder" },
  ai_model: { en: "AI Model", no: "AI-modell", sv: "AI-modell", da: "AI-model" },
  ai_model_desc: { en: "Choose which Gemini model to use for AI features.", no: "Velg hvilken Gemini-modell som skal brukes for AI-funksjoner.", sv: "Välj vilken Gemini-modell som ska användas för AI-funktioner.", da: "Vælg hvilken Gemini-model der skal bruges til AI-funktioner." },
  subscription_tier: { en: "Subscription Tier", no: "Abonnementsnivå", sv: "Abonnemangsnivå", da: "Abonnementsniveau" },
  free_tier: { en: "Free (No AI)", no: "Gratis (Uten AI)", sv: "Gratis (Utan AI)", da: "Gratis (Uden AI)" },
  pro_tier: { en: "Pro (AI Powered)", no: "Pro (Med AI)", sv: "Pro (Med AI)", da: "Pro (Med AI)" },
  upgrade_to_pro: { en: "Upgrade to Pro", no: "Oppgrader til Pro", sv: "Uppgradera till Pro", da: "Opgrader til Pro" },
  pro_features_desc: { en: "Unlock AI Assistant, Smart Insights, and Competitive Research.", no: "Lås opp AI-assistent, smarte innsikter og konkurranseanalyse.", sv: "Lås upp AI-assistent, smarta insikter och konkurrensanalys.", da: "Lås op for AI-assistent, smarte indsigter og konkurrenceanalyse." },
  byok_desc: { en: "Bring Your Own Key (BYOK) - You only pay for what you use.", no: "Bruk din egen nøkkel (BYOK) - Du betaler kun for det du bruker.", sv: "Använd din egen nyckel (BYOK) - Du betalar bara för det du använder.", da: "Brug din egen nøgle (BYOK) - Du betaler kun for det, du bruger." },
  current_plan: { en: "Current Plan", no: "Nåværende plan", sv: "Nuvarande plan", da: "Nuværende plan" },
  manage_subscription: { en: "Manage Subscription", no: "Administrer abonnement", sv: "Hantera abonnemang", da: "Administrer abonnement" },
  team_management: { en: "Team Management", no: "Teamadministrasjon", sv: "Teamhantering", da: "Teamledelse" },
  team_members: { en: "Team Members", no: "Teammedlemmer", sv: "Teammedlemmar", da: "Teammedlemmer" },
  invite_member: { en: "Invite Member", no: "Inviter medlem", sv: "Bjud in medlem", da: "Inviter medlem" },
  invite_desc: { en: "Send an invitation to join your organization.", no: "Send en invitasjon til å bli med i din organisasjon.", sv: "Skicka en inbjudan att gå med i din organisation.", da: "Send en invitation til at deltage i din organisation." },
  role: { en: "Role", no: "Rolle", sv: "Roll", da: "Rolle" },
  pending_invitations: { en: "Pending Invitations", no: "Ventende invitasjoner", sv: "Väntande inbjudningar", da: "Afventende invitationer" },
  member_limit_reached: { en: "Member limit reached for your plan.", no: "Medlemsgrensen er nådd for din plan.", sv: "Medlemsgränsen har uppnåtts för din plan.", da: "Medlemsgrænsen er nået for din plan." },
  
  // Products
  add_product: { en: "Add Product", no: "Legg til produkt", sv: "Lägg til produkt", da: "Tilføj produkt" },
  edit_product: { en: "Edit Product", no: "Rediger produkt", sv: "Redigera produkt", da: "Rediger produkt" },
  product_details: { en: "Enter the product details below.", no: "Skriv inn produktdetaljer nedenfor.", sv: "Ange produktuppgifter nedan.", da: "Indtast produktdetaljer nedenfor." },
  product_name: { en: "Product Name", no: "Produktnavn", sv: "Produktnamn", da: "Produktnavn" },
  category: { en: "Category", no: "Kategori", sv: "Kategori", da: "Kategori" },
  stock_level: { en: "Stock Level", no: "Lagerbeholdning", sv: "Lagernivå", da: "Lagerbeholdning" },
  description: { en: "Description", no: "Beskrivelse", sv: "Beskrivning", da: "Beskrivelse" },
  products_desc: { en: "Manage your product catalog and services.", no: "Administrer produktkatalog og tjenester.", sv: "Hantera din produktkatalog och tjänster.", da: "Administrer dit produktkatalog og tjenester." },
  price: { en: "Price", no: "Pris", sv: "Pris", da: "Pris" },
  available: { en: "Available", no: "Tilgjengelig", sv: "Tillgänglig", da: "Tilgængelig" },
  out_of_stock: { en: "Out of Stock", no: "Utsolgt", sv: "Slutsåld", da: "Udsolgt" },
  
  // Outreach
  outreach_desc: { en: "Manage your customer communications via Email and WhatsApp.", no: "Administrer kundekommunikasjon via e-post og WhatsApp.", sv: "Hantera din kundkommunikation via e-post och WhatsApp.", da: "Administrer din kundekommunikation via e-mail og WhatsApp." },
  total_sent: { en: "Total Sent", no: "Totalt sendt", sv: "Totalt skickat", da: "Total sendt" },
  email_outreach: { en: "Email Outreach", no: "E-postoppfølging", sv: "E-postuppsökande", da: "E-mail-opsøgende" },
  whatsapp_outreach: { en: "WhatsApp Outreach", no: "WhatsApp-oppfølging", sv: "WhatsApp-uppsökande", da: "WhatsApp-opsøgende" },
  communication_history: { en: "Communication History", no: "Kommunikasjonshistorikk", sv: "Kommunikationshistorik", da: "Kommunikationshistorik" },
  platform: { en: "Platform", no: "Plattform", sv: "Plattform", da: "Platform" },
  message_preview: { en: "Message Preview", no: "Forhåndsvisning", sv: "Förhandsgranskning", da: "Forhåndsvisning" },
  no_outreach_found: { en: "No outreach records found.", no: "Ingen oppfølgingsposter funnet.", sv: "Inga uppsökande poster hittades.", da: "Ingen opsøgende optegnelser fundet." },
  new_outreach: { en: "New Outreach", no: "Ny oppfølging", sv: "Nytt uppsökande", da: "Ny opsøgende" },
  send_new_message: { en: "Send New Message", no: "Send ny melding", sv: "Skicka nytt meddelande", da: "Send ny besked" },
  select_customer_placeholder: { en: "Select a customer", no: "Velg en kunde", sv: "Välj en kund", da: "Vælg en kunde" },
  subject: { en: "Subject", no: "Emne", sv: "Ämne", da: "Emne" },
  message: { en: "Message", no: "Melding", sv: "Meddelande", da: "Besked" },
  send_message: { en: "Send Message", no: "Send melding", sv: "Skicka meddelande", da: "Send besked" },
  search_history: { en: "Search history...", no: "Søk i historikk...", sv: "Sök i historik...", da: "Søg i historik..." },
  sent: { en: "Sent", no: "Sendt", sv: "Skickat", da: "Sendt" },
  just_now: { en: "Just now", no: "Akkurat nå", sv: "Just nu", da: "Lige nu" },
  customer: { en: "Customer", no: "Kunde", sv: "Kund", da: "Kunde" },
  
  // Settings
  settings_desc: { en: "Manage your account and application preferences.", no: "Administrer konto- og applikasjonsinnstillinger.", sv: "Hantera ditt konto och applikationsinställningar.", da: "Administrer din konto og applikationsindstillinger." },
  
  // Help
  help: { en: "Help", no: "Hjelp", sv: "Hjälp", da: "Hjælp" },
  user_guide: { en: "User Guide", no: "Brukermanual", sv: "Användarmanual", da: "Brugermanual" },
  help_dashboard_title: { en: "Dashboard", no: "Oversikt", sv: "Instrumentpanel", da: "Oversigt" },
  help_dashboard_content: { 
    en: "The dashboard is your command center. It gives you a bird's-eye view of your entire business through interactive charts and key metrics like total revenue, customer growth, and outstanding invoices. Use the 'AI Smart Insights' to instantly uncover hidden trends, identify at-risk customers, and get actionable recommendations based on your real-time data.",
    no: "Oversikten er ditt kontrollsenter. Den gir deg et fugleperspektiv av hele virksomheten gjennom interaktive diagrammer og nøkkeltall som total omsetning, kundevekst og utestående fakturaer. Bruk 'AI Smart Insights' til å umiddelbart avdekke skjulte trender, identifisere kunder i faresonen, og få handlingsrettede anbefalinger basert på sanntidsdataene dine.",
    sv: "Instrumentpanelen är din kontrollcentral. Den ger dig ett fågelperspektiv av hela din verksamhet genom interaktiva diagram och nyckeltal som totala intäkter, kundtillväxt och utestående fakturor. Använd 'AI Smart Insights' för att direkt upptäcka dolda trender, identifiera kunder i riskzonen och få konkreta rekommendationer baserat på dina realtidsdata.",
    da: "Oversigten er dit kontrolcenter. Den giver dig et fugleperspektiv over hele din forretning gennem interaktive diagrammer og nøgletal som samlet omsætning, kundevækst og udestående fakturaer. Brug 'AI Smart Insights' til øjeblikkeligt at afdække skjulte tendenser, identificere kunder i risikozonen og få handlingsrettede anbefalinger baseret på dine realtidsdata."
  },
  help_pipeline_title: { en: "Pipeline", no: "Salgstrakt", sv: "Försäljningstratt", da: "Salgstragt" },
  help_pipeline_content: {
    en: "The Pipeline gives you a visual drag-and-drop representation of your sales process. Move leads and deals through stages from initial contact to won or lost. This helps you quickly see where your opportunities are and what actions to take next.",
    no: "Salgsrøret gir deg en visuell dra-og-slipp-representasjon av salgsprosessen din. Flytt leads og avtaler gjennom stadier fra første kontakt til vunnet eller tapt. Dette hjelper deg raskt å se hvor mulighetene dine er og hvilke handlinger du skal ta neste gang.",
    sv: "Försäljningstratten ger dig en visuell dra-och-släpp-representation av din försäljningsprocess. Flytta leads och affärer genom stadier från första kontakt till vunnen eller förlorad. Detta hjälper dig att snabbt se var dina möjligheter finns och vilka åtgärder du ska vidta härnäst.",
    da: "Salgstragten giver dig en visuel træk-og-slip-repræsentation af din salgsproces. Flyt leads og tilbud gennem faser fra indledende kontakt til vundet eller tabt. Dette hjælper dig med hurtigt at se, hvor dine muligheder er, og hvilke handlinger du skal foretage næste."
  },
  help_customers_title: { en: "Customers", no: "Kunder", sv: "Kunder", da: "Kunder" },
  help_customers_content: {
    en: "The Customers module is the heart of your CRM. Here, you manage your entire client lifecycle. Add new prospects manually or bulk-import them using a CSV file. Track each contact's journey from an initial lead to a loyal, paying customer. Keep notes, organize them by industry, and quickly see their associated quotes and invoices all in one place.",
    no: "Kundemodulen er hjertet i CRM-et ditt. Her administrerer du hele kundelivssyklusen. Legg til nye prospekter manuelt eller masseimporter dem med en CSV-fil. Følg hver kontakts reise fra et innledende lead til en lojal, betalende kunde. Hold notater, organiser dem etter bransje, og se raskt deres tilknyttede tilbud og fakturaer på ett sted.",
    sv: "Kundmodulen är hjärtat i ditt CRM. Här hanterar du hela din kundlivscykel. Lägg till nya prospekt manuellt eller massimportera dem med en CSV-fil. Följ varje kontakts resa från initialt lead till lojal, betalande kund. För anteckningar, organisera dem efter bransch och se snabbt deras korresponderande offerter och fakturor på ett och samma ställe.",
    da: "Kundemodulet er hjertet i dit CRM. Her administrerer du hele din kundelivscyklus. Tilføj nye kundeemner manuelt eller importer dem i bulk med en CSV-fil. Følg hver kontakts rejse fra et indledende lead til en loyal, betalende kunde. Gem noter, organiser dem efter branche, og se hurtigt deres tilknyttede tilbud og fakturaer på ét sted."
  },
  help_quotes_title: { en: "Quotes", no: "Tilbud", sv: "Offerter", da: "Tilbud" },
  help_quotes_content: {
    en: "Quotes help you win business by presenting professional, itemized price estimates to your prospects. You can add your predefined products or custom line items. Once a quote is generated, you can send it to your client. When the client agrees to the terms and the quote is accepted, you can seamlessly convert it directly into an active invoice with a single click.",
    no: "Tilbud hjelper deg med å vinne forretninger ved å presentere profesjonelle, detaljerte prisoverslag til prospektene dine. Du kan legge til forhåndsdefinerte produkter eller egendefinerte linjer. Når et tilbud er generert, kan du sende det til kunden. Når kunden godtar vilkårene og tilbudet er akseptert, kan du sømløst konvertere det direkte til en aktiv faktura med et enkelt klikk.",
    sv: "Offerter hjälper dig att vinna affärer genom att presentera professionella, detaljerade prisförslag till dina prospekt. Du kan lägga till fördefinierade produkter eller anpassade rader. När en offert genererats kan du skicka den till kunden. När kunden accepterar villkoren kan du sömlöst konvertera den direkt till en aktiv faktura med ett enda klick.",
    da: "Tilbud hjælper dig med at vinde forretning ved at præsentere professionelle, detaljerede prisoverslag for dine kundeemner. Du kan tilføje foruddefinerede produkter eller tilpassede linjer. Når et tilbud er genereret, kan du sende det til klienten. Når kunden accepterer vilkårene og tilbuddet er accepteret, kan du gnidningsløst konvertere det direkte til en aktiv faktura med et enkelt klik."
  },
  help_invoices_title: { en: "Invoices", no: "Fakturaer", sv: "Fakturor", da: "Fakturaer" },
  help_invoices_content: {
    en: "The Invoices section handles your billing cycle. After winning a quote or starting a project, generate a professional invoice here. Define payment terms, due dates, and apply the correct VAT rates automatically. Track performance by monitoring the status of each invoice: look out for Overdue invoices to chase up, and watch your Pending invoices turn to Paid to maintain healthy cash flow. If Stripe or PayPal is configured, your clients can pay directly online.",
    no: "Fakturaseksjonen håndterer faktureringssyklusen din. Etter at du har vunnet et tilbud, genererer du en profesjonell faktura her. Definer betalingsbetingelser, forfallsdatoer, og bruk riktige MVA-satser automatisk. Spor resultatene ved å overvåke statusen for hver faktura: følg opp forfalte fakturaer, og se ventende fakturaer bli betalt for å opprettholde en sunn kontantstrøm. Med Stripe eller PayPal konfigurert kan kundene betale direkte online.",
    sv: "Fakturasektionen hanterar din faktureringscykel. Efter att ha vunnit en offert genererar du en professionell faktura här. Definiera betalningsvillkor, förfallodatum och tillämpa korrekta momssatser automatiskt. Övervaka resultatet genom att spåra statusen för varje faktura: håll utkik efter förfallna fakturor att följa upp, och se dina väntande fakturor bli betalda för ett hälsosamt kassaflöde. Om Stripe eller PayPal är konfigurerat kan kunderna betala direkt online.",
    da: "Fakturasektionen håndterer din faktureringscyklus. Efter at have vundet et tilbud, genererer du en professionel faktura her. Definer betalingsbetingelser, forfaldsdatoer, og anvend korrekte momssatser automatisk. Spor din indtjening ved at overvåge status for hver faktura: hold øje med forfaldne fakturaer for at følge op, og se dine afventende fakturaer blive betalt for at sikre et sundt cashflow. Med Stripe eller PayPal konfigureret kan dine kunder betale direkte online."
  },
  help_products_title: { en: "Products", no: "Produkter", sv: "Produkter", da: "Produkter" },
  help_products_content: {
    en: "Maintain a structured catalog of your goods and services in the Products section. Standardizing your offerings means faster quote and invoice creation. Set default prices, add clear descriptions, and assign the correct tax categorization (e.g., standard vs. reduced VAT). This ensures your billing is consistently accurate and saves you from manually typing out line items every time.",
    no: "Vedlikehold en strukturert katalog over varer og tjenester i Produktseksjonen. Standardisering av tilbudene dine betyr raskere opprettelse av tilbud og fakturaer. Angi standardpriser, legg til tydelige beskrivelser, og tilordne riktig avgiftskategorisering (f.eks. standard vs. redusert MVA). Dette sikrer at faktureringen din alltid er nøyaktig og sparer deg for manuell inntasting hver gang.",
    sv: "Håll en strukturerad katalog över dina varor och tjänster i Produktsektionen. Standardisering av dina erbjudanden innebär snabbare skapande av offerter och fakturor. Ange standardpriser, lägg till tydliga beskrivningar och tilldela korrekt skattekategorisering (t.ex. standard vs. reducerad moms). Detta säkerställer en konsekvent och korrekt fakturering och sparar dig från att knappa in rader manuellt varje gång.",
    da: "Vedligehold et struktureret katalog over dine varer og tjenester i Produktsektionen. Standardisering af dine tilbud betyder hurtigere oprettelse af tilbud og fakturaer. Angiv standardpriser, tilføj tydelige beskrivelser, og tildel den korrekte afgiftskategorisering (f.eks. standard vs. nedsat moms). Dette sikrer, at din fakturering altid er nøjagtig, og sparer dig for at indtaste linjer manuelt hver gang."
  },
  help_payments_title: { en: "Payments", no: "Betalinger", sv: "Betalningar", da: "Betalinger" },
  help_payments_content: {
    en: "The Payments module is your ledger for recorded income. Whenever a client pays an invoice offline or via a third-party gateway, log the transaction here. By linking a payment record to a specific invoice, the system automatically subtracts the amount due, preventing billing errors and giving you peace of mind that your financial records perfectly mirror reality.",
    no: "Betalingsmodulen er din hovedbok for registrert inntekt. Når en kunde betaler en faktura offline eller via en tredjepartsportal, logger du transaksjonen her. Ved å koble en betalingsoppføring til en spesifikk faktura, trekker systemet automatisk fra skyldig beløp, forhindrer faktureringsfeil og gir deg trygghet for at regnskapet ditt stemmer overens med virkeligheten.",
    sv: "Betalningsmodulen är din huvudbok för registrerad inkomst. När en kund betalar en faktura offline eller via en tredjepartsportal loggar du transaktionen här. Genom att koppla en betalningspost till en specifik faktura subtraherar systemet automatiskt det skyldiga beloppet, förhindrar faktureringsfel och ger dig sinnesro att din bokföring perfekt speglar verkligheten.",
    da: "Betalingsmodulet er din hovedbog for registreret indkomst. Når en kunde betaler en faktura offline eller via en tredjepartsportal, logger du transaktionen her. Ved at knytte en betalingspostering til en specifik faktura fratrækker systemet automatisk det skyldige beløb, forhindrer faktureringsfejl og giver dig tryghed for, at dit regnskab perfekt afspejler virkeligheden."
  },
  help_outreach_title: { en: "Outreach", no: "Oppfølging", sv: "Uppsökande", da: "Opsøgende" },
  help_outreach_content: {
    en: "Outreach ensures you never lose touch with your leads. Send direct Email or WhatsApp messages from within the platform. By centralizing your communication history, your team always knows exactly when a customer was last contacted, what was said, and when to follow up next. It's the key to proactive selling and building long-lasting client relationships.",
    no: "Oppfølging sikrer at du aldri mister kontakten med prospektene dine. Send direkte e-post eller WhatsApp-meldinger fra plattformen. Ved å sentralisere kommunikasjonshistorikken, vet teamet ditt alltid nøyaktig når en kunde sist ble kontaktet, hva som ble sagt, og når de skal følges opp. Det er nøkkelen til proaktivt salg og langsiktige kunderelasjoner.",
    sv: "Uppsökande verksamhet säkerställer att du aldrig tappar kontakten med dina prospekt. Skicka direkt e-post eller WhatsApp-meddelanden inifrån plattformen. Genom att centralisera din kommunikationshistorik vet ditt team alltid exakt när en kund senast kontaktades, vad som sades och när nästa uppföljning ska ske. Det är nyckeln till proaktiv försäljning och långsiktiga kundrelationer.",
    da: "Opsøgende salg sikrer, at du aldrig mister kontakten med dine leads. Send direkte e-mail eller WhatsApp-beskeder inde fra platformen. Ved at centralisere din kommunikationshistorik ved dit team altid præcis, hvornår en kunde sidst blev kontaktet, hvad der blev sagt, og hvornår der skal følges op næste gang. Det er nøglen til proaktivt salg og opbygning af langsigtede kunderelationer."
  },
  help_reports_title: { en: "Reports", no: "Rapporter", sv: "Rapporter", da: "Rapporter" },
  help_reports_content: {
    en: "Reports transform your raw data into strategic intelligence. Dive into visualizations that break down your revenue streams, map your prospect conversion funnel, and highlight outstanding debt. Use these insights to identify which products are driving growth, understand seasonal trends, and make informed decisions on where to focus your sales efforts next.",
    no: "Rapporter gjør rådataene dine om til strategisk innsikt. Dykk ned i visualiseringer som bryter ned inntektsstrømmene dine, kartlegger konverteringstrakten for prospekter og fremhever utestående gjeld. Bruk denne innsikten til å identifisere hvilke produkter som driver veksten, forstå sesongmessige trender og ta informerte beslutninger om hvor salgsinnsatsen skal rettes.",
    sv: "Rapporter omvandlar din rådata till strategisk insikt. Dyk ner i visualiseringer som bryter ner dina inkomstströmmar, kartlägger din prospektkonverteringstratt och belyser utestående skulder. Använd dessa insikter för att identifiera vilka produkter som driver tillväxt, förstå säsongstrender och fatta välgrundade beslut om var du ska fokusera dina säljinsatser.",
    da: "Rapporter omdanner dine rå data til strategisk indsigt. Dyk ned i visualiseringer, der opdeler dine indtægtsstrømme, kortlægger din konverteringstragt for prospekter og fremhæver udestående gæld. Brug denne indsigt til at identificere, hvilke produkter der driver væksten, forstå sæsonbestemte tendenser og træffe informerede beslutninger om, hvor du næste gang skal fokusere din salgsindsats."
  },
  help_settings_title: { en: "Settings", no: "Innstillinger", sv: "Inställningar", da: "Indstillinger" },
  help_settings_content: {
    en: "Settings is where you tailor Aiappsy CRM to fit your exact business needs. Here's a quick overview of what you can configure:\n\n**Company Profile**\nUpdate your branding and contact details to ensure all outward-facing documents look professional.\n\n**Preferences & Localisation**\nSet your default currency and global VAT region for automatic tax compliance.\n\n**AI Action Balance & Models**\nManage your AI action balance or purchase extra packages. Switch between free standard models (like Gemini 2.0) and premium models (requires your own API key).\n\n**Admin Settings**\nFor Super Admins: Control tier limits, define token packages, and set payment gateways.\n\n**Integrations**\nConnect SMTP for outbound emails via the assistant, and plug in your own Google AI Studio API key for unlimited premium usage.",
    no: "Innstillinger er hvor du tilpasser Aiappsy CRM til dine forretningsbehov. En rask oversikt over hva du kan konfigurere:\n\n**Firmaprofil**\nOppdater detaljene dine for å sikre at utgående dokumenter ser profesjonelle ut.\n\n**Preferanser og lokalisering**\nAngi standardvaluta og mva.-region for automatisk skatteoverholdelse.\n\n**AI-saldo og -modeller**\nAdministrer AI-saldoen din eller kjøp ekstra pakker. Bytt mellom gratis standardmodeller (som Gemini 2.0) og premiummodeller (krever din egen API-nøkkel).\n\n**Admin-innstillinger**\nFor Super Admins: Kontroller abonnementsgrenser, definer tokenpakker og konfigurer betalingsløsninger.\n\n**Integrasjoner**\nKoble til SMTP for utgående e-post, og bruk din egen Google AI Studio API-nøkkel for ubegrenset premium bruk.",
    sv: "Inställningar är där du skräddarsyr Aiappsy CRM för att passa dina affärsbehov. En snabb översikt över vad du kan konfigurera:\n\n**Företagsprofil**\nUppdatera dina detaljer för att säkerställa att utgående dokument ser professionella ut.\n\n**Preferenser och lokalisering**\nStäll in standardvaluta och momsregion för automatisk skatteefterlevnad.\n\n**AI-saldo och modeller**\nHantera ditt AI-saldo eller köp extra paket. Växla mellan gratis standardmodeller (som Gemini 2.0) och premiummodeller (kräver en egen API-nyckel).\n\n**Admininställningar**\nFör Super Admins: Kontrollera nivågränser, definiera tokenpaket och ställ in betalningslösningar.\n\n**Integrationer**\nAnslut SMTP för utgående e-post, och använd din egen Google AI Studio API-nyckel för obegränsad premium-användning.",
    da: "Indstillinger er hvor du skræddersyr Aiappsy CRM til dine forretningsbehov. En hurtig oversigt over, hvad du kan konfigurere:\n\n**Virksomhedsprofil**\nOpdater dine detaljer for at sikre, at udgående dokumenter ser professionelle ud.\n\n**Præferencer og lokalisering**\nIndstil standardvaluta og momsregion for automatisk skatteoverholdelse.\n\n**AI-saldo og -modeller**\nAdministrer din AI-saldo eller køb ekstra pakker. Skift mellem gratis standardmodeller (som Gemini 2.0) og premiummodeller (kræver din egen API-nøgle).\n\n**Admin-indstillinger**\nFor Super Admins: Kontroller abonnementsgrænser, definer token-pakker og opsæt betalingsløsninger.\n\n**Integrationer**\nForbind SMTP til udgående e-mails, og brug din egen Google AI Studio API-nøgle til ubegrænset premium-brug."
  },
  help_hub_title: { en: "Intelligence Hub", no: "Intelligenssenter", sv: "Intelligensnav", da: "Intelligenscenter" },
  help_hub_content: {
    en: "The Intelligence Hub (formerly Notebook) acts as a centralized brain for your CRM accounts. Select an account on the left to view, search, and synthesize specific customer documents. Upload call transcripts, contracts, and emails as 'Sources' to generate comprehensive study guides, audio briefings, and intelligent conversational insights about your customers. The 'Search accounts' bar lets you easily find contacts inside your CRM and tie context directly back to their profiles.",
    no: "Intelligenssenteret fungerer som en sentral hjerne for CRM-kontoene dine. Velg en konto til venstre for å se, søke i og syntetisere spesifikke kundedokumenter. Last opp utskrifter og dokumenter for å generere studieveiledninger og lydbriefinger. 'Søk etter kontoer'-linjen lar deg enkelt finne kontakter og knytte kontekst direkte til dem.",
    sv: "Intelligensnavet fungerar som en central hjärna för dina CRM-konton. Välj ett konto till vänster för att se, söka i och syntetisera kunddokument. Ladda upp utskrifter och dokument för att generera studieguider och ljudgenomgångar. 'Sök konton' låter dig enkelt hitta kontakter och knyta kontext direkt till dem.",
    da: "Intelligenscenteret fungerer som en central hjerne for dine CRM-konti. Vælg en konto til venstre for at se, søge i og syntetisere specifikke kundedokumenter. Upload transskriptioner og dokumenter for at generere studievejledninger og lydbriefings. 'Søg konti' lader dig nemt finde kontakter og knytte kontekst direkte til dem."
  },
  help_hygiene_title: { en: "Data Hygiene", no: "Datahygiene", sv: "Datahygien", da: "Datahygiejne" },
  help_hygiene_content: {
    en: "Data Hygiene is an AI-powered automated background agent that audits your CRM base. It finds duplicates, standardized empty domains/phone numbers, standardizes naming, and enforces rules without manual intervention. Check the log to see all autonomous actions it has performed.",
    no: "Datahygiene er en AI-drevet automatisert bakgrunnsagent som reviderer CRM-basen din. Den finner duplikater, standardiserer tomme domener/telefonnumre og håndhever regler uten manuell inngripen. Sjekk loggen for å se alle autonome handlinger den har utført.",
    sv: "Datahygien är en AI-driven automatiserad bakgrundsagent som granskar din CRM-bas. Den hittar dubbletter, standardiserer tomma domäner/telefonnummer och upprätthåller regler automatiskt. Kontrollera loggen för att se alla åtgärder den utfört.",
    da: "Datahygiejne er en AI-drevet automatiseret baggrundsagent, som auditerer din CRM-base. Den finder dubletter, standardiserer tomme domæner/telefonnumre og håndhæver regler uden manuel involvering. Tjek loggen for at se alle de handlinger, den har udført."
  },
  help_success_title: { en: "Customer Success", no: "Kundesuksess", sv: "Kundframgång", da: "Kundesucces" },
  help_success_content: {
    en: "Customer Success helps you monitor account health scores, identify churn risks, and manage renewals. It highlights which clients need immediate attention and suggests proactive engagement via the AI Assistant.",
    no: "Kundesuksess hjelper deg med å overvåke kontoenes helseskårer, identifisere churn-risikoer og håndtere fornyelser. Den fremhever hvilke kunder som trenger oppmerksomhet og foreslår proaktiv kontakt via AI-assistenten.",
    sv: "Kundframgång hjälper dig att övervaka kontons hälsopoäng, identifiera risk för kundbortfall och hantera förnyelser.",
    da: "Kundesucces hjælper dig med at overvåge kontis sundhedsscore, identificere churn-risici og administrere fornyelser."
  },
  help_workflows_title: { en: "Automations", no: "Automatiseringer", sv: "Automatiseringar", da: "Automatiseringer" },
  help_workflows_content: {
    en: "Automations, or Workflows, allow you to create trigger-action routines in the CRM. You can automatically qualify leads, assign tasks, or send emails when specific CRM events happen (like a Lead scoring above 50 or an Invoice becoming overdue).",
    no: "Automatiseringer, eller Arbeidsflyter, lar deg opprette utløser-hendelse rutiner i CRM.",
    sv: "Automatiseringar, eller Arbetsflöden, låter dig skapa händelse-och-åtgärd-rutiner i CRM.",
    da: "Automatiseringer, eller Arbejdsgange, lader dig oprette trigger-action rutiner i CRM."
  },
  help_leads_title: { en: "Lead Scoring", no: "Lead-scoring", sv: "Lead-poäng", da: "Lead-scoring" },
  help_leads_content: {
    en: "The Lead Scoring system evaluates your prospects based on engagement signals and framework rules (like BANT or MEDDIC). It helps you prioritize high-value prospects that are most likely to close. Select a framework via Settings to adjust how AI scores your leads.",
    no: "Lead-scoring-systemet vurderer potensielle kunder basert på engasjementssignaler og rammeverk (som BANT eller MEDDIC).",
    sv: "Poängsystemet för leads utvärderar dina potentiella kunder baserat på engagemang och ramverksregler (som BANT eller MEDDIC).",
    da: "Lead-scoring-systemet evaluerer dine potentielle kunder baseret på engagementssignaler og framework-regler (som BANT eller MEDDIC)."
  },
  help_crm_customers: {
    en: "Manage standard Customers, Suppliers, and your Custom Contact Types here. Add labels, define custom fields, track relationship health, and review transaction histories associated with these accounts.",
    no: "Administrer standardkunder, leverandører og tilpassede kontakttyper her. Legg til etiketter, definer egendefinerte felt, spor relasjonshelse og se gjennom transaksjonshistorikk.",
    sv: "Hantera dina kunder, leverantörer och anpassade kontakttyper här. Lägg till etiketter, definiera anpassade fält, spåra relationshälsa och granska transaktionshistorik.",
    da: "Administrer dine kunder, leverandører og tilpassede kontakttyper her. Tilføj etiketter, definer tilpassede felter, følg relationssundheden og gennemgå transaktionshistorik."
  },
  
  // Quotes
  quote_id: { en: "Quote ID", no: "Tilbuds-ID", sv: "Offert-ID", da: "Tilbuds-ID" },
  quote_details: { en: "Enter the quote details below.", no: "Skriv inn tilbudsdetaljer nedenfor.", sv: "Ange offertuppgifter nedan.", da: "Indtast tilbudsdetaljer nedenfor." },
  quote_number: { en: "Quote Number", no: "Tilbudsnummer", sv: "Offertnummer", da: "Tilbudsnummer" },
  select_customer: { en: "Select customer", no: "Velg kunde", sv: "Välj kund", da: "Vælg kunde" },
  edit_quote: { en: "Edit Quote", no: "Rediger tilbud", sv: "Redigera offert", da: "Rediger tilbud" },
  create_quote: { en: "Create Quote", no: "Opprett tilbud", sv: "Skapa offert", da: "Opret tilbud" },
  no_quotes_match: { en: "No quotes match your search.", no: "Ingen tilbud samsvarer med søket ditt.", sv: "Inga offerter matchar din sökning.", da: "Ingen tilbud matcher din søgning." },
  no_quotes_found: { en: "No quotes found. Create your first quote to get started.", no: "Ingen tilbud funnet. Opprett ditt første tilbud for å komme i gang.", sv: "Inga offerter hittades. Skapa din första offert för att komma igång.", da: "Ingen tilbud fundet. Opret dit første tilbud for at komme i gang." },
  expiry_date: { en: "Expiry Date", no: "Utløpsdato", sv: "Utgångsdatum", da: "Udløbsdato" },
  auth_required_quotes: { en: "You need to be authenticated to manage quotes.", no: "Du må være logget inn for å administrere tilbud.", sv: "Du måste vara inloggad för att hantera offerter.", da: "Du skal være logget ind for at administrere tilbud." },
  auth_required_customers: { en: "You need to be authenticated to manage customers.", no: "Du må være logget inn for å administrere kunder.", sv: "Du måste vara inloggad för att hantera kunder.", da: "Du skal være logget ind for at administrere kunder." },
  
  // Invoices
  invoice_id: { en: "Invoice ID", no: "Faktura-ID", sv: "Faktura-ID", da: "Faktura-ID" },
  invoice_details: { en: "Enter the invoice details below.", no: "Skriv inn fakturadetaljer nedenfor.", sv: "Ange fakturauppgifter nedan.", da: "Indtast fakturadetaljer nedenfor." },
  invoice_number: { en: "Invoice Number", no: "Fakturanummer", sv: "Fakturanummer", da: "Fakturanummer" },
  no_invoices_match: { en: "No invoices match your search.", no: "Ingen fakturaer samsvarer med søket ditt.", sv: "Inga fakturor matchar din sökning.", da: "Ingen fakturaer matcher din søgning." },
  no_invoices_found: { en: "No invoices found. Create your first invoice to get started.", no: "Ingen fakturaer funnet. Opprett din første faktura for å komme i gang.", sv: "Inga fakturor hittades. Skapa din första faktura för att komma igång.", da: "Ingen fakturaer fundet. Opret din første faktura for at komme i gang." },
  export: { en: "Export", no: "Eksporter", sv: "Exportera", da: "Eksporter" },
  auth_required_invoices: { en: "You need to be authenticated to manage invoices.", no: "Du må være logget inn for å administrere fakturaer.", sv: "Du måste vara inloggad för att hantera fakturor.", da: "Du skal være logget ind for at administrere fakturaer." },
  
  // Common
  date: { en: "Date", no: "Dato", sv: "Datum", da: "Dato" },
  please_sign_in: { en: "Please Sign In", no: "Vennligst logg inn", sv: "Vänligen logga in", da: "Venligst log ind" },
  
  // Import
  import_customers: { en: "Import Customers", no: "Importer kunder", sv: "Importera kunder", da: "Importer kunder" },
  import_csv: { en: "Import CSV", no: "Importer CSV", sv: "Importera CSV", da: "Importer CSV" },
  csv_import_success: { en: "Customers imported successfully.", no: "Kunder importert.", sv: "Kunder har importerats.", da: "Kunder importeret." },
  csv_import_error: { en: "Error importing customers.", no: "Feil ved import av kunder.", sv: "Fel vid import av kunder.", da: "Fejl ved import af kunder." },
  
  // Misc
  contact: { en: "Contact", no: "Kontakt", sv: "Kontakt", da: "Kontakt" },
  customers_desc: { en: "Manage your customer relationships and leads.", no: "Administrer kunderelasjoner og leads.", sv: "Hantera kundrelationer och leads.", da: "Administrer kunderelationer og leads." },
  suppliers_desc: { en: "Manage your supplier relationships and contacts.", no: "Administrer leverandørrelasjoner og kontakter.", sv: "Hantera leverantörsrelationer och kontakter.", da: "Administrer leverandørrelationer og kontakter." },
  custom_types_desc: { en: "Manage your custom contacts.", no: "Administrer dine egendefinerte kontakter.", sv: "Hantera dina anpassade kontakter.", da: "Administrer dine brugerdefinerede kontakter." },
  invoices_desc: { en: "Manage your billing and payments.", no: "Administrer fakturering og betalinger.", sv: "Hantera fakturering och betalningar.", da: "Administrer fakturering og betalinger." },
  quotes_desc: { en: "Create and manage price estimates for your clients.", no: "Opprett og administrer pristilbud til dine kunder.", sv: "Skapa och hantera offerter till dina kunder.", da: "Opret og administrer pristilbud til dine kunder." },
  
  whatsapp: { en: "WhatsApp", no: "WhatsApp", sv: "WhatsApp", da: "WhatsApp" },
  
  // Payments
  payments_desc: { en: "Track all incoming payments and transactions.", no: "Spor alle innkommende betalinger og transaksjoner.", sv: "Spåra alla inkommande betalningar och transaktioner.", da: "Spor alle indkommende betalinger og transaktioner." },
  record_payment: { en: "Record Payment", no: "Registrer betaling", sv: "Registrera betalning", da: "Registrer betaling" },
  payment_method: { en: "Payment Method", no: "Betalingsmetode", sv: "Betalningsmetod", da: "Betalingsmetode" },
  completed: { en: "Completed", no: "Fullført", sv: "Slutförd", da: "Gennemført" },
  processing: { en: "Processing", no: "Behandler", sv: "Behandlar", da: "Behandler" },
  failed: { en: "Failed", no: "Feilet", sv: "Misslyckades", da: "Fejlet" },
  credit_card: { en: "Credit Card", no: "Kredittkort", sv: "Kreditkort", da: "Kreditkort" },
  bank_transfer: { en: "Bank Transfer", no: "Bankoverføring", sv: "Banköverföring", da: "Bankoverførsel" },
  paypal: { en: "PayPal", no: "PayPal", sv: "PayPal", da: "PayPal" },
  cash: { en: "Cash", no: "Kontanter", sv: "Kontanter", da: "Kontanter" },
  select_invoice: { en: "Select Invoice", no: "Velg faktura", sv: "Välj faktura", da: "Vælg faktura" },
  select_method: { en: "Select Method", no: "Velg metode", sv: "Välj metod", da: "Vælg metode" },
  payment_details: { en: "Enter the payment details below.", no: "Skriv inn betalingsdetaljer nedenfor.", sv: "Ange betalningsuppgifter nedan.", da: "Indtast betalingsdetaljer nedenfor." },
  
  // Reports
  reports_desc: { en: "Detailed analytics and business performance metrics.", no: "Detaljert analyse og forretningsytelse.", sv: "Detaljerad analys och affärsresultat.", da: "Detaljeret analyse og forretningsresultater." },
  export_data: { en: "Export Data", no: "Eksporter data", sv: "Exportera data", da: "Eksporter data" },
  top_customers_revenue: { en: "Top 5 Customers by Revenue", no: "Topp 5 kunder etter omsetning", sv: "Topp 5 kunder efter intäkter", da: "Top 5 kunder efter omsætning" },
  customer_distribution: { en: "Customer Distribution", no: "Kundefordeling", sv: "Kundfördelning", da: "Kundefordeling" },
  invoice_status_overview: { en: "Invoice Status Overview", no: "Oversikt over fakturastatus", sv: "Översikt över fakturastatus", da: "Oversigt over fakturastatus" },
  
  // Landing Page
  features: { en: "Features", no: "Funksjoner", sv: "Funktioner", da: "Funktioner" },
  pricing: { en: "Pricing", no: "Priser", sv: "Priser", da: "Priser" },
  about: { en: "About", no: "Om oss", sv: "Om oss", da: "Om os" },
  go_to_dashboard: { en: "Go to Dashboard", no: "Gå til oversikt", sv: "Gå till instrumentpanel", da: "Gå til oversigt" },
  get_started: { en: "Get Started", no: "Kom i gang", sv: "Kom igång", da: "Kom i gang" },
  hero_title_1: { en: "Close more", no: "Vinn flere", sv: "Stäng fler", da: "Land flere" },
  hero_title_2: { en: "Deals", no: "avtaler", sv: "affärer", da: "aftaler" },
  hero_title_3: { en: "with AI.", no: "med AI.", sv: "med AI.", da: "med AI." },
  hero_subtitle: { 
    en: "Aiappsy is the first CRM that doesn't just store data—it acts on it. Automate your outreach, research competitors, and generate professional quotes in seconds.",
    no: "Aiappsy er det første CRM-systemet som ikke bare lagrer data – det tar grep. Automatiser salgsoppfølging, analyser konkurrenter og opprett profesjonelle tilbud på få sekunder.",
    sv: "Aiappsy är det första CRM-systemet som inte bara lagrar data – det agerar åt dig. Automatisera din kunduppföljning, analysera konkurrenter och skapa professionella offerter på sekunder.",
    da: "Aiappsy er det første CRM-system, der ikke kun gemmer data – det arbejder for dig. Automatiser din kundekontakt, analyser konkurrenter, og opret professionelle tilbud på sekunder."
  },
  start_for_free: { en: "Start for Free", no: "Start gratis", sv: "Starta gratis", da: "Start gratis" },
  features_title: { en: "Built for the next generation of sales", no: "Bygget for neste generasjon salg", sv: "Byggt för nästa generations försäljning", da: "Bygget til næste generation af salg" },
  features_subtitle: { en: "Stop fighting your CRM and start closing deals. Aiappsy handles the busy work so you can focus on relationships.", no: "Slutt å kjempe mot CRM-systemet ditt, og begynn å lande avtaler. Aiappsy tar seg av rutinearbeidet, så du kan fokusere på relasjonene.", sv: "Sluta kämpa med ditt CRM och börja stänga affärer. Aiappsy hanterar rutinarbetet så att du kan fokusera på relationerna.", da: "Stop med at kæmpe med dit CRM og begynd at lukke aftaler. Aiappsy håndterer rutinearbejdet, så du kan fokusere på relationerne." },
  pricing_title: { en: "Simple, transparent pricing", no: "Enkle, oversiktlige priser", sv: "Enkla, tydliga priser", da: "Enkle, gennemsigtige priser" },
  pricing_subtitle: { en: "Scale your business without the hidden fees.", no: "Skaler virksomheten din uten skjulte kostnader.", sv: "Skala upp din verksamhet utan dolda avgifter.", da: "Skaler din virksomhed uden skjulte gebyrer." },
  about_title_1: { en: "We're on a mission to", no: "Vårt oppdrag er å", sv: "Vårt uppdrag är att", da: "Vores mission er at" },
  about_title_2: { en: "humanize", no: "menneskeliggjøre", sv: "förmänskliga", da: "menneskeliggøre" },
  about_title_3: { en: "business.", no: "virkeligheten.", sv: "företagandet.", da: "forretningslivet." },
  
  // Landing Page missing words
  privacy_policy: { en: "Privacy Policy", no: "Personvernerklæring", sv: "Integritetspolicy", da: "Privatlivspolitik" },
  terms_of_service: { en: "Terms of Service", no: "Brukervilkår", sv: "Användarvillkor", da: "Brugervilkår" },
  customer_satisfaction: { en: "Customer Satisfaction", no: "Kundetilfredshet", sv: "Kundnöjdhet", da: "Kundetilfredshed" },
  invoices_processed: { en: "Invoices Processed", no: "Behandlede fakturaer", sv: "Behandlade fakturor", da: "Behandlede fakturaer" },
  live_activity: { en: "Live Activity", no: "Siste aktivitet", sv: "Senaste aktivitet", da: "Seneste aktivitet" },
  ai_insight: { en: "AI Insight", no: "AI-innsikt", sv: "AI-insikt", da: "AI-indsigt" },
  quote_accepted_example: { en: "Quote #124 Accepted", no: "Tilbud #124 Akseptert", sv: "Offert #124 Accepterad", da: "Tilbud #124 Accepteret" },
  by_nordic_solutions_example: { en: "by Nordic Solutions AS", no: "av Nordic Solutions AS", sv: "av Nordic Solutions AS", da: "af Nordic Solutions AS" },
  free_plan: { en: "Starter", no: "Starter", sv: "Starter", da: "Starter" },
  pro_plan: { en: "Growth", no: "Growth", sv: "Tillväxt", da: "Vækst" },
  enterprise_plan: { en: "Scale", no: "Scale", sv: "Skala", da: "Skala" },
  ai_actions_mo: { en: "AI Actions/mo", no: "AI-handlinger/mnd", sv: "AI-åtgärder/mån", da: "AI-handlinger/md." },
  byok_standard: { en: "BYOK Included", no: "BYOK Inkludert", sv: "BYOK Inkluderat", da: "BYOK Inkluderet" },
  automated_outreach: { en: "Automated Outreach", no: "Automatisert oppfølging", sv: "Automatiserad uppföljning", da: "Automatiseret opfølgning" },
  basic_crm_features: { en: "Basic CRM Features", no: "Grunnleggende CRM-funksjoner", sv: "Grundläggande CRM-funktioner", da: "Grundlæggende CRM-funktioner" },
  dedicated_manager: { en: "Dedicated Account Manager", no: "Dedikert kundeansvarlig", sv: "Dedikerad kundansvarig", da: "Dedikeret kontoadministrator" },
  predictive_analytics: { en: "Predictive Analytics", no: "Forventningsanalyse", sv: "Prediktiv analys", da: "Prædiktiv analyse" },
  unlimited_users: { en: "Unlimited Users", no: "Ubegrenset antall brukere", sv: "Obegränsat antal användare", da: "Ubegrænset antal brugere" },
  priority_support: { en: "Priority Support", no: "Prioritert support", sv: "Prioriterad support", da: "Prioriteret support" },
  revenue_reports: { en: "Revenue Reports", no: "Omsetningsrapporter", sv: "Omsättningsrapporter", da: "Omsætningsrapporter" },
  revenue: { en: "Revenue", no: "Omsetning", sv: "Omsättning", da: "Omsætning" },
  profile: { en: "Profile", no: "Profil", sv: "Profil", da: "Profil" },
  edit_profile: { en: "Edit Profile", no: "Rediger profil", sv: "Redigera profil", da: "Rediger profil" },
  display_name: { en: "Display Name", no: "Visningsnavn", sv: "Visningsnamn", da: "Visningsnavn" },
  email_address: { en: "Email Address", no: "E-postadresse", sv: "E-postadress", da: "E-mailadresse" },
  profile_updated: { en: "Profile updated successfully", no: "Profilen er oppdatert", sv: "Profilen har uppdaterats", da: "Profilen er opdateret" },
  personal_info: { en: "Personal Information", no: "Personlig informasjon", sv: "Personlig information", da: "Personlig information" },

  // VAT & Localization
  vat_region: { en: "VAT Region", no: "MVA-region", sv: "Momsregion", da: "Momsregion" },
  vat_rate: { en: "VAT Rate", no: "MVA-sats", sv: "Momssats", da: "Momssats" },
  subtotal: { en: "Subtotal", no: "Sum før MVA", sv: "Subtotal", da: "Subtotal" },
  total_vat: { en: "Total VAT", no: "Total MVA", sv: "Total moms", da: "Total moms" },
  total_amount: { en: "Total Amount", no: "Totalbeløp", sv: "Totalbelopp", da: "Totalbeløb" },
  product_type: { en: "Product Type", no: "Produkttype", sv: "Produkttyp", da: "Produkttype" },
  standard_goods: { en: "Standard Goods/Services", no: "Standard varer/tjenester", sv: "Standardvaror/tjänster", da: "Standardvarer/tjenester" },
  food_beverages: { en: "Food & Beverages", no: "Mat og drikke", sv: "Livsmedel", da: "Fødevarer" },
  culture_transport: { en: "Culture & Transport", no: "Kultur og transport", sv: "Kultur och transport", da: "Kultur og transport" },
  books_newspapers: { en: "Books & Newspapers", no: "Bøker og aviser", sv: "Böcker och tidningar", da: "Bøger og aviser" },
  norway: { en: "Norway", no: "Norge", sv: "Norge", da: "Norge" },
  sweden: { en: "Sweden", no: "Sverige", sv: "Sverige", da: "Sverige" },
  denmark: { en: "Denmark", no: "Danmark", sv: "Danmark", da: "Danmark" },
  international: { en: "International (No VAT)", no: "Internasjonal (Fritatt)", sv: "Internationell (Momsfri)", da: "International (Momsfri)" },
  
  // Pipeline
  visual_sales_pipeline: { en: "Visual sales pipeline. Drag and drop to update status.", no: "Visuell salgstrakt. Dra og slipp for å endre status.", sv: "Visuell säljpipeline. Dra och släpp för att ändra status.", da: "Visuel salgspipeline. Træk og slip for at ændre status." },
  new_deal: { en: "New Deal", no: "Nytt prosjekt", sv: "Ny affär", da: "Ny aftale" },
  add_new_deal: { en: "Add New Deal", no: "Legg til nytt prosjekt", sv: "Lägg till ny affär", da: "Tilføj ny aftale" },
  create_new_prospect: { en: "Create a new prospect for your pipeline.", no: "Legg til et nytt prospekt i salgstrakten din.", sv: "Skapa ett nytt prospekt för din pipeline.", da: "Opret et nyt prospekt til din pipeline." },
  contact_name: { en: "Contact Name", no: "Kontaktnavn", sv: "Kontaktnamn", da: "Kontaktnavn" },
  pipeline_stage: { en: "Pipeline Stage", no: "Steg i salgstrakt", sv: "Fas i pipeline", da: "Fase i pipeline" },
  save_deal: { en: "Save Deal", no: "Lagre prosjekt", sv: "Spara affär", da: "Gem aftale" },
  
  // Admin & Integrations
  access_denied: { en: "Access Denied", no: "Ingen tilgang", sv: "Åtkomst nekad", da: "Adgang nægtet" },
  super_admin_control_center: { en: "Super Admin Control Center", no: "Kontrollsenter for Super Admin", sv: "Kontrollcenter för Super Admin", da: "Kontrolcenter for Super Admin" },
  manage_platform_settings: { en: "Manage platform-wide settings, customers, and releases.", no: "Administrer plattformens innstillinger, kunder og utgivelser.", sv: "Hantera plattformsomfattande inställningar, kunder och releaser.", da: "Administrer platformens indstillinger, kunder og udgivelser." },
  monthly_price: { en: "Monthly Price ($)", no: "Månedspris ($)", sv: "Månadspris ($)", da: "Månedlig pris ($)" },
  team_member_limit: { en: "Team Member Limit", no: "Grense for teammedlemmer", sv: "Gräns för teammedlemmar", da: "Grænse for teammedlemmer" },
  included_ai_tokens_mo: { en: "Included AI Tokens/mo", no: "Inkluderte AI-tokens/md", sv: "Inkluderade AI-tokens/mån", da: "Inkluderede AI-tokens/md" },
  ai_token_pricing: { en: "AI Token Pricing", no: "Prissetting for AI-tokens", sv: "Prissättning för AI-tokens", da: "Prisfastsættelse for AI-tokens" },
  price_per_token: { en: "Price per Token ($)", no: "Pris per token ($)", sv: "Pris per token ($)", da: "Pris pr. token ($)" },
  registered_customers: { en: "Registered Customers", no: "Registrerte kunder", sv: "Registrerade kunder", da: "Registrerede kunder" },
  system_apis: { en: "System & APIs", no: "System og API-er", sv: "System & API:er", da: "System & API'er" },
  publish_new_release: { en: "Publish New Release", no: "Publiser ny utgivelse", sv: "Publicera ny release", da: "Udgiv ny release" },
  recent_releases: { en: "Recent Releases", no: "Nylige utgivelser", sv: "Senaste releaser", da: "Seneste udgivelser" },
  integrations: { en: "Integrations", no: "Integrasjoner", sv: "Integrationer", da: "Integrationer" },
  integrations_desc: { en: "Connect your own services to power your CRM.", no: "Koble til dine egne tjenester for å styrke ditt CRM.", sv: "Anslut dina egna tjänster för att driva ditt CRM.", da: "Tilslut dine egne tjenester for at styrke dit CRM." },
  stripe_payments: { en: "Stripe Payments", no: "Stripe Betalinger", sv: "Stripe Betalningar", da: "Stripe Betalinger" },
  gemini_ai_intelligence: { en: "Gemini AI Intelligence", no: "Gemini AI-intelligens", sv: "Gemini AI-intelligens", da: "Gemini AI-intelligens" },
  publishable_key: { en: "Publishable Key", no: "Publiserbar nøkkel", sv: "Publicerbar nyckel", da: "Publicerbar nøgle" },
  secret_key: { en: "Secret Key", no: "Hemmelig nøkkel", sv: "Hemlig nyckel", da: "Hemmelig nøgle" },
  preferred_ai_model: { en: "Preferred AI Model", no: "Foretrukken AI-modell", sv: "Föredragen AI-modell", da: "Foretrukken AI-model" },
  
  // Settings details
  manage_plan_ai: { en: "Manage your plan and AI token balance.", no: "Administrer abonnementet og AI-tokenssaldoen din.", sv: "Hantera din plan och ditt AI-tokensaldo.", da: "Administrer dit abonnement og din AI-tokensaldo." },
  up_to_users: { en: "Up to", no: "Opptil", sv: "Upp till", da: "Op til" },
  users: { en: "Users", no: "Brukere", sv: "Användare", da: "Brugere" },
  user_singular: { en: "User", no: "Bruker", sv: "Användare", da: "Bruger" },
  ai_tokens_mo: { en: "AI Tokens/mo.", no: "AI-tokens/mnd", sv: "AI-tokens/mån", da: "AI-tokens/md." },
  monthly: { en: "/mo", no: "/mnd", sv: "/mån", da: "/md." },
  unlimited_users_tokens: { en: "Unlimited Users, Unlimited Tokens.", no: "Ubegrenset antall brukere, ubegrensede tokens.", sv: "Obegränsat antal användare, obegränsade tokens.", da: "Ubegrænset antal brugere, ubegrænsede tokens." },
  tokens_remaining: { en: "tokens remaining (1 token = 1 task)", no: "tokens gjenstår (1 token = 1 oppgave)", sv: "tokens återstår (1 token = 1 uppgift)", da: "tokens tilbage (1 token = 1 opgave)" },
  buy_tokens: { en: "Buy Tokens", no: "Kjøp tokens", sv: "Köp tokens", da: "Køb tokens" },
  each_abbreviation: { en: "/ea", no: "/stk", sv: "/st", da: "/stk" },
  ai_token_balance: { en: "AI Token Balance", no: "AI-tokenssaldo", sv: "AI-tokensaldo", da: "AI-tokensaldo" },
  what_is_token: { en: "What is an AI Token?", no: "Hva er et AI-token?", sv: "Vad är en AI-token?", da: "Hvad er en AI-token?" },
  token_explanation: { en: "One token represents one task performed by the AI agent, such as reading an email, generating a response, translating text, or updating a lead. Tokens reset at the beginning of each billing cycle. You can always buy extra tokens if you run out.", no: "Ett token representerer én oppgave utført av AI-assistenten, som å lese en e-post, generere et svar, oversette tekst eller oppdatere en kontakt. Tokens tilbakestilles ved starten av hver faktureringssyklus. Du kan alltid kjøpe ekstra tokens hvis du går tom.", sv: "En token representerar en uppgift utförd av AI-assistenten, som att läsa ett e-postmeddelande, generera ett svar, översätta text eller uppdatera en kontakt. Tokens återställs i början av varje faktureringscykel. Du kan alltid köpa extra tokens om du får slut.", da: "En token repræsenterer én opgave udført af AI-assistenten, såsom at læse en e-mail, generere et svar, oversætte tekst eller opdatere en kontakt. Tokens nulstilles i begyndelsen af hver faktureringscyklus. Du kan altid købe ekstra tokens, hvis du løber tør." },
  token_equals_task: { en: "(1 token = 1 AI task)", no: "(1 token = 1 AI-oppgave)", sv: "(1 token = 1 AI-uppgift)", da: "(1 token = 1 AI-opgave)" },
  ai_configuration_byok: { en: "AI Configuration (BYOK)", no: "AI-konfigurasjon (BYOK)", sv: "AI-konfiguration (BYOK)", da: "AI-konfiguration (BYOK)" },
  get_free_gemini_key: { en: "Get a free Gemini API key from Google AI Studio", no: "Få en gratis Gemini API-nøkkel fra Google AI Studio", sv: "Få en gratis Gemini API-nyckel från Google AI Studio", da: "Få en gratis Gemini API-nøgle fra Google AI Studio" },
  dont_have_api_key: { en: "Don't have an API key?", no: "Har du ikke en API-nøkkel?", sv: "Har du ingen API-nyckel?", da: "Har du ikke en API-nøgle?" },
  ai_config_byok_desc: { en: "Configure your own Gemini API key and select your preferred AI model.", no: "Konfigurer din egen Gemini API-nøkkel og velg din foretrukne AI-modell.", sv: "Konfigurera din egen Gemini API-nyckel och välj din föredragna AI-modell.", da: "Konfigurer din egen Gemini API-nøgle og vælg din foretrukne AI-model." },
  default_currency: { en: "Default Currency", no: "Standardvaluta", sv: "Standardvaluta", da: "Standardvaluta" },

  // Auth checks
  auth_required_products: { en: "You need to be authenticated to manage products.", no: "Du må være logget inn for å administrere produkter.", sv: "Du måste vara inloggad för att hantera produkter.", da: "Du skal være logget ind for at administrere produkter." },
  auth_required_payments: { en: "You need to be authenticated to manage payments.", no: "Du må være logget inn for å administrere betalinger.", sv: "Du måste vara inloggad för att hantera betalningar.", da: "Du skal være logget ind for at administrere betalinger." },
  auth_required_contacts: { en: "You need to be authenticated to manage contacts.", no: "Du må være logget inn for å administrere kontakter.", sv: "Du måste vara inloggad för att hantera kontakter.", da: "Du skal være logget ind for at administrere kontakter." },
  auth_required_pipeline: { en: "You need to be authenticated to manage pipeline.", no: "Du må være logget inn for å administrere salgsprosessen.", sv: "Du måste vara inloggad för att hantera din pipeline.", da: "Du skal være logget ind for at administrere din pipeline." },
  
  // Extra Landing text
  contact_sales: { en: "Contact Sales", no: "Kontakt salg", sv: "Kontakta sälj", da: "Kontakt salg" },
  // Landing Extra
  accept_credit_cards: { en: "Accept credit card payments on your invoices.", no: "Godta kredittkortbetalinger på fakturaene dine.", sv: "Acceptera kreditkortsbetalningar på dina fakturor.", da: "Accepter kreditkortbetalinger på dine fakturaer." },
  stripe_step_1: { en: "Log in to your", no: "Logg inn på", sv: "Logga in på", da: "Log ind på" },
  stripe_step_2: { en: "Copy your Publishable key and Secret key.", no: "Kopier Publishable key og Secret key.", sv: "Kopiera din Publishable key och Secret key.", da: "Kopier din Publishable key og Secret key." },
  stripe_step_3: { en: "Paste them below to enable 'Pay Now' buttons for your clients.", no: "Lim dem inn under for å aktivere 'Betal nå'-knapper for kundene dine.", sv: "Klistra in dem nedan för att aktivera 'Betala nu'-knappar för dina kunder.", da: "Indsæt dem nedenfor for at aktivere 'Betal nu'-knapper for dine kunder." },
  power_your_ai: { en: "Power your outreach and research with your own AI key.", no: "Driv oppfølgingen og analysene dine med din egen AI-nøkkel.", sv: "Driv din uppsökande verksamhet och forskning med din egen AI-nyckel.", da: "Styrk dit opsøgende arbejde og dine analyser med din egen AI-nøgle." },
  ai_step_1: { en: "Visit", no: "Besøk", sv: "Besök", da: "Besøg" },
  ai_step_2: { en: "Create a new API key and copy it.", no: "Opprett en ny API-nøkkel og kopier den.", sv: "Skapa en ny API-nyckel och kopiera den.", da: "Opret en ny API-nøgle og kopier den." },
  ai_step_3: { en: "Paste it below to unlock AI-powered features.", no: "Lim den inn under for å låse opp AI-drevne funksjoner.", sv: "Klistra in den nedan för att låsa upp AI-drivna funktioner.", da: "Indsæt den nedenfor for at låse op for AI-drevne funktioner." },
  recommended: { en: "Recommended", no: "Anbefalt", sv: "Rekommenderad", da: "Anbefalet" },
  free_description: { en: "Perfect for solo founders.", no: "Perfekt for gründere.", sv: "Perfekt för ensamgrundare.", da: "Perfekt til solostiftere." },
  pro_description: { en: "For growing teams.", no: "For team i vekst.", sv: "För växande team.", da: "Til voksende teams." },
  enterprise_description: { en: "For large organizations.", no: "For større selskaper.", sv: "För större företag.", da: "Til større virksomheder." },
  upgrade_now: { en: "Upgrade Now", no: "Oppgrader nå", sv: "Uppgradera nu", da: "Opgrader nu" },
  full_name: { en: "Full Name", no: "Fullt navn", sv: "Fullständigt namn", da: "Fulde navn" },

  features_title_new: { en: "The Autonomous CRM Engine", no: "Den autonome CRM-motoren", sv: "Den autonoma CRM-motorn", da: "Den autonome CRM-motor" },
  features_subtitle_new: { en: "Discover a feature-complete platform designed to replace five different tools. Every module natively infused with AI.", no: "Oppdag en komplett plattform designet for å erstatte fem forskjellige verktøy. Hver modul er integrert med kunstig intelligens.", sv: "Upptäck en komplett plattform designad för att ersätta fem olika verktyg. Varje modul är integrerad med artificiell intelligens.", da: "Opdag en komplet platform designet til at erstatte fem forskellige værktøjer. Hvert modul er integreret med kunstig intelligens." },
  
  about_paragraph_1: { en: "Aiappsy was born from a simple observation: most CRMs are just glorified spreadsheets that demand more time than they save.", no: "Aiappsy ble født av en enkel observasjon: de fleste CRM-er er bare glorifiserte regneark som krever mer tid enn de sparer.", sv: "Aiappsy föddes från en enkel observation: de flesta CRM är bara glorifierade kalkylblad som kräver mer tid än de sparar.", da: "Aiappsy blev født af en simpel observation: de fleste CRM'er er bare glorificerede regneark, der kræver mere tid, end de sparer." },
  about_paragraph_2: { en: "We built Aiappsy to be the brain of your business. By combining Scandinavian design principles with cutting-edge AI, we've created a tool that feels natural, works tirelessly, and helps you build deeper connections with your customers.", no: "Vi bygde Aiappsy for å være hjernen i virksomheten din. Ved å kombinere skandinaviske designprinsipper med banebrytende AI, har vi skapt et verktøy som føles naturlig, jobber utrettelig og hjelper deg med å bygge dypere forbindelser med kundene dine.", sv: "Vi byggde Aiappsy för att vara hjärnan i ditt företag. Genom att kombinera skandinaviska designprinciper med banbrytande AI har vi skapat ett verktyg som känns naturligt, arbetar outtröttligt och hjälper dig att bygga djupare relationer med dina kunder.", da: "Vi byggede Aiappsy til at være hjernen i din virksomhed. Ved at kombinere skandinaviske designprincipper med banebrydende AI har vi skabt et værktøj, der føles naturligt, arbejder utrætteligt og hjælper dig med at opbygge dybere forbindelser med dine kunder." },
  testimonial_quote: { en: "\"Aiappsy changed how we work.\"", no: "\"Aiappsy endret hvordan vi jobber.\"", sv: "\"Aiappsy ändrade hur vi arbetar.\"", da: "\"Aiappsy ændrede, hvordan vi arbejder.\"" },
  testimonial_author: { en: "— Sarah Jenkins, CEO at FlowState", no: "— Sarah Jenkins, administrerende direktør i FlowState", sv: "— Sarah Jenkins, VD på FlowState", da: "— Sarah Jenkins, administrerende direktør i FlowState" },
  
  learn_more: { en: "Learn More", no: "Lær mer", sv: "Läs mer", da: "Lær mere" },
  ai_capabilities: { en: "AI Capabilities", no: "AI-funksjoner", sv: "AI-funktioner", da: "AI-funktioner" },
  core_features: { en: "Core Features", no: "Kjernefunksjoner", sv: "Kärnfunktioner", da: "Kernefunktioner" },
  get_started_with: { en: "Get Started with", no: "Kom i gang med", sv: "Kom igång med", da: "Kom i gang med" },
  close: { en: "Close", no: "Lukk", sv: "Stäng", da: "Luk" },
  plan: { en: "Plan", no: "Abonnement", sv: "Abonnemang", da: "Abonnement" },
  
  customer_directory: { en: "Customer Directory", no: "Kundekatalog", sv: "Kundkatalog", da: "Kundebibliotek" },
  add_new: { en: "Add New", no: "Legg til ny", sv: "Lägg till ny", da: "Tilføj ny" },
  search_customers_placeholder: { en: "Search by name, industry or risk level...", no: "Søk etter navn, bransje eller risikonivå...", sv: "Sök efter namn, bransch eller risknivå...", da: "Søg efter navn, branche eller risikoniveau..." },
  
  industry: { en: "Industry", no: "Bransje", sv: "Bransch", da: "Branche" },
  risk_level: { en: "Risk", no: "Risiko", sv: "Risk", da: "Risiko" },
  ai_smart_insight: { en: "AI Smart Insight", no: "Smart AI-innsikt", sv: "Smart AI-insikt", da: "Smart AI-indsigt" },
  insight_decrease: { en: "has shown a 40% decrease in platform activity this week.", no: "har vist en 40% nedgang i plattformaktivitet denne uken.", sv: "har visat en 40% minskning av plattformsaktivitet den här veckan.", da: "har vist et fald på 40% i platformaktivitet i denne uge." },
  insight_recommendation: { en: "Recommendation: Schedule a check-in call to discuss retention strategies.", no: "Anbefaling: Planlegg en oppfølgingssamtale for å diskutere strategier for opprettholdelse.", sv: "Rekommendation: Schemalägg ett avstämningssamtal för att diskutera strategier för bibehållande.", da: "Anbefaling: Planlæg et opfølgningsopkald for at diskutere fastholdelsesstrategier." },
  
  
  active_leads: { en: "Active Leads", no: "Aktive leads", sv: "Aktiva leads", da: "Aktive leads" },
  quotes_sent: { en: "Quotes Sent", no: "Tilbud sendt", sv: "Skickade offerter", da: "Tilbud sendt" },
  conversion: { en: "Conversion", no: "Konvertering", sv: "Konvertering", da: "Konvertering" },
  
  trusted_by: { en: "Trusted by next-generation sales teams worldwide", no: "Foretrukket av neste generasjons salgsteam over hele verden", sv: "Betrodd av nästa generations säljteam över hela världen", da: "Stoles på af næste generations salgsteam over hele verden" },
  explore_module: { en: "Module Exploration", no: "Modulutforskning", sv: "Modulutforskning", da: "Moduludforskning" },
  try_feature_free: { en: "Try this feature for free", no: "Prøv denne funksjonen gratis", sv: "Prova denna funktion gratis", da: "Prøv denne funktion gratis" },
  and_more: { en: "more", no: "mer", sv: "mer", da: "mere" },
  
  cat1_title: { en: "Sales & Pipeline Operations", no: "Salg og pipeline-operasjoner", sv: "Försäljning och pipeline-operationer", da: "Salg & Pipeline-operationer" },
  cat1_sub: { en: "Built to close. A modern Kanban that keeps deals moving seamlessly.", no: "Bygget for å avslutte. En moderne Kanban som holder avtaler i bevegelse sømløst.", sv: "Byggd för att stänga. En modern Kanban som håller affärer i rörelse sömlöst.", da: "Bygget til at lukke. En moderne Kanban, der holder aftaler i bevægelse problemfrit." },
  cat1_f1_t: { en: "Visual Kanban Board", no: "Visuelt Kanban-brett", sv: "Visuell Kanban-tavla", da: "Visuelt Kanban-bræt" },
  cat1_f1_d: { en: "Drag-and-drop opportunity management tailored to your process.", no: "Dra-og-slipp mulighetshåndtering tilpasset din prosess.", sv: "Dra-och-släpp möjlighetshantering anpassad till din process.", da: "Træk-og-slip mulighedsadministration skræddersyet til din proces." },
  cat1_f2_t: { en: "Deal Probability Matrix", no: "Avtale-sannsynlighetsmatrise", sv: "Avtal-sannolikhetsmatris", da: "Aftale-sandsynlighedsmatrix" },
  cat1_f2_d: { en: "Track conversion chances across the funnel accurately.", no: "Spor konverteringssjanser over hele trakten nøyaktig.", sv: "Spåra konverteringschanser över hela tratten exakt.", da: "Spor konverteringschancer på tværs af tragten nøjagtigt." },
  cat1_f3_t: { en: "Task & Interaction Timeline", no: "Oppgave- og interaksjonstidslinje", sv: "Uppgifts- och interaktionstidslinje", da: "Opgave- & interaktionstidslinje" },
  cat1_f3_d: { en: "Full history of interactions attached to every customer.", no: "Full historie over interaksjoner knyttet til hver kunde.", sv: "Fullständig historia av interaktioner kopplade till varje kund.", da: "Fuld historie over interaktioner knyttet til hver kunde." },
  cat1_f4_t: { en: "Document Storage", no: "Dokumentlagring", sv: "Dokumentlagring", da: "Dokumentlagring" },
  cat1_f4_d: { en: "Attach PDFs, proposals, and contracts securely.", no: "Legg ved PDF-er, forslag og kontrakter trygt.", sv: "Bifoga PDF-filer, förslag och kontrakt säkert.", da: "Vedhæft PDF'er, forslag og kontrakter sikkert." },
  cat1_f5_t: { en: "Lead Scoring Models", no: "Lead-scoringsmodeller", sv: "Lead-scoringsmodeller", da: "Lead-scoringsmodeller" },
  cat1_f5_d: { en: "BANT, MEDDIC, and CHAMP methodologies built natively in.", no: "BANT, MEDDIC og CHAMP metoder bygget inn naturlig.", sv: "BANT, MEDDIC och CHAMP metoder inbyggda från början.", da: "BANT, MEDDIC og CHAMP metoder indbygget oprindeligt." },

  cat2_title: { en: "Autonomous Agent", no: "Autonom agent", sv: "Autonom agent", da: "Autonom agent" },
  cat2_sub: { en: "Your proactive AI copilot that does the heavy lifting.", no: "Din proaktive AI-medpilot som gjør de tunge løftene.", sv: "Din proaktiva AI-copilot som gör de tunga lyften.", da: "Din proaktive AI-copilot, der gør det tunge arbejde." },
  cat2_f1_t: { en: "Text & Voice Execution", no: "Tekst- og taleutførelse", sv: "Text- och röstutförande", da: "Tekst- & stemmeudførelse" },
  cat2_f1_d: { en: "Tell the AI 'draft a quote' and watch the UI update instantly.", no: "Fortell AI-en å 'lag et utkast til et tilbud' og se at UI-en oppdateres umiddelbart.", sv: "Säg åt AI:n att 'utkasta en offert' och se gränssnittet uppdateras direkt.", da: "Fortæl AI'en om at 'udkaste et tilbud' og se brugergrænsefladen opdatere med det samme." },
  cat2_f2_t: { en: "Generative Workflows", no: "Generative arbeidsflyter", sv: "Generativa arbetsflöden", da: "Generative arbejdsgange" },
  cat2_f2_d: { en: "Draft highly contextual email proposals for any prospect.", no: "Utkast høyst kontekstuelle e-postforslag for enhver potensiell kunde.", sv: "Utkast högst kontextuella e-postförslag för varje prospekt.", da: "Udkast meget kontekstuelle e-mail-forslag for enhver potentiel kunde." },
  cat2_f3_t: { en: "Auto Data Hygiene", no: "Automatisert datahygiene", sv: "Automatiserad datahygien", da: "Automatiseret datahygiejne" },
  cat2_f3_d: { en: "Cleanse formatting, enrich data, and merge hidden duplicates.", no: "Rens formatering, berik data og slå sammen skjulte duplikater.", sv: "Rensa formatering, berika data och slå samman dolda dubbletter.", da: "Rens formatering, berig data og flet skjulte dubletter." },
  cat2_f4_t: { en: "Automated Workflows", no: "Automatiserte arbeidsflyter", sv: "Automatiserade arbetsflöden", da: "Automatiserede arbejdsgange" },
  cat2_f4_d: { en: "Trigger actions natively across the CRM to keep deals moving.", no: "Utløs handlinger på tvers av CRM.", sv: "Utlös åtgärder överallt i CRM.", da: "Udløs handlinger på tværs af CRM." },
  cat2_f5_t: { en: "Smart Meeting Prep", no: "Smart møteforberedelse", sv: "Smart mötesförberedelse", da: "Smart mødeforberedelse" },
  cat2_f5_d: { en: "Auto-generates briefing documents before your scheduled calls.", no: "Genererer briefingdokumenter automatisk før dine planlagte samtaler.", sv: "Automatgenererar briefingdokument innan dina inplanerade samtal.", da: "Genererer automatisk briefingdokumenter før dine planlagte opkald." },

  cat3_title: { en: "Billing & Invoicing", no: "Fakturering og betaling", sv: "Fakturering och betalning", da: "Fakturering og betaling" },
  cat3_sub: { en: "Accelerate your quote-to-cash lifecycle.", no: "Akselerer din tilbud-til-kontant livssyklus.", sv: "Öka hastigheten på din offert-till-kassa livscykel.", da: "Accelerer din tilbud-til-kontant livscyklus." },
  cat3_f1_t: { en: "Stripe & PayPal Native", no: "Stripe og PayPal integrert", sv: "Stripe och PayPal integrerat", da: "Stripe og PayPal integreret" },
  cat3_f1_d: { en: "Generate direct payment links so clients can pay in one click.", no: "Generer direkte betalingskoblinger slik at kundene kan betale med ett klikk.", sv: "Generera direktbetalningslänkar så att kunder kan betala med ett klick.", da: "Generer direkte betalingslinks, så klienter kan betale med et enkelt klik." },
  cat3_f2_t: { en: "Instant PDF Quotes", no: "Øyeblikkelige PDF-tilbud", sv: "Omedelbara PDF-offerter", da: "Øjeblikkelige PDF-tilbud" },
  cat3_f2_d: { en: "Send beautiful, branded visual proposals straight from the CRM.", no: "Send nydelige, merkevarebyggende visuelle forslag rett fra CRM.", sv: "Skicka vackra, visuella förslag med varumärke direkt från CRM.", da: "Send smukke, visuelle forslag med brand direkte fra CRM." },
  cat3_f3_t: { en: "Multi-Currency Support", no: "Støtte for flere valutaer", sv: "Stöd för flera valutor", da: "Støtte for flere valutaer" },
  cat3_f3_d: { en: "Native billing in USD, EUR, NOK, SEK, DKK handling live rates.", no: "Innebygd fakturering i USD, EUR, NOK, SEK, DKK som håndterer live priser.", sv: "Inbyggd fakturering i USD, EUR, NOK, SEK, DKK som hanterar live-priser.", da: "Indbygget fakturering i USD, EUR, NOK, SEK, DKK med live kurser." },
  cat3_f4_t: { en: "Centralized Product Catalog", no: "Sentralisert produktkatalog", sv: "Centraliserad produktkatalog", da: "Centraliseret produktkatalog" },
  cat3_f4_d: { en: "Pull SKUs instantly into line items to reduce manual entry.", no: "Trekk SKU-er umiddelbart inn i varelinjer for å redusere manuell oppføring.", sv: "Dra SKU:er omedelbart in i orderrader för att minska manuell inmatning.", da: "Træk SKU'er øjeblikkeligt ind i ordrelinjer for at reducere manuel indtastning." },

  cat4_title: { en: "Intelligence & Forecasting", no: "Intelligens og prognoser", sv: "Intelligens och prognoser", da: "Intelligens og prognoser" },
  cat4_sub: { en: "See the exact future of your recurring revenue.", no: "Se den nøyaktige fremtiden til dine gjentakende inntekter.", sv: "Se den exakta framtiden för dina återkommande intäkter.", da: "Se den nøjagtige fremtid for dine tilbagevendende indtægter." },
  cat4_f1_t: { en: "Revenue Projections", no: "Inntekts-prognoser", sv: "Inkomstprognoser", da: "Indtægtsprognoser" },
  cat4_f1_d: { en: "AI predicts your likely quarterly MRR based on deal velocity.", no: "AI forutsier din sannsynlige kvartalsvise MRR basert på avtalehastighet.", sv: "AI förutsäger din sannolika kvartalsvisa MRR baserat på avtalshastighet.", da: "AI forudsiger din sandsynlige kvartalsvise MRR baseret på aftalehastighed." },
  cat4_f2_t: { en: "Churn Risk Heatmap", no: "Churn-risiko varmekart", sv: "Churn-risk värmekarta", da: "Churn-risiko varmekort" },
  cat4_f2_d: { en: "Proactively flag stalled accounts before they churn.", no: "Flagge stoppede kontoer proaktivt før de churner.", sv: "Flagga stannade konton proaktivt innan de churnar.", da: "Flag aktivt inaktive konti, før de churner." },
  cat4_f3_t: { en: "Conversational Analytics", no: "Konversasjonsanalyse", sv: "Konversationsanalys", da: "Konversationsanalyse" },
  cat4_f3_d: { en: "Ask database questions in plain language (e.g., 'What is Q2 revenue?').", no: "Still spørsmål om database i vanlig språkbruk (f.eks., 'Hva er Q2-inntekten?').", sv: "Ställ frågor om databasen med vanligt språk (t.ex. 'Vad är intäkten för Q2?').", da: "Stil spørgsmål til databasen i almindeligt sprog (f.eks. 'Hvad er Q2-indtægten?')." },
  cat4_f4_t: { en: "Automated QBRs", no: "Automatiserte QBR-er", sv: "Automatiserade QBR", da: "Automatiserede QBR'er" },
  cat4_f4_d: { en: "Intelligent prompts to schedule critical Quarterly Business Reviews.", no: "Intelligente påminnelser for å planlegge kritiske Quarterly Business Reviews.", sv: "Intelligenta påminnelser för att schemalägga viktiga Quarterly Business Reviews.", da: "Intelligente opfordringer til at planlægge vigtige Quarterly Business Reviews." },
  cat4_f5_t: { en: "Intelligence Hub", no: "Intelligenssenter", sv: "Intelligensnav", da: "Intelligenscenter" },
  cat4_f5_d: { en: "Upload documents to generate AI study guides and audio briefings for accounts.", no: "Last opp dokumenter for å bygge huben.", sv: "Ladda upp dokument för att bygga navet.", da: "Upload dokumenter for at bygge centeret." },
  cat4_f6_t: { en: "Lead Scoring", no: "Lead-scoring", sv: "Lead-poäng", da: "Lead-scoring" },
  cat4_f6_d: { en: "BANT & MEDDIC frameworks natively evaluate and rank your prospects.", no: "BANT & MEDDIC evaluerer prospektene dine.", sv: "BANT & MEDDIC utvärderar dina prospekt.", da: "BANT & MEDDIC evaluerer dine leads." },

  cat5_title: { en: "Enterprise Ready Scale", no: "Bedriftsklar skala", sv: "Företagsklar skala", da: "Virksomhedsklar skala" },
  cat5_sub: { en: "Secure infrastructure, compliant, and deeply localized.", no: "Sikker infrastruktur, overholdende og dypt lokalisert.", sv: "Säker infrastruktur, kompatibel och djupt lokaliserad.", da: "Sikker infrastruktur, overholdende og dybt lokaliseret." },
  cat5_f1_t: { en: "Bring Your Own Key (BYOK)", no: "Ta med din egen nøkkel (BYOK)", sv: "Ta med din egen nyckel (BYOK)", da: "Medbring din egen nøgle (BYOK)" },
  cat5_f1_d: { en: "Unlimited AI token usage via your own custom API infrastructure.", no: "Ubegrenset bruk av AI-token via din egen egendefinerte API-infrastruktur.", sv: "Obegränsad användning av AI-token via din egen anpassade API-infrastruktur.", da: "Ubegrænset brug af AI-token via din egen tilpassede API-infrastruktur." },
  cat5_f2_t: { en: "SMTP Domain Integration", no: "SMTP-domeneintegrasjon", sv: "SMTP-domänintegration", da: "SMTP-domæneintegration" },
  cat5_f2_d: { en: "Send automated outreach natively from your actual business domain.", no: "Send automatisert utgående naturlig fra ditt faktiske bedriftsdomene.", sv: "Skicka automatiserade utskick naturligt från din faktiska företagsdomän.", da: "Send automatiseret opsøgende naturligt från dit faktiske forretningsdomæne." },
  cat5_f3_t: { en: "Multilingual Engine", no: "Flerspråklig motor", sv: "Flerspråkig motor", da: "Flersproget motor" },
  cat5_f3_d: { en: "Fluidly localized into English, Norsk, Svenska, and Dansk.", no: "Smidig lokalisert til engelsk, norsk, svensk og dansk.", sv: "Smidigt lokaliserat till engelska, norska, svenska och danska.", da: "Flydende lokaliseret til engelsk, norsk, svensk og dansk." },
  cat5_f4_t: { en: "Role-Based Access", no: "Rollebasert tilgang", sv: "Rollbaserad åtkomst", da: "Rollebaseret adgang" },
  cat5_f4_d: { en: "Bank-grade authentication and strict team permissions via Firebase.", no: "Bankgrad-autentisering og strenge teamtillatelser via Firebase.", sv: "Bankgrad-autentisering och stränga teamrättigheter via Firebase.", da: "Bankgrad-godkendelse og strenge teamrettigheder via Firebase." },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  const t = (key: string): string => {
    if (!translations[key]) {
      // Return the key itself as a fallback to prevent crash and clearly show what's missing
      return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return translations[key][language] || translations[key]["en"];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
