import React, { useState } from 'react';
import { X, ShieldCheck, AlertTriangle, ShieldAlert, Image, Plus, Check } from 'lucide-react';
import { WILAYAS } from '../data/wilayas';
import { createPost } from '../lib/firebase';
import { PostCategory, PostType } from '../types';

interface AddPostModalProps {
  type: PostType; // 'lost' or 'found'
  onClose: () => void;
  onPostAdded: () => void;
  currentUserId: string;
  currentUserDisplayName: string;
}

export default function AddPostModal({ type, onClose, onPostAdded, currentUserId, currentUserDisplayName }: AddPostModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PostCategory>('documents');
  const [wilaya, setWilaya] = useState(WILAYAS[15]); // Default to Algiers (Alger)
  const [commune, setCommune] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePlaceholderType, setImagePlaceholderType] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPresetPlaceholder = (cat: PostCategory) => {
    switch (cat) {
      case 'documents':
        return 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=400';
      case 'keys':
        return 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=400';
      case 'phones':
        return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400';
      default:
        return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400';
    }
  };

  const handleCategoryChange = (cat: PostCategory) => {
    setCategory(cat);
    // Suggest or assign template security questions based on category
    if (cat === 'documents') {
      setSecurityQuestion('ما هو اللقب العائلي الكامل لصاحب الوثيقة؟');
    } else if (cat === 'keys') {
      setSecurityQuestion('ما اللون أو شكل الميدالية الملحقة بالمفاتيح؟');
    } else if (cat === 'phones') {
      setSecurityQuestion('ما هي خلفية الشاشة أو نوع غطاء الحماية؟');
    } else {
      setSecurityQuestion('صف غرضاً مميزاً بداخل هذا الشيء؟');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !wilaya || !commune || !contactNumber || !securityQuestion || !securityAnswer) {
      alert("يرجى ملء جميع الحقول الإلزامية لتأمين إعلانك");
      return;
    }

    setIsSubmitting(true);

    // Apply auto-preset or client defined URL
    const finalImage = imageUrl || (imagePlaceholderType !== 'none' ? getPresetPlaceholder(category) : undefined);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      category,
      wilaya,
      commune: commune.trim(),
      contactNumber: contactNumber.trim(),
      securityQuestion: securityQuestion.trim(),
      securityAnswer: securityAnswer.trim(),
      ownerId: currentUserId,
      ownerName: currentUserDisplayName,
      image: finalImage
    };

    try {
      await createPost(payload);
      onPostAdded();
      onClose();
    } catch (err) {
      alert("خطأ أثناء النشر، حاول مجدداً");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="add-post-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] shadow-xl overflow-hidden animate-slideUp">
        
        {/* Header */}
        <div className={`p-4 flex items-center justify-between text-white ${type === 'lost' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {type === 'lost' ? '📢 إعلان عن مفقود (ضيعت)' : '🤝 إعلان عن مسترجع (لقيت)'}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-black/10 hover:bg-black/20 text-white transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-right">
          
          {/* Privacy awareness section specifically customized for documents */}
          {category === 'documents' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 animate-pulse text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1 text-xs">
                <span className="font-bold">⚠️ تنبيه أمني هام جداً:</span>
                <p className="leading-relaxed">
                  يرجى تغطية الصورة الشخصية والأرقام الحساسة لحماية الخصوصية. لا تقم بنشر صورة الهوية الشخصية كاملة، واكتفِ بذكر الاسم واللقب والولاية فقط!
                </p>
              </div>
            </div>
          )}

          {/* Title and Category */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">صنف الغرض مكلّف بالبحث عنه *</label>
              <div className="grid grid-cols-4 gap-2">
                {(['documents', 'keys', 'phones', 'others'] as PostCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`py-2 px-1 text-center text-xs rounded-xl font-medium border transition-all ${
                      category === cat
                        ? type === 'lost'
                          ? 'bg-red-50 text-red-600 border-red-300 ring-2 ring-red-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-300 ring-2 ring-emerald-100'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'documents' && 'وثائق'}
                    {cat === 'keys' && 'مفاتيح'}
                    {cat === 'phones' && 'الهاتف'}
                    {cat === 'others' && 'أخرى'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">عنوان الإعلان (مثال: مفاتيح شقة ضائعة) *</label>
              <input 
                type="text"
                placeholder="حروف واضحة ومباشرة لتسهيل البحث العلمي..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={90}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-right font-medium"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">المواصفات والتفاصيل (بدون معلومات حساسة) *</label>
            <textarea 
              rows={3}
              placeholder="اكتب تفاصيل المكان (الحومة)، الزمان التقريبي، والمواصفات العامة للغرض..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-right font-medium resize-none"
              required
            />
          </div>

          {/* Location details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">الولاية *</label>
              <select
                value={wilaya}
                onChange={e => setWilaya(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 text-right font-medium"
                required
              >
                {WILAYAS.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">البلدية / الحومة الفرعية *</label>
              <input 
                type="text"
                placeholder="مثال: باب الواد، سيدي مبروك..."
                value={commune}
                onChange={e => setCommune(e.target.value)}
                maxLength={80}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white text-right font-medium"
                required
              />
            </div>
          </div>

          {/* Image attachments picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">صورة الغرض التوضيحية</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <button
                type="button"
                onClick={() => { setImagePlaceholderType('none'); setImageUrl(''); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${imagePlaceholderType === 'none' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                بدون صورة
              </button>
              <button
                type="button"
                onClick={() => { setImagePlaceholderType('preset'); setImageUrl(''); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${imagePlaceholderType === 'preset' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                صورة افتراضية فخمة
              </button>
              <button
                type="button"
                onClick={() => { setImagePlaceholderType('custom'); }}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold border ${imagePlaceholderType === 'custom' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
              >
                رابط صورة خارجي
              </button>
            </div>

            {imagePlaceholderType === 'custom' && (
              <input 
                type="url"
                placeholder="ألصق رابط الصورة الإلكترونية هنا (https://...)"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none text-right font-medium"
              />
            )}
          </div>

          {/* Privacy blocker security credentials setup */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 flex flex-col gap-3">
            <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              أمان الخصوصية: إعداد سؤال التثبت واللقاء
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              لحماية هاتف الاتصال الخاص بك من المتطفلين والمزعجين، لن يظهر الرقم إلا لمن يجيب على هذا السؤال بدقة تامة لإثبات الملكية الكاملة للمفقود.
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">أدخل سؤال التحقق للأشخاص للتواصل معك *</label>
                <input 
                  type="text"
                  placeholder="مثال: ما هو لون الغلاف الخارجي للمحفظة؟"
                  value={securityQuestion}
                  onChange={e => setSecurityQuestion(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-right font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">الإجابة الدقيقة المختصرة *</label>
                <input 
                  type="text"
                  placeholder="مثال: بني غامق"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-right font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم الهاتف الخاص بك للاتصال (المحمي) *</label>
                <input 
                  type="tel"
                  placeholder="مثال: 0555123456"
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-red-500 text-left font-mono"
                  dir="ltr"
                  required
                />
              </div>
            </div>
          </div>

          {/* CTA Publish Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-bold rounded-xl py-3 text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all mt-2 ${
              type === 'lost' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isSubmitting ? 'جاري نشر الإعلان بموثوقية...' : 'تأكيد ونشر الإعلان فوراً 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
