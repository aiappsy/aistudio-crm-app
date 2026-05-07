import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "en" | "no" | "sv" | "da";

interface Translations {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translations = {
  // Sidebar
  dashboard: { en: "Dashboard", no: "Oversikt", sv: "Instrumentpanel", da: "Oversigt" },
  contacts: { en: "Contacts", no: "Kontakter", sv: "Kontakter", da: "Kontakter" },
  customers: { en: "Customers", no: "Kunder", sv: "Kunder", da: "Kunder" },
  suppliers: { en: "Suppliers", no: "Leverandører", sv: "Leverantörer", da: "Leverandører" },
  custom_types: { en: "Custom Types", no: "Egendefinerte typer", sv: "Anpassade typer", da: "Brugerdefinerede typer" },
  pipeline: { en: "Pipeline", no: "Salgsprosess", sv: "Pipeline", da: "Pipeline" },
  quotes: { en: "Quotes", no: "Tilbud", sv: "Offerter", da: "Tilbud" },
  invoices: { en: "Invoices", no: "Fakturaer", sv: "Fakturor", da: "Fakturaer" },
  products: { en: "Products", no: "Produkter", sv: "Produkter", da: "Produkter" },
  payments: { en: "Payments", no: "Betalinger", sv: "Betalningar", da: "Betalinger" },
  outreach: { en: "Outreach", no: "Oppfølging", sv: "Uppsökande", da: "Opsøgende" },
  reports: { en: "Reports", no: "Rapporter", sv: "Rapporter", da: "Rapporter" },
  settings: { en: "Settings", no: "Innstillinger", sv: "Inställningar", da: "Indstillinger" },
  
  // Dashboard
  welcome_back: { en: "Welcome back", no: "Velkommen tilbake", sv: "Välkommen tillbaka", da: "Velkommen tilbage" },
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
    no: "Hei! Jeg er din Aiappsy CRM-assistent. Jeg kan hjelpe deg med å administrere kunder, opprette fakturaer og sende oppfølgingsmeldinger. Hvordan kan jeg hjelpe deg i dag?", 
    sv: "Hej! Jag är din Aiappsy CRM-assistent. Jag kan hjälpa dig att hantera kunder, skapa fakturor och skicka uppsökande meddelanden. Hur kan jag hjälpa dig idag?", 
    da: "Hej! Jeg er din Aiappsy CRM-assistent. Jeg kan hjælpe dig med at administrere kunder, oprette fakturaer og sende opsøgende beskeder. Hvordan kan jeg hjælpe dig i dag?" 
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
    en: "The dashboard provides a high-level overview of your business performance, including total revenue, customer growth, and active invoices. AI Smart Insights offer automated analysis of your data.",
    no: "Oversikten gir en overordnet oversikt over virksomhetens ytelse, inkludert total omsetning, kundevekst og aktive fakturaer. Smarte AI-innsikter gir automatisk analyse av dataene dine.",
    sv: "Instrumentpanelen ger en övergripande översikt över ditt företags resultat, inklusive totala intäkter, kundtillväxt och aktiva fakturor. Smarta AI-insikter erbjuder automatiserad analys av dina data.",
    da: "Oversigten giver et overordnet overblik over din virksomheds præstationer, herunder samlet omsætning, kundevækst og aktive fakturaer. Smarte AI-indsigter tilbyder automatiseret analyse af dine data."
  },
  help_customers_title: { en: "Customers", no: "Kunder", sv: "Kunder", da: "Kunder" },
  help_customers_content: {
    en: "Manage your client list here. You can add new customers manually or import them from a CSV file. Track their status from leads to active clients.",
    no: "Administrer kundelisten din her. Du kan legge til nye kunder manuelt eller importere dem fra en CSV-fil. Spor statusen deres fra leads til aktive kunder.",
    sv: "Hantera din kundlista här. Du kan lägga till nya kunder manuellt eller importera dem från en CSV-fil. Spåra deras status från leads till aktiva kunder.",
    da: "Administrer din kundeliste her. Du kan tilføje nye kunder manuelt eller importere dem fra en CSV-fil. Spor deres status fra leads til aktive kunder."
  },
  help_quotes_title: { en: "Quotes", no: "Tilbud", sv: "Offerter", da: "Tilbud" },
  help_quotes_content: {
    en: "Create and manage price estimates for potential projects. Quotes can be accepted by customers and later converted into invoices.",
    no: "Opprett og administrer pristilbud for potensielle prosjekter. Tilbud kan aksepteres av kunder og senere konverteres til fakturaer.",
    sv: "Skapa och hantera offerter för potentiella projekt. Offerter kan accepteras av kunder och senare konverteras till fakturor.",
    da: "Opret og administrer pristilbud til potentielle projekter. Tilbud kan accepteres af kunder og senere konverteres til fakturaer."
  },
  help_invoices_title: { en: "Invoices", no: "Fakturaer", sv: "Fakturor", da: "Fakturaer" },
  help_invoices_content: {
    en: "Generate professional invoices for your services. Track payment status (Pending, Paid, Overdue) and manage your billing cycle.",
    no: "Generer profesjonelle fakturaer for tjenestene dine. Spor betalingsstatus (Venter, Betalt, Forfalt) og administrer faktureringssyklusen din.",
    sv: "Generera professionella fakturor för dina tjänster. Spåra betalningsstatus (Väntar, Betald, Förfallen) och hantera din faktureringscykel.",
    da: "Generer professionelle fakturaer for dine tjenester. Spor betalingsstatus (Afventer, Betalt, Forfaldet) og administrer din faktureringscyklus."
  },
  help_products_title: { en: "Products", no: "Produkter", sv: "Produkter", da: "Produkter" },
  help_products_content: {
    en: "Maintain your product and service catalog. Configure VAT rates based on product types and regions to ensure accurate tax calculation on invoices.",
    no: "Vedlikehold produkt- og tjenestekatalogen din. Konfigurer MVA-satser basert på produkttyper og regioner for å sikre nøyaktig avgiftsberegning på fakturaer.",
    sv: "Underhåll din produkt- och tjänstekatalog. Konfigurera momssatser baserat på produkttyper och regioner för att säkerställa korrekt skatteberäkning på fakturor.",
    da: "Vedligehold dit produkt- og servicekatalog. Konfigurer momssatser baseret på produkttyper og regioner for at sikre nøjagtig afgiftsberegning på fakturaer."
  },
  help_payments_title: { en: "Payments", no: "Betalinger", sv: "Betalningar", da: "Betalinger" },
  help_payments_content: {
    en: "Record incoming payments from your customers. Link payments to specific invoices to keep your financial records up to date.",
    no: "Registrer innkommende betalinger fra kundene dine. Koble betalinger til spesifikke fakturaer for å holde regnskapet oppdatert.",
    sv: "Registrera inkommande betalningar från dina kunder. Koppla betalningar till specifika fakturor för att hålla dina finansiella register uppdaterade.",
    da: "Registrer indgående betalinger fra dine kunder. Knyt betalinger til specifikke fakturaer for at holde dine økonomiske optegnelser opdateret."
  },
  help_outreach_title: { en: "Outreach", no: "Oppfølging", sv: "Uppsökande", da: "Opsøgende" },
  help_outreach_content: {
    en: "Communicate with your customers via Email or WhatsApp. Track your outreach history and maintain strong customer relationships.",
    no: "Kommuniser med kundene dine via e-post eller WhatsApp. Spor oppfølgingshistorikken din og oppretthold sterke kunderelasjoner.",
    sv: "Kommunicera med dina kunder via e-post eller WhatsApp. Spåra din uppsökande historik och upprätthåll starka kundrelationer.",
    da: "Kommuniker med dine kunder via e-mail eller WhatsApp. Spor din opsøgende historik og oprethold stærke kunderelationer."
  },
  help_reports_title: { en: "Reports", no: "Rapporter", sv: "Rapporter", da: "Rapporter" },
  help_reports_content: {
    en: "Analyze your business with detailed reports. Visualize revenue by customer, lead distribution, and invoice status overviews.",
    no: "Analyser virksomheten din med detaljerte rapporter. Visualiser omsetning per kunde, lead-fordeling og oversikt over fakturastatus.",
    sv: "Analysera ditt företag med detaljerade rapporter. Visualisera intäkter per kund, lead-fördelning och översikter över fakturastatus.",
    da: "Analyser din virksomhed med detaljerede rapporter. Visualiser omsætning pr. kunde, lead-fordeling og oversigter over fakturastatus."
  },
  help_settings_title: { en: "Settings", no: "Innstillinger", sv: "Inställningar", da: "Indstillinger" },
  help_settings_content: {
    en: "Configure your company profile, VAT region, and AI preferences. Set up your SMTP server to enable outreach emails directly from the app.",
    no: "Konfigurer firmaprofilen din, MVA-region og AI-preferanser. Sett opp SMTP-serveren din for å aktivere oppfølgings-e-poster direkte fra appen.",
    sv: "Konfigurera din företagsprofil, momsregion och AI-preferenser. Konfigurera din SMTP-server för att aktivera uppsökande e-postmeddelanden direkt från appen.",
    da: "Konfigurer din virksomhedsprofil, momsregion og AI-præferencer. Konfigurer din SMTP-server for at aktivere opsøgende e-mails direkte fra appen."
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
  hero_title_1: { en: "Close more", no: "Vinn flere", sv: "Landa fler", da: "Vind flere" },
  hero_title_2: { en: "Deals", no: "avtaler", sv: "affärer", da: "aftaler" },
  hero_title_3: { en: "with AI.", no: "med AI.", sv: "med AI.", da: "med AI." },
  hero_subtitle: { 
    en: "Aiappsy is the first CRM that doesn't just store data—it acts on it. Automate your outreach, research competitors, and generate professional quotes in seconds.",
    no: "Aiappsy er det første CRM-systemet som ikke bare lagrer data – det handler på dem. Automatiser oppfølging, undersøk konkurrenter og generer profesjonelle tilbud på sekunder.",
    sv: "Aiappsy är det första CRM-systemet som inte bara lagrar data – det agerar på den. Automatisera din uppsökande verksamhet, undersök konkurrenter och generera professionella offerter på sekunder.",
    da: "Aiappsy er det første CRM-system, der ikke bare gemmer data – det handler på dem. Automatiser din opsøgende indsats, undersøg konkurrenter og generer professionelle tilbud på sekunder."
  },
  start_for_free: { en: "Start for Free", no: "Start gratis", sv: "Starta gratis", da: "Start gratis" },
  features_title: { en: "Built for the next generation of sales", no: "Bygget for neste generasjon salg", sv: "Byggd för nästa generations försäljning", da: "Bygget til næste generation af salg" },
  features_subtitle: { en: "Stop fighting your CRM and start closing deals. Aiappsy handles the busy work so you can focus on relationships.", no: "Slutt å kjempe mot CRM-et ditt og begynn å lukke avtaler. Aiappsy håndterer det travle arbeidet slik at du kan fokusere på relasjoner.", sv: "Sluta kämpa mot ditt CRM och börja stänga affärer. Aiappsy hanterar det upptagna arbetet så att du kan fokusera på relationer.", da: "Stop med at kæmpe mod dit CRM og begynd at lukke aftaler. Aiappsy håndterer det travle arbejde, så du kan fokusere på relationer." },
  pricing_title: { en: "Simple, transparent pricing", no: "Enkle, transparente priser", sv: "Enkla, transparenta priser", da: "Enkle, gennemsigtige priser" },
  pricing_subtitle: { en: "Scale your business without the hidden fees.", no: "Skaler virksomheten din uten skjulte avgifter.", sv: "Skala din verksamhet utan dolda avgifter.", da: "Skaler din virksomhed uden skjulte gebyrer." },
  about_title_1: { en: "We're on a mission to", no: "Vi har et oppdrag om å", sv: "Vi har ett uppdrag att", da: "Vi har en mission om at" },
  about_title_2: { en: "humanize", no: "menneskeliggjøre", sv: "förmänskliga", da: "menneskeliggøre" },
  about_title_3: { en: "business.", no: "virksomhet.", sv: "affärer.", da: "forretning." },

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
  visual_sales_pipeline: { en: "Visual sales pipeline. Drag and drop to update status.", no: "Visuell salgsprosess. Dra og slipp for å oppdatere status.", sv: "Visuell försäljningsprocess. Dra och släpp för att uppdatera status.", da: "Visuel salgsproces. Træk og slip for at opdatere status." },
  new_deal: { en: "New Deal", no: "Ny avtale", sv: "Ny affär", da: "Ny aftale" },
  add_new_deal: { en: "Add New Deal", no: "Legg til ny avtale", sv: "Lägg till ny affär", da: "Tilføj ny aftale" },
  create_new_prospect: { en: "Create a new prospect for your pipeline.", no: "Opprett et nytt prospekt for salgsprosessen din.", sv: "Skapa ett nytt prospekt för din pipeline.", da: "Opret et nyt prospekt til din pipeline." },
  contact_name: { en: "Contact Name", no: "Kontaktnavn", sv: "Kontaktnamn", da: "Kontaktnavn" },
  pipeline_stage: { en: "Pipeline Stage", no: "Fase i salgsprosess", sv: "Pipeline-fas", da: "Pipeline-fase" },
  save_deal: { en: "Save Deal", no: "Lagre avtale", sv: "Spara affär", da: "Gem aftale" },
  
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
  ai_token_balance: { en: "AI Token Balance", no: "AI-tokenssaldo", sv: "AI-tokensaldo", da: "AI-tokensaldo" },
  ai_configuration_byok: { en: "AI Configuration (BYOK)", no: "AI-konfigurasjon (BYOK)", sv: "AI-konfiguration (BYOK)", da: "AI-konfiguration (BYOK)" },
  get_free_gemini_key: { en: "Get a free Gemini API key from Google AI Studio", no: "Få en gratis Gemini API-nøkkel fra Google AI Studio", sv: "Få en gratis Gemini API-nyckel från Google AI Studio", da: "Få en gratis Gemini API-nøgle fra Google AI Studio" },
  default_currency: { en: "Default Currency", no: "Standardvaluta", sv: "Standardvaluta", da: "Standardvaluta" },

  // Auth checks
  auth_required_products: { en: "You need to be authenticated to manage products.", no: "Du må være logget inn for å administrere produkter.", sv: "Du måste vara inloggad för att hantera produkter.", da: "Du skal være logget ind for at administrere produkter." },
  auth_required_payments: { en: "You need to be authenticated to manage payments.", no: "Du må være logget inn for å administrere betalinger.", sv: "Du måste vara inloggad för att hantera betalningar.", da: "Du skal være logget ind for at administrere betalinger." },
  auth_required_contacts: { en: "You need to be authenticated to manage contacts.", no: "Du må være logget inn for å administrere kontakter.", sv: "Du måste vara inloggad för att hantera kontakter.", da: "Du skal være logget ind for at administrere kontakter." },
  auth_required_pipeline: { en: "You need to be authenticated to manage pipeline.", no: "Du må være logget inn for å administrere salgsprosessen.", sv: "Du måste vara inloggad för att hantera din pipeline.", da: "Du skal være logget ind for at administrere din pipeline." },
  
  // Extra Landing text
  contact_sales: { en: "Contact Sales", no: "Kontakt salg", sv: "Kontakta sälj", da: "Kontakt salg" },
  free_description: { en: "Perfect for solo founders.", no: "Perfekt for enslige gründere.", sv: "Perfekt för ensamgrundare.", da: "Perfekt for solostiftere." },
  pro_description: { en: "For growing teams.", no: "For voksende team.", sv: "För växande team.", da: "Til voksende teams." },
  enterprise_description: { en: "For large organizations.", no: "For store organisasjoner.", sv: "För stora organisationer.", da: "Til store organisationer." },
  upgrade_now: { en: "Upgrade Now", no: "Oppgrader nå", sv: "Uppgradera nu", da: "Opgrader nu" }
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
      console.warn(`Translation key not found: ${key}`);
      return key;
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
