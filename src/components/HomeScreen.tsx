import React, { useState, useEffect } from 'react';
import { 
  Plus, Check, Search, MapPin, Layers, RefreshCw, Smartphone, Key, 
  FileText, HelpCircle, Phone, ArrowUpRight, Flame, Compass, Bell, CheckCircle2 
} from 'lucide-react';
import { Post, PostType, PostCategory } from '../types';
import { getFilteredPosts, getCurrentUser } from '../lib/firebase';
import { WILAYAS, CATEGORIES } from '../data/wilayas';
import PostCard from './PostCard';
import AddPostModal from './AddPostModal';
import AdminPanel from './AdminPanel';

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'lost' | 'found'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWilaya, setSelectedWilaya] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal tracking
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<PostType>('lost');

  // Load static user
  const user = getCurrentUser();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const typeFilter = activeTab === 'all' ? undefined : activeTab;
      const data = await getFilteredPosts(
        selectedWilaya === 'all' ? undefined : selectedWilaya,
        selectedCategory === 'all' ? undefined : selectedCategory,
        typeFilter
      );
      
      // Perform text-search filter locally if query provided
      if (data) {
        let filtered = [...data];
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(q) || 
            p.description.toLowerCase().includes(q) ||
            p.commune.toLowerCase().includes(q)
          );
        }
        setPosts(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, selectedCategory, selectedWilaya, searchQuery]);

  // Open modal with correct flag
  const triggerAddPost = (type: PostType) => {
    setModalType(type);
    setShowAddModal(true);
  };

  const handleFlagClick = () => {
    const nextCount = adminClickCount + 1;
    if (nextCount >= 5) {
      setShowAdminPanel(true);
      setAdminClickCount(0);
    } else {
      setAdminClickCount(nextCount);
    }
  };

  const handleClearAllLocalData = () => {
    localStorage.removeItem('dz_lost_found_posts');
    window.location.reload();
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Key': return <Key className="w-4 h-4" />;
      case 'Smartphone': return <Smartphone className="w-4 h-4" />;
      case 'HelpCircle': return <HelpCircle className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <div id="home-screen" className="flex flex-col min-h-screen bg-slate-50 text-slate-900 pb-12">
      
      {/* PWA High-Performance Header */}
      <header className="sticky top-0 bg-white border-b border-slate-100 text-slate-800 z-40 px-4 py-3.5 shadow-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-800">
                لقيت ولا ضيعت <span className="text-indigo-600 font-black">dz</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold">منصة التضامن للمفقودات في الجزائر</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={fetchPosts}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 active:scale-95 transition-all cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div 
              onClick={handleFlagClick}
              className="bg-slate-50 border border-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono cursor-pointer hover:bg-slate-100 select-none active:scale-95 transition-all"
              title="انقر ٥ مرات لفتح لوحة التحكم السرية"
            >
              🇩🇿 {adminClickCount > 0 ? `(${adminClickCount})` : ''}
            </div>
          </div>
        </div>

        {/* Quick Location Wilaya filter in header */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
          <MapPin className="w-4 h-4 text-indigo-600 shrink-0 mx-1" />
          <select
            value={selectedWilaya}
            onChange={(e) => setSelectedWilaya(e.target.value)}
            className="bg-transparent text-xs text-slate-700 font-bold font-sans outline-none w-full cursor-pointer"
          >
            <option value="all" className="text-slate-800 font-bold">كل الولايات الـ 58 (كل القطر الوطني)</option>
            {WILAYAS.map(w => (
              <option key={w} value={w} className="text-slate-700 font-semibold">{w}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Hero Panel with Big Native Action CTA Buttons */}
      <section className="p-4 bg-linear-to-b from-indigo-100/10 to-transparent flex flex-col gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <h2 className="text-center text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
            ماذا تريد أن تفعل اليوم؟ اختر لإضافة إعلانك فوراً
          </h2>
          
          <div className="grid grid-cols-2 gap-3.5">
            {/* Found Item Buttton: GREEN action */}
            <button
              onClick={() => triggerAddPost('found')}
              className="flex flex-col items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl p-4 shadow-sm border border-emerald-400 active:scale-95 transition-all cursor-pointer group"
            >
              <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">🤝</span>
              <span className="text-base font-extrabold">لقيت حاجة</span>
              <span className="text-[10px] text-emerald-100 font-medium mt-0.5">تبليغ عن غرض مسترجع</span>
            </button>

            {/* Lost Item Button: RED action */}
            <button
              onClick={() => triggerAddPost('lost')}
              className="flex flex-col items-center justify-center bg-rose-500 hover:bg-rose-600 text-white rounded-2xl p-4 shadow-sm border border-rose-400 active:scale-95 transition-all cursor-pointer group"
            >
              <span className="text-3xl mb-1.5 group-hover:scale-110 transition-transform">📢</span>
              <span className="text-base font-extrabold">ضيعت حاجة</span>
              <span className="text-[10px] text-rose-100 font-medium mt-0.5">البحث عن مفتاح/هوية/غرض</span>
            </button>
          </div>
        </div>
      </section>

      {/* Live search container */}
      <section className="px-4 py-2">
        <div className="relative">
          <input 
            type="text" 
            placeholder="البحث بالكلمات الدلالية (مثال: رخصة سياقة، قسنطينة)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-semibold shadow-xs focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
        </div>
      </section>

      {/* Main Categories Row */}
      <section className="py-2.5 px-4 overflow-x-auto flex gap-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border transition-all shrink-0 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {getIconComponent(cat.icon)}
            <span>{cat.label}</span>
          </button>
        ))}
      </section>

      {/* Status Segment Tabs: All / Lost / Found */}
      <section className="px-4 py-2.5">
        <div className="bg-slate-200/60 p-1 rounded-xl grid grid-cols-3 text-center text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'all' ? 'bg-white text-indigo-700 shadow-xs border-b border-indigo-100' : ''}`}
          >
            الجميع ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('lost')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'lost' ? 'bg-white text-rose-600 shadow-xs' : ''}`}
          >
            🔴 المفقودات
          </button>
          <button
            onClick={() => setActiveTab('found')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${activeTab === 'found' ? 'bg-white text-emerald-600 shadow-xs' : ''}`}
          >
            🟢 المسترجعات
          </button>
        </div>
      </section>

      {/* Active posts list grid block */}
      <main className="px-4 py-2 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            <span className="text-xs font-bold text-slate-500">جاري استرجاع المنشورات النشطة...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-3xl">
              📭
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-700">لا توجد منشورات متطابقة حاليا</span>
              <span className="text-[11px] text-slate-400 mt-0.5">كن أول من ينشر إعلاناً في ولايتك للتضامن</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {posts.map((post) => (
              <div key={post.id}>
                <PostCard 
                  post={post} 
                  currentUserId={user?.uid || 'offline_user'} 
                  onStatusChanged={fetchPosts}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Strict document advice bar footer */}
      <footer className="mt-auto px-4 py-3 bg-slate-100 text-center text-[10px] text-slate-400 font-semibold border-t border-slate-200">
        منصة التضامن "لقيت ولا ضيعت" للجزائريين. مصممة بحب لمساعدة بعضنا البعض 🇩🇿
      </footer>

      {/* Floating Plus CTA representing Android Quick Add trigger */}
      <div className="fixed bottom-5 left-5 z-40 flex flex-col gap-2">
        <button
          onClick={() => triggerAddPost('found')}
          className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-full p-3.5 shadow-lg shadow-indigo-200 active:scale-95 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          title="نشر إعلان غرض وجدته"
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span>بلغ عن مسترجع</span>
        </button>
      </div>

      {/* Declare Post Modal */}
      {showAddModal && (
        <AddPostModal 
          type={modalType}
          onClose={() => setShowAddModal(false)}
          onPostAdded={fetchPosts}
          currentUserId={user?.uid || 'offline_user'}
          currentUserDisplayName={user?.displayName || 'مواطن جزائري'}
        />
      )}

      {/* Admin Panel Gateway */}
      {showAdminPanel && (
        <AdminPanel 
          posts={posts}
          onClose={() => setShowAdminPanel(false)}
          onClearAllLocalData={handleClearAllLocalData}
        />
      )}
    </div>
  );
}
