const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_FLASH_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

export const fetchWithExponentialBackoff = async (url: string, options: RequestInit, maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status !== 429) {
        return response;
      }
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.warn('Rate limit hit. Retrying in ' + (delay / 1000) + 's...');
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      console.error('Fetch failed:', error);
      throw error;
    }
  }
  throw new Error('Max retries exceeded for API call.');
};

export const generateAdvisory = async () => {
  const currentMetrics = {
    farmScore: '7.8/10',
    soilMoisture: '68% (Target 65%)',
    temperature: '25.3°C (Slightly High)',
    cropHealth: '92% (Excellent Vigor)',
    crop: 'Soybeans (Vegetative V4)',
    criticalTasks: '3 (Urgent irrigation, Pest Warning)',
  };

  const dataPrompt = 'Generate a concise, prioritized 3-step action plan for the farmer based on the current farm metrics and risks.\n\nMetrics:\n- Overall Farm Score: ' + currentMetrics.farmScore + '\n- Soil Moisture: ' + currentMetrics.soilMoisture + '\n- Temperature: ' + currentMetrics.temperature + '\n- Crop: ' + currentMetrics.crop + '\n- Critical Tasks: ' + currentMetrics.criticalTasks + '\n\nAction Plan Format:\n1. [Urgent Action 1] - Why this is critical.\n2. [Medium Action 2] - Context and next step.\n3. [Monitoring Action 3] - What to watch for.';

  const payload = {
    contents: [{ parts: [{ text: dataPrompt }] }],
    systemInstruction: {
      parts: [{ text: "You are a concise farm advisor AI, prioritizing only the most critical, actionable steps for a farmer using the Kisaan Saathi app. Your output must be a numbered list." }]
    },
  };

  const response = await fetchWithExponentialBackoff(GEMINI_FLASH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();

  const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: Could not generate advisory.';
  return generatedText;
};

export const identifyDisease = async () => {
  const mockSymptom = "I see small yellow spots developing on the lower leaves of my Soybean plants in Field 3.";
  const crop = "Soybeans (V4 Growth Stage)";

  const dataPrompt = 'The farmer provided the following symptom for ' + crop + ': "' + mockSymptom + '".\nDiagnose the most probable disease or issue and provide a simple, 2-step treatment recommendation for a farmer.';

  const payload = {
    contents: [{ parts: [{ text: dataPrompt }] }],
    tools: [{ "google_search": {} }],
    systemInstruction: {
      parts: [{ text: "You are an expert crop pathologist. Provide a diagnosis, a brief explanation, and a 2-point practical treatment plan." }]
    },
  };

  const response = await fetchWithExponentialBackoff(GEMINI_FLASH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();

  const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Diagnosis failed.';
  return generatedText;
};