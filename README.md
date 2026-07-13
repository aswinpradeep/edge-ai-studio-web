# Edge AI Studio (`edge-ai-studio-web`)

A zero-server, high-performance, and privacy-first multi-modal browser-based AI inference platform. It integrates document OCR, automatic speech recognition (ASR), large language model (LLM) reasoning, and text-to-speech (TTS) synthesis into a unified pipeline running entirely local on your device.

By leveraging **LiteRT.js** (TensorFlow Lite) and **ONNX Runtime Web**, Edge AI Studio achieves high execution performance using CPU WASM multi-threading without requiring any API keys, backend servers, or sending any data over the network.

---

## Key Features

- ⚡ **One-Click Preloading**: Pre-load all multi-modal models sequentially using the "Load All Models" interface to avoid worker thread congestion.
- 📊 **Real-time Metrics**: Track individual model download sizes, estimated RAM requirements, precise load latencies, and execution statistics.
- ⚙️ **Unified Pipeline Orchestration**:
  1. **OCR**: Extract text from documents or images.
  2. **ASR**: Transcribe voice queries locally from your microphone.
  3. **LLM**: Grounded Q&A using the extracted document context and voice queries.
  4. **TTS**: Speak generated responses aloud with real-time audio chunk streaming.
- 🔒 **100% Local & Offline**: All processing takes place within your browser context.

---

## Model Specifications

| Component | Model Name | Engine | Size | Est. RAM Footprint | Output Metrics |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **OCR** | CRAFT (detector) + CRNN (recognizer) | LiteRT.js | **57 MB** | ~120 MB | Detection & Recognition Latency |
| **ASR** | Whisper Tiny (30s window) | LiteRT.js | **144 MB** | ~250 MB | Mel-filter & Inference Latency |
| **LLM** | SmolLM-135M-Instruct (q4) | ONNX Web | **35 MB** | ~150 MB | Generation Latency & Tokens/sec |
| **TTS** | Mimi + FlowLM (Pocket TTS) | ONNX Web | **~120 MB** | ~300 MB | First Audio Chunk Latency (TTFB) & RTFx |

---

## Prerequisites & Browser Requirements

1. **Secure Context**: Web APIs such as `AudioWorklet` (for real-time audio playback) and `navigator.mediaDevices.getUserMedia` (for microphone input) require HTTPS or `localhost` access.
2. **SharedArrayBuffer Headers**: Multi-threaded LiteRT and ONNX WASM compilation require `SharedArrayBuffer`, which requires specific security headers:
   - `Cross-Origin-Opener-Policy: same-origin`
   - `Cross-Origin-Embedder-Policy: require-corp`

> [!NOTE]
> This repository is pre-configured with `coi-serviceworker.js` to automatically intercept requests and inject these security headers in the browser, allowing the platform to run seamlessly on standard static file servers (including GitHub Pages) without server-side header configurations.

---

## Getting Started

### Local Development

To run the application locally, start a local server context. For example, using Python's built-in HTTP server or node `http-server`:

```bash
# Using Node.js npx:
npx http-server . -p 8080

# Or using python:
python3 -m http-server 8080
```

Open your browser and navigate to `http://localhost:8080`.

---

## Deployment to GitHub Pages

This project is fully optimized for GitHub Pages.

### Automated CI/CD (GitHub Actions)

A GitHub Actions workflow is pre-configured at `.github/workflows/deploy.yml`. When you push your code to the `master` or `main` branch, the workflow will automatically package and deploy the application.

1. Create a remote GitHub repository.
2. Link the repository locally and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/edge-ai-studio-web.git
   git push -u origin master
   ```
3. Enable GitHub Pages on your repo settings under **Settings** -> **Pages** -> **Build and deployment**, and select **GitHub Actions** as the source.

### Manual Push Script

You can also use the helper script to easily commit and push changes:

```bash
./deploy.sh
```
 
  
