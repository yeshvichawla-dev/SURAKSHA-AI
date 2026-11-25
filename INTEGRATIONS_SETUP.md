# Suraksha AI — API & AI setup

## Google Maps APIs (already wired in the code)
Enable Maps JavaScript API, Places API (New), and Routes API in Google Cloud. Create a restricted browser key for the frontend and a separate server key for Routes API. Add them to the matching `.env` files using the examples. A real key cannot be included in this ZIP; create keys in your own Google Cloud project and enable billing/budget alerts.

## Optional Gemini AI photo analysis (now wired)
1. Create a Gemini API key in Google AI Studio.
2. Put it in `backend/.env` as `GEMINI_API_KEY=...`. Do not put it in `frontend/.env`.
3. Restart the FastAPI backend.
4. In the hazard report form, upload a photo and select **Analyse photo with AI**.
5. Review the suggestion; it does not automatically change the hazard category/severity or verify the report.

Without the key, all manual reporting, maps and other non-AI functions remain available. API keys are secrets and are intentionally not bundled.

## Java / JavaScript clarification
This project is built with React + TypeScript (JavaScript ecosystem) and Python FastAPI. It does not require Java.
