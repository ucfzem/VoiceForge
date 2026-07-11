# VoiceForge — Session Backup

**Date:** July 11, 2026
**Repo:** https://github.com/ucfzem/VoiceForge
**Live:** https://voiceforge-delta.vercel.app

---

## Summary

### Problem
EchoVault (original) used Soniox STT + Gemini API. Gemini had CORS issues and free quota limits (429 errors).

### Solution
Built **VoiceForge** from scratch — a free Speech-to-Article web app with:

- **Web Speech API** (browser native STT) — free, no API key, no CORS
- **Groq API** (Llama 3.3 70B) for structuring transcripts into polished articles
- **Vercel serverless function** (`api/groq.js`) as a proxy to avoid CORS

### Features Added (in order)
1. Core app with Web Speech API + Groq proxy
2. Save button for Groq key (localStorage persistence)
3. Copy-to-clipboard + Download as .md buttons
4. Language selector (EN, FR, ES, AR) with Moroccan flag for Arabic
5. Full i18n — all UI text translated into 4 languages
6. RTL support for Arabic (no layout breaking)
7. Dark/Light theme toggle (moon/sun icons)
   - Dark: brown/gold/yellow/white
   - Light: beige/brown/gold


### Deployments
| App | URL | Repo |
|---|---|---|
| **EchoVault** (original) | https://echovault-zeta.vercel.app | https://github.com/ucfzem/EchoVault |
| **VoiceForge** (new) | https://voiceforge-delta.vercel.app | https://github.com/ucfzem/VoiceForge |
| **UcfZem Works** (link tree) | https://ucfzem.github.io/works/ | https://github.com/ucfzem/ucfzem.github.io |

### File Structure
```
echovault2/
├── index.html      — Main app (all UI + logic)
├── api/groq.js     — Vercel serverless proxy to Groq API
├── vercel.json     — Vercel config
└── BACKUP.md       — This file
```

### VoiceForge added to Link Tree
- Located at https://ucfzem.github.io/works/ in the **locked projects** section (password-protected)
- Positioned in the middle: between "AI Image Enhancer" and "4lang Quiz"
- Icon: 🎙️ (microphone)

### How to Use VoiceForge
1. Open https://voiceforge-delta.vercel.app
2. Get a free Groq key at https://console.groq.com/keys (no credit card)
3. Paste key in the field and click Save
4. Select language (EN/FR/ES/AR)
5. Click the microphone, start speaking
6. Click stop — article generates instantly

### How to Deploy Updates
```bash
git push
# Vercel auto-deploys from GitHub main branch
```
