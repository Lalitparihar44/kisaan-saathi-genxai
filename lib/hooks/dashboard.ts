import { useState } from 'react';
import { generateAdvisory, identifyDisease } from '../dashboard';

export const useAiAdvisory = () => {
  const [aiAdvisoryOutput, setAiAdvisoryOutput] = useState('Click \'Generate AI Advisory\' to get your action plan.');
  const [loadingAdvisory, setLoadingAdvisory] = useState(false);

  const handleGenerateAdvisory = async () => {
    setAiAdvisoryOutput('<div class="p-3 text-center text-llm-purple font-medium">\n<svg class="animate-spin h-5 w-5 text-llm-purple inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>\nAnalyzing data and generating personalized advisory...\n</div>');
    setLoadingAdvisory(true);

    try {
      const generatedText = await generateAdvisory();
      setAiAdvisoryOutput('<div class="ai-output p-3 rounded-lg text-gray-800">\n<p class="font-bold mb-1 flex items-center text-llm-purple">\n<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-llm-purple mr-1"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>\nAI Action Plan:\n</p>\n<p class="text-sm">' + generatedText + '</p>\n</div>');
    } catch (error) {
      setAiAdvisoryOutput('<div class="p-3 bg-red-100 rounded-lg text-red-800">Error fetching AI advisory. Please check your network.</div>');
    } finally {
      setLoadingAdvisory(false);
    }
  };

  return {
    aiAdvisoryOutput,
    loadingAdvisory,
    handleGenerateAdvisory,
  };
};

export const useDiseaseId = () => {
  const [diseaseIdOutput, setDiseaseIdOutput] = useState('Click \'Identify Disease\' to diagnose crop issues.');
  const [loadingDisease, setLoadingDisease] = useState(false);

  const handleIdentifyDisease = async () => {
    setDiseaseIdOutput('<div class="p-3 text-center text-llm-purple font-medium">\n<svg class="animate-spin h-5 w-5 text-llm-purple inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>\nAnalyzing symptoms and identifying disease...\n</div>');
    setLoadingDisease(true);

    try {
      const generatedText = await identifyDisease();
      setDiseaseIdOutput('<div class="ai-output p-3 rounded-lg text-gray-800">\n<p class="font-bold mb-1 flex items-center text-llm-purple">\n<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-llm-purple mr-1"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>\nDisease Diagnosis:\n</p>\n<p class="text-sm">' + generatedText + '</p>\n</div>');
    } catch (error) {
      setDiseaseIdOutput('<div class="p-3 bg-red-100 rounded-lg text-red-800">Error identifying disease. Please check your network.</div>');
    } finally {
      setLoadingDisease(false);
    }
  };

  return {
    diseaseIdOutput,
    loadingDisease,
    handleIdentifyDisease,
  };
};