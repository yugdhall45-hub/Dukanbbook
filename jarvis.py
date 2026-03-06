"""
 ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗
     ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝
     ██║███████║██████╔╝██║   ██║██║███████╗
██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║
╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝
      Just A Rather Very Intelligent System
             Built by the User | 2026
"""

import os
import sys
import time
import datetime
import webbrowser
import subprocess
import threading
import random
import json
import re

# --------------- Optional imports (will warn if missing) ---------------
try:
    import speech_recognition as sr
    SPEECH_OK = True
except ImportError:
    SPEECH_OK = False
    print("[WARN] SpeechRecognition not installed. Voice input disabled.")

try:
    import pyttsx3
    TTS_OK = True
except ImportError:
    TTS_OK = False
    print("[WARN] pyttsx3 not installed. Voice output disabled.")

try:
    import wikipedia
    WIKI_OK = True
except ImportError:
    WIKI_OK = False

try:
    import requests
    REQUESTS_OK = True
except ImportError:
    REQUESTS_OK = False

try:
    import anthropic
    CLAUDE_OK = True
except ImportError:
    CLAUDE_OK = False

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ─────────────────────────────────────────────────────────────────────
#  CONFIGURATION
# ─────────────────────────────────────────────────────────────────────
WAKE_WORD        = "jarvis"
ASSISTANT_NAME   = "JARVIS"
USER_NAME        = os.getenv("USER_NAME", "Sir")
CLAUDE_API_KEY   = os.getenv("CLAUDE_API_KEY", "")
CLAUDE_MODEL     = "claude-opus-4-5"           # change to claude-3-5-haiku for faster/cheaper
WEATHER_API_KEY  = os.getenv("WEATHER_API_KEY", "")   # openweathermap.org
DEFAULT_CITY     = os.getenv("DEFAULT_CITY", "New Delhi")
VOICE_RATE       = int(os.getenv("VOICE_RATE", "175"))
VOICE_VOLUME     = float(os.getenv("VOICE_VOLUME", "1.0"))

# Notes file
NOTES_FILE = os.path.join(os.path.dirname(__file__), "notes.txt")

# ─────────────────────────────────────────────────────────────────────
#  TEXT-TO-SPEECH ENGINE
# ─────────────────────────────────────────────────────────────────────
engine = None
if TTS_OK:
    engine = pyttsx3.init()
    voices = engine.getProperty("voices")
    # Prefer a male voice (index 0) or whatever is available
    engine.setProperty("voice", voices[0].id if voices else "")
    engine.setProperty("rate",   VOICE_RATE)
    engine.setProperty("volume", VOICE_VOLUME)


def speak(text: str):
    """Convert text to speech and also print it."""
    print(f"\n[{ASSISTANT_NAME}]: {text}")
    if TTS_OK and engine:
        engine.say(text)
        engine.runAndWait()


# ─────────────────────────────────────────────────────────────────────
#  SPEECH RECOGNITION
# ─────────────────────────────────────────────────────────────────────
def listen(timeout: int = 5, phrase_limit: int = 10) -> str:
    """Listen via microphone and return recognised text (lower-case)."""
    if not SPEECH_OK:
        return input(f"\n[You (type)]: ").strip().lower()

    r = sr.Recognizer()
    r.pause_threshold = 1.0
    with sr.Microphone() as source:
        print("\n[Listening... Speak now]")
        r.adjust_for_ambient_noise(source, duration=0.5)
        try:
            audio = r.listen(source, timeout=timeout, phrase_time_limit=phrase_limit)
        except sr.WaitTimeoutError:
            return ""

    try:
        query = r.recognize_google(audio, language="en-IN")
        print(f"[You]: {query}")
        return query.lower()
    except sr.UnknownValueError:
        speak("Sorry, I didn't catch that. Could you repeat?")
        return ""
    except sr.RequestError:
        speak("Speech service is unavailable right now.")
        return ""


# ─────────────────────────────────────────────────────────────────────
#  CLAUDE AI BRAIN
# ─────────────────────────────────────────────────────────────────────
claude_client   = None
chat_history    = []   # list of {"role": ..., "content": ...} dicts

CLAUDE_SYSTEM = (
    f"You are JARVIS, a highly intelligent personal AI assistant "
    f"inspired by Iron Man's JARVIS. You are helpful, witty, and concise. "
    f"Always address the user as '{USER_NAME}'. Keep responses under 3 sentences "
    f"unless detailed info is explicitly requested."
)

def init_claude():
    global claude_client
    if not CLAUDE_OK or not CLAUDE_API_KEY:
        print("[WARN] Claude API key not set. AI brain will be offline.")
        return
    claude_client = anthropic.Anthropic(api_key=CLAUDE_API_KEY)
    print(f"[INFO] Claude AI brain initialised ({CLAUDE_MODEL}).")


def ask_claude(query: str) -> str:
    """Send query to Claude and return response text (with conversation memory)."""
    if claude_client is None:
        return "My AI brain is offline. Please set your CLAUDE_API_KEY in the .env file."
    chat_history.append({"role": "user", "content": query})
    try:
        response = claude_client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=512,
            system=CLAUDE_SYSTEM,
            messages=chat_history,
        )
        reply = response.content[0].text.strip()
        chat_history.append({"role": "assistant", "content": reply})
        return reply
    except Exception as e:
        # Remove the user message we just added so history stays consistent
        chat_history.pop()
        return f"I encountered an error: {e}"


# ─────────────────────────────────────────────────────────────────────
#  UTILITY FUNCTIONS
# ─────────────────────────────────────────────────────────────────────

def get_greeting() -> str:
    hour = datetime.datetime.now().hour
    if 5 <= hour < 12:
        return "Good morning"
    elif 12 <= hour < 17:
        return "Good afternoon"
    elif 17 <= hour < 21:
        return "Good evening"
    return "Good night"


def tell_time() -> str:
    now = datetime.datetime.now()
    return f"The time is {now.strftime('%I:%M %p')} on {now.strftime('%A, %d %B %Y')}."


def open_website(url: str, name: str = ""):
    label = name or url
    speak(f"Opening {label}.")
    webbrowser.open(url)


def search_web(query: str):
    speak(f"Searching the web for: {query}")
    webbrowser.open(f"https://www.google.com/search?q={query.replace(' ', '+')}")


def search_youtube(query: str):
    speak(f"Playing {query} on YouTube.")
    webbrowser.open(f"https://www.youtube.com/results?search_query={query.replace(' ', '+')}")


def search_wikipedia(query: str) -> str:
    if not WIKI_OK:
        return "Wikipedia module is not installed."
    try:
        wikipedia.set_lang("en")
        result = wikipedia.summary(query, sentences=2)
        return result
    except wikipedia.exceptions.DisambiguationError as e:
        return f"Too many results. Did you mean: {', '.join(e.options[:3])}?"
    except wikipedia.exceptions.PageError:
        return "I couldn't find a Wikipedia article for that."
    except Exception as e:
        return f"Wikipedia error: {e}"


def get_weather(city: str = DEFAULT_CITY) -> str:
    if not REQUESTS_OK:
        return "Requests library is not installed."
    if not WEATHER_API_KEY:
        return "Weather API key is not configured in the .env file."
    url = (f"https://api.openweathermap.org/data/2.5/weather"
           f"?q={city}&appid={WEATHER_API_KEY}&units=metric")
    try:
        data = requests.get(url, timeout=5).json()
        if data.get("cod") != 200:
            return f"Could not retrieve weather for {city}."
        temp   = data["main"]["temp"]
        desc   = data["weather"][0]["description"].capitalize()
        humid  = data["main"]["humidity"]
        return (f"In {city}, it is currently {temp}°C with {desc}. "
                f"Humidity is {humid}%.")
    except Exception as e:
        return f"Weather error: {e}"


def take_note(note: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    with open(NOTES_FILE, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}] {note}\n")
    speak("Note saved successfully.")


def read_notes():
    if not os.path.exists(NOTES_FILE):
        speak("You have no saved notes.")
        return
    with open(NOTES_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()
    if not lines:
        speak("Your notepad is empty.")
        return
    speak(f"You have {len(lines)} note(s):")
    for line in lines[-5:]:   # read last 5 notes
        speak(line.strip())


def open_application(app: str):
    """Try to open common system applications."""
    apps = {
        "notepad"          : "notepad",
        "calculator"       : "calc",
        "paint"            : "mspaint",
        "word"             : "winword",
        "excel"            : "excel",
        "powerpoint"       : "powerpnt",
        "task manager"     : "taskmgr",
        "file explorer"    : "explorer",
        "command prompt"   : "cmd",
        "settings"         : "ms-settings:",
        "camera"           : "microsoft.windows.camera:",
        "spotify"          : "spotify",
        "chrome"           : "chrome",
        "firefox"          : "firefox",
        "edge"             : "msedge",
        "vs code"          : "code",
        "visual studio code": "code",
    }
    key = app.lower().strip()
    cmd = apps.get(key)
    if cmd:
        speak(f"Opening {app}.")
        try:
            if cmd.endswith(":"):
                os.startfile(cmd)
            else:
                subprocess.Popen(cmd)
        except FileNotFoundError:
            speak(f"I couldn't find {app} on this system.")
    else:
        speak(f"I don't know how to open {app}. Let me search it for you.")
        search_web(f"how to open {app} on windows")


def system_command(cmd: str):
    """Handle system-level commands."""
    cmd = cmd.lower()
    if "shutdown" in cmd:
        speak(f"Shutting down in 10 seconds, {USER_NAME}. Goodbye.")
        os.system("shutdown /s /t 10")
    elif "restart" in cmd:
        speak("Restarting in 10 seconds.")
        os.system("shutdown /r /t 10")
    elif "lock" in cmd:
        speak("Locking the computer.")
        os.system("rundll32.exe user32.dll,LockWorkStation")
    elif "sleep" in cmd:
        speak("Putting the computer to sleep.")
        os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
    elif "volume up" in cmd:
        from ctypes import cast, POINTER
        from comtypes import CLSCTX_ALL
        from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
        devices = AudioUtilities.GetSpeakers()
        interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
        volume = cast(interface, POINTER(IAudioEndpointVolume))
        volume.SetMasterVolumeLevelScalar(min(1.0, volume.GetMasterVolumeLevelScalar() + 0.1), None)
        speak("Volume increased.")
    elif "volume down" in cmd:
        speak("Lowering volume.")
        os.system("nircmd.exe changesysvolume -5000")
    elif "mute" in cmd:
        speak("Muting the system.")
        os.system("nircmd.exe mutesysvolume 1")
    else:
        speak("Unknown system command.")


def get_joke() -> str:
    jokes = [
        "Why do programmers prefer dark mode? Because light attracts bugs!",
        "I told my computer I needed a break. Now it won't stop sending me Kit-Kat ads.",
        "Why did the AI go to therapy? It had too many deep issues.",
        "A SQL query walks into a bar, walks up to two tables and asks... Can I join you?",
        "I would tell you a UDP joke, but you might not get it.",
    ]
    return random.choice(jokes)


# ─────────────────────────────────────────────────────────────────────
#  COMMAND PROCESSOR
# ─────────────────────────────────────────────────────────────────────

def process_command(query: str) -> bool:
    """
    Route the query to the appropriate handler.
    Returns False to exit the program, True to continue.
    """
    q = query.lower().strip()
    if not q:
        return True

    # ── EXIT ───────────────────────────────────────────────────────
    if any(w in q for w in ("quit", "exit", "bye", "goodbye", "shutdown jarvis")):
        speak(f"Goodbye, {USER_NAME}. Powering down systems. Stay awesome!")
        return False

    # ── TIME / DATE ────────────────────────────────────────────────
    if any(w in q for w in ("time", "date", "day", "today")):
        speak(tell_time())
        return True

    # ── WEATHER ────────────────────────────────────────────────────
    if "weather" in q:
        city_match = re.search(r"weather (?:in|of|for) (.+)", q)
        city = city_match.group(1).strip() if city_match else DEFAULT_CITY
        speak(get_weather(city))
        return True

    # ── WIKIPEDIA ──────────────────────────────────────────────────
    if "wikipedia" in q or "wiki" in q:
        search_term = re.sub(r"(wikipedia|wiki|search|tell me about|what is|who is)", "", q).strip()
        if search_term:
            speak(f"Searching Wikipedia for {search_term}...")
            result = search_wikipedia(search_term)
            speak(result)
        else:
            speak("What would you like me to look up on Wikipedia?")
        return True

    # ── YOUTUBE ────────────────────────────────────────────────────
    if "youtube" in q or "play" in q:
        video = re.sub(r"(play|youtube|on youtube|search youtube for)", "", q).strip()
        search_youtube(video if video else q)
        return True

    # ── WEB SEARCH ─────────────────────────────────────────────────
    if any(w in q for w in ("search", "google", "look up", "find")):
        search_term = re.sub(r"(search|google|look up|find|for me)", "", q).strip()
        search_web(search_term if search_term else q)
        return True

    # ── OPEN WEBSITES ──────────────────────────────────────────────
    if "open" in q:
        sites = {
            "facebook"  : "https://facebook.com",
            "instagram" : "https://instagram.com",
            "twitter"   : "https://twitter.com",
            "github"    : "https://github.com",
            "gmail"     : "https://mail.google.com",
            "maps"      : "https://maps.google.com",
            "whatsapp"  : "https://web.whatsapp.com",
            "reddit"    : "https://reddit.com",
            "linkedin"  : "https://linkedin.com",
            "amazon"    : "https://amazon.in",
            "flipkart"  : "https://flipkart.com",
            "netflix"   : "https://netflix.com",
        }
        found = False
        for name, url in sites.items():
            if name in q:
                open_website(url, name.capitalize())
                found = True
                break
        if not found:
            # Try to open a local app
            app = re.sub(r"open", "", q).strip()
            open_application(app)
        return True

    # ── NOTES ──────────────────────────────────────────────────────
    if "take note" in q or "make note" in q or "remember" in q:
        note_text = re.sub(r"(take note|make note|note that|remember that|remember)", "", q).strip()
        if note_text:
            take_note(note_text)
        else:
            speak("What would you like me to note down?")
            note_text = listen()
            if note_text:
                take_note(note_text)
        return True

    if "read notes" in q or "show notes" in q or "my notes" in q:
        read_notes()
        return True

    # ── SYSTEM ─────────────────────────────────────────────────────
    if any(w in q for w in ("shutdown", "restart", "lock", "sleep", "volume")):
        system_command(q)
        return True

    # ── JOKES ──────────────────────────────────────────────────────
    if any(w in q for w in ("joke", "funny", "laugh", "make me laugh")):
        speak(get_joke())
        return True

    # ── GREET ──────────────────────────────────────────────────────
    if any(w in q for w in ("hello", "hi", "hey", "howdy")):
        speak(f"{get_greeting()}, {USER_NAME}! All systems are fully operational. How can I assist you?")
        return True

    # ── SELF INFO ──────────────────────────────────────────────────
    if any(w in q for w in ("who are you", "your name", "what are you", "about yourself")):
        speak(f"I am {ASSISTANT_NAME} — Just A Rather Very Intelligent System — your personal AI assistant, {USER_NAME}.")
        return True

    # ── FALLBACK → CLAUDE AI ───────────────────────────────────────
    response = ask_claude(query)
    speak(response)
    return True


# ─────────────────────────────────────────────────────────────────────
#  MAIN LOOP
# ─────────────────────────────────────────────────────────────────────

def print_banner():
    print("\033[96m")
    print("=" * 60)
    print("   ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗")
    print("       ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝")
    print("       ██║███████║██████╔╝██║   ██║██║███████╗")
    print("  ██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║")
    print("  ╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║")
    print("   ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝")
    print()
    print("    Just A Rather Very Intelligent System")
    print("=" * 60)
    print("\033[0m")


def main():
    print_banner()
    init_claude()

    greeting = f"{get_greeting()}, {USER_NAME}! I am {ASSISTANT_NAME}, your personal AI assistant."
    modes = []
    if SPEECH_OK:
        modes.append("voice")
    modes.append("text")
    greeting += f" Running in {' & '.join(modes)} mode."
    speak(greeting)

    if SPEECH_OK:
        speak(f'Say "{WAKE_WORD}" to wake me, or just speak your command.')
    else:
        speak("Type your commands below. Type 'exit' to quit.")

    running = True
    while running:
        query = listen()

        # If using voice mode, check for wake word (optional: comment out to always listen)
        # if SPEECH_OK and WAKE_WORD not in query:
        #     continue

        running = process_command(query)

    print("\n[JARVIS offline]")


if __name__ == "__main__":
    main()
