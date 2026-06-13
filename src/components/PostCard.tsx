import React, { useState } from 'react';
import { MapPin, Calendar, Phone, CheckCircle, ShieldAlert, HelpCircle } from 'lucide-react';
import { Post, PostStatus } from '../types';
import { togglePostStatus } from '../lib/firebase';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onStatusChanged: () => void | Promise<void>;
}

export default function PostCard({ post, currentUserId, onStatusChanged }: PostCardProps) {
  const [showVerification, setShowVerification] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isContactRevealed, setIsContactRevealed] = useState(false);
  const [verificationError, setVerificationError] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'documents': return 'وثائق وهويات';
      case 'keys': return 'مفاتيح وميداليات';
      case 'phones': return 'هواتف وإلكترونيات';
      default: return 'أشياء أخرى';
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `منذ ${Math.max(1, diffMins)} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      return `منذ ${diffDays} يوم`;
    } catch (e) {
      return "حديثاً";
    }
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!post.securityAnswer) return;
    
    const preparedAnswer = userAnswer.trim().toLowerCase();
    const preparedCorrect = post.securityAnswer.trim().toLowerCase();
    
    if (preparedAnswer === preparedCorrect || preparedCorrect.includes(preparedAnswer) && preparedAnswer.length > 2) {
      setIsContactRevealed(true);
      setShowVerification(false);
      setVerificationError(false);
    } else {
      setVerificationError(true);
    }
  };

  const handleResolve = async () => {
    setIsResolving(true);
    const success = await togglePostStatus(post.id, 'resolved');
    if (success) {
      onStatusChanged();
    }
    setIsResolving(false);
  };

  const isOwner = post.ownerId === currentUserId;

  return (
    <div id={`post-card-${post.id}`} className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden flex flex-col transition-all active:scale-[0.99] duration-150">
      
      {/* Type Badge & Category */}
      <div className="p-3 flex items-center justify-between bg-slate-50/50 border-b border-rose-50/20">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            post.type === 'lost' 
              ? 'bg-red-50 text-red-600 border border-red-100' 
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          }`}>
            {post.type === 'lost' ? 'ضيعت 🔴' : 'لقيت 🟢'}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {getCategoryLabel(post.category)}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-0.5" dir="ltr">
          <Calendar className="w-3.5 h-3.5 text-slate-300" />
          {getRelativeTime(post.createdAt)}
        </span>
      </div>

      {/* Main image / Card skeleton */}
      {post.image ? (
        <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
          {post.category === 'documents' && (
            <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1.5 text-center">
              <span className="text-[10px] text-amber-300 font-medium flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                تنبيه: الصورة محمية ومغطاة للمعلومات الشخصية
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-11 bg-linear-to-b from-slate-50 to-white border-b border-dashed border-slate-100"></div>
      )}

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <h3 className="text-base font-bold text-slate-800 leading-snug">
          {post.title}
        </h3>
        
        <p className="text-xs text-slate-600 font-normal leading-relaxed break-words line-clamp-3">
          {post.description}
        </p>

        {/* Location indicators */}
        <div className="flex items-center gap-1 text-slate-500 mt-2">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{post.wilaya}</span>
          <span className="text-slate-300 text-xs">•</span>
          <span className="text-xs text-slate-600">{post.commune || 'وسط المدينة'}</span>
        </div>

        {/* Poster identity label */}
        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
          <span>الناشر:</span>
          <span className="font-bold text-slate-600">{post.ownerName}</span>
          {isOwner && (
            <span className="bg-blue-50 text-blue-600 px-1 py-0.2 rounded text-[9px] font-bold">إعلاني</span>
          )}
        </div>

        {/* Action Tray */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          
          {isOwner ? (
            /* Owner resolved panel */
            <button
              onClick={handleResolve}
              disabled={isResolving}
              className="w-full bg-slate-900 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {isResolving ? 'جاري التعديل...' : 'تم العثور عليه / استرجاعه وجلبه لقائمتي'}
            </button>
          ) : (
            /* Visitor contact block */
            <>
              {isContactRevealed ? (
                /* Contact revealed */
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-center justify-between text-emerald-800 animate-fadeInDec">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-emerald-600 font-bold">الرقم المعتمد للتواصل</span>
                    <span className="text-base font-bold select-all tracking-wide" dir="ltr">{post.contactNumber || 'لا يوجد هاتف'}</span>
                  </div>
                  <a 
                    href={`tel:${post.contactNumber}`}
                    className="bg-emerald-600 text-white p-2.5 rounded-full shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ) : showVerification ? (
                /* Verification form */
                <form onSubmit={handleVerify} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-2.5">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5 text-xs text-right">
                      <span className="font-bold text-slate-700 font-sans">سؤال الأمان والملكية:</span>
                      <span className="text-slate-600">{post.securityQuestion || "صف هذا الغرض للتأكد من ملكيتك؟"}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="أدخل الإجابة هنا لتأكيد ملكيتك..."
                      value={userAnswer}
                      onChange={(e) => {
                        setUserAnswer(e.target.value);
                        setVerificationError(false);
                      }}
                      className="flex-1 bg-white border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:border-emerald-600 text-right font-medium"
                      required
                    />
                    <button 
                      type="submit"
                      className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer"
                    >
                      تأكيد
                    </button>
                  </div>
                  
                  {verificationError && (
                    <span className="text-[10px] text-red-600 font-bold text-right">
                      ❌ إجابة غير دقيقة. يرجى مراجعة المواصفات لتطابق الوصف.
                    </span>
                  )}
                  
                  <button 
                    type="button" 
                    onClick={() => setShowVerification(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 text-center mt-1 cursor-pointer"
                  >
                    إلغاء وتراجع
                  </button>
                </form>
              ) : (
                /* Standard Contact CTA button */
                <button
                  onClick={() => setShowVerification(true)}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  الاتصال بناشر الإعلان (يتطلب تأكيد وسؤال الأمان)
                </button>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
