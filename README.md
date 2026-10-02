# Votranse — Voice Translator

Votranse is a voice-translation communication app. The interface is English by default, with language selection including Kinyarwanda and many other languages.

## Included
- Chat / Messages
- Call screen with phone number
- Select Language (call-only)
- Magic Voice
- Voice recognition + speech output
- Group
- Profile / Edit / Share
- Phone authentication-ready Supabase setup
- Storage / profile bucket SQL
- Render deployment configuration

## Run
1. `npm install`
2. Create `.env`:
   `VITE_SUPABASE_URL=...`
   `VITE_SUPABASE_ANON_KEY=...`
   `VITE_TRANSLATION_URL=...` (optional translation API endpoint)
3. `npm run dev`

## Render
Static site. Use `render.yaml` or create a Static Site:
Build command: `npm install && npm run build`
Publish directory: `dist`

## Important
Browser permissions for microphone, location and contacts depend on the device/browser. Real phone calling and production-grade live call audio translation require a telephony/WebRTC provider and a translation API; this project provides the complete UI and integration points without embedding private API keys.
