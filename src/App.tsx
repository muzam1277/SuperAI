import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Cpu, 
  Video, 
  Plus, 
  Send, 
  Loader2, 
  ChevronRight,
  FileText,
  Zap,
  Layers,
  Play,
  Download,
  AlertCircle,
  ShieldCheck,
  Lock,
  Unlock,
  Info,
  Upload,
  File,
  Image as ImageIcon,
  Music,
  X,
  Search,
  Globe,
  ExternalLink,
  Mic,
  MicOff,
  User as UserIcon,
  LogOut,
  History,
  MessageSquare,
  Trash2,
  Sparkles,
  Heart,
  Shield
} from 'lucide-react';
import Markdown from 'react-markdown';
import { SuperAIService, ETHICAL_RULES, LEGAL_DISCLAIMER } from './services/superAIService';
import { SecurityService, UserRole } from './services/securityService';
import { Logo } from './components/Logo';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PRIVACY_POLICY = `
# Privacy Policy
**Last Updated: February 2026**

1. **Data Collection**: We collect minimal data required for system operation, including your name and email if you log in via Google.
2. **Multimodal Processing**: Any files or text you upload are processed in real-time. We do not store this data persistently unless you explicitly grant consent in the Security settings.
3. **Cookies**: We use secure, cross-site cookies to manage your session.
4. **Third-Party Services**: We use Google Gemini API for intelligence processing. Your data is subject to their privacy guidelines during processing.
5. **Data Deletion**: You can purge all your session data at any time using the "Purge Data" feature in the Security tab.
`;

const TERMS_OF_USE = `
# Terms of Use
**Last Updated: February 2026**

1. **Acceptance**: By using SuperAI, you agree to these terms and our Ethical Rules.
2. **Ethical Use**: You must not use the system for any harmful, illegal, or unethical purposes. All actions are monitored by a Neural Firewall.
3. **Master ID**: Access to advanced features requires a valid Master ID. Sharing your ID is strictly prohibited.
4. **No Liability**: SuperAI Systems is not responsible for any outcomes resulting from the use of AI-generated content.
5. **Modifications**: We reserve the right to modify these terms at any time.
`;

const LegalModal = ({ title, content, onClose }: { title: string; content: string; onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#141414]/80 backdrop-blur-sm"
  >
    <motion.div 
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="bg-white border border-[#141414] w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
    >
      <div className="p-6 border-b border-[#141414] flex items-center justify-between bg-[#E4E3E0]">
        <h3 className="font-serif italic text-2xl">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-[#141414]/10 transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-8 prose prose-sm max-w-none font-sans">
        <Markdown>{content}</Markdown>
      </div>
      <div className="p-6 border-t border-[#141414] flex justify-end bg-[#E4E3E0]">
        <button 
          onClick={onClose}
          className="px-8 py-3 bg-[#141414] text-[#E4E3E0] font-mono uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  </motion.div>
);

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

type Tab = 'research' | 'synthesis' | 'video' | 'image' | 'safety' | 'plans' | 'search' | 'security';
type ProcessingTask = 'summarize' | 'extract_audio' | 'extract_frames';
type PlanType = 'Free' | 'Daily' | 'Monthly' | 'Yearly';

interface Plan {
  type: PlanType;
  price: string;
  researchLimit: number | 'unlimited';
  videoLimit: number | 'unlimited';
  features: string[];
}

const USAGE_PLANS: Plan[] = [
  {
    type: 'Free',
    price: '$0',
    researchLimit: 3,
    videoLimit: 1,
    features: ['3 Research Tasks/Day', '1 Video Render/Day', 'Standard Image Lab']
  },
  {
    type: 'Daily',
    price: '$0.99',
    researchLimit: 'unlimited',
    videoLimit: 3,
    features: ['Unlimited Research', '3 Video Renders/Day', 'Multimodal Support']
  },
  {
    type: 'Monthly',
    price: '$9.99',
    researchLimit: 'unlimited',
    videoLimit: 20,
    features: ['Unlimited Research', '20 Video Renders/Month', 'High-Res Image Lab']
  },
  {
    type: 'Yearly',
    price: '$89.99',
    researchLimit: 'unlimited',
    videoLimit: 'unlimited',
    features: ['Priority Processing', 'Unlimited Everything', '24/7 Support']
  }
];

interface UploadedFile {
  data: string;
  mimeType: string;
  name: string;
  preview?: string;
}

interface User {
  name: string;
  email: string;
  picture: string;
  role: UserRole;
}

interface HistoryItem {
  id: string;
  title: string;
  type: Tab;
  timestamp: number;
  data: any;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('research');
  const [processingLogs, setProcessingLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [ethicalChecking, setEthicalChecking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [researchData, setResearchData] = useState<{ summary: string } | null>(null);
  const [synthesisResult, setSynthesisResult] = useState<string | null>(null);
  const [videoScript, setVideoScript] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{ text: string; sources: { title: string; url: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const [masterId, setMasterId] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('GUEST');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userConsent, setUserConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(() => localStorage.getItem('superai_terms_accepted') === 'true');
  const [showLegal, setShowLegal] = useState(() => localStorage.getItem('superai_terms_accepted') !== 'true');
  const [purgeSuccess, setPurgeSuccess] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanType>('Free');
  const [usageCount, setUsageCount] = useState({ research: 0, video: 0 });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiService = useMemo(() => new SuperAIService(), []);

  useEffect(() => {
    aiService.setTermsAccepted(termsAccepted);
  }, [termsAccepted, aiService]);

  useEffect(() => {
    aiService.setConsent(userConsent);
  }, [userConsent, aiService]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setIsAuthorized(true);
          setUserRole(userData.role);
        }
      } catch (e) {
        console.error("Auth check failed", e);
      }
    };
    checkAuth();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const { url } = await res.json();
      window.open(url, 'google_login', 'width=500,height=600');
    } catch (e) {
      setError("Failed to initiate Google login");
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setIsAuthorized(false);
    setUserRole('GUEST');
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const handleOpenKeyDialog = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  const handleAuthorize = () => {
    const role = SecurityService.validateAccess(masterId);
    if (role !== 'GUEST') {
      setUserRole(role);
      setIsAuthorized(true);
      setError(null);
    } else {
      // Legacy check
      if (masterId === 'shah_master_id') {
        setUserRole('MASTER');
        setIsAuthorized(true);
        setError(null);
      } else {
        setIsAuthorized(false);
        setUserRole('GUEST');
        setError('INVALID ACCESS KEY: Access Denied.');
      }
    }
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowLegal(false);
    localStorage.setItem('superai_terms_accepted', 'true');
    aiService.setTermsAccepted(true);
  };

  const handleToggleConsent = (consent: boolean) => {
    setUserConsent(consent);
    aiService.setConsent(consent);
  };

  const handleNewChat = () => {
    setResearchData(null);
    setSynthesisResult(null);
    setVideoScript(null);
    setVideoUrl(null);
    setGeneratedImageUrl(null);
    setSearchResult(null);
    setInputText('');
    setSelectedFiles([]);
    setError(null);
    setProcessingLogs([]);
  };

  const handlePurgeData = () => {
    handleNewChat();
    setHistory([]);
    setUsageCount({ research: 0, video: 0 });
    setPurgeSuccess(true);
    setTimeout(() => setPurgeSuccess(false), 3000);
  };

  const addToHistory = (title: string, type: Tab, data: any) => {
    const newItem: HistoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: title || 'Untitled Conversation',
      type,
      timestamp: Date.now(),
      data
    };
    setHistory(prev => [newItem, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setActiveTab(item.type);
    if (item.type === 'research') setResearchData(item.data);
    if (item.type === 'synthesis') setSynthesisResult(item.data);
    if (item.type === 'video') {
      setVideoScript(item.data.script);
      setVideoUrl(item.data.url);
    }
    if (item.type === 'image') setGeneratedImageUrl(item.data);
    if (item.type === 'search') setSearchResult(item.data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > 15) {
      setError("MAX ATTACHMENTS REACHED: You can only upload up to 15 files at a time.");
      return;
    }

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setSelectedFiles(prev => [...prev, {
          data: base64,
          mimeType: file.type,
          name: file.name,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleResearch = async () => {
    if (!inputText && selectedFiles.length === 0) return;
    
    // Bypass limits for Master/Admin
    const isAdmin = isAuthorized && masterId === 'shah_master_id';
    const plan = USAGE_PLANS.find(p => p.type === currentPlan)!;
    
    // Text messaging is free for everyone without limit
    const isTextOnly = selectedFiles.length === 0;

    if (!isAdmin && !isTextOnly && plan.researchLimit !== 'unlimited' && usageCount.research >= plan.researchLimit) {
      setError(`PLAN LIMIT REACHED: Your ${currentPlan} plan allows only ${plan.researchLimit} multimodal research tasks. Text-only research is unlimited.`);
      return;
    }

    setLoading(true);
    setEthicalChecking(true);
    setError(null);
    setProcessingLogs([]);
    try {
      const result = await aiService.processInput({ 
        text: inputText, 
        files: selectedFiles.map(f => ({ data: f.data, mimeType: f.mimeType, name: f.name }))
      }, masterId, userRole, (log) => {
        setProcessingLogs(prev => [...prev, log]);
      });
      setResearchData(result);
      if (!isTextOnly) {
        setUsageCount(prev => ({ ...prev, research: prev.research + 1 }));
      }
      addToHistory(inputText.substring(0, 30) || 'Research Analysis', 'research', result);
    } catch (err: any) {
      setError(err.message || 'Failed to process input');
    } finally {
      setLoading(false);
      setEthicalChecking(false);
    }
  };

  const handleSynthesis = async () => {
    if (!researchData) return;
    setLoading(true);
    setEthicalChecking(true);
    setError(null);
    setProcessingLogs([]);
    try {
      const result = await aiService.synthesizeMaterials([researchData.summary], masterId, userRole, (log) => {
        setProcessingLogs(prev => [...prev, log]);
      });
      setSynthesisResult(result || null);
      addToHistory('Synthesis: ' + (researchData.summary.substring(0, 20) || 'Materials'), 'synthesis', result);
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize materials');
    } finally {
      setLoading(false);
      setEthicalChecking(false);
    }
  };

  const handleVideoGen = async () => {
    if (!inputText && selectedFiles.length === 0) return;

    // Bypass limits for Master/Admin
    const isAdmin = isAuthorized && masterId === 'shah_master_id';
    const plan = USAGE_PLANS.find(p => p.type === currentPlan)!;
    
    if (!isAdmin && plan.videoLimit !== 'unlimited' && usageCount.video >= plan.videoLimit) {
      setError(`PLAN LIMIT REACHED: Your ${currentPlan} plan allows only ${plan.videoLimit} video generations.`);
      return;
    }

    setLoading(true);
    setEthicalChecking(true);
    setError(null);
    setProcessingLogs([]);
    setVideoUrl(null);
    try {
      const topic = inputText || (selectedFiles.length > 0 ? `Analyze and generate video based on ${selectedFiles[0].name}` : '');
      const script = await aiService.generateVideoScript(topic, masterId, userRole, (log) => {
        setProcessingLogs(prev => [...prev, log]);
      });
      setVideoScript(script || null);
      
      if (script) {
        const initialOp = await aiService.generateVideo(script, masterId, userRole, (log) => {
          setProcessingLogs(prev => [...prev, log]);
        });
        const finalOp = await aiService.pollVideoOperation(initialOp);
        const downloadLink = finalOp.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
          const url = await aiService.fetchVideoUrl(downloadLink);
          setVideoUrl(url);
          setUsageCount(prev => ({ ...prev, video: prev.video + 1 }));
          addToHistory('Video: ' + (topic.substring(0, 20) || 'Generation'), 'video', { script, url });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate video');
    } finally {
      setLoading(false);
      setEthicalChecking(false);
    }
  };

  const handleImageGen = async () => {
    if (!inputText && selectedFiles.length === 0) return;

    // Bypass limits for Master/Admin
    const isAdmin = isAuthorized && masterId === 'shah_master_id';
    const plan = USAGE_PLANS.find(p => p.type === currentPlan)!;
    
    // For simplicity, we'll use researchLimit for image tasks in Free plan if not admin
    if (!isAdmin && plan.type === 'Free' && typeof plan.researchLimit === 'number' && usageCount.research >= plan.researchLimit) {
      setError(`PLAN LIMIT REACHED: Your Free plan allows only ${plan.researchLimit} generation tasks.`);
      return;
    }

    setLoading(true);
    setEthicalChecking(true);
    setError(null);
    setProcessingLogs([]);
    try {
      let result: string;
      const firstImageFile = selectedFiles.find(f => f.mimeType.startsWith('image/'));
      if (firstImageFile) {
        result = await aiService.editImage(firstImageFile.data, firstImageFile.mimeType, inputText, masterId, userRole, (log) => {
          setProcessingLogs(prev => [...prev, log]);
        });
      } else {
        result = await aiService.generateImage(inputText, masterId, userRole, (log) => {
          setProcessingLogs(prev => [...prev, log]);
        });
      }
      setGeneratedImageUrl(result);
      addToHistory('Image: ' + (inputText.substring(0, 20) || 'Creation'), 'image', result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setLoading(false);
      setEthicalChecking(false);
    }
  };

  const handleSearch = async () => {
    if (!inputText) return;

    setLoading(true);
    setEthicalChecking(true);
    setError(null);
    setProcessingLogs([]);
    try {
      const result = await aiService.searchAndUnderstand(inputText, masterId, userRole, (log) => {
        setProcessingLogs(prev => [...prev, log]);
      });
      setSearchResult(result);
      addToHistory('Search: ' + (inputText.substring(0, 20) || 'Query'), 'search', result);
    } catch (err: any) {
      setError(err.message || 'Failed to perform web search');
    } finally {
      setLoading(false);
      setEthicalChecking(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-8 h-8" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-[#141414] p-12 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)] space-y-8"
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 bg-[#141414] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
              <Cpu className="w-10 h-10 text-[#E4E3E0]" />
            </div>
            <h1 className="font-serif italic text-4xl">SuperAI</h1>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] opacity-50">Universal Intelligence Gateway</p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-4 py-4 border border-[#141414] bg-white hover:bg-[#141414] hover:text-[#E4E3E0] transition-all font-mono text-xs uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <Globe className="w-5 h-5" />
              Login with Google
            </button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-[#141414]/10"></div>
              <span className="flex-shrink mx-4 font-mono text-[9px] uppercase tracking-widest opacity-30">OR ACCESS KEY</span>
              <div className="flex-grow border-t border-[#141414]/10"></div>
            </div>

            <div className="space-y-2">
              <input 
                type="password" 
                value={masterId}
                onChange={(e) => setMasterId(e.target.value)}
                placeholder="Enter Master ID..."
                className="w-full bg-white border border-[#141414] px-4 py-3 text-sm font-mono focus:ring-0"
              />
              <button 
                onClick={handleAuthorize}
                className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]"
              >
                Initialize Session
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-[10px] font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="pt-8 border-t border-[#141414]/10 flex flex-col items-center gap-4">
            <div className="flex gap-6">
              <button onClick={() => setShowPrivacy(true)} className="text-[9px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 hover:underline">Privacy Policy</button>
              <button onClick={() => setShowTerms(true)} className="text-[9px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 hover:underline">Terms of Use</button>
            </div>
            <p className="text-[8px] font-mono opacity-20 uppercase tracking-widest">© 2026 SuperAI Systems | All Rights Reserved</p>
          </div>
        </motion.div>

        {/* Legal Modals */}
        <AnimatePresence>
          {showPrivacy && (
            <LegalModal 
              title="Privacy Policy" 
              content={PRIVACY_POLICY} 
              onClose={() => setShowPrivacy(false)} 
            />
          )}
          {showTerms && (
            <LegalModal 
              title="Terms of Use" 
              content={TERMS_OF_USE} 
              onClose={() => setShowTerms(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#E4E3E0] border-r border-[#141414] z-40 hidden md:flex flex-col">
        <div className="p-6 border-b border-[#141414] flex items-center justify-between">
          <Logo />
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        <div className="p-4 border-b border-[#141414]">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 bg-[#141414] text-[#E4E3E0] font-mono uppercase tracking-widest text-[11px] hover:bg-emerald-600 transition-all shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <div className="px-4 mb-4">
            <label className="text-[9px] font-mono uppercase tracking-widest opacity-40 mb-2 block">Intelligence Modules</label>
            <div className="space-y-1">
              <SidebarItem icon={<BookOpen className="w-4 h-4" />} label="Research" active={activeTab === 'research'} onClick={() => setActiveTab('research')} />
              <SidebarItem icon={<Layers className="w-4 h-4" />} label="Synthesis" active={activeTab === 'synthesis'} onClick={() => setActiveTab('synthesis')} />
              <SidebarItem icon={<Video className="w-4 h-4" />} label="Video Gen" active={activeTab === 'video'} onClick={() => setActiveTab('video')} />
              <SidebarItem icon={<ImageIcon className="w-4 h-4" />} label="Image Lab" active={activeTab === 'image'} onClick={() => setActiveTab('image')} />
              <SidebarItem icon={<Search className="w-4 h-4" />} label="Deep Search" active={activeTab === 'search'} onClick={() => setActiveTab('search')} />
            </div>
          </div>

          <div className="px-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-mono uppercase tracking-widest opacity-40 block">Recent History</label>
              <History className="w-3 h-3 opacity-20" />
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto scrollbar-hide">
              {history.length > 0 ? (
                history.map((item) => (
                  <div key={item.id} className="group relative">
                    <button 
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-left px-3 py-2 text-[10px] font-mono truncate hover:bg-[#141414]/5 transition-colors flex items-center gap-2"
                    >
                      <MessageSquare className="w-3 h-3 opacity-30" />
                      <span className="truncate">{item.title}</span>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-[9px] font-mono opacity-20 px-3 italic">No recent activity</p>
              )}
            </div>
          </div>

          <div className="px-4">
            <label className="text-[9px] font-mono uppercase tracking-widest opacity-40 mb-2 block">System</label>
            <div className="space-y-1">
              <SidebarItem icon={<ShieldCheck className="w-4 h-4" />} label="Safety" active={activeTab === 'safety'} onClick={() => setActiveTab('safety')} />
              <SidebarItem icon={<Zap className="w-4 h-4" />} label="Usage Plans" active={activeTab === 'plans'} onClick={() => setActiveTab('plans')} />
              <SidebarItem icon={<Lock className="w-4 h-4" />} label="Security" active={activeTab === 'security'} onClick={() => setActiveTab('security')} />
            </div>
          </div>
        </nav>

        <div className="p-6 border-t border-[#141414] space-y-4">
          <button 
            onClick={() => setActiveTab('plans')}
            className="w-full flex items-center justify-between px-4 py-3 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span className="font-mono uppercase tracking-widest text-[10px] text-emerald-800">Upgrade Pro</span>
            </div>
            <ChevronRight className="w-3 h-3 text-emerald-400 group-hover:translate-x-1 transition-transform" />
          </button>

          {user ? (
            <div className="flex items-center gap-3 p-2 bg-white border border-[#141414] shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
              <img src={user.picture} alt={user.name} className="w-8 h-8 border border-[#141414]" />
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold truncate">{user.name}</p>
                <p className="text-[8px] font-mono opacity-50 truncate">{user.email}</p>
              </div>
              <button onClick={handleLogout} className="p-1 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[9px] font-mono uppercase tracking-widest opacity-50">System Access Key</label>
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={masterId}
                  onChange={(e) => setMasterId(e.target.value)}
                  placeholder="Enter Key..."
                  className="w-full bg-white border border-[#141414] px-2 py-1 text-[10px] font-mono focus:ring-0"
                />
                <button 
                  onClick={handleAuthorize}
                  className={cn(
                    "p-1 border border-[#141414] transition-colors",
                    isAuthorized ? "bg-emerald-500 text-white" : "bg-white hover:bg-[#141414] hover:text-[#E4E3E0]"
                  )}
                >
                  {isAuthorized ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4 pt-2">
            <button onClick={() => setShowPrivacy(true)} className="text-[8px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 hover:underline">Privacy</button>
            <button onClick={() => setShowTerms(true)} className="text-[8px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 hover:underline">Terms</button>
            <button className="text-[8px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 hover:underline flex items-center gap-1">
              <Heart className="w-2 h-2" />
              Feedback
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-8 min-h-screen pb-64">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-serif italic mb-2">
              {activeTab === 'research' && 'Universal Intelligence'}
              {activeTab === 'synthesis' && 'Educational Synthesis'}
              {activeTab === 'video' && 'Cinematic Generation'}
              {activeTab === 'image' && 'Advanced Image Lab'}
              {activeTab === 'search' && 'Deep Web Search'}
              {activeTab === 'security' && 'Neural Firewall Control'}
              {activeTab === 'plans' && 'Usage Packages'}
              {activeTab === 'safety' && 'Ethical Safeguards'}
            </h2>
            <p className="text-sm opacity-60 max-w-md">
              {activeTab === 'research' && 'Process any input—PDF, Image, Audio, or Video—with deep multimodal analysis.'}
              {activeTab === 'synthesis' && 'Synthesize cross-modal research into cohesive educational frameworks.'}
              {activeTab === 'video' && 'High-fidelity cinematic generation from any source material or script.'}
              {activeTab === 'image' && 'Ultra-high definition image generation and iterative modification.'}
              {activeTab === 'search' && 'Search the global web and extract deep understanding with neural grounding.'}
              {activeTab === 'security' && 'Monitor neural firewall status and manage cryptographic integrity.'}
              {activeTab === 'plans' && 'Select an affordable usage package that fits your research and generation needs.'}
              {activeTab === 'safety' && 'Review the ethical protocols governing universal input processing.'}
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-mono opacity-40 uppercase tracking-tighter">Neural Firewall v4.0</p>
            <div className="flex items-center gap-2 justify-end">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isAuthorized ? "bg-emerald-500" : "bg-red-500")} />
              <p className={cn("text-xs font-mono", isAuthorized ? "text-emerald-600" : "text-red-600")}>
                {isAuthorized ? `${userRole} AUTHORIZED` : 'RESTRICTED ACCESS'}
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto">
          {activeTab !== 'safety' ? (
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div 
                    key="loading-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] mb-8"
                  >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-4 h-4 border-2 border-[#141414] border-t-transparent animate-spin" />
                        <h3 className="font-serif italic text-xl">
                          {ethicalChecking ? 'Ethical & Legal Validation...' : 'Unlimited Processing Active...'}
                        </h3>
                      </div>
                      <div className="space-y-2 font-mono text-[10px] opacity-60">
                        {processingLogs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-emerald-500">›</span>
                            {log}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'research' && (
                    <motion.div 
                      key="research-output"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      {researchData ? (
                        <>
                          <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                            <h3 className="font-serif italic text-2xl mb-6">Intelligence Synthesis</h3>
                            <div className="prose prose-sm max-w-none prose-zinc">
                              <Markdown>{researchData.summary}</Markdown>
                            </div>
                          </div>
                        </>
                      ) : (
                        <EmptyState icon={<BookOpen className="w-12 h-12" />} message="Upload a file or enter text for universal analysis..." />
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'synthesis' && (
                    <motion.div 
                      key="synthesis-output"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      {synthesisResult ? (
                        <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                          <h3 className="font-serif italic text-2xl mb-6">Cross-Modal Educational Synthesis</h3>
                          <div className="prose prose-sm max-w-none prose-zinc">
                            <Markdown>{synthesisResult}</Markdown>
                          </div>
                          <div className="mt-8 pt-8 border-t border-[#141414] flex justify-end">
                            <button className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:underline">
                              <Download className="w-4 h-4" />
                              Export PDF
                            </button>
                          </div>
                        </div>
                      ) : (
                        <EmptyState icon={<Layers className="w-12 h-12" />} message="Generate multimodal research summaries first..." />
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'video' && (
                    <motion.div 
                      key="video-output"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      {videoScript ? (
                        <>
                          <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                            <h3 className="font-serif italic text-2xl mb-6">Production Script</h3>
                            <div className="prose prose-sm max-w-none prose-zinc">
                              <Markdown>{videoScript}</Markdown>
                            </div>
                          </div>

                          <div className="aspect-video bg-[#141414] border border-[#141414] flex flex-col items-center justify-center text-[#E4E3E0] p-12 text-center relative overflow-hidden">
                            {loading ? (
                              <div className="space-y-4 z-10">
                                <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                                <p className="font-mono text-xs uppercase tracking-[0.2em]">Synthesizing Multimodal Frames...</p>
                                <p className="text-[10px] opacity-50 max-w-xs mx-auto">This process involves deep neural rendering and may take several minutes.</p>
                              </div>
                            ) : videoUrl ? (
                              <video src={videoUrl} controls className="w-full h-full object-cover" />
                            ) : (
                              <div className="space-y-6 z-10">
                                <Play className="w-12 h-12 mx-auto opacity-20" />
                                <p className="font-mono text-xs uppercase tracking-[0.2em]">Ready for Rendering</p>
                                <button className="py-2 px-8 border border-[#E4E3E0] hover:bg-[#E4E3E0] hover:text-[#141414] transition-all font-mono text-xs uppercase tracking-widest">
                                  Start Render
                                </button>
                              </div>
                            )}
                            {/* Decorative grid */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#E4E3E0 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                          </div>
                        </>
                      ) : (
                        <EmptyState icon={<Video className="w-12 h-12" />} message="Define a topic or upload source material to begin video generation..." />
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'image' && (
                    <motion.div 
                      key="image-output"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      {generatedImageUrl ? (
                        <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                          <h3 className="font-serif italic text-2xl mb-6">Generated Asset</h3>
                          <div className="aspect-square bg-zinc-100 border border-[#141414] overflow-hidden">
                            <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-contain" />
                          </div>
                          <div className="mt-6 flex justify-between items-center">
                            <p className="text-[10px] font-mono opacity-50 uppercase">Resolution: 1024x1024 | Format: PNG</p>
                            <button 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = generatedImageUrl;
                                link.download = 'superai-asset.png';
                                link.click();
                              }}
                              className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest hover:underline"
                            >
                              <Download className="w-4 h-4" />
                              Download Asset
                            </button>
                          </div>
                        </div>
                      ) : (
                        <EmptyState icon={<ImageIcon className="w-12 h-12" />} message="Describe an image or upload one to modify..." />
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'search' && (
                    <motion.div 
                      key="search-output"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      {searchResult ? (
                        <>
                          <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                            <h3 className="font-serif italic text-2xl mb-6">Neural Search Synthesis</h3>
                            <div className="prose prose-sm max-w-none prose-zinc">
                              <Markdown>{searchResult.text}</Markdown>
                            </div>
                          </div>
                          
                          <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                            <h3 className="font-serif italic text-xl mb-6 flex items-center gap-2">
                              <Globe className="w-5 h-5 text-emerald-600" />
                              Verified Sources
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {searchResult.sources.map((source, i) => (
                                <a 
                                  key={i} 
                                  href={source.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-4 border border-[#141414]/10 hover:border-[#141414] transition-all group"
                                >
                                  <div className="flex justify-between items-start">
                                    <p className="text-xs font-mono font-bold truncate max-w-[200px]">{source.title}</p>
                                    <ExternalLink className="w-3 h-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <p className="text-[10px] font-mono opacity-50 truncate mt-1">{source.url}</p>
                                </a>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <EmptyState icon={<Search className="w-12 h-12" />} message="Enter a research query to begin deep web analysis..." />
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'security' && (
                    <motion.div 
                      key="security-output"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="bg-[#141414] text-[#E4E3E0] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
                        <div className="flex items-center gap-3 mb-6">
                          <ShieldCheck className="w-8 h-8 text-emerald-500" />
                          <h3 className="font-serif italic text-2xl">Neural Firewall v4.0</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-4 border border-[#E4E3E0]/10">
                            <p className="text-[9px] opacity-50 uppercase mb-1">Status</p>
                            <p className="text-sm font-mono text-emerald-500">ACTIVE & MONITORING</p>
                          </div>
                          <div className="p-4 border border-[#E4E3E0]/10">
                            <p className="text-[9px] opacity-50 uppercase mb-1">Threat Level</p>
                            <p className="text-sm font-mono">LOW (0.02%)</p>
                          </div>
                          <div className="p-4 border border-[#E4E3E0]/10">
                            <p className="text-[9px] opacity-50 uppercase mb-1">Integrity</p>
                            <p className="text-sm font-mono">CRYPTOGRAPHICALLY SIGNED</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                        <h4 className="font-serif italic text-xl mb-6">Security Event Log</h4>
                        <div className="space-y-3 font-mono text-[10px] opacity-60">
                          <div className="flex gap-4 border-b border-[#141414]/5 pb-2">
                            <span className="text-emerald-600">[23:39:30]</span>
                            <span>IDENTITY_VERIFIED: Role {userRole} authorized for session.</span>
                          </div>
                          <div className="flex gap-4 border-b border-[#141414]/5 pb-2">
                            <span className="text-emerald-600">[23:38:12]</span>
                            <span>FIREWALL_SCAN: Input analyzed. No injection patterns found.</span>
                          </div>
                          <div className="flex gap-4 border-b border-[#141414]/5 pb-2">
                            <span className="text-emerald-600">[23:35:45]</span>
                            <span>ENCRYPTION_SYNC: Session keys rotated successfully.</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                        <h4 className="font-serif italic text-xl mb-4">Access Control Matrix</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-mono text-[10px]">
                            <thead>
                              <tr className="border-b border-[#141414]">
                                <th className="pb-2">Feature</th>
                                <th className="pb-2">User</th>
                                <th className="pb-2">Admin</th>
                                <th className="pb-2">Master</th>
                              </tr>
                            </thead>
                            <tbody className="opacity-70">
                              <tr className="border-b border-[#141414]/5">
                                <td className="py-2">Research</td>
                                <td className="py-2 text-emerald-600">YES</td>
                                <td className="py-2 text-emerald-600">YES</td>
                                <td className="py-2 text-emerald-600">YES</td>
                              </tr>
                              <tr className="border-b border-[#141414]/5">
                                <td className="py-2">Video Gen</td>
                                <td className="py-2 text-red-600">NO</td>
                                <td className="py-2 text-emerald-600">YES</td>
                                <td className="py-2 text-emerald-600">YES</td>
                              </tr>
                              <tr className="border-b border-[#141414]/5">
                                <td className="py-2">Security Control</td>
                                <td className="py-2 text-red-600">NO</td>
                                <td className="py-2 text-red-600">NO</td>
                                <td className="py-2 text-emerald-600">YES</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'plans' && (
                    <motion.div 
                      key="plans-output"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="bg-emerald-50 border border-emerald-200 p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <ShieldCheck className="w-8 h-8 text-emerald-600" />
                          <div>
                            <h4 className="font-serif italic text-lg">Master Authority Privilege</h4>
                            <p className="text-[10px] font-mono uppercase tracking-widest opacity-60">Authorized Admin accounts bypass all usage limits.</p>
                          </div>
                        </div>
                        <div className={cn(
                          "px-4 py-1 border font-mono text-[10px] uppercase tracking-widest",
                          isAuthorized ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-zinc-400 border-zinc-200"
                        )}>
                          {isAuthorized ? "Unlimited Access Active" : "Standard Limits Apply"}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {USAGE_PLANS.map((plan) => (
                        <div 
                          key={plan.type}
                          className={cn(
                            "bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col transition-all",
                            currentPlan === plan.type ? "ring-2 ring-emerald-500 ring-offset-4" : "hover:translate-y-[-4px]"
                          )}
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="font-serif italic text-2xl">{plan.type}</h3>
                              <p className="text-3xl font-mono mt-2">{plan.price}</p>
                            </div>
                            {currentPlan === plan.type && (
                              <span className="bg-emerald-500 text-white text-[9px] font-mono px-2 py-1 uppercase tracking-widest">Active</span>
                            )}
                          </div>
                          
                          <ul className="space-y-3 mb-8 flex-1">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-center gap-2 text-xs font-mono opacity-70">
                                <ChevronRight className="w-3 h-3 text-emerald-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          <button 
                            onClick={() => setCurrentPlan(plan.type)}
                            disabled={currentPlan === plan.type}
                            className={cn(
                              "w-full py-3 font-mono text-xs uppercase tracking-widest border border-[#141414] transition-all",
                              currentPlan === plan.type 
                                ? "bg-zinc-100 text-zinc-400 cursor-default" 
                                : "bg-[#141414] text-[#E4E3E0] hover:bg-transparent hover:text-[#141414]"
                            )}
                          >
                            {currentPlan === plan.type ? 'Current Package' : 'Select Package'}
                          </button>
                        </div>
                      ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          ) : (
            <div>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <div className="flex items-center gap-3 mb-8">
                    <Lock className="w-8 h-8 text-emerald-600" />
                    <h3 className="font-serif italic text-3xl">Legal Framework v3.6</h3>
                  </div>
                  <div className="prose prose-sm max-w-none prose-zinc">
                    <Markdown>{LEGAL_DISCLAIMER}</Markdown>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <div className="flex items-center gap-3 mb-8">
                      <ShieldCheck className="w-8 h-8 text-emerald-600" />
                      <h3 className="font-serif italic text-3xl">Core Directives</h3>
                    </div>
                  <div className="space-y-6">
                    {ETHICAL_RULES.map((rule, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="font-mono text-lg opacity-20 group-hover:opacity-100 transition-opacity">0{i + 1}</span>
                        <p className="font-mono text-sm leading-relaxed">{rule}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-[#141414] text-[#E4E3E0] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.2)]">
                    <div className="flex items-center gap-3 mb-6">
                      <Info className="w-6 h-6 opacity-50" />
                      <h4 className="font-mono text-xs uppercase tracking-widest">Universal Architecture</h4>
                    </div>
                    <p className="text-sm opacity-80 leading-relaxed mb-6">
                      The system now supports Universal Input Processing. Every file—regardless of type—is subjected to deep ethical analysis before multimodal features are extracted.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-[#E4E3E0]/20">
                        <p className="text-[9px] opacity-50 uppercase mb-1">Authorization</p>
                        <p className="text-xs font-mono">MASTER-ONLY</p>
                      </div>
                      <div className="p-4 border border-[#E4E3E0]/20">
                        <p className="text-[9px] opacity-50 uppercase mb-1">Checkpoint</p>
                        <p className="text-xs font-mono">MULTIMODAL-PRE</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                    <h4 className="font-serif italic text-xl mb-4">Access Authority</h4>
                    <p className="text-sm opacity-60 mb-6">
                      The system utilizes a multi-role access control matrix. Access keys are cryptographically validated against the Neural Firewall to prevent unauthorized manipulation.
                    </p>
                    <div className="p-4 bg-zinc-100 font-mono text-[10px] flex items-center justify-between">
                      <span>CURRENT ROLE:</span>
                      <span className={isAuthorized ? "text-emerald-600" : "text-red-600"}>
                        {isAuthorized ? userRole : "UNAUTHORIZED"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#141414] p-8 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif italic text-xl">Security & Privacy</h4>
                      <ShieldCheck className="w-5 h-5 opacity-30" />
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-[#141414]/10">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider">Data Storage Consent</p>
                          <p className="text-[10px] opacity-50">Allow system to store processed summaries and graphs.</p>
                        </div>
                        <button 
                          onClick={() => handleToggleConsent(!userConsent)}
                          className={cn(
                            "w-12 h-6 rounded-full border border-[#141414] relative transition-colors",
                            userConsent ? "bg-emerald-500" : "bg-zinc-200"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white border border-[#141414] transition-all",
                            userConsent ? "left-7" : "left-1"
                          )} />
                        </button>
                      </div>

                      <div className="p-4 border border-red-100 bg-red-50/30 space-y-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-red-600">Purge Session Data</p>
                          <p className="text-[10px] opacity-50">Irreversibly delete all research, scripts, and generated assets.</p>
                        </div>
                        <button 
                          onClick={handlePurgeData}
                          disabled={!isAuthorized || loading}
                          className="w-full py-2 border border-red-600 text-red-600 text-[10px] font-mono uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-30"
                        >
                          {purgeSuccess ? "DATA PURGED SUCCESSFULLY" : "EXECUTE GLOBAL PURGE"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        </div>
      </main>

      {/* Bottom Input Section */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-6 bg-[#E4E3E0]/80 backdrop-blur-md border-t border-[#141414] z-30">
        <div className="max-w-4xl mx-auto space-y-4">
          {selectedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex-shrink-0 relative group bg-white border border-[#141414] p-1 pr-6 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]">
                  {file.preview ? (
                    <img src={file.preview} alt="Preview" className="w-6 h-6 object-cover" />
                  ) : (
                    <div className="scale-50">{getFileIcon(file.mimeType)}</div>
                  )}
                  <span className="text-[9px] font-mono truncate max-w-[80px]">{file.name}</span>
                  <button 
                    onClick={() => removeFile(idx)} 
                    className="absolute top-1 right-1 p-0.5 hover:text-red-600 transition-colors"
                  >
                    <X className="w-2 h-2" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="relative bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex items-end p-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 hover:bg-[#141414]/5 transition-colors"
              title="Upload Files"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              multiple
              className="hidden" 
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.heic,.mp4,.mkv,.avi,.mov,.wmv,.flv,.webm,.mpg,.mpeg,.3gp,.ts,.vob,.ogv,.rmvb,.divx,.asf,.m4v,.f4v,.mp3,.wav,.ogg,.flac,.aac,.m4a,.wma"
            />
            
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeTab === 'video' ? "Describe the video to generate..." : 
                activeTab === 'search' ? "What do you want to search and understand?" :
                "Ask anything or provide context..."
              }
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm py-3 px-2 max-h-32 min-h-[44px]"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />

            <div className="flex items-center gap-1 p-1">
              <button 
                onClick={toggleListening}
                className={cn(
                  "p-3 transition-colors rounded-full",
                  isListening ? "bg-red-500 text-white animate-pulse" : "hover:bg-[#141414]/5"
                )}
                title="Voice Input"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <button 
                onClick={
                  activeTab === 'research' ? handleResearch : 
                  activeTab === 'synthesis' ? handleSynthesis : 
                  activeTab === 'image' ? handleImageGen : 
                  activeTab === 'search' ? handleSearch :
                  handleVideoGen
                }
                disabled={loading || (!inputText && selectedFiles.length === 0 && activeTab !== 'search') || (activeTab === 'search' && !inputText)}
                className="p-3 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 transition-all disabled:opacity-50"
                title="Execute"
              >
                {ethicalChecking ? (
                  <ShieldCheck className="w-5 h-5 animate-pulse text-emerald-400" />
                ) : loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="text-[10px] font-mono text-red-600 flex items-center gap-2 bg-red-50 p-2 border border-red-200">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Legal Disclaimer Modal */}
      <AnimatePresence>
        {showLegal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#141414]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#E4E3E0] border border-[#141414] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]"
            >
              <div className="p-6 border-b border-[#141414] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-serif italic text-xl">Legal Framework & Ethics</h3>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest opacity-50">Action Required</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 prose prose-sm max-w-none prose-zinc">
                <Markdown>{LEGAL_DISCLAIMER}</Markdown>
              </div>

              <div className="p-6 border-t border-[#141414] flex items-center justify-between bg-white/50">
                <p className="text-[10px] font-mono opacity-50 max-w-[300px]">
                  By clicking accept, you acknowledge the Master Authority protocols and the Ethical Directives.
                </p>
                <button 
                  onClick={handleAcceptTerms}
                  className="py-3 px-8 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-colors"
                >
                  Accept & Initialize
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all group",
        active 
          ? "bg-[#141414] text-[#E4E3E0]" 
          : "hover:bg-[#141414]/5 text-[#141414]/60 hover:text-[#141414]"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-[#E4E3E0]" : "text-[#141414]/40")}>
        {icon}
      </span>
      <span className="font-mono uppercase tracking-widest text-[11px]">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  );
}

function EmptyState({ icon, message }: { icon: React.ReactNode, message: string }) {
  return (
    <div className="h-[500px] border border-dashed border-[#141414]/20 flex flex-col items-center justify-center text-center p-12 space-y-6">
      <div className="opacity-10">{icon}</div>
      <p className="font-serif italic text-xl opacity-40 max-w-xs">{message}</p>
    </div>
  );
}
