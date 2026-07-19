<div align="center">

# 🎓 Gyaan

### On-Device AI Classroom — running on a 0.8B model

**Cloud-grade AI teaching. Fully local. Zero egress. Zero cost per use.**

[![Model](https://img.shields.io/badge/LLM-0.8B%20Quantized-success.svg)](#-the-bet)
[![Target](https://img.shields.io/badge/Hardware-Snapdragon%20X%20Elite-red.svg)](#-benchmarks)
[![Offline](https://img.shields.io/badge/Runs-Offline%20%2F%20Air--gapped-black.svg)](#-privacy--cost)

</div>

## 🎯 The Problem

AI-powered education tools today carry three heavy costs:

| Pain | Reality |
|---|---|
| 💸 **Token cost** | Every generation bills a cloud API. Scale = expensive. |
| 🔓 **Privacy** | Student data, prompts, and content flow to third-party servers. Unacceptable for minors / regulated environments. |
| 📶 **Connectivity** | No internet = no lesson. Fails in classrooms, rural areas, offline labs. |

And "on-device AI" usually means **7B–8B models minimum** — too heavy for edge hardware, too hungry on battery.

## 💡 The Bet

> We tested in the harshest condition possible.
> **Not 8B. Not 4B. Not even 1B.**
> A **0.8B model, quantized to ~400 MB.**

The question: *can a sub-1B model, running fully on a Snapdragon X Elite, produce a genuinely useful, animated, narrated classroom?*

**Answer: yes — if you move the intelligence out of the model and into the software around it.**

---

## 🏗️ How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                    SNAPDRAGON X ELITE (laptop)                │
│                                                              │
│   Phone browser ──Wi-Fi──►  Next.js Server (:3000)           │
│   (thin client)                  │                           │
│                                  ▼                           │
│                          GenieX / llama.cpp (:18181)         │
│                                  │                           │
│                                  ▼                           │
│                     Qwen3-0.8B (Q-quant, ~400 MB)            │
│                                  │                           │
│                    ┌─────────────┴─────────────┐             │
│                    ▼                           ▼             │
│              Hexagon NPU                 Oryon CPU            │
│                                                              │
│   ✦ ALL inference is local. Zero cloud. Zero egress. ✦       │
└──────────────────────────────────────────────────────────────┘
```

**Type any topic → get a 5-scene animated lesson:**

1. 🎬 **Intro** — hooks the learner
2. 📋 **Components** — every part of the topic, none skipped
3. 🔬 **Deep dive** — how the parts connect
4. ❓ **Quiz** — checks understanding
5. 📝 **Summary** — key takeaways

Each scene renders with **teacher speech** (TTS), **spotlight** (focus dimming), and **laser pointer** (tracks the word being spoken).

---

## 📷 Screenshots & Demo

### Sample Screens

| Classroom Main Interface | Model Selection |
| :---: | :---: |
| ![Classroom Interface](https://github.com/Solorush2021/gyaan/raw/main/assets/image2.jpg) | ![Model Selector](https://github.com/Solorush2021/gyaan/raw/main/assets/image1.jpg) |

### 🎥 Video Demo

See a live recording of Gyaan running fully locally on the Snapdragon X Elite:
👉 [Watch the Working Video on Google Drive](https://drive.google.com/your-video-link-here)

---

## 🧠 The Core IP — Making a 0.8B Smart

Small models forget instructions, mangle JSON, and can't do spatial reasoning. We solved this by **offloading intelligence from the model to deterministic code:**

| Technique | What it does | Impact |
|---|---|---|
| **Prompt shrinking** | Moved all pixel-math, SVG paths, height tables OUT of the LLM into TypeScript | 31 KB → ~3 KB prompt (**−90 %**) |
| **Grid-DSL** | Model emits semantic slots (`{role:"bullet", text:"..."}`), code renders pixels | ~12 tokens/element vs ~60 (**−80 %**) |
| **Fixed templates** | Small model stops inventing JSON structure — fills content only | Reliable output |
| **Call merging** | Content + teacher-actions combined into ONE call per scene | 2 calls → 1 (**−50 %**) |
| **JSON repair + retry** | 4-strategy repair parser + 2× retry on malformed output | Recovers ~25 % failure rate |
| **Rolling context** | Rules survive across scenes without blowing VRAM | Fits 4K–32K windows |
| **Role-based IDs** | Predictable element IDs let spotlight/laser target the right object | Animations always land |

> **Net result:** a 0.8B model does work that normally demands a 70B.

---

## ⚡ NPU Memory Mapping & SRAM Tiling (Flash Attention)

To maximize performance on the Snapdragon X Elite, the runtime leverages compiler-driven **SRAM Tiling** (the NPU equivalent of Flash Attention) rather than standard main-memory attention mechanisms.

### 1. Snapdragon X Elite Memory Layout

While main system RAM is shared, high-speed SRAM caches are private to each processing engine to bypass memory bandwidth bottlenecks:

| Hardware Component | Cache/SRAM Type | Capacity | Access / Scope |
|---|---|---|---|
| **System RAM** (LPDDR5x) | Main Memory | 16 GB - 64 GB | Shared (CPU, GPU, NPU) |
| **Oryon CPU** | L2 + L3 Cache | 42 MB | Private to CPU |
| **Adreno GPU** | GMEM Cache | ~2 MB - 4 MB | Private to GPU (Tiled rendering) |
| **Hexagon NPU** | **VTCM** (Vector Tightly Coupled Memory) | **~8 MB - 12 MB** | Private to NPU (Used for SRAM Tiling) |

### 2. How SRAM Tiling Works on the NPU

Unlike GPUs where developers manually invoke PyTorch operators like `flash_attn_func()`, the Snapdragon NPU handles this at the compiler level via the **QNN HTP (Hexagon Tensor Processor) Backend**:

* **Operator Fusion**: During model compilation (e.g., via Qualcomm AI Hub or the QNN converter), the compiler detects the standard Attention layer.
* **VTCM SRAM Tiling**: The compiler replaces standard matrix math operations with optimized HTP operators. These slice tensors into tiles that fit entirely inside the NPU's **8–12 MB VTCM** (on-chip high-speed SRAM), drastically reducing slow roundtrips to the shared LPDDR5x main memory.
* **Burst Mode**: When compiling or running manually, using the performance flag `--ht_performance_mode burst` ensures the runtime aggressively utilizes the VTCM SRAM.

---

## 📊 Benchmarks

### Inference performance on Snapdragon X Elite

| Compute Target | Tokens/sec | Power Draw | Best For |
|:---:|:---:|:---:|---|
| **Hexagon NPU** (w4a16) | **~30 tok/s** ⚑ | **~8–12 W** ⚒ | Long sessions, battery-sensitive, always-on |
| **Oryon CPU** | **~20 tok/s** ⚑ | **~25–35 W** ⚒ | Sustained throughput, plugged-in demo |

> ⚑ *Measured on-device with Qwen3-0.8B Q-quantized via GenieX. Final numbers vary with model variant, quantization, and runtime (`qairt` vs `llama_cpp`). See [GenieX](https://github.com/qualcomm/GenieX) for the NPU stack.*
>
> ⚒ *Power draw is estimated from typical Snapdragon X Elite NPU/CPU envelopes under LLM inference load; not instrumented per-run. Measure with your device's power telemetry for precise figures.*

### Why we chose CPU for live demos
- Higher sustained throughput → faster classroom generation
- NPU reserved for the **low-power, long-session** roadmap (battery + thermal)

### Efficiency vs. the cloud-native pipeline

| Metric | Cloud (original) | Gyaan (on-device) | Savings |
|---|---|---|---|
| Slide prompt size | 31 KB (~8,870 tok) | ~3 KB (~850 tok) | **−90 %** |
| LLM calls per slide | 2 | 1 | **−50 %** |
| Output tokens / element | ~60 | ~12 | **−80 %** |
| Per-deck cost | paid API | **$0** | **−100 %** |
| Data egress | full prompts + PII | **none** | **−100 %** |
| Min model size | 70 B | **0.8 B** | **~89× smaller** |

---

## 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| **App** | Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn/ui |
| **Animation** | Motion (Framer successor) · Web Audio API |
| **Local LLM server** | [GenieX](https://github.com/qualcomm/GenieX) (Qualcomm) · llama.cpp fallback |
| **Model** | Qwen3-0.8B-Instruct, Q-quantized (~400 MB) |
| **Context** | 4K (NPU static graph) → 32K (CPU rolling) |
| **Target HW** | Snapdragon X Elite — Hexagon NPU + Adreno GPU + Oryon CPU |

---

## 📱 Phone-as-Thin-Client

The model never runs on the phone. The laptop acts as the server; any phone on the same local network can open and use the UI.

### Step-by-Step Setup:

1. **Connect to the Same Network**: Ensure both your laptop and phone are connected to the same Wi-Fi network (or connect your laptop to your phone's mobile hotspot).
2. **Set Network Profile**: Make sure the network profile on your laptop is set to **Private** in Windows settings.
3. **Configure the Firewall (Admin Access)**: Open PowerShell as an administrator (Right-click Start → **Terminal (Admin)** or **PowerShell (Admin)**) and run the following rule to allow inbound traffic on port 3000:
   ```powershell
   New-NetFirewallRule -DisplayName "Gyaan 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private,Public
   ```
4. **Start the Host Server**: Run the Gyaan server bound to all interfaces:
   ```powershell
   npm run dev -- --hostname 0.0.0.0
   ```
   You will see a console output indicating local network endpoints, similar to:
   ```text
   Restarted with 0.0.0.0 — Ready in 1850ms. Now try on your phone:
   http://10.249.126.12:3000
   ```
5. **Open on Phone**: On your phone's web browser, enter the network URL displayed in the console (e.g., `http://10.249.126.12:3000`). You can now run prompts, hear the narrated text, and interact with Gyaan's local classroom directly from your mobile device!

---

## 🔒 Privacy & Cost

| | Gyaan | Cloud AI apps |
|---|---|---|
| Tokens billed | **0** | per-use |
| Data leaves device | **never** | always |
| Works offline | ✅ | ❌ |
| GDPR / data-residency | clean by design | requires DPA |
| Air-gapped deployment | ✅ | ❌ |

> **The smallest attack surface in AI: nothing to exfiltrate.**

## 🚀 Setup & Installation (Snapdragon X Elite, Windows ARM64)

### 1. Download & Prepare the Local LLM (LM Studio)
1. Ensure you have **LM Studio for ARM** (the **Bionic** build for Snapdragon laptops) installed on your system.
2. Download the **Qwen 2.5 (or 3.5) 0.8B quantized to 4-bits** model (e.g., `Qwen3.5 0.8B Q4_K_M`).

![LM Studio Model Library](https://github.com/Solorush2021/gyaan/raw/main/assets/image5.jpg)

3. Load the model inside LM Studio and start the local API server. It typically runs on `http://localhost:1234/v1`.

![LM Studio API Server Settings](https://github.com/Solorush2021/gyaan/raw/main/assets/image4.jpg)

### 2. Configure and Run Gyaan
```powershell
# 1. Install Node.js LTS (winget auto-selects arm64)
winget install OpenJS.NodeJS.LTS

# 2. Unzip the source
Expand-Archive gyaan-dragon.zip C:\Users\you\gyaan
cd C:\Users\you\gyaan

# 3. Install dependencies
npm install

# 4. Configure environment variables
copy .env.example .env.local
# Edit .env.local to match your local LM Studio URL:
# OPENAI_BASE_URL=http://localhost:1234/v1

# 5. Run the web server
npm run dev -- --hostname 0.0.0.0
```

Open **`http://localhost:3000`** on the laptop, or **`http://<laptop-lan-ip>:3000`** on your phone.

> ⚠️ If Turbopack errors on Windows ARM64, set `$env:TURBOPACK=0` and re-run.

---

## 📖 Usage Guide & UI Configuration

Once the web interface is open, configure the settings as follows:

### 1. Connect Gyaan to LM Studio & Select Model
1. Open the **Settings** panel in the Gyaan web UI and go to **LLM**.
2. Select your provider (e.g. **Lemonade (Local)**).
3. In the API/Base URL field, input your LM Studio local server address: `http://localhost:1234/v1`.
4. Click the **Test Connection** button to verify the interface can communicate with the model running in LM Studio.

![Model Connection Setup](https://github.com/Solorush2021/gyaan/raw/main/assets/image6.jpg)

5. Close Settings. At the bottom of the main dashboard, click the model selection dropdown and choose your loaded model (e.g. `unsloth/Qwen3.5-0.8B-GGUF:Q4_0` under the **Lemonade** provider).

![Model Dropdown Selector](https://github.com/Solorush2021/gyaan/raw/main/assets/image1.jpg)

### 2. Set Up Text-to-Speech (TTS)
1. Go to the **Settings** panel and select **Text-to-Speech**.
2. Select **Browser Native** as your TTS provider.
3. Switch the **Enable this provider** toggle to **ON**.
4. You can optionally test speech by entering text and clicking **Test TTS**. Click **Save** when done.

![TTS Configuration](https://github.com/Solorush2021/gyaan/raw/main/assets/image3.jpg)

### 3. Generate a Local Lesson
1. Close settings and return to the main dashboard.
2. Select your student persona voice/icon from the dropdown inside the main window.
3. Enter your desired topic or prompt in the input/chat window (e.g. type `teachR` or a specific topic you want to learn).
4. Hit submit/press enter, and wait for the lesson, spotlight animation, and teacher narration to generate entirely on-device!

![Chat Generation Demo](https://github.com/Solorush2021/gyaan/raw/main/assets/image2.jpg)

---

## 🗺️ Roadmap

- [ ] NPU-native 4B via Qualcomm AI Hub (`w4a16` bundle)
- [ ] 3D / simulation / code scenes (when 7B+ is affordable on-device)
- [ ] mTLS + reverse proxy (Caddy) for hardened LAN exposure
- [ ] Qualcomm SPU-backed signing keys for client certs
- [ ] Kokoro neural TTS server-side (reliable phone audio)

---


<div align="center">

**Built for the edge. Runs on the least hardware possible.**

*Privacy by architecture — not by promise.*

</div>
