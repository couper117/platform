# RwaSport — Admin User Manual

## 1. Introduction
Welcome to RwaSport Admin. This manual covers core management tasks.

## 2. Admin Roles
- **Superadmin:** Global access to everything.
- **League Admin:** Manages specific leagues, teams, and delegates match reporters.
- **Match Reporter:** Access to the Live Reporting portal for match-day logging.

## 3. Core Tasks
### Managing Leagues & Admins
- Go to **Admin > Leagues**. 
- Use the **Shield icon** to assign a League Admin by email.
- Use the **UserPlus icon** to assign a Match Reporter to a specific match.

### Scheduling Matches
- Use the **Schedule Management** dashboard. 
- Click **New Fixture**, choose teams, set date, and venue.

### Verifying Teams & Players
- **Teams:** Use the **Team Verification** page to set team status to `VERIFIED`.
- **Players:** Use the **Document Review** page. Approve required documents (ID, Passport, Medical) to trigger auto-verification.

### Publishing Content
- Use **News Publisher** to create featured announcements.

### Ad Monetization
- Use the **Sponsorship Center** to upload ad banners and select their positions (e.g., `HOME_BANNER`).

### The AI Assistant
The floating assistant in the bottom-right corner of the site answers visitors'
questions about the platform — sports, clubs, athletes, fixtures, results,
standings, venues, school competitions and how to use the app. It answers only
from RwaSport's own records, and politely declines anything unrelated.

Configure it at **Admin > AI Assistant** (Super Admin only):

- **Switch it on or off.** Off hides it from every page immediately.
- **Choose a provider.** Google Gemini is the default. OpenAI, Anthropic,
  OpenRouter, Groq, Mistral, DeepSeek and a self-hosted Ollama server are also
  supported; each needs only its own API key.
- **Enter the API key.** It is encrypted before it is stored and is never sent
  back to a browser — the page shows only the last four characters. Leaving the
  field blank keeps the key already in place; **Clear** removes it. A key set as
  a server environment variable is shown as such and cannot be edited here.
- **Pick a model.** Press **Fetch models** and choose from what that key can
  actually reach, rather than typing an ID. If the chosen model is later
  withdrawn by the provider, the platform moves to the closest working one on its
  own and records the change.
- **Tune the behaviour.** Creativity (keep it low — the assistant quotes
  records), longest reply, how many turns of a conversation it remembers, and how
  much platform data is attached to each question. **House style** adds your own
  standing instructions.
- **Test the connection.** This lists the models the key can reach and then sends
  a real request, so it catches a key that is valid but has no billing or no
  access to the chosen model. It tests what is currently typed, so a new key can
  be checked before it replaces a working one.
- **What visitors see.** The assistant's name, its opening message and the
  suggested questions in the chat window.

**Privacy.** Questions and answers are not stored. Each question is answered
against records read from the database at that moment, and only what the public
site already publishes is sent to the provider — never identity or licence
numbers, dates of birth, telephone numbers, e-mail addresses, or the Amashuri
school athletes' records.
