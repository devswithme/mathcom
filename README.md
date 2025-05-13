# 📚 MathCom AI

An interactive math tutor platform designed for Cambridge students (Checkpoint, IGCSE, AS/A Levels), combining a **Next.js frontend** with a **Flask backend** powered by DeepSeek models.

---

## 🚀 How to Run

### 1. Backend Setup (Flask server)

```bash
cd ai-server
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Create .env file with your DeepSeek API Key
echo "DEEPSEEK_API_KEY=your-api-key-here" > .env

# Run the server
python app.py
```

Server will start on:  
```
http://localhost:5001
```

---

### 2. Frontend Setup (Next.js app)

```bash
cd mathcom_ai  # or the folder where your Next.js project resides

npm install

# Run the development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Frontend will start on:  
```
http://localhost:3000
```

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

---

## ⚙️ Features

- **Streaming AI Responses**: Instant feedback while solving math problems
- **Memory/Context Handling**: Tutor remembers your previous steps
- **MathJax Support**: Clean rendering of mathematical expressions
- **Smooth Auto-Scrolling**: Natural chat experience, like ChatGPT

---

## 🛡️ Notes

- `.env` files are ignored by Git — never commit your real API keys.
- Build outputs (`node_modules/`, `.next/`, `venv/`) are ignored to keep repository clean.
