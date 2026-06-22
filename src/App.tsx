import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Search, 
  Bot, 
  User, 
  Cpu, 
  Database, 
  Globe, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  ShieldAlert, 
  Copy, 
  Sparkles, 
  BookOpen, 
  HeartPulse,
  ExternalLink,
  Info,
  ChevronRight,
  Code,
  Mic,
  MicOff,
  Upload,
  Plus,
  Trash2,
  Printer,
  Download,
  AlertTriangle,
  Calculator,
  Calendar,
  X,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TextbookEntry {
  page: string;
  title: string;
}

const medicalLibrary: Record<string, TextbookEntry> = {
  "abdominal ultrasound": { page: "Pages 1-4", title: "Abdominal Ultrasound" },
  "acetaminophen": { page: "Pages 18-19", title: "Acetaminophen" },
  "achalasia": { page: "Page 20", title: "Achalasia" },
  "achondroplasia": { page: "Pages 21-22", title: "Achondroplasia" },
  "acne": { page: "Pages 24-26", title: "Acne" },
  "acute kidney failure": { page: "Pages 43-45", title: "Acute Kidney Failure" },
  "addison's disease": { page: "Pages 53-54", title: "Addison's Disease" },
  "adult respiratory distress syndrome": { page: "Pages 67-68", title: "Adult Respiratory Distress Syndrome" },
  "aids": { page: "Pages 73-81", title: "AIDS" }
};

export default function App() {
  // Navigation tabs: 'chatbot' | 'checker' | 'dosage' | 'code'
  const [activeTab, setActiveTab] = useState<"chatbot" | "checker" | "dosage" | "code">("chatbot");
  
  // Python files code lookup state
  const [activeCodeFile, setActiveCodeFile] = useState<"tools" | "agent">("agent");
  const [toolsPy, setToolsPy] = useState<string>("");
  const [agentPy, setAgentPy] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // --- 1. Multimodal OCR Prescription States ---
  const [isAnalyzingOcr, setIsAnalyzingOcr] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // --- 2. Diagnostic Symptom Checker States ---
  const [checkerStep, setCheckerStep] = useState<number>(0); // 0: Select Symptom, 1: Questions, 2: Triage Summary
  const [selectedSymptomId, setSelectedSymptomId] = useState<string | null>(null);
  const [checkerAnswers, setCheckerAnswers] = useState<Record<string, string>>({});

  // Symptom configurations mapping (Decision Tree)
  const symptomsData = [
    {
      id: "abdominal",
      titleAr: "ألم في البطن",
      titleEn: "Abdominal Pain",
      icon: "🩺",
      questions: [
        { id: "q1", textAr: "هل الألم حاد ومفاجئ أم مزمن ومتكرر منذ فترة؟", textEn: "Is the pain sharp & sudden, or chronic & recurring?", options: ["حاد ومفاجئ", "مزمن ومتكرر"] },
        { id: "q2", textAr: "هل يصاحبه انتفاخ شديد، غثيان أو فقدان للشهية؟", textEn: "Is it accompanied by severe swelling, nausea, or appetite loss?", options: ["نعم", "لا"] }
      ],
      matchTopic: "abdominal ultrasound",
      diagnosisTxt: "مؤشرات سريرية تشير إلى ألم بطني حاد. وفقاً للمراجع الطبية (GALE Encyclopedia)، يُنصح بإجراء فحص سريري سريع وقد تتطلب الحالة إجراء تصوير بالسونار (Abdominal Ultrasound) لتقييم حالة الكبد أو المرارة أو استبعاد التهاب الزائدة الدودية الطارئ."
    },
    {
      id: "swallowing",
      titleAr: "صعوبة في البلع",
      titleEn: "Difficulty Swallowing",
      icon: "🥛",
      questions: [
        { id: "q1", textAr: "هل تجد صعوبة أكبر في بلع الأطعمة الصلبة فقط أم السوائل أيضاً؟", textEn: "Do you have trouble swallowing solids only, or liquids too?", options: ["الأطعمة الصلبة فقط", "الأطعمة الصلبة والسوائل معاً"] },
        { id: "q2", textAr: "هل تعاني من ألم بالصدر أو ارتجاع طعام غير مهضوم أثناء النوم؟", textEn: "Do you experience chest pain or nighttime regurgitation of undigested food?", options: ["نعم، بشكل متكرر", "لا"] }
      ],
      matchTopic: "achalasia",
      diagnosisTxt: "اشتباه سريري في تشنج عضلات المريء أو رتوج مريئية (Achalasia). إن فشل صمام المريء السفلي في الارتخاء يمنع مرور السوائل والجوامد معاً مسبباً ارتدادات ليلية مزمنة."
    },
    {
      id: "breathing",
      titleAr: "ضيق حاد في التنفس",
      titleEn: "Shortness of Breath",
      icon: "🫁",
      questions: [
        { id: "q1", textAr: "هل بدأ ضيق التنفس بشكل مفاجئ للغاية مع تسارع ملحوظ في التنفس؟", textEn: "Did dyspnea start very suddenly with highly accelerated breathing?", options: ["نعم، فجأة وصاعق", "لا، تدريجي"] },
        { id: "q2", textAr: "هل تشعر بنقص شديد بالأكسيجين أو تلاحظ شحوباً أو زرقة في الشفتين؟", textEn: "Do you feel severe oxygen reduction or notice pale/blue lips?", options: ["نعم، هناك تغير زرقاوي", "لا"] }
      ],
      matchTopic: "adult respiratory distress syndrome",
      diagnosisTxt: "تحذير طبي عاجل! الأعراض الواردة قد تشير إلى متلازمة الضيق التنفسي الحاد (ARDS)، وهي حالة طبية طارئة تتطلب نقلاً فورياً للمستشفى لتقييم مستويات الأكسجين بالدم ووظائف الرئة."
    },
    {
      id: "fatigue",
      titleAr: "تعب شديد وخمول غير مبرر",
      titleEn: "Extreme Fatigue & Weakness",
      icon: "🔋",
      questions: [
        { id: "q1", textAr: "هل تلاحظ اسمراراً غامقاً غير معتاد في البشرة أو ثنايا اللثة؟", textEn: "Do you notice unusual hyperpigmentation on skin or gum crests?", options: ["نعم، هناك اسمرار ملحوظ", "لا"] },
        { id: "q2", textAr: "هل تعاني من انخفاض دائم بضغط الدم وصفات ضعف هضمي وهبوط وزن؟", textEn: "Do you suffer from permanent low blood pressure, digestive weakness, and weight loss?", options: ["نعم", "لا"] }
      ],
      matchTopic: "addison's disease",
      diagnosisTxt: "يقترح التوزيع العرضي هذا احتمالية قصور الغدة الكظرية الأولي أو ما يعرف بمرض أديسون (Addison's Disease). يتوجب إجراء تحاليل دم مخبرية لقياس مستويات هرمونات الكورتيزول والـ ACTH."
    },
    {
      id: "acne",
      titleAr: "بثور وحب شباب متقدم",
      titleEn: "Advanced Acne & Cysts",
      icon: "🧼",
      questions: [
        { id: "q1", textAr: "هل البثور تظهر على شكل أكياس عميقة ومؤلمة تحت نسيج الجلد؟", textEn: "Are skin lesions deep painful cysts beneath the skin?", options: ["نعم، تكيسات مؤلمة وعميقة", "بثور ورؤوس عادية"] },
        { id: "q2", textAr: "هل تنتشر على نطاق واسع في الكتفين والظهر والصدر بالكامل؟", textEn: "Are they distributed extensively over back, shoulders & chest?", options: ["نعم", "لا، فقط بالوجه"] }
      ],
      matchTopic: "acne",
      diagnosisTxt: "تصنيف الحالة يشير إلى حب الشباب الشديد والالتهابي التكيسي (Severe Acne Vulgaris). هذه الدرجة من الالتهاب تتطلب في الغالب استشارة جلدية لوصف مركبات قوية مثل أيزوتريتينوين (Isotretinoin)."
    },
    {
      id: "renal",
      titleAr: "تورم سريع وانخفاض في البول",
      titleEn: "Rapid Edema & Low Urine",
      icon: "💧",
      questions: [
        { id: "q1", textAr: "هل تلاحظ حدوث تورم أو انتفاخ سريع في القدمين أو الكاحلين أو الوجه؟", textEn: "Do you notice rapid swelling/edema in feet, ankles, or face?", options: ["نعم، انتفاخ مفاجئ", "لا"] },
        { id: "q2", textAr: "هل طرأ انخفاض شديد ملحوظ في كمية البول المفرزة يومياً فجأة؟", textEn: "Did you observe a sudden drastic decrease in your daily urine volume?", options: ["نعم، انخفض البول بحدة", "لا، ضمن المعتاد"] }
      ],
      matchTopic: "acute kidney failure",
      diagnosisTxt: "تحذير هام! هناك احتمالية لقصور أو فشل كلوي حاد مفاجئ (Acute Kidney Failure). تراكم السوائل مسبباً التورم (Edema) مع قلة إفراز اليوريا يتطلب مراجعة فورية لقسم الطوارئ لإجراء تحاليل وظائف الكلى."
    }
  ];

  // --- 3. Smart Dosage & Medication Safety Tracker States ---
  const [pediatricWeight, setPediatricWeight] = useState<number>(18);
  const [paracetamolConc, setParacetamolConc] = useState<string>("250mg/5ml");
  
  // Custom medication journal list
  const [medsList, setMedsList] = useState<Array<{
    id: string;
    name: string;
    doseMg: number;
    frequency: number; // times per day
    activeIngredient: "Paracetamol" | "Amoxicillin" | "Other";
    takenDosesToday: number; // how many times they checked it today
  }>>([
    { id: "1", name: "باراسيتامول شراب (أطفال)", doseMg: 250, frequency: 3, activeIngredient: "Paracetamol", takenDosesToday: 1 },
    { id: "2", name: "أموكسيسيلين كبسول", doseMg: 500, frequency: 3, activeIngredient: "Amoxicillin", takenDosesToday: 2 }
  ]);

  // Medication entry form
  const [formMedName, setFormMedName] = useState<string>("");
  const [formDoseMg, setFormDoseMg] = useState<number>(500);
  const [formFreq, setFormFreq] = useState<number>(3);
  const [formIngredient, setFormIngredient] = useState<"Paracetamol" | "Amoxicillin" | "Other">("Paracetamol");

  // Chat window state
  const [messages, setMessages] = useState<Array<{ sender: "user" | "bot"; text: string }>>([
    {
      sender: "bot",
      text: "أهلاً بك. أنا MediBlaze، مساعدك الطبي الذكي لتبسيط المصطلحات الطبية وعلاجاتها (RAG Clinical Chatbot). اكتب أعراضك أو استفساراً دوائياً، أو اختر موضوعاً من قاعدة البيانات الطبية بالجانب الأيسر لمشاهدة تحليل ومزامنة البيانات اللحظية."
    }
  ]);
  const [inputValue, setInputInputValue] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [printTargetText, setPrintTargetText] = useState<string | null>(null);
  const [printTargetIndex, setPrintTargetIndex] = useState<number>(0);
  const [showIframePrintNotice, setShowIframePrintNotice] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Speech Recognition hook and state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechLanguage, setSpeechLanguage] = useState<string>("ar-SA"); // defaults to Arabic
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeechSupported = typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = speechLanguage;

        rec.onstart = () => {
          setIsListening(true);
          setSpeechError(null);
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            setInputInputValue((prev) => prev ? prev + " " + resultText : resultText);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error === "not-allowed") {
            setSpeechError("يرجى تفعيل صلاحية الميكروفون لاستخدام هذه الميزة.");
          } else if (event.error === "no-speech") {
            // silent ignore or brief message
          } else {
            setSpeechError("حدث خطأ أثناء محاولة التعرف على الصوت.");
          }
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, [speechLanguage]);

  const toggleListening = () => {
    if (!isSpeechSupported) {
      alert("التعرف على الصوت غير مدعوم في هذا المتصفح الحالي.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  // --- Dynamic High-Fidelity Arabic Clinical PDF / Print Generator ---
  const parseMarkdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // Replace code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-family: monospace; font-size: 11px; white-space: pre-wrap; direction: ltr; text-align: left; margin: 10px 0;">$1</pre>');
    
    // Parse bold markdown **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<b style="font-weight: 700; color: #0f172a;">$1</b>');
    
    const lines = html.split('\n');
    let inList = false;
    const processedLines = lines.map((line) => {
      const trimmed = line.trim();
      
      // Check headers
      if (trimmed.startsWith('### ')) {
        const item = trimmed.replace('### ', '');
        if (inList) { 
          inList = false; 
          return '</ul><h4 style="font-family: \'Cairo\', sans-serif; font-size: 14px; font-weight: 700; color: #0d9488; margin-top: 20px; border-bottom: 2px solid #0d9488; padding-bottom: 5px; text-align: right;">' + item + '</h4>'; 
        }
        return '<h4 style="font-family: \'Cairo\', sans-serif; font-size: 14px; font-weight: 700; color: #0d9488; margin-top: 20px; border-bottom: 2px solid #0d9488; padding-bottom: 5px; text-align: right;">' + item + '</h4>';
      }
      if (trimmed.startsWith('## ')) {
        const item = trimmed.replace('## ', '');
        if (inList) { 
          inList = false; 
          return '</ul><h3 style="font-family: \'Cairo\', sans-serif; font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 24px; text-align: right;">' + item + '</h3>'; 
        }
        return '<h3 style="font-family: \'Cairo\', sans-serif; font-size: 16px; font-weight: 700; color: #1e293b; margin-top: 24px; text-align: right;">' + item + '</h3>';
      }
      if (trimmed.startsWith('# ')) {
        const item = trimmed.replace('# ', '');
        if (inList) { 
          inList = false; 
          return '</ul><h2 style="font-family: \'Cairo\', sans-serif; font-size: 18px; font-weight: 800; color: #1e293b; margin-top: 26px; text-align: right;">' + item + '</h2>'; 
        }
        return '<h2 style="font-family: \'Cairo\', sans-serif; font-size: 18px; font-weight: 800; color: #1e293b; margin-top: 26px; text-align: right;">' + item + '</h2>';
      }
      
      // Check bullet list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const bulletText = trimmed.substring(2);
        if (!inList) {
          inList = true;
          return '<ul style="margin: 8px 0; padding-right: 20px; list-style-type: square; text-align: right;"><li style="font-family: \'Cairo\', sans-serif; font-size: 12.5px; line-height: 1.8; color: #334155; margin-bottom: 6px;">' + bulletText + '</li>';
        }
        return '<li style="font-family: \'Cairo\', sans-serif; font-size: 12.5px; line-height: 1.8; color: #334155; margin-bottom: 6px;">' + bulletText + '</li>';
      } else {
        if (inList) {
          inList = false;
          if (trimmed === '') return '</ul>';
          return '</ul><p style="font-family: \'Cairo\', sans-serif; font-size: 12.5px; line-height: 1.8; color: #334155; margin: 10px 0; text-align: right;">' + trimmed + '</p>';
        }
        if (trimmed === '') return '';
        return '<p style="font-family: \'Cairo\', sans-serif; font-size: 12.5px; line-height: 1.8; color: #334155; margin: 10px 0; text-align: right;">' + trimmed + '</p>';
      }
    });
    
    let finalHtml = processedLines.join('\n');
    if (inList) {
      finalHtml += '</ul>';
    }
    return finalHtml;
  };

  const downloadHTMLBackup = () => {
    if (!printTargetText) return;
    const formattedBodyHtml = parseMarkdownToHtml(printTargetText);
    const currentDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const currentYear = new Date().getFullYear();

    const offlineHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediBlaze Clinical Report - MDA-\${printTargetIndex}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap');
    
    @page {
      size: A4;
      margin: 18mm 15mm 18mm 15mm;
    }
    
    body {
      font-family: 'Cairo', 'Inter', system-ui, -apple-system, sans-serif;
      color: #1e293b;
      background: #f8fafc;
      margin: 0;
      padding: 40px 20px;
      direction: rtl;
      text-align: right;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container-wrapper {
      max-width: 800px;
      margin: 0 auto;
    }

    .report-container {
      border: 1px solid #cbd5e1;
      padding: 45px;
      border-radius: 16px;
      background: #ffffff;
      position: relative;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }

    .watermark-bg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 110px;
      font-weight: 900;
      color: rgba(13, 148, 136, 0.025);
      pointer-events: none;
      user-select: none;
      font-family: 'Inter', sans-serif;
      letter-spacing: 5px;
      white-space: nowrap;
      z-index: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3.5px solid #0d9488;
      padding-bottom: 22px;
      margin-bottom: 35px;
      z-index: 10;
    }

    .header-meta {
      text-align: left;
      font-size: 11px;
      color: #475569;
      line-height: 1.8;
    }

    .meta-item b {
      color: #0f172a;
    }

    .header-branding {
      text-align: right;
    }

    .logo-text {
      font-size: 26px;
      font-weight: 800;
      color: #0d9488;
      margin: 0;
      letter-spacing: -0.5px;
      font-family: 'Inter', sans-serif;
    }

    .logo-sub {
      font-size: 9.5px;
      color: #64748b;
      margin: 3px 0 0 0;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .report-title-box {
      text-align: center;
      margin-bottom: 35px;
      z-index: 10;
    }

    .report-title {
      font-size: 19px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      display: inline-block;
      border-bottom: 2.5px solid #14b8a6;
      padding-bottom: 6px;
    }

    .report-body {
      flex-grow: 1;
      z-index: 10;
      margin-bottom: 35px;
    }

    h4 {
      font-family: 'Cairo', sans-serif;
      font-size: 14.5px !important;
      font-weight: 700 !important;
      color: #0d9488 !important;
      margin-top: 22px !important;
      border-bottom: 2.5px solid #0d9488 !important;
      padding-bottom: 6px !important;
      text-align: right !important;
    }

    p {
      font-family: 'Cairo', sans-serif;
      font-size: 12.5px !important;
      line-height: 1.85 !important;
      color: #334155 !important;
      margin: 11px 0 !important;
      text-align: right !important;
    }

    ul {
      margin: 10px 0 !important;
      padding-right: 22px !important;
      list-style-type: square !important;
      text-align: right !important;
    }

    li {
      font-family: 'Cairo', sans-serif;
      font-size: 12.5px !important;
      line-height: 1.85 !important;
      color: #334155 !important;
      margin-bottom: 8px !important;
    }

    .footer-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      z-index: 10;
    }

    .clinical-disclaimer {
      font-size: 10px;
      color: #64748b;
      max-width: 66%;
      line-height: 1.7;
      text-align: justify;
    }

    .stamp-container {
      text-align: center;
    }

    .stamp-label {
      font-size: 10px;
      font-weight: bold;
      color: #64748b;
      margin-bottom: 10px;
    }

    .stamp-seal {
      width: 90px;
      height: 90px;
      border: 3px double #0d9488;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #0d9488;
      font-size: 9px;
      font-weight: 800;
      transform: rotate(-4deg);
      margin: 0 auto;
      background: rgba(13, 148, 136, 0.02);
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9) inset;
    }

    .stamp-dash {
      border-top: 1px dashed #0d9488;
      border-bottom: 1px dashed #0d9488;
      padding: 1px 3.5px;
      margin: 2.5px 0;
      font-size: 7.5px;
      font-family: 'Inter', sans-serif;
      font-weight: bold;
      letter-spacing: 0.5px;
    }

    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .report-container {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="container-wrapper">
    <div class="report-container">
      <div class="watermark-bg">MEDIBLAZE CLINICAL</div>
      
      <div>
        <div class="header">
          <div class="header-meta">
            <div class="meta-item">تاريخ التقرير: <b>\${currentDate}</b></div>
            <div class="meta-item">الرقم المرجعي: <b>MDA-\${printTargetIndex}98-\${currentYear}</b></div>
            <div class="meta-item">مرجع التثقيف: <b>موسوعة GALE الطبية للأبحاث</b></div>
          </div>
          <div class="header-branding">
            <h1 class="logo-text">MEDIBLAZE</h1>
            <p class="logo-sub">Advanced AI Physician Co-pilot</p>
          </div>
        </div>

        <div class="report-title-box">
          <h2 class="report-title">تقرير طبي وتثقيف صحي معتمد</h2>
        </div>

        <div class="report-body">
          \${formattedBodyHtml}
        </div>
      </div>

      <div class="footer-section">
        <div class="clinical-disclaimer">
          <b>تنويه طبي هام:</b> تم إنشاء هذا المستند الإرشادي والمسارات الطبية المرفقة به برمجياً واستدلالياً بواسطة الذكاء الاصطناعي التوليدي ومزامنته مع قواعد بيانات موسوعة GALE المعتمدة. يعاد التنويه بصرامة أن كافة هذه المعلومات والجرعات مخصصة حصرياً لأغراض التثقيف والإرشاد المنزلي والدراسة البيولوجية، ولا تمثّل تشخيصاً طبياً نهائياً، ولا تحل مطلقاً محل الفحص والاستشارة السريرية لدى طبيب بشري مرخص.
        </div>
        
        <div class="stamp-container">
          <div class="stamp-label">التوقيع الطبي الاستشاري</div>
          <div class="stamp-seal">
            <div style="font-size: 8px; font-weight: bold; font-family: 'Inter', sans-serif;">MEDIBLAZE</div>
            <div class="stamp-dash">CO-PILOT</div>
            <div style="font-size: 8px; font-weight: bold; font-family: 'Inter', sans-serif;">VERIFIED CLINICAL</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([offlineHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MediBlaze_Report_MDA-\${printTargetIndex}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    try {
      const isInsideIframe = window.self !== window.top;
      if (isInsideIframe) {
        setShowIframePrintNotice(true);
      } else {
        window.print();
      }
    } catch (err) {
      console.error("Print error:", err);
      setShowIframePrintNotice(true);
    }
  };

  const handlePrintPDF = (text: string, index: number) => {
    // 1. Set the preview states so the user still gets the beautiful, highly-responsive visual preview modal on screen!
    setPrintTargetText(text);
    setPrintTargetIndex(index);

    try {
      const formattedBodyHtml = parseMarkdownToHtml(text);
      const currentDate = new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      const currentYear = new Date().getFullYear();

      // Construct high-fidelity HTML report payload matching GALE clinical formatting standards
      const printHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediBlaze Clinical Report - MDA-${index}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap');
    
    @page {
      size: A4;
      margin: 15mm;
    }
    
    body {
      font-family: 'Cairo', 'Inter', system-ui, sans-serif;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      direction: rtl;
      text-align: right;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .container-wrapper {
      max-width: 800px;
      margin: 0 auto;
    }

    .report-container {
      border: 1px solid #e2e8f0;
      padding: 40px;
      border-radius: 12px;
      background: #ffffff;
      position: relative;
      min-height: 250mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .watermark-bg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 90px;
      font-weight: 900;
      color: rgba(13, 148, 136, 0.03);
      pointer-events: none;
      user-select: none;
      font-family: 'Inter', sans-serif;
      letter-spacing: 5px;
      white-space: nowrap;
      z-index: 0;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #0d9488;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }

    .header-meta {
      text-align: left;
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }

    .header-branding {
      text-align: right;
    }

    .logo-text {
      font-size: 24px;
      font-weight: 800;
      color: #0d9488;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }

    .logo-sub {
      font-size: 9px;
      color: #64748b;
      margin: 2px 0 0 0;
      font-family: 'Inter', sans-serif;
      text-transform: uppercase;
    }

    .report-title-box {
      text-align: center;
      margin-bottom: 25px;
    }

    .report-title {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      display: inline-block;
      border-bottom: 2px solid #14b8a6;
      padding-bottom: 4px;
    }

    .report-body {
      flex-grow: 1;
      margin-bottom: 25px;
    }

    h4 {
      font-size: 14px;
      font-weight: 700;
      color: #0d9488;
      margin-top: 18px;
      border-bottom: 2px solid #0d9488;
      padding-bottom: 4px;
    }

    p {
      font-size: 12px;
      line-height: 1.75;
      color: #334155;
      margin: 8px 0;
    }

    ul {
      margin: 8px 0;
      padding-right: 20px;
      list-style-type: square;
    }

    li {
      font-size: 12px;
      line-height: 1.75;
      color: #334155;
      margin-bottom: 6px;
    }

    .footer-section {
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .clinical-disclaimer {
      font-size: 9.5px;
      color: #64748b;
      max-width: 65%;
      line-height: 1.6;
      text-align: justify;
    }

    .stamp-container {
      text-align: center;
    }

    .stamp-label {
      font-size: 9.5px;
      font-weight: bold;
      color: #64748b;
      margin-bottom: 6px;
    }

    .stamp-seal {
      width: 80px;
      height: 80px;
      border: 3px double #0d9488;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #0d9488;
      font-size: 8px;
      font-weight: 800;
      transform: rotate(-4deg);
      background: rgba(13, 148, 136, 0.02);
    }

    .stamp-dash {
      border-top: 1px dashed #0d9488;
      border-bottom: 1px dashed #0d9488;
      padding: 1px 3px;
      margin: 2px 0;
      font-size: 7px;
      font-weight: bold;
    }

    @media print {
      body {
        padding: 0 !important;
        margin: 0 !important;
      }
      .report-container {
        border: none !important;
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="container-wrapper">
    <div class="report-container">
      <div class="watermark-bg">MEDIBLAZE CLINICAL</div>
      <div>
        <div class="header">
          <div class="header-meta">
            <div>تاريخ التقرير: <b>${currentDate}</b></div>
            <div>الرقم المرجعي: <b>MDA-${index}98-${currentYear}</b></div>
            <div>مرجع التثقيف: <b>موسوعة GALE الطبية للأبحاث</b></div>
          </div>
          <div class="header-branding">
            <h1 class="logo-text">MEDIBLAZE</h1>
            <p class="logo-sub">Advanced AI Physician Co-pilot</p>
          </div>
        </div>
        <div class="report-title-box">
          <h2 class="report-title">تقرير طبي وتثقيف صحي معتمد</h2>
        </div>
        <div class="report-body">
          ${formattedBodyHtml}
        </div>
      </div>
      <div class="footer-section">
        <div class="clinical-disclaimer">
          <b>تنويه طبي هام:</b> تم إنشاء هذا المستند الإرشادي والمسارات الطبية المرفقة به برمجياً واستدلالياً بواسطة الذكاء الاصطناعي التوليدي ومزامنته مع قواعد بيانات موسوعة GALE المعتمدة. يعاد التنويه بصرامة أن كافة هذه المعلومات والجرعات مخصصة حصرياً لأغراض التثقيف والإرشاد المنزلي والدراسة البيولوجية، ولا تمثّل تشخيصاً طبياً نهائياً، ولا تحل مطلقاً محل الفحص والاستشارة السريرية لدى طبيب بشري مرخص.
        </div>
        <div class="stamp-container">
          <div class="stamp-label">التوقيع الطبي الاستشاري</div>
          <div class="stamp-seal">
            <div style="font-size: 7.5px; font-weight: bold; font-family: 'Inter', sans-serif;">MEDIBLAZE</div>
            <div class="stamp-dash">CO-PILOT</div>
            <div style="font-size: 7.5px; font-weight: bold; font-family: 'Inter', sans-serif;">VERIFIED CLINICAL</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

      // 2. Generate a Blob and Object URL containing the printable markup
      const blob = new Blob([printHtml], { type: "text/html;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);

      // 3. Create a concealed iframe to trigger printing seamlessly inside standard browsers
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "none";
      iframe.style.pointerEvents = "none";
      iframe.style.zIndex = "-1000";
      
      document.body.appendChild(iframe);
      iframe.src = blobUrl;

      // 4. Once iframe is fully loaded, trigger native print
      iframe.onload = () => {
        try {
          // Verify we aren't blocked by iframe browser secure blockers
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            
            // Cleanup elements after printing has completed/closed
            setTimeout(() => {
              try {
                if (document.body.contains(iframe)) {
                  document.body.removeChild(iframe);
                }
                URL.revokeObjectURL(blobUrl);
              } catch (cleanErr) {
                console.warn("Iframe cleanup deferred:", cleanErr);
              }
            }, 60000); // Keep alive temporarily for printing pipeline to copy assets
          } else {
            throw new Error("Unable to access iframe contentWindow namespace");
          }
        } catch (innerPrintErr) {
          console.error("Iframe native print blocked or failed:", innerPrintErr);
          // Automatic graceful sandbox fallback: Trigger the standalone report notice or fallback to manual open
          setShowIframePrintNotice(true);
          try {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            URL.revokeObjectURL(blobUrl);
          } catch (cleanErr) {
            console.warn("Clean-up handler issue:", cleanErr);
          }
        }
      };
    } catch (err) {
      console.error("Critical error preparing print payload iframe:", err);
      setShowIframePrintNotice(true);
    }
  };



  // Live LangGraph active node tracking
  const [activeWorkflowNodes, setActiveWorkflowNodes] = useState<Array<{
    name: string;
    status: "idle" | "active" | "completed" | "skipped";
    description: string;
  }>>([
    { name: "router_node", status: "idle", description: "Node 1: Classifies diagnostic search target" },
    { name: "retrieve_rag", status: "idle", description: "Node 2: Pinpoints textbook database facts" },
    { name: "call_web_search", status: "idle", description: "Node 3: Grounded clinical web analysis" },
    { name: "generate_answer", status: "idle", description: "Node 4: Synthesizes final diagnostic answer" }
  ]);

  const [routeDecision, setRouteDecision] = useState<string>("direct");
  const [retrievedContext, setRetrievedContext] = useState<string>("");
  const [webContext, setWebContext] = useState<string>("");

  // Preset clinical cases for medical test runs
  const presetCases = [
    { title: "AIDS Symptoms", query: "What are the common symptoms of AIDS?" },
    { title: "Acne Accutane warnings", query: "Tell me about acne treatment and the Accutane precautions" },
    { title: "Acetaminophen overdose", query: "What are the dosage limits for acetaminophen and signs of overdose?" },
    { title: "Lesser known: Achalasia", query: "What are the causes and symptoms of esophageal Achalasia?" },
    { title: "2026 Clinical Updates", query: "Are there any newly verified 2026 clinical vaccine trials for immunologists?" },
    { title: "Achondroplasia Diagnosis", query: "What physical features are checked for achondroplasia?" }
  ];

  // Fetch the created python file code blocks at startup (with safe fallback)
  useEffect(() => {
    async function fetchCodes() {
      try {
        const res = await fetch("/api/agent-code");
        if (res.ok) {
          const data = await res.json();
          setToolsPy(data.toolsCode);
          setAgentPy(data.agentCode);
        } else {
          // Local fallback in case of latency
          setToolsPy(getBackupToolsPy());
          setAgentPy(getBackupAgentPy());
        }
      } catch (e) {
        setToolsPy(getBackupToolsPy());
        setAgentPy(getBackupAgentPy());
      }
    }
    fetchCodes();
  }, []);

  // Ensure scroll shifts with ongoing chats
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  // Main chat routing invocator
  const handleSendMessage = async (rawQuery: string) => {
    if (!rawQuery.trim() || isGenerating) return;

    // Reset status flows
    setActiveWorkflowNodes(prev => prev.map(n => ({ ...n, status: "idle" })));
    setRouteDecision("");
    setRetrievedContext("");
    setWebContext("");

    const userMessage = rawQuery.trim();
    setMessages(prev => [...prev, { sender: "user", text: userMessage }]);
    setInputInputValue("");
    setIsGenerating(true);

    // Step 1: Set router active
    setActiveWorkflowNodes(prev => prev.map(n => n.name === "router_node" ? { ...n, status: "active" as const } : n));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error("Diagnostic pipeline error: " + response.statusText);
      }

      const data = await response.json();

      // Simulate sequential steps visually for deep understanding
      await delay(800);
      setRouteDecision(data.routeDecision);
      setRetrievedContext(data.retrievedContext);
      setWebContext(data.webContext);

      // Render step completion list
      setActiveWorkflowNodes(prev => prev.map(node => {
        const matchData = data.steps.find((s: any) => s.name === node.name);
        return matchData ? {
          ...node,
          status: matchData.status as any,
          description: matchData.description
        } : node;
      }));

      await delay(1000);
      setMessages(prev => [...prev, { sender: "bot", text: data.response }]);

    } catch (e: any) {
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: `### Pipeline Connection Error\nCould not fetch response from the server-side medical pipeline: ${e.message}\n\n*Please ensure the Google API Key is valid under Settings > Secrets.*` 
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Copy helper for python tab
  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Safe client-side python strings if API takes time to start/compile
  const getBackupToolsPy = () => `import os
import asyncio
from typing import List, Dict, Any
from pinecone import Pinecone
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool

# Expected Environment Variables:
# PINECONE_API_KEY - Auth token for Pinecone Vector Database
# PINECONE_INDEX_NAME - Name of index storing Book.pdf embeddings (defaults to 'mediblaze-index')
# GEMINI_API_KEY - API Key for Google Gemini Models

@tool
async def medical_rag_tool(query: str) -> str:
    \"\"\"
    Retrieves the most relevant medical contexts and references from the textbook 
    'The GALE Encyclopedia of Medicine' (Book.pdf) matching the user's query.
    \"\"\"
    api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "mediblaze-index")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)
    
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/text-embedding-004",
        google_api_key=gemini_api_key
    )
    
    loop = asyncio.get_running_loop()
    query_vector = await loop.run_in_executor(None, embeddings.embed_query, query)
    
    query_response = await loop.run_in_executor(
        None,
        lambda: index.query(vector=query_vector, top_k=5, include_metadata=True)
    )
    
    matches = query_response.get("matches", [])
    retrieved_texts = [
        f"[Excerpt from GALE Encyclopedia of Medicine, Page {match.get('metadata', {}).get('page')}]:\\n{match.get('metadata', {}).get('text')}"
        for match in matches if match.get('metadata', {}).get('text')
    ]
    return "\\n\\n---\\n\\n".join(retrieved_texts)

@tool
async def web_search_tool(query: str) -> str:
    \"\"\"Queries DuckDuckGo search to retrieve up-to-date medical observations.\"\"\"
    search = DuckDuckGoSearchRun()
    loop = asyncio.get_running_loop()
    results = await loop.run_in_executor(None, search.run, query)
    return results`;

  const getBackupAgentPy = () => `import os
from typing import TypedDict, List, Dict, Any, Literal
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from agent.utils.tools import medical_rag_tool, web_search_tool

class AgentState(TypedDict):
    messages: List[BaseMessage]
    current_query: str
    route_decision: str
    retrieved_context: str
    web_context: str
    final_response: str

class RouteDecisionSchema(BaseModel):
    decision: Literal["rag", "web", "both", "direct"]

# Build stategraph workflow:
workflow = StateGraph(AgentState)
workflow.add_node("router_node", router_node)
workflow.add_node("retrieve_rag", retrieve_rag)
workflow.add_node("call_web_search", call_web_search)
workflow.add_node("generate_answer", generate_answer)

workflow.set_entry_point("router_node")
# Set conditional edges to parse clinical route decision
workflow.add_conditional_edges("router_node", route_after_router)
app = workflow.compile()`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Clinical Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-950/40">
            <HeartPulse className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl tracking-tight text-white">MediBlaze</h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold tracking-wider">
                LangGraph Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Advanced Multi-Agent RAG Workspace</p>
          </div>
        </div>

        {/* Tab switch navigation */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-lg max-w-full">
          <button 
            id="tab-btn-chatbot"
            onClick={() => setActiveTab("chatbot")}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "chatbot" 
                ? "bg-teal-500/15 text-teal-400 border border-teal-500/30" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>العيادة والمستندات</span>
          </button>

          <button 
            id="tab-btn-checker"
            onClick={() => setActiveTab("checker")}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "checker" 
                ? "bg-teal-500/15 text-teal-400 border border-teal-500/30" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>فاحص الأعراض</span>
          </button>

          <button 
            id="tab-btn-dosage"
            onClick={() => setActiveTab("dosage")}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "dosage" 
                ? "bg-teal-500/15 text-teal-400 border border-teal-500/30" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>الجرعات والجدول</span>
          </button>

          <button 
            id="tab-btn-code"
            onClick={() => setActiveTab("code")}
            className={`px-3 py-1.5 rounded-md text-[11px] font-bold tracking-wide transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${
              activeTab === "code" 
                ? "bg-teal-500/15 text-teal-400 border border-teal-500/30" 
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>مخطط السيرفر</span>
          </button>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 w-full max-w-8xl mx-auto flex flex-col md:flex-row overflow-hidden">
        
        {activeTab === "chatbot" && (
          <>
            {/* Left Sidebar - Helper Database */}
            <section className="w-full md:w-80 border-r border-slate-800/80 bg-slate-900/40 p-5 flex flex-col gap-5 overflow-y-auto shrink-0">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
                  <Database className="w-3.5 h-3.5 text-teal-400" />
                  Textbook Glossaries
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Fully indexed health terms based on <i>The GALE Encyclopedia of Medicine</i> textbook (Book.pdf attachments).
                </p>
                
                <div className="flex flex-col gap-2">
                  {Object.keys(medicalLibrary).map((key) => (
                    <button
                      key={key}
                      id={`gale-btn-${key}`}
                      onClick={() => handleSendMessage(`Tell me about ${medicalLibrary[key].title} and treatment guidelines.`)}
                      disabled={isGenerating}
                      className="w-full text-left p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-all duration-200 group flex items-start justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-[12px] font-semibold text-slate-200 group-hover:text-teal-400 transition-colors">
                          {medicalLibrary[key].title}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          GALE Vol. 1 • {medicalLibrary[key].page}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Presets testing section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Clinical Test Runs
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  Click on these presets to witness how the Multi-Agent router automatically branches.
                </p>
                <div className="flex flex-col gap-1.5">
                  {presetCases.map((preset, idx) => (
                    <button
                      key={idx}
                      id={`preset-btn-${idx}`}
                      onClick={() => handleSendMessage(preset.query)}
                      disabled={isGenerating}
                      className="text-[11px] text-left px-3 py-2 bg-slate-950 border border-slate-800/80 rounded-md hover:border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer w-full flex items-center justify-between"
                    >
                      <span>{preset.title}</span>
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </button>
                  ))}
                </div>
              </div>

              {/* 📷 1️⃣ تحليل الروشتات والتقرير بالصور (Multimodal prescription OCR) */}
              <div className="border-t border-slate-800/80 pt-4 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
                  <Camera className="w-3.5 h-3.5 text-teal-400" />
                  تحليل الروشتات والتحاليل بالصور
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed mb-3 text-right">
                  التقط أو ارفع صورة لروشتة بخط اليد أو لتقرير نتائج تحاليل لتبسيطها سريرياً بواسطة Gemini Flash.
                </p>

                <div className="p-3.5 bg-slate-950 border border-slate-850 rounded-xl hover:border-slate-700 transition duration-200">
                  <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-400 hover:text-teal-400">
                    <Upload className="w-6 h-6 stroke-1 text-slate-500" />
                    <span className="text-[10px] text-center font-bold">ارفَع صورة أو وثيقة طبية</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        setIsAnalyzingOcr(true);
                        setOcrError(null);
                        
                        try {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const base64String = (reader.result as string).split(",")[1];
                            const mimeType = file.type;

                            const res = await fetch("/api/ocr", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ image: base64String, mimeType })
                            });

                            if (!res.ok) {
                              throw new Error("فشل الخادم في معالجة وتحليل صورتك الطبية.");
                            }

                            const ocrData = await res.json();
                            
                            setMessages(prev => [
                              ...prev,
                              { sender: "user", text: `📷 [تحليل مستند طبي]: ${file.name}` },
                              { sender: "bot", text: ocrData.response }
                            ]);
                            
                            setIsAnalyzingOcr(false);
                          };
                          reader.readAsDataURL(file);
                        } catch (err: any) {
                          setOcrError(err.message || "حدث خطأ غير متوقع");
                          setIsAnalyzingOcr(false);
                        }
                      }}
                    />
                  </label>
                </div>

                {isAnalyzingOcr && (
                  <div className="mt-3 p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-lg text-[10px] text-teal-400 animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    <span>جاري قراءة خط اليد واستخراج الجرعات...</span>
                  </div>
                )}

                {ocrError && (
                  <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] text-rose-400 text-right">
                    {ocrError}
                  </div>
                )}
              </div>
            </section>

            {/* Middle Container - Beautiful symptom chat screen */}
            <section className="flex-1 flex flex-col bg-slate-950 chat-container border-r border-slate-800/80 relative">
              {/* Upper alert informational ribbon */}
              <div className="bg-slate-900/80 border-b border-slate-800/80 px-6 py-2 flex items-center justify-between text-slate-400 text-[11px]">
                <div className="flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Clinical simulation leverages local vector matching and server-side text Grounding.</span>
                </div>
                <span className="font-mono text-slate-500 text-[10px]">Latency: ~1.2s</span>
              </div>

              {/* Chat bubbles list */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 max-h-[calc(100vh-210px)]">
                {messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex gap-3 max-w-xl ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        msg.sender === "user" 
                          ? "bg-slate-800 text-slate-200" 
                          : "bg-gradient-to-br from-teal-500 to-emerald-500 text-white"
                      }`}>
                        {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Msg content box */}
                      <div className={`rounded-xl px-4 py-3 text-xs leading-relaxed printable-report ${
                        msg.sender === "user"
                          ? "bg-teal-600/10 text-slate-100 border border-teal-500/20"
                          : "bg-slate-900/60 text-slate-200 border border-slate-800/80 relative"
                      }`}>
                        {/* Printable Hospital Letterhead header */}
                        {msg.sender === "bot" && index > 0 && (
                          <div className="hidden print-header border-b-2 border-teal-500 pb-3 mb-4 text-slate-800 flex items-center justify-between text-right">
                            <div className="text-left text-[10px] text-slate-500 leading-snug">
                              <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</div>
                              <div>الرقم المرجعي: MDA-{index}98-{new Date().getFullYear()}</div>
                            </div>
                            <div className="text-right">
                              <h2 className="text-lg font-black tracking-tight text-teal-600">MEDIBLAZE CLINICAL WORKSPACE</h2>
                              <p className="text-[10px] font-mono text-slate-500">Advanced AI Physician Co-Pilot • GALE Encyclopedia Grounded</p>
                            </div>
                          </div>
                        )}

                        {msg.sender === "bot" ? (
                          <div className="space-y-3 prose prose-invert max-w-none">
                            {/* Simple manual clinical formatting */}
                            {msg.text.split("\n\n").map((para, pIdx) => {
                              if (para.startsWith("### ")) {
                                return (
                                  <h4 key={pIdx} className="font-bold text-slate-100 text-xs mt-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                    {para.replace("### ", "")}
                                  </h4>
                                );
                              }
                              return (
                                <p key={pIdx} className="text-slate-300">
                                  {para}
                                </p>
                              );
                            })}
                          </div>
                        ) : (
                          msg.text
                        )}

                        {/* Printable Hospital Stamp / Footer */}
                        {msg.sender === "bot" && index > 0 && (
                          <div className="hidden print-footer mt-6 pt-3 border-t border-slate-200 text-right text-[10px] text-slate-400">
                            <div>تم إعداد ومطابقة الإرشادات الذاتية برمجياً بالاستدلال من موسوعة GALE المرجعية للأبحاث الطبية المعتمدة.</div>
                            <div className="font-bold text-slate-600 mt-1">توقيع وختم المستشار الرقمي: MediBlaze Co-Pilot</div>
                          </div>
                        )}

                        {/* 📄 2️⃣ تصدير التقارير الطبية كملف طبي رسمي بصيغة PDF (Clinical PDF Export Engine) */}
                        {msg.sender === "bot" && index > 0 && (
                          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-wrap gap-3 items-center justify-between no-print">
                            <span className="text-[9px] text-slate-500 font-mono text-left">ID: MDA-{index}</span>
                            <div className="flex gap-2">
                              {/* TXT Version Backup */}
                              <button
                                type="button"
                                onClick={() => {
                                  const textToExport = msg.text;
                                  const bodyOutput = `==================================================\n` + 
                                               `           MEDIBLAZE CLINICAL REPORT\n` +
                                               `         مستند تقرير طبي رسمي معتمد\n` +
                                               `==================================================\n\n` + 
                                               `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}\n` +
                                               `المصدر المعتمد للبحث: موسوعة GALE الطبية المرجعية \n\n` +
                                               `--------------------------------------------------\n` +
                                               `المحتوى والتشخيص الإرشادي (Diagnostic Details):\n` +
                                               `--------------------------------------------------\n\n` + 
                                               textToExport + 
                                               `\n\n--------------------------------------------------\n` +
                                               `تنويه هام: هذا التقرير صادر عن نظام الذكاء الاصطناعي الاستشاري MediBlaze للرعاية الصحية الهادفة والتثقيف الصحي.\n` +
                                               `المعلومات الواردة فيه تعتبر لأغراض الإرشاد والتوعية فقط، ولا تحل بدلاً من مراجعة الطبيب البشري المختص.\n` +
                                               `==================================================\n`;

                                  const blob = new Blob([bodyOutput], { type: "text/plain;charset=utf-8" });
                                  const url = URL.createObjectURL(blob);
                                  const link = document.createElement("a");
                                  link.href = url;
                                  link.download = `MediBlaze_Report_${new Date().toISOString().slice(0,10)}.txt`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }}
                                className="px-2 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold rounded hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                                title="تحميل التقرير كملف نصي عادي"
                              >
                                <Download className="w-3 h-3 text-slate-500" />
                                مسودة نصية (.TXT)
                              </button>

                              {/* Premium PDF Generator */}
                              <button
                                type="button"
                                onClick={() => handlePrintPDF(msg.text, index)}
                                className="px-3 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-[10px] text-white font-extrabold rounded shadow-lg shadow-teal-950/20 transition-all flex items-center gap-1.5 cursor-pointer"
                                title="تحميل وحفظ التقرير الطبي بصيغة PDF عالية الدقة مع ترويسة وختم رسمي"
                              >
                                <Printer className="w-3 h-3 text-white" />
                                تصدير كـ تقرير PDF
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 items-center">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 text-white flex items-center justify-center animate-pulse">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-900/50 border border-slate-800/60 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat formulation input */}
              <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }}
                  className="relative flex items-center"
                >
                  <input
                    id="chat-input-field"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputInputValue(e.target.value)}
                    placeholder={speechLanguage === "ar-SA" ? "اكتب الأعراض أو استفسارك هنا..." : "Type symptoms or clinical question..."}
                    disabled={isGenerating}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-28 py-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20 transition-all font-sans"
                  />
                  <div className="absolute right-2 flex items-center gap-1.5">
                    {/* Language selector toggle button */}
                    <button
                      type="button"
                      onClick={() => setSpeechLanguage(prev => prev === "ar-SA" ? "en-US" : "ar-SA")}
                      className={`text-[9px] font-bold px-1.5 py-1 rounded bg-slate-900 border transition-all cursor-pointer hover:bg-slate-800 ${
                        speechLanguage === "ar-SA" ? "text-teal-400 border-teal-500/30" : "text-amber-400 border-amber-500/30"
                      }`}
                      title={speechLanguage === "ar-SA" ? "اللغة الحالية: العربية (اضغط للتحويل للإنجليزية)" : "Current Language: English (Click to switch to Arabic)"}
                    >
                      {speechLanguage === "ar-SA" ? "AR" : "EN"}
                    </button>

                    {/* Microphone button */}
                    {isSpeechSupported ? (
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-1.5 rounded-md transition-all cursor-pointer flex items-center justify-center border ${
                          isListening 
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse" 
                            : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800"
                        }`}
                        title={isListening ? "إيقاف التسجيل الصوتي" : "بدء الإدخال الصوتي"}
                      >
                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="p-1.5 rounded-md bg-slate-950/40 text-slate-600 border border-slate-900 cursor-not-allowed"
                        title="التعرف على الصوت غير مدعوم في هذا المتصفح"
                      >
                        <Mic className="w-4 h-4 opacity-30" />
                      </button>
                    )}

                    {/* Send button */}
                    <button
                      id="chat-send-btn"
                      type="submit"
                      disabled={!inputValue.trim() || isGenerating}
                      className="px-2 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold rounded-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
                
                {/* Speech recognition state messages */}
                {isListening && (
                  <div className="mt-2 text-[10px] text-teal-400 font-mono flex items-center gap-1.5 bg-teal-500/5 px-2 py-1 rounded border border-teal-500/10 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
                    <span>جاري الاستماع الآن ({speechLanguage === "ar-SA" ? "عربي" : "English"})... تحدث وسيطهر الكلام تلقائياً.</span>
                  </div>
                )}

                {speechError && (
                  <div className="mt-1.5 text-[10px] text-rose-400 font-medium flex items-center gap-1 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">
                    <span className="w-1 h-1 rounded-full bg-rose-400" />
                    <span>{speechError}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Right Container - Active LangGraph Orchestration Transition Monitor */}
            <section className="w-full md:w-80 bg-slate-900/20 p-5 flex flex-col gap-6 overflow-y-auto shrink-0 border-r border-slate-800">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
                  <Activity className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  LangGraph Live Exec
                </h3>

                {/* Graph Visual Pipeline */}
                <div className="relative border-l border-slate-800 pl-4 ml-3 space-y-6 py-2">
                  {activeWorkflowNodes.map((node, idx) => (
                    <div key={idx} className="relative group">
                      {/* Node Bullet Ring */}
                      <span className={`absolute -left-[24px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        node.status === "active" 
                          ? "bg-teal-500 border-teal-500 animate-ping" 
                          : node.status === "completed"
                            ? "bg-teal-500 border-teal-500"
                            : node.status === "skipped"
                              ? "bg-slate-800 border-slate-600"
                              : "bg-slate-950 border-slate-800"
                      }`}>
                        {node.status === "completed" && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        )}
                      </span>

                      {/* Node Texts */}
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-mono font-bold uppercase transition-colors tracking-wide ${
                            node.status === "active" 
                              ? "text-teal-400" 
                              : node.status === "completed"
                                ? "text-slate-100"
                                : "text-slate-500"
                          }`}>
                            {node.name}
                          </span>
                          
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                            node.status === "active"
                              ? "bg-teal-500/10 text-teal-400 animate-pulse border border-teal-500/20"
                              : node.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : node.status === "skipped"
                                  ? "bg-slate-800/10 text-slate-500"
                                  : "bg-slate-900 text-slate-600 border border-slate-800"
                          }`}>
                            {node.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                          {node.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rerouted evidentiary context results */}
              <div className="flex-1 flex flex-col gap-4 border-t border-slate-800/80 pt-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Database className="w-3 h-3 text-slate-500" />
                      RAG Contexts Matcher
                    </span>
                    {routeDecision && (
                      <span className="text-[9px] font-mono bg-slate-900 border border-slate-800 px-1 py-0.5 text-teal-400 font-bold uppercase">
                        {routeDecision}
                      </span>
                    )}
                  </div>
                  
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[10px] text-slate-400 h-24 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                    {retrievedContext ? (
                      retrievedContext
                    ) : (
                      <span className="text-slate-600 italic">No textbook matching entries retrieved. Triggered on standard questions.</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
                    <Globe className="w-3 h-3 text-slate-500" />
                    Web Grounded Facts
                  </span>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-900 text-[10px] text-slate-400 h-24 overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed">
                    {webContext ? (
                      webContext
                    ) : (
                      <span className="text-slate-600 italic">No temporary web context was queried. Evaluated as standard glossary terms or conversational.</span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* 📋 3️⃣ فاحص الأعراض التفاعلي (Diagnostic Symptom Checker) */}
        {activeTab === "checker" && (
          <section className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 overflow-y-auto max-h-[calc(100vh-80px)]">
            <div className="border-b border-slate-800 pb-4 text-right">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2 justify-end">
                <Activity className="w-5 h-5 text-teal-400" />
                فاحص ومستكشف الأعراض التفاعلي (Interactive Symptom Checker)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                نظام طبي استدلالي ذكي بموسوعة GALE المرجعية لتقييم الأعراض والعلامات الطبية المتكررة للوصول لإرشادات التبيين السليم.
              </p>
            </div>

            {checkerStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-200 text-right">الخطوة 1: اختر العرض الأساسي لتتبع حالتك الصحية (Main Symptom)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {symptomsData.map((symptom) => (
                    <button
                      key={symptom.id}
                      type="button"
                      onClick={() => {
                        setSelectedSymptomId(symptom.id);
                        setCheckerAnswers({});
                        setCheckerStep(1);
                      }}
                      className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 hover:bg-slate-900/85 hover:shadow-lg hover:shadow-teal-950/10 transition-all cursor-pointer text-right group flex flex-col justify-between"
                    >
                      <div className="text-2xl mb-3">{symptom.icon}</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-100 group-hover:text-teal-400 transition-colors">
                          {symptom.titleAr}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-1 uppercase">
                          {symptom.titleEn}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {checkerStep === 1 && selectedSymptomId && (() => {
              const sym = symptomsData.find((s) => s.id === selectedSymptomId)!;
              return (
                <div className="space-y-6 max-w-2xl bg-slate-900/40 border border-slate-800 p-6 rounded-2xl mx-auto w-full">
                  <div className="flex items-center gap-3 justify-end">
                    <div className="text-right">
                      <h3 className="font-bold text-white text-sm">{sym.titleAr}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{sym.titleEn} • استبيان علامات شجرة التشخيص</p>
                    </div>
                    <span className="text-2xl">{sym.icon}</span>
                  </div>

                  <div className="space-y-5">
                    {sym.questions.map((q) => (
                      <div key={q.id} className="space-y-2 border-b border-slate-800/50 pb-4">
                        <label className="text-[12px] font-bold text-slate-200 block text-right">
                          • {q.textAr}
                          <span className="block text-[10px] text-slate-500 font-mono font-normal mt-0.5 text-left">{q.textEn}</span>
                        </label>
                        <div className="flex flex-wrap gap-2 pt-1.5 justify-end">
                          {q.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setCheckerAnswers((prev) => ({ ...prev, [q.id]: opt }));
                              }}
                              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                checkerAnswers[q.id] === opt
                                  ? "bg-teal-500/20 text-teal-400 border border-teal-500"
                                  : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setCheckerStep(0)}
                      className="px-4 py-2 text-xs bg-slate-950 text-slate-400 font-bold rounded-lg border border-slate-850 hover:bg-slate-900 transition cursor-pointer"
                    >
                      رجوع ومسح الاختيار
                    </button>

                    <button
                      type="button"
                      disabled={sym.questions.some((q) => !checkerAnswers[q.id])}
                      onClick={() => setCheckerStep(2)}
                      className="px-6 py-2 text-xs bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-lg transition hover:from-teal-600 hover:to-emerald-600 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
                    >
                      معاينة التقرير والتشخيص المبدئي
                    </button>
                  </div>
                </div>
              );
            })()}

            {checkerStep === 2 && selectedSymptomId && (() => {
              const sym = symptomsData.find((s) => s.id === selectedSymptomId)!;
              return (
                <div className="space-y-6 max-w-2xl bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden mx-auto w-full">
                  <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <HeartPulse className="w-40 h-40 text-teal-400" />
                  </div>

                  <div className="border-b border-slate-800 pb-4 text-right">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                      تقرير التقييم السريري المبدئي
                    </span>
                    <h3 className="font-extrabold text-white text-base mt-2 flex items-center gap-2 justify-end">
                      <span>{sym.icon}</span>
                      <span>الحالة المتتبعة: {sym.titleAr}</span>
                    </h3>
                  </div>

                  <div className="space-y-4 text-right">
                    <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-900 space-y-3">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-left">الإجابات والمسارات السريرية:</h4>
                      {sym.questions.map((q) => (
                        <div key={q.id} className="text-xs flex justify-between gap-4 border-b border-slate-800/20 pb-2">
                          <span className="text-teal-400 font-bold shrink-0">{checkerAnswers[q.id] || "لم يحدد"}</span>
                          <span className="text-slate-400 font-medium">{q.textAr}</span>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-teal-500/5 rounded-xl border border-teal-500/10 space-y-2">
                      <h4 className="text-xs font-bold text-teal-400 flex items-center gap-1.5 justify-end">
                        <Sparkles className="w-4 h-4 text-teal-400" />
                        التوجيه الطبي المرجعي للعلامات (Matched Assessment)
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {sym.diagnosisTxt}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800/60">
                    <button
                      type="button"
                      onClick={() => {
                        let compiledQuery = `أعاني من عرض: ${sym.titleAr} (${sym.titleEn}) ومساري السريري المبدئي هو:\n`;
                        sym.questions.forEach((q) => {
                          compiledQuery += `- ${q.textAr} إجابتي: ${checkerAnswers[q.id]}\n`;
                        });
                        compiledQuery += `أرجو مطابقة هذه التفاصيل بموسوعة GALE الطبية وتوضيح أحدث إرشادات العلاج والوقاية الطارئة.`;
                        
                        setActiveTab("chatbot");
                        handleSendMessage(compiledQuery);
                        setCheckerStep(0);
                        setSelectedSymptomId(null);
                        setCheckerAnswers({});
                      }}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bot className="w-4 h-4" />
                      إرسال للمستشار الطبي لبدء البحث المتقدم (RAG)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCheckerStep(0);
                        setSelectedSymptomId(null);
                        setCheckerAnswers({});
                      }}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-300 font-bold text-xs rounded-lg border border-slate-800 transition cursor-pointer"
                    >
                      إعادة الفحص من جديد
                    </button>
                  </div>
                </div>
              );
            })()}
          </section>
        )}

        {/* 💊 4️⃣ حاسبة الجرعات ومتابعة الأدوية (Smart Dosage & Medication Tracker) */}
        {activeTab === "dosage" && (
          <section className="flex-1 p-6 flex flex-col gap-6 bg-slate-950 overflow-y-auto max-h-[calc(100vh-80px)]">
            <div className="border-b border-slate-800 pb-4 text-right">
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2 justify-end">
                <Calculator className="w-5 h-5 text-teal-400" />
                حاسبة الجرعات الذكية وحارس مواعيد الأدوية الآمن (Dosage Tracker)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                احسب جرعة الباراسيتامول الآمنة للأطفال بدقة بناءً على الوزن، وسجل مواعيد أدويتك لطلب الحماية التلقائية من تجاوز الجرعة الآمنة.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Pediatric Dosage Calculator */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 justify-end">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    حاسبة جرعات الباراسيتامول للأطفال (Pediatric Calculator)
                  </h3>
                  <Calculator className="w-4 h-4 text-teal-400" />
                </div>

                <div className="space-y-4 text-right">
                  {/* Weight Input with Slider & Input form */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono text-teal-400 font-bold text-sm bg-teal-500/10 px-2.5 py-1 rounded border border-teal-500/20">{pediatricWeight} كجم</span>
                      <label className="text-slate-300 font-bold">وزن الطفل الحالي (Body Weight):</label>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="40"
                      value={pediatricWeight}
                      onChange={(e) => setPediatricWeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                  </div>

                  {/* Concentration Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">تركيز الشراب المتاح بالعبوة (Concentration):</label>
                    <select
                      value={paracetamolConc}
                      onChange={(e) => setParacetamolConc(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500/40 text-right"
                    >
                      <option value="120mg/5ml">120 ملغ لكل 5 مل (معتاد للرضع)</option>
                      <option value="250mg/5ml">250 ملغ لكل 5 مل (معتاد للأطفال فوق سنتين)</option>
                    </select>
                  </div>

                  {/* Calculated Results Card */}
                  {(() => {
                    const doseMg = Math.round(pediatricWeight * 12.5);
                    const concFactor = paracetamolConc === "120mg/5ml" ? 120 / 5 : 250 / 5;
                    const doseMl = (doseMg / concFactor).toFixed(1);
                    const maxDailyMg = Math.round(pediatricWeight * 50);
                    const maxDailyMl = (maxDailyMg / concFactor).toFixed(1);

                    return (
                      <div className="bg-slate-950 rounded-xl p-4 border border-teal-500/10 space-y-3 relative overflow-hidden text-right">
                        <div className="absolute top-0 left-0 p-2 text-teal-500/5 select-none pointer-events-none">
                          <Calculator className="w-24 h-24" />
                        </div>
                        
                        <div>
                          <span className="text-[9px] uppercase font-mono tracking-wider font-bold text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded">الجرعة الفردية الآمنة لمرة واحدة</span>
                          <div className="flex items-baseline gap-3 mt-1.5 justify-end">
                            <span className="text-sm text-slate-500">أو ما يعادل</span>
                            <span className="text-lg font-bold text-white font-mono">{doseMl} مل</span>
                            <span className="text-sm text-slate-500">من العبوة</span>
                            <span className="text-xl font-extrabold text-teal-400">{doseMg} ملغ</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">تؤخذ عند اللزوم (فقط في حال وجود حرارة أو ألم) كل 4 إلى 6 ساعات.</p>
                        </div>

                        <div className="border-t border-slate-850 pt-2 flex justify-between text-xs items-center">
                          <span className="font-bold text-orange-400">{maxDailyMg} ملغ ({maxDailyMl} مل)</span>
                          <span className="text-slate-400 text-[10px]">الحد الأقصى في 24 ساعة:</span>
                        </div>

                        <div className="bg-amber-500/5 px-2.5 py-1.5 rounded border border-amber-500/10 text-[9px] text-amber-400 leading-relaxed flex gap-1 items-start text-right">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
                          <span>تنبيه حرج: لا تعطي الطفل أكثر من 4 جرعات متباعدة خلال 24 ساعة، ولا تدمج دواء برد آخر يحتوي على الباراسيتامول لتجنب السمية المفرطة.</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Daily Medication Tracker */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3 justify-end">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">
                    حارس السلامة وجدول الأدوية اليومي (Active Dose Guardian)
                  </h3>
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                </div>

                {/* Form to add New Medication */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!formMedName) return;
                    setMedsList(prev => [
                      ...prev,
                      {
                        id: Date.now().toString(),
                        name: formMedName,
                        doseMg: formDoseMg,
                        frequency: formFreq,
                        activeIngredient: formIngredient,
                        takenDosesToday: 0
                      }
                    ]);
                    setFormMedName("");
                    setFormDoseMg(500);
                    setFormFreq(3);
                    setFormIngredient("Paracetamol");
                  }}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-850 grid grid-cols-1 sm:grid-cols-2 gap-3 text-right"
                >
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">اسم الدواء (Medication Name):</label>
                    <input
                      type="text"
                      value={formMedName}
                      onChange={(e) => setFormMedName(e.target.value)}
                      placeholder="مثال: بنادول 500 ملغ، شراب أو كبسولات..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 text-right"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">المادة الفعالة (Active Ingredient):</label>
                    <select
                      value={formIngredient}
                      onChange={(e) => setFormIngredient(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 text-right"
                    >
                      <option value="Paracetamol">باراسيتامول (مسكن وخافض حرارة)</option>
                      <option value="Amoxicillin">أموكسيسيلين (مضاد حيوي)</option>
                      <option value="Other">مادة أخرى (Ibuprofen, etc.)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">جرعة المرة الواحدة (mg per Dose):</label>
                    <input
                      type="number"
                      value={formDoseMg}
                      onChange={(e) => setFormDoseMg(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white text-right font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">مرات الأخذ يومياً (Freq/Day):</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formFreq}
                      onChange={(e) => setFormFreq(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white text-right font-mono"
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end">
                    <button
                      type="submit"
                      disabled={!formMedName}
                      className="w-full py-2 bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white border border-teal-500/20 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة الدواء للجدول
                    </button>
                  </div>
                </form>

                {/* Safety Monitoring System */}
                {(() => {
                  const scheduledParacetamolTotal = medsList
                    .filter(m => m.activeIngredient === "Paracetamol")
                    .reduce((sum, m) => sum + (m.doseMg * m.frequency), 0);
                  
                  const isParacetamolExceeded = scheduledParacetamolTotal > 4000;

                  return (
                    <div className="space-y-3">
                      {isParacetamolExceeded && (
                        <div className="bg-rose-500/20 text-rose-300 px-4 py-3 rounded-xl border border-rose-500/40 text-xs text-right leading-relaxed animate-pulse flex gap-2 items-start">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold font-sans text-rose-300 block">⚠️ تحذير طبي حرج: تجاوز جرعة الأمان اليومية!</span>
                            الجرعة اليومية للباراسيتامول في هذا الجدول هي **({scheduledParacetamolTotal} ملغ)**، وهي تتجاوز حد الأمان للبالغين البالغ **(4000 ملغ)**! قد تسبب زيادة مفرطة وتسمم كبدي مهدد للحياة. يرجى خفض الجرعات وتعديل الخطة فوراً!
                          </div>
                        </div>
                      )}

                      {/* Cumulative Dose Progress Meter */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 text-right">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">مؤشر الحد اليومي التراكمي:</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className={scheduledParacetamolTotal > 4000 ? "text-rose-400 font-bold" : "text-teal-400 font-bold"}>
                              {scheduledParacetamolTotal} / 4000 ملغ
                            </span>
                            <span className="text-slate-300 font-bold">الباراسيتامول الكلي لليوم</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                scheduledParacetamolTotal > 4000 ? "bg-rose-500 animate-pulse" : "bg-teal-400"
                              }`}
                              style={{ width: `${Math.min((scheduledParacetamolTotal / 4000) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Journal Table display */}
                <div className="space-y-2 text-right">
                  <h4 className="text-xs font-bold text-slate-400">قائمة الأدوية المعتمدة لليوم:</h4>
                  {medsList.length === 0 ? (
                    <div className="text-center py-6 text-slate-600 text-xs italic">
                      لا توجد أدوية مضافة حالياً لجدول المتابعة اليومية.
                    </div>
                  ) : (
                    medsList.map((med) => {
                      const limitWarning = med.activeIngredient === "Paracetamol" && (med.doseMg * med.frequency) > 4000;
                      return (
                        <div
                          key={med.id}
                          className={`p-3 rounded-lg bg-slate-950 border transition-all flex items-center justify-between gap-4 ${
                            limitWarning ? "border-rose-500/30 bg-rose-500/5" : "border-slate-850"
                          }`}
                        >
                          {/* Left Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMedsList(prev => prev.map(m => {
                                  if (m.id === med.id) {
                                    return { ...m, takenDosesToday: Math.min(m.takenDosesToday + 1, m.frequency) };
                                  }
                                  return m;
                                }));
                              }}
                              disabled={med.takenDosesToday >= med.frequency}
                              className={`px-2 py-1 text-[10px] rounded font-bold transition-all cursor-pointer ${
                                med.takenDosesToday >= med.frequency
                                  ? "bg-slate-900 text-slate-500 border border-slate-950 cursor-not-allowed"
                                  : "bg-teal-500/10 text-teal-400 hover:bg-teal-500 hover:text-white border border-teal-500/25"
                              }`}
                            >
                              {med.takenDosesToday >= med.frequency ? "اكتمل" : "تسجيل أخذ جرعة"} 
                              <span className="font-mono ml-1">({med.takenDosesToday}/{med.frequency})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMedsList(prev => prev.map(m => {
                                  if (m.id === med.id) {
                                    return { ...m, takenDosesToday: 0 };
                                  }
                                  return m;
                                }));
                              }}
                              className="p-1 px-1.5 rounded hover:bg-slate-850 text-slate-500 hover:text-slate-300 text-[10px] border border-slate-900 cursor-pointer"
                              title="إعادة ضبط وعداد الجرعات اليوم"
                            >
                              ضبط
                            </button>

                            <button
                              type="button"
                              onClick={() => setMedsList(prev => prev.filter(m => m.id !== med.id))}
                              className="p-1 text-rose-500 hover:text-rose-400 rounded hover:bg-rose-500/5 cursor-pointer"
                              title="حذف هذا الدواء"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Right descriptions */}
                          <div className="text-right font-sans">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                                {med.activeIngredient}
                              </span>
                              <span className="font-extrabold text-xs text-white">{med.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              الجرعة المفردة: <span className="font-bold text-slate-300">{med.doseMg} ملغ</span> • تكرار الأخذ {med.frequency} مرات باليوم (مجموع الخطة: {med.doseMg * med.frequency} ملغ)
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 💻 مخطط السيرفر (Production-ready LangGraph Blueprint files) */}
        {activeTab === "code" && (
          <section className="flex-1 p-6 flex flex-col gap-4 bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Code className="w-4 h-4 text-teal-400" />
                  Expert Advanced RAG & LangGraph Architecture
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Review the exact production-ready asynchronous Python files created in your workspace at <span className="font-mono text-slate-200">/agent/</span>.
                </p>
              </div>

              {/* Toggle files */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCodeFile("agent")}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${
                    activeCodeFile === "agent" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:text-white"
                  }`}
                >
                  agent.py
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeFile("tools")}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${
                    activeCodeFile === "tools" ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "text-slate-400 hover:text-white"
                  }`}
                >
                  agent/utils/tools.py
                </button>
              </div>
            </div>

            {/* Code Block Container */}
            <div className="flex-1 bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden flex flex-col relative">
              <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px] text-slate-400">
                  {activeCodeFile === "agent" ? "/agent/agent.py" : "/agent/utils/tools.py"}
                </span>

                <button
                  id="bprint-copy-btn"
                  type="button"
                  onClick={() => handleCopyCode(activeCodeFile === "agent" ? agentPy || getBackupAgentPy() : toolsPy || getBackupToolsPy())}
                  className="px-2.5 py-1 bg-slate-850 hover:bg-slate-800 text-[11px] hover:text-white rounded border border-slate-700/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Beautiful custom formatted code editor block */}
              <div className="flex-1 p-5 overflow-auto font-mono text-[11px] leading-relaxed text-slate-300 whitespace-pre-wrap select-text selection:bg-teal-500/20">
                {activeCodeFile === "agent" ? (
                  agentPy || getBackupAgentPy()
                ) : (
                  toolsPy || getBackupToolsPy()
                )}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* --- High-Fidelity Printable Clinical Report Document View (Hidden on Screen, Visible on Print) --- */}
      {printTargetText && (
        <div className="clinical-print-document hidden print:flex bg-white text-slate-800 p-10 relative flex-col justify-between" dir="rtl">
          <div className="watermark-bg absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] text-[90px] font-black text-slate-100/50 uppercase tracking-widest select-none pointer-events-none z-0">
            MEDIBLAZE
          </div>
          
          <div className="z-10 relative">
            {/* Header Letterhead */}
            <div className="flex justify-between items-start border-b-2 border-teal-600 pb-5 mb-8">
              <div className="text-right">
                <h1 className="text-2xl font-black text-teal-600 tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>MEDIBLAZE</h1>
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: "Inter, sans-serif" }}>Advanced AI Physician Co-pilot</p>
              </div>
              <div className="text-left text-xs text-slate-500 leading-relaxed font-mono">
                <div>تاريخ التقرير: <span className="font-bold text-slate-800">{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                <div>الرقم المرجعي: <span className="font-bold text-slate-800">MDA-{printTargetIndex}98-{new Date().getFullYear()}</span></div>
                <div>مرجع التثقيف: <span className="font-bold text-slate-800">موسوعة GALE الطبية للأبحاث</span></div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-lg font-extrabold text-slate-800 border-b border-teal-500 pb-2 inline-block px-5">تقرير طبي وتثقيف صحي معتمد</h2>
            </div>

            {/* Body */}
            <div 
              className="text-right leading-relaxed mb-6 text-slate-700 font-sans"
              style={{ fontSize: '13px' }}
              dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(printTargetText) }}
            />
          </div>

          {/* Footer - Stamp, Seals and Disclaimer */}
          <div className="border-t border-slate-200 pt-6 mt-8 flex justify-between items-end z-10 relative">
            <div className="text-slate-500 text-[10px] leading-relaxed max-w-[70%] text-justify">
              <strong className="text-slate-700">تنويه طبي هام:</strong> تم إنشاء هذا المستند الإرشادي والمسارات الطبية المرفقة به برمجياً واستدلالياً بواسطة الذكاء الاصطناعي التوليدي ومزامنته مع قواعد بيانات موسوعة GALE المعتمدة. يعاد التنويه بصرامة أن كافة هذه المعلومات والجرعات مخصصة حصرياً لأغراض التثقيف والإرشاد المنزلي والدراسة البيولوجية، ولا تمثّل تشخيصاً طبياً نهائياً، ولا تحل مطلقاً محل الفحص والاستشارة السريرية لدى طبيب بشري مرخص.
            </div>
            
            <div className="text-center min-w-[120px]">
              <div className="text-[10px] font-extrabold text-slate-500 mb-2">التوقيع الطبي الاستشاري</div>
              <div className="w-[84px] h-[84px] rounded-full border-4 border-double border-teal-600 flex flex-col items-center justify-center bg-teal-50/10 text-teal-600 mx-auto select-none" style={{ transform: "rotate(-4deg)" }}>
                <div className="text-[8px] font-black" style={{ fontFamily: "Inter, sans-serif" }}>MEDIBLAZE</div>
                <div className="text-[6px] font-bold border-y border-dashed border-teal-600 my-1 py-0.5 px-1 bg-white">CO-PILOT</div>
                <div className="text-[6px] font-extrabold" style={{ fontFamily: "Inter, sans-serif" }}>VERIFIED</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Highly Polished Clinical Report Preview Modal (Visible on Screen, Hidden on Print) --- */}
      {printTargetText && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 md:p-6 no-print overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl flex flex-col max-h-[92vh] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-850 flex items-center justify-between bg-slate-900/90 backdrop-blur">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
                <h3 className="font-bold text-slate-200 text-sm md:text-base">معاينة التقرير الطبي المعتمد قبل الطباعة</h3>
              </div>
              <button 
                type="button"
                onClick={() => setPrintTargetText(null)}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="إغلاق المعاينة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Action Buttons Bar */}
            <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-850 flex flex-wrap gap-4 items-center justify-between">
              <span className="text-xs text-slate-400">
                رقم المستند المرجعي: <span className="font-mono text-teal-400 font-bold">MDA-{printTargetIndex}</span>
              </span>
              <div className="flex gap-2">
                {/* PDF Print Button */}
                <button
                  type="button"
                  onClick={() => {
                    handlePrint();
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-xs text-white font-extrabold rounded-xl shadow-lg shadow-teal-500/15 hover:shadow-teal-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  بدء الطباعة / حفظ كـ PDF
                </button>
                
                {/* HTML Backup Download Button */}
                <button
                  type="button"
                  onClick={() => downloadHTMLBackup()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 font-semibold rounded-xl hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                  title="تحميل التقرير كملف صفحات ويب مستقل مجهز للطباعة المنزلية"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  تحميل نسخة مستقلة (.HTML)
                </button>
              </div>
            </div>

            {/* Simulated Live Sheet Preview (Light Styled Card) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-950/40 flex justify-center">
              <div className="bg-white text-slate-800 w-full max-w-[210mm] p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200 relative flex flex-col justify-between" dir="rtl" id="printable-report-area">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] rotate-[-30deg] text-[64px] md:text-[80px] font-black text-slate-900 pointer-events-none select-none tracking-widest uppercase">
                  MEDIBLAZE
                </div>

                <div className="z-10 relative">
                  {/* Header Letterhead */}
                  <div className="flex justify-between items-start border-b-2 border-teal-600 pb-5 mb-8">
                    <div className="text-right">
                      <h1 className="text-2xl font-black text-teal-600 tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>MEDIBLAZE</h1>
                      <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: "Inter, sans-serif" }}>Advanced AI Physician Co-pilot</p>
                    </div>
                    <div className="text-left text-xs text-slate-500 leading-relaxed font-mono">
                      <div>تاريخ التقرير: <span className="font-bold text-slate-800">{new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                      <div>الرقم المرجعي: <span className="font-bold text-slate-800">MDA-{printTargetIndex}98-{new Date().getFullYear()}</span></div>
                      <div>مرجع التثقيف: <span className="font-bold text-slate-800">موسوعة GALE الطبية للأبحاث</span></div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-8">
                    <h2 className="text-base md:text-lg font-extrabold text-slate-900 border-b-2 border-teal-500 pb-1.5 inline-block px-6">تقرير طبي وتثقيف صحي معتمد</h2>
                  </div>

                  {/* Body Content with nice line spacing */}
                  <div 
                    className="report-text-content text-right text-[13px] leading-relaxed text-slate-700 whitespace-pre-wrap select-text font-serif" 
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(printTargetText) }}
                  />
                </div>

                {/* Footer Disclaimer & Sign Stamp */}
                <div className="border-t border-slate-200 pt-6 mt-8 flex justify-between items-end z-10 relative">
                  <div className="text-slate-500 text-[10px] leading-relaxed max-w-[70%] text-justify">
                    <strong className="text-slate-700">تنويه طبي هام:</strong> تم إنشاء هذا المستند الإرشادي والمسارات الطبية المرفقة به برمجياً واستدلالياً بواسطة الذكاء الاصطناعي التوليدي ومزامنته مع قواعد بيانات موسوعة GALE المعتمدة. يعاد التنويه بصرامة أن كافة هذه المعلومات والجرعات مخصصة حصرياً لأغراض التثقيف والإرشاد المنزلي والدراسة البيولوجية، ولا تمثّل تشخيصاً طبياً نهائياً، ولا تحل مطلقاً محل الفحص والاستشارة السريرية لدى طبيب بشري مرخص.
                  </div>
                  
                  <div className="text-center min-w-[120px]">
                    <div className="text-[10px] font-extrabold text-slate-500 mb-2">التوقيع الطبي الاستشاري</div>
                    <div className="w-[80px] h-[80px] rounded-full border-4 border-double border-teal-600 flex flex-col items-center justify-center bg-teal-50/10 text-teal-600 mx-auto select-none" style={{ transform: "rotate(-4deg)" }}>
                      <div className="text-[8px] font-black" style={{ fontFamily: "Inter, sans-serif" }}>MEDIBLAZE</div>
                      <div className="text-[6px] font-bold border-y border-dashed border-teal-600 my-1 py-0.5 px-0.5 bg-white">CO-PILOT</div>
                      <div className="text-[6px] font-extrabold" style={{ fontFamily: "Inter, sans-serif" }}>VERIFIED</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Safe Printing Iframe Restriction Notice Modal --- */}
      {showIframePrintNotice && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative" dir="rtl">
            <div className="flex flex-col items-center text-center">
              {/* Alert Icon */}
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 border border-amber-500/20">
                <Printer className="w-7 h-7" />
              </div>
              
              <h3 className="text-base font-bold text-slate-200 mb-2">تعليمات الطباعة داخل بيئة التطوير (A4 Report)</h3>
              
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mb-6">
                مرحباً بك! لِكونك تتصفّح التطبيق حالياً من داخل <strong className="text-teal-400 font-semibold">تطبيق المعاينة المُقيد (Iframe Secure Sandbox)</strong>، فإن المتصفح يمنع استدعاء واجهة الطباعة المباشرة لتأمين نوافذ النظام وطباعة المخرجات بأمان.
              </p>

              <div className="w-full space-y-3.5 mb-6 text-right">
                {/* Rule 1: Standalone copy */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-md bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">1</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 mb-1">الطباعة المنزلية المباشرة (موصى بها)</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      اضغط على زر <strong className="text-teal-400">"تحميل نسخة مستقلة وطباعتها"</strong> لحفظ التقرير بصيغته السريرية المستقلة على جهازك، ثم افتح الملف واضغط <kbd className="bg-slate-800 px-1 py-0.5 rounded text-[10px]">Ctrl + P</kbd> لبدء الطباعة.
                    </p>
                  </div>
                </div>

                {/* Rule 2: Open in a new tab */}
                <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-850 flex gap-3 items-start">
                  <div className="w-5 h-5 rounded-md bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">2</div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 mb-1">استخدام الطباعة التفاعلية المباشرة</h4>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      افتح التطبيق في علامة تبويب مستقلة جديدة للتشغيل خارج بيئة التطوير، حيث يمكنك الطباعة بنقرة واحدة مباشرة بفضل كامل الصلاحيات.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setShowIframePrintNotice(false);
                    downloadHTMLBackup();
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-xs text-white font-bold rounded-xl transition-all cursor-pointer"
                >
                  تحميل نسخة مستقلة وطباعتها
                </button>
                <button
                  type="button"
                  onClick={() => setShowIframePrintNotice(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-xs text-slate-350 font-bold rounded-xl transition-all cursor-pointer"
                >
                  إغلاق التنبيه
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
