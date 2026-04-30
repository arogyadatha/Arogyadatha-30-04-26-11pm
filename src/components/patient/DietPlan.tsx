import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Sparkles, Loader2, RefreshCcw } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { CaseData } from '../../services/caseService';
import { toast } from 'sonner';

interface DietPlanProps {
  caseId: string;
  patientId: string;
  caseData: CaseData;
  existingPlan: any | null;
  onClose: () => void;
  onPlanGenerated?: () => void;
}

interface MealPlan {
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  avoid: string[];
  hydration: string;
  generalTips: string[];
}

const mealIcons: Record<string, { emoji: string; label: string; gradient: string; text: string }> = {
  breakfast: { emoji: '🌅', label: 'Breakfast', gradient: 'from-amber-400 to-orange-400', text: 'text-amber-700' },
  lunch: { emoji: '☀️', label: 'Lunch', gradient: 'from-green-400 to-emerald-500', text: 'text-emerald-700' },
  dinner: { emoji: '🌙', label: 'Dinner', gradient: 'from-[#10B981] to-[#047857]', text: 'text-emerald-700' },
  snacks: { emoji: '🍎', label: 'Snacks', gradient: 'from-pink-400 to-rose-400', text: 'text-pink-700' },
};

export default function DietPlan({ caseId, patientId, caseData, existingPlan, onClose, onPlanGenerated }: DietPlanProps) {
  const [plan, setPlan] = useState<MealPlan | null>(existingPlan || null);
  const [generating, setGenerating] = useState(false);

  const generateDietPlan = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Gemini API key not configured');
      return;
    }

    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: `You are a clinical dietitian. Create a practical, simple diet plan for a patient with:
- Health Concern: ${caseData.caseName}
- Symptoms: ${caseData.symptoms || 'Not specified'}

The plan should be practical for an Indian patient, using commonly available foods. Keep meals simple and healthy. Be specific with meal suggestions.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              breakfast: { type: Type.STRING },
              lunch: { type: Type.STRING },
              dinner: { type: Type.STRING },
              snacks: { type: Type.STRING },
              avoid: { type: Type.ARRAY, items: { type: Type.STRING } },
              hydration: { type: Type.STRING },
              generalTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['breakfast', 'lunch', 'dinner', 'snacks', 'avoid', 'hydration', 'generalTips']
          }
        }
      });

      const result = JSON.parse(res.text) as MealPlan;
      setPlan(result);

      // Save to Firestore
      const dietRef = doc(db, 'patients', patientId, 'cases', caseId, 'extra', 'dietPlan');
      await setDoc(dietRef, { ...result, generatedAt: serverTimestamp(), caseId });

      toast.success('🥗 Diet plan generated and saved!');
      onPlanGenerated?.();
    } catch (error) {
      console.error('Diet plan generation error:', error);
      toast.error('Failed to generate diet plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[24px] border-2 border-yellow-100 shadow-lg overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center text-lg">
              🥗
            </div>
            <div>
              <h3 className="text-white font-black text-sm leading-none">AI Diet Plan</h3>
              <p className="text-yellow-100 text-[10px] font-medium mt-0.5">
                For: {caseData.caseName}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Generate / Regenerate Button */}
        <button
          onClick={generateDietPlan}
          disabled={generating}
          className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all disabled:opacity-60 active:scale-95 flex items-center justify-center gap-2 shadow-lg ${
            plan
              ? 'bg-gray-100 text-gray-600 shadow-none'
              : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-amber-200'
          }`}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating Diet Plan...
            </>
          ) : plan ? (
            <>
              <RefreshCcw className="w-4 h-4" />
              Regenerate Plan
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Generate AI Diet Plan
            </>
          )}
        </button>

        {plan && (
          <div className="space-y-3">
            {/* Meal Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(mealIcons).map(([key, config]) => {
                const mealText = plan[key as keyof MealPlan];
                if (!mealText || typeof mealText !== 'string') return null;
                return (
                  <div key={key} className={`rounded-2xl p-3 bg-gradient-to-br ${config.gradient} bg-opacity-10`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-lg">{config.emoji}</span>
                      <p className={`text-[10px] font-black ${config.text} uppercase tracking-wide`}>{config.label}</p>
                    </div>
                    <p className="text-xs text-gray-700 font-medium leading-relaxed">{mealText}</p>
                  </div>
                );
              })}
            </div>

            {/* Hydration */}
            {plan.hydration && (
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">💧</span>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wide">Hydration</p>
                </div>
                <p className="text-xs text-gray-700 font-medium">{plan.hydration}</p>
              </div>
            )}

            {/* Avoid */}
            {plan.avoid && plan.avoid.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🚫</span>
                  <p className="text-[10px] font-black text-red-700 uppercase tracking-wide">Foods to Avoid</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {plan.avoid.map((item, i) => (
                    <span key={i} className="text-[10px] font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full border border-red-200">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* General Tips */}
            {plan.generalTips && plan.generalTips.length > 0 && (
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">✅</span>
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wide">Tips</p>
                </div>
                <div className="space-y-1.5">
                  {plan.generalTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-700 font-medium">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
