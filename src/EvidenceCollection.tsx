import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { FileUp, Image as ImageIcon, Send, MessageSquare } from 'lucide-react';

interface EvidenceCollectionProps {
  guestId: string;
  playerName: string;
  lang: 'kz' | 'ru';
  t: any;
}

interface Evidence {
  id: string;
  playerId: string;
  playerName: string;
  testimony: string;
  fileBase64: string | null;
  fileName: string | null;
  timestamp: any;
}

export const EvidenceCollection: React.FC<EvidenceCollectionProps> = ({ guestId, playerName, lang, t }) => {
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [testimony, setTestimony] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'evidence'), orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data: Evidence[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as Evidence);
      });
      setEvidenceList(data);
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setFileBase64(dataUrl);
      };
      
      const res = event.target?.result;
      if (typeof res === 'string') {
          if (res.startsWith('data:image')) {
              img.src = res;
          } else {
              setFileBase64(res); // if not image, just use base64 (might be big!)
          }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if ((!testimony.trim() && !fileBase64) || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'evidence'), {
        playerId: guestId,
        playerName,
        testimony: testimony.trim(),
        fileBase64,
        fileName,
        timestamp: serverTimestamp()
      });
      setTestimony('');
      setFileBase64(null);
      setFileName(null);
    } catch (e) {
      console.error("Error adding evidence: ", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[70vh] bg-white dark:bg-[#2A2B35] rounded-3xl border-2 border-[#E5E5E5] dark:border-[#393A4B] shadow-sm overflow-hidden">
        <div className="p-4 border-b-2 border-[#E5E5E5] dark:border-[#393A4B] bg-[#F7F9FC] dark:bg-[#181920]">
            <h3 className="text-xl font-black text-[#3C3C3C] dark:text-[#E5E5E5] uppercase">{lang === 'kz' ? 'Бексана ісі: Магитериалдар мен айғақтар' : 'Дело Бексаны: Доказательства и показания'}</h3>
            <p className="text-sm font-bold text-[#AFAFAF] dark:text-[#8C8F9F]">{lang === 'kz' ? 'Бәрі көре алатын ортақ іс материалдары' : 'Общие материалы дела, видимые всем'}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#F7F9FC]/50 dark:bg-[#181920]/50">
            {evidenceList.map(ev => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={ev.id} className={`p-4 rounded-2xl max-w-[85%] ${ev.playerId === guestId ? 'ml-auto bg-[#1CB0F6] text-white border-[#1899D6] border-b-4' : 'mr-auto bg-white dark:bg-[#343541] border-2 border-[#E5E5E5] dark:border-[#393A4B] text-[#3C3C3C] dark:text-[#E5E5E5]'}`}>
                    <div className="font-extrabold text-xs mb-2 opacity-80">{ev.playerName}</div>
                    {ev.testimony && <p className="font-bold text-sm whitespace-pre-wrap">{ev.testimony}</p>}
                    {ev.fileBase64 && ev.fileBase64.startsWith('data:image') && (
                        <img src={ev.fileBase64} alt="Evidence" className="mt-2 rounded-xl max-h-48 object-cover border-2 border-black/10" />
                    )}
                    {ev.fileBase64 && !ev.fileBase64.startsWith('data:image') && (
                        <div className="mt-2 text-xs font-bold bg-black/10 p-2 rounded-lg flex items-center gap-2">
                           <FileUp size={14} /> {ev.fileName}
                        </div>
                    )}
                </motion.div>
            ))}
            {evidenceList.length === 0 && (
                <div className="text-center text-[#AFAFAF] dark:text-[#8C8F9F] font-bold mt-10">
                    {lang === 'kz' ? 'Әзірге айғақтар жоқ...' : 'Пока нет показаний...'}
                </div>
            )}
        </div>

        <div className="p-4 border-t-2 border-[#E5E5E5] dark:border-[#393A4B] bg-white dark:bg-[#2A2B35]">
            {fileName && (
                <div className="mb-3 px-3 py-2 bg-[#F7F9FC] dark:bg-[#181920] rounded-xl flex items-center justify-between text-sm font-bold border-2 border-[#E5E5E5] dark:border-[#393A4B]">
                    <span className="truncate flex-1 text-[#3C3C3C] dark:text-[#E5E5E5]"><ImageIcon size={16} className="inline mr-2 text-[#1CB0F6]" /> {fileName}</span>
                    <button onClick={() => {setFileBase64(null); setFileName(null);}} className="text-[#FF4B4B] uppercase text-xs ml-4">✕</button>
                </div>
            )}
            <div className="flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
                <motion.button whileTap={{ y: 2 }} onClick={() => fileInputRef.current?.click()} className="p-4 rounded-2xl bg-[#F7F9FC] dark:bg-[#181920] border-2 border-[#E5E5E5] dark:border-[#393A4B] border-b-4 hover:bg-[#E5E5E5] text-[#AFAFAF] transition-all">
                    <FileUp size={24} className="text-[#1CB0F6]"/>
                </motion.button>
                <textarea 
                    value={testimony} 
                    onChange={e => setTestimony(e.target.value)} 
                    placeholder={lang === 'kz' ? 'Куәлігіңізді жазыңыз...' : 'Напишите свои показания...'}
                    className="flex-1 bg-[#F7F9FC] dark:bg-[#181920] border-2 border-[#E5E5E5] dark:border-[#393A4B] rounded-2xl p-4 text-[#3C3C3C] dark:text-[#E5E5E5] outline-none focus:border-[#1CB0F6] resize-none h-16 font-bold custom-scrollbar placeholder:text-[#AFAFAF]"
                />
                <motion.button disabled={(!testimony.trim() && !fileBase64) || isSubmitting} whileTap={{ y: 2 }} onClick={handleSubmit} className="p-4 rounded-2xl bg-[#58CC02] hover:bg-[#46A302] border-[#58CC02] hover:border-[#46A302] border-b-4 disabled:opacity-50 transition-all text-white flex items-center justify-center">
                    <Send size={24} />
                </motion.button>
            </div>
        </div>
    </div>
  );
};
