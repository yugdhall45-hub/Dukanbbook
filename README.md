# 🤖 JARVIS AI Assistant

> *Just A Rather Very Intelligent System*

A **voice-enabled** personal AI assistant built in Python, inspired by Iron Man's JARVIS. It uses Google Gemini for intelligent conversation and supports a wide range of voice commands.

---

## ✨ Features

| Category | Commands |
|---|---|
| 🕐 **Time & Date** | "What's the time?", "Today's date?" |
| 🌦 **Weather** | "Weather in Mumbai", "What's the weather?" |
| 🌐 **Web Search** | "Search Python tutorials", "Google machine learning" |
| 📺 **YouTube** | "Play shape of you", "YouTube lo-fi music" |
| 📖 **Wikipedia** | "Wikipedia Albert Einstein", "Tell me about black holes" |
| 🖥 **Open Apps** | "Open Notepad", "Open Chrome", "Open VS Code" |
| 🌍 **Open Sites** | "Open GitHub", "Open Gmail", "Open WhatsApp" |
| 📝 **Notes** | "Take note buy milk", "Read my notes" |
| 😂 **Jokes** | "Tell me a joke", "Make me laugh" |
| 🔧 **System** | "Lock the computer", "Restart", "Shutdown" |
| 🤖 **AI Chat** | Anything else → Powered by Google Gemini |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

> **Note:** PyAudio on Windows may need a pre-built wheel:
> ```bash
> pip install pipwin
> pipwin install pyaudio
> ```

### 2. Configure API Keys
```bash
# Copy the template
copy .env.example .env
# Edit .env and add your API keys
```

Get free API keys:
- **Gemini AI**: https://aistudio.google.com/app/apikey
- **Weather**: https://openweathermap.org/api

### 3. Run JARVIS
```bash
python jarvis.py
```

---

## 🗂 Project Structure

```
JARVIS_AI/
├── jarvis.py         ← Main assistant (run this)
├── requirements.txt  ← Python dependencies
├── .env.example      ← API key template
├── .env              ← Your actual keys (create from template)
├── notes.txt         ← Auto-created when you take notes
└── README.md         ← This file
```

---

## 💡 Tips

- **No microphone?** — JARVIS falls back to keyboard input automatically.
- **No Gemini key?** — All built-in commands still work; only AI chat is disabled.
- **Wake word** — By default JARVIS listens continuously. The wake-word (`jarvis`) check is optional and commented out in the code.

---

*Built with ❤️ using Python, Google Gemini, SpeechRecognition, and pyttsx3*
