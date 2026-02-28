import { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import type { Trip, Expense } from './types';
import { TripService } from './services/tripService';
import { PDFService } from './services/pdfService';

import Header from './components/Header';
import ConfirmDialog from './components/ui/ConfirmDialog';
import Skeleton from './components/ui/Skeleton';
import QuoteBar from './components/QuoteBar';
import TravelBackground from './components/TravelBackground';

// Lazy Load Heavy Components
const Dashboard = lazy(() => import('./components/Dashboard'));
const TripSetup = lazy(() => import('./components/TripSetup'));
const TripJoin = lazy(() => import('./components/TripJoin'));
const ExpenseForm = lazy(() => import('./components/ExpenseForm'));

export default function App() {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'landing' | 'create' | 'join'>('landing');
  const [initialTripId, setInitialTripId] = useState<string>('');

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDestructive?: boolean }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }, isDestructive: false
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinId = params.get('join');
    if (joinId) {
      setInitialTripId(joinId);
      setViewMode('join');
    }
  }, []);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setIsSyncing(true);
      TripService.syncPendingActions().then(() => {
        setTimeout(() => setIsSyncing(false), 1000);
      });
    };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) TripService.syncPendingActions();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fix: black screen after screen lock in PWA mode
  // When the device screen turns off and the user returns, the WebView sometimes blanks.
  // Re-hydrate from localStorage cache on visibilitychange.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const savedTripId = localStorage.getItem('tripId');
        const cachedJson = localStorage.getItem('cachedTrip');
        if (savedTripId && cachedJson && !currentTrip) {
          try {
            const cached = JSON.parse(cachedJson);
            setCurrentTrip(cached);
          } catch (_) { /* ignore */ }
        }
        // Force a repaint — fixes iOS WebKit blank white/black flash
        document.body.style.opacity = '0.99';
        requestAnimationFrame(() => { document.body.style.opacity = ''; });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [currentTrip]);

  useEffect(() => {
    const savedTripId = localStorage.getItem('tripId');
    const savedMyId = localStorage.getItem('myId');
    const cachedTripJson = localStorage.getItem('cachedTrip');

    if (savedTripId && savedMyId) {
      setMyId(savedMyId);
      if (cachedTripJson) {
        try {
          const cachedTrip = JSON.parse(cachedTripJson);
          if (cachedTrip.id === savedTripId) {
            setCurrentTrip(cachedTrip);
            setLoadingTrip(false);
          }
        } catch (e) {
          console.error("Failed to parse cached trip", e);
        }
      }
      loadTrip(savedTripId, !!cachedTripJson);
    } else {
      if (localStorage.getItem('trip_setup_state')) setViewMode('create');
      setLoadingTrip(false);
    }
  }, []);

  useEffect(() => {
    if (currentTrip?.id && !isOffline) {
      const unsubscribe = TripService.subscribeToTrip(currentTrip.id, () => {
        setIsSyncing(true);
        setTimeout(() => loadTrip(currentTrip.id, true), 500);
      });
      return unsubscribe;
    }
  }, [currentTrip?.id, isOffline]);

  const loadTrip = async (id: string, isSilent = false) => {
    if (!isSilent) setIsSyncing(true);
    const result = await TripService.getTrip(id);
    if (result.success && result.trip) {
      setCurrentTrip(result.trip);
      localStorage.setItem('tripId', id);
      localStorage.setItem('cachedTrip', JSON.stringify(result.trip));
    } else {
      if (isOffline && currentTrip) {
        setLoadingTrip(false);
      } else if (result.error === 'NOT_FOUND') {
        toast.error("This trip no longer exists.");
        handleReset();
      } else {
        setLoadingTrip(false);
      }
    }
    setIsSyncing(false);
    setLoadingTrip(false);
  };

  const saveLocalContext = (tripId: string, id: string) => {
    localStorage.setItem('tripId', tripId);
    localStorage.setItem('myId', id);
    setMyId(id);
    loadTrip(tripId);
  };

  const handleCreateOrJoin = (trip: Trip, id: string) => {
    setCurrentTrip(trip);
    localStorage.setItem('cachedTrip', JSON.stringify(trip));
    saveLocalContext(trip.id, id);
  };

  const handleReset = () => {
    localStorage.removeItem('tripId');
    localStorage.removeItem('myId');
    localStorage.removeItem('cachedTrip');
    setCurrentTrip(null);
    setMyId('');
    setViewMode('landing');
  };

  const handleDeleteTrip = async () => {
    if (!currentTrip) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Entire Trip?',
      message: 'Are you sure you want to delete this trip for everyone? This cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        const toastId = toast.loading('Deleting trip...');
        await TripService.deleteTrip(currentTrip.id);
        toast.success('Trip deleted successfully', { id: toastId });
        handleReset();
      }
    });
  };

  const handleAddExpense = async (e: Expense) => {
    if (!currentTrip) return;
    const expenseWithCreator = { ...e, createdBy: myId };
    const result = await TripService.addExpense(currentTrip.id, expenseWithCreator);
    if (result.success) {
      setShowAddExpense(false);
      setEditingExpense(null);
    } else {
      toast.error(`Failed to add expense: ${result.error}`);
    }
  };

  const handleUpdateExpense = async (e: Expense) => {
    if (!currentTrip) return;
    const result = await TripService.updateExpense(currentTrip.id, e);
    if (result.success) {
      toast.success("Expense updated!");
      setShowAddExpense(false);
      setEditingExpense(null);
    } else {
      toast.error(`Failed to update expense: ${result.error}`);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!currentTrip) return;
    const previousExpenses = currentTrip.expenses;
    setCurrentTrip(prev => prev ? { ...prev, expenses: prev.expenses.filter(e => e.id !== expenseId) } : null);
    const success = await TripService.deleteExpense(expenseId, currentTrip.id);
    if (!success) {
      setCurrentTrip(prev => prev ? { ...prev, expenses: previousExpenses } : null);
      toast.error('Failed to delete expense. Please try again.');
    }
  };

  // ── Dark Loading Skeleton ──────────────────────────────────────
  if (loadingTrip) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-6">
        {/* Ambient blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="blob w-[50%] h-[40%] top-[-10%] left-[-10%] bg-[#b613ec]/15" />
          <div className="blob w-[40%] h-[40%] bottom-[10%] right-[-10%] bg-indigo-600/10" />
        </div>
        <div className="w-full max-w-sm space-y-8 animate-pulse relative z-10">
          <div className="flex justify-center">
            <Skeleton className="w-20 h-20 rounded-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 mx-auto rounded-xl" />
            <Skeleton className="h-4 w-1/2 mx-auto rounded-lg" />
          </div>
          <div className="space-y-3 pt-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Active Trip View ────────────────────────────────────────────
  if (currentTrip) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0A0F] font-['Space_Grotesk',sans-serif]">
        {/* Toaster must live here too — expense add/delete toasts */}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'rgba(13, 8, 23, 0.97)',
              color: '#F4F4F8',
              border: '1px solid rgba(182,19,236,0.3)',
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 600,
              borderRadius: '16px',
              backdropFilter: 'blur(12px)',
              fontSize: '13px',
            },
            duration: 3000
          }}
          containerStyle={{ zIndex: 9999 }}
        />
        <ConfirmDialog
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        />
        <Header
          key="active-session-header"
          tripName={currentTrip.name}
          destination={currentTrip.destination}
          startDate={currentTrip.startDate}
          endDate={currentTrip.endDate}
          onReset={handleReset}
          isSyncing={isSyncing}
          isOffline={isOffline}
          isCreator={currentTrip.creatorId === myId}
          onDelete={currentTrip.creatorId === myId ? handleDeleteTrip : undefined}
          showLogout={true}
          onExportPDF={() => PDFService.generateTripReport(currentTrip)}
          tripId={currentTrip.id}
        />
        <Suspense fallback={
          <div className="p-6 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
            <div className="flex gap-4">
              <Skeleton className="h-64 w-1/3 rounded-3xl" />
              <Skeleton className="h-64 w-2/3 rounded-3xl" />
            </div>
          </div>
        }>
          <Dashboard
            trip={currentTrip}
            myId={myId}
            onAddExpense={() => { setEditingExpense(null); setShowAddExpense(true); }}
            onEditExpense={(e) => { setEditingExpense(e); setShowAddExpense(true); }}
            onDeleteExpense={handleDeleteExpense}
            onRefreshTrip={() => loadTrip(currentTrip.id)}
            onExportPDF={() => PDFService.generateTripReport(currentTrip)}
          />
          {showAddExpense && (
            <ExpenseForm
              members={currentTrip.members}
              onAdd={editingExpense ? handleUpdateExpense : handleAddExpense}
              onCancel={() => { setShowAddExpense(false); setEditingExpense(null); }}
              initialData={editingExpense || undefined}
            />
          )}
        </Suspense>
      </div>
    );
  }

  // ── Landing / Create / Join ─────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#0A0A0F] font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden flex flex-col">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(30, 10, 50, 0.95)',
            color: '#F4F4F8',
            border: '1px solid rgba(182,19,236,0.3)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 600,
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
          },
          duration: 3000
        }}
        containerStyle={{ zIndex: 9999 }}
      />

      {/* Travel-themed animated background — mountains, aurora, stars, travel icons */}
      <TravelBackground />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-5 pb-0">
        <div className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="TripKhata" className="w-9 h-9 rounded-xl shadow-lg shadow-[#b613ec]/30" />
          <h2 className="text-xl font-bold tracking-tight text-[#F4F4F8]">Trip<span className="text-[#b613ec]">Khata</span></h2>
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center px-5 relative z-10 pb-16 pt-6">
        <AnimatePresence mode="wait">

          {/* ── Landing ── */}
          {viewMode === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="max-w-md mx-auto w-full"
            >
              {/* ── Premium Hero Trip Preview Card ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="relative w-full mb-8"
              >
                {/* Ambient glow behind card */}
                <div className="absolute inset-x-8 -inset-y-4 bg-[#b613ec]/20 rounded-3xl blur-3xl" />

                {/* The card */}
                <div className="relative glass-card rounded-3xl p-6 border border-white/10 overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-48 h-48 bg-[#b613ec]/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

                  {/* Trip Header — single column, no more overlap */}
                  <div className="mb-5 relative z-10 pr-24">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live Trip</span>
                    </div>
                    <h3 className="text-xl font-bold text-[#F4F4F8] leading-tight">Goa Beach Trip 🏖️</h3>
                    <p className="text-xs text-[rgba(244,244,248,0.4)] mt-0.5">Panaji, South Goa • 4 nights</p>
                  </div>

                  {/* Member Avatars + Total Spent row */}
                  <div className="flex items-center justify-between mb-5 relative z-10">
                    <div className="flex items-center gap-2">
                      {[
                        { n: 'Arjun', g: 'from-violet-500 to-[#b613ec]' },
                        { n: 'Priya', g: 'from-rose-400 to-pink-600' },
                        { n: 'Sahil', g: 'from-emerald-400 to-teal-600' },
                        { n: 'Kiran', g: 'from-amber-400 to-orange-500' },
                      ].map((m, i) => (
                        <div key={i} className={`w-9 h-9 rounded-xl bg-gradient-to-br ${m.g} flex items-center justify-center font-bold text-white text-sm shadow-lg border-2 border-[#0d0817]`}>
                          {m.n[0]}
                        </div>
                      ))}
                      <span className="text-[10px] font-bold text-[rgba(244,244,248,0.35)] ml-1">4 members</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-[rgba(244,244,248,0.3)] uppercase tracking-widest">Total Spent</p>
                      <p className="text-xl font-bold text-[#F4F4F8]">₹18,420</p>
                    </div>
                  </div>

                  {/* Mock Expense Items */}
                  <div className="space-y-2.5 relative z-10">
                    {[
                      { emoji: '🍛', name: 'Dinner at Fisherman\'s Wharf', by: 'Arjun', amount: '₹2,400', mine: '₹600' },
                      { emoji: '🏨', name: 'Beach Resort (2 nights)', by: 'Priya', amount: '₹7,200', mine: '₹1,800' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
                        <span className="text-xl">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-[#F4F4F8] truncate">{item.name}</p>
                          <p className="text-[10px] text-[rgba(244,244,248,0.4)]">{item.by} paid</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#F4F4F8]">{item.amount}</p>
                          <p className="text-[10px] text-[#b613ec] font-bold">You: {item.mine}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Balance pill */}
                  <div className="mt-4 flex items-center justify-between bg-emerald-400/10 border border-emerald-400/25 rounded-2xl px-4 py-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-400 text-sm">trending_up</span>
                      <span className="text-xs font-bold text-[rgba(244,244,248,0.6)]">Your Net Balance</span>
                    </div>
                    <span className="text-base font-bold text-emerald-400">+₹3,150</span>
                  </div>

                  {/* Made for Bharat badge */}
                  <div className="absolute top-4 right-4 z-20">
                    <span className="px-2.5 py-1 rounded-full bg-[#b613ec]/20 border border-[#b613ec]/40 text-[9px] font-bold uppercase tracking-widest text-[#b613ec]">Made for Bharat 🇮🇳</span>
                  </div>
                </div>
              </motion.div>

              {/* Rotating sarcastic travel quote */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mb-5"
              >
                <QuoteBar category="travel" interval={9000} />
              </motion.div>

              {/* Hero Text */}
              <motion.div
                className="space-y-3 mb-7"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <h1 className="text-5xl font-bold leading-[0.95] tracking-tighter text-[#F4F4F8]">
                  Trip<span className="text-[#b613ec]">Khata</span>
                </h1>
                <p className="text-lg text-[rgba(244,244,248,0.5)] font-light max-w-[280px]">
                  Add bills. See who owes what. Settle at the end.
                </p>
              </motion.div>

              {/* CTAs */}
              <motion.div
                className="flex flex-col gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { localStorage.removeItem('trip_setup_state'); setViewMode('create'); }}
                  className="w-full h-14 btn-primary rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-xl">add_circle</span>
                  Plan New Trip
                </motion.button>
                <p className="text-center text-[10px] text-[rgba(244,244,248,0.25)] font-medium tracking-wide -mt-1">You'll get a Room ID — share with your squad</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setViewMode('join')}
                  className="w-full h-14 glass-pill rounded-2xl font-bold text-lg text-[#F4F4F8] flex items-center justify-center border border-white/10"
                >
                  <span className="material-symbols-outlined text-xl mr-2 text-[rgba(244,244,248,0.5)]">group_add</span>
                  Join Existing
                </motion.button>
                <p className="text-center text-[10px] text-[rgba(244,244,248,0.25)] font-medium tracking-wide -mt-1">Enter the 6-digit Room ID from your friend</p>
              </motion.div>

              {/* Feature Pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="mt-8 w-screen relative left-1/2 right-1/2 -ml-[50vw] overflow-hidden"
              >
                <div className="flex animate-marquee gap-4 whitespace-nowrap">
                  {[...Array(2)].map((_, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      {[
                        { icon: 'bolt', label: 'Real-time', color: '#b613ec' },
                        { icon: 'smart_toy', label: 'AI Insights', color: '#818cf8' },
                        { icon: 'cloud_off', label: 'Works Offline', color: '#34d399' },
                        { icon: 'lock', label: 'Secure Encryption', color: '#fb923c' },
                        { icon: 'analytics', label: 'Smart Analytics', color: '#f472b6' },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 glass-pill px-5 py-2.5 rounded-full border border-white/5">
                          <span className="material-symbols-outlined text-sm" style={{ color: item.color }}>{item.icon}</span>
                          <span className="text-xs font-bold uppercase tracking-widest text-[#F4F4F8]">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {/* Fade edges */}
                <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0A0A0F] to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0A0A0F] to-transparent z-10" />
              </motion.div>
            </motion.div>
          )}

          {/* ── Create Flow ── */}
          {viewMode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              <Suspense fallback={<div className="p-10 text-center"><Skeleton className="h-96 w-full rounded-2xl" /></div>}>
                <TripSetup onComplete={handleCreateOrJoin} onBack={() => setViewMode('landing')} />
              </Suspense>
            </motion.div>
          )}

          {/* ── Join Flow ── */}
          {viewMode === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              <Suspense fallback={<div className="p-10 text-center"><Skeleton className="h-64 w-full rounded-2xl" /></div>}>
                <TripJoin onJoin={handleCreateOrJoin} onBack={() => setViewMode('landing')} initialTripId={initialTripId} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="pb-6 pt-2 text-center relative z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[rgba(244,244,248,0.15)]">TripKhata · Made for India 🇮🇳</p>
      </div>
    </div>
  );
}