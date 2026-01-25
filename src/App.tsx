import { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import type { Trip, Expense } from './types';
import { TripService } from './services/tripService';
import { PDFService } from './services/pdfService';
import { IdentificationIcon, SparklesIcon } from '@heroicons/react/24/outline'; // Icons used in landing

import Header from './components/Header';
import ConfirmDialog from './components/ui/ConfirmDialog';
import Skeleton from './components/ui/Skeleton';

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

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDestructive?: boolean }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }, isDestructive: false
  });

  // Check for Deep Link on mount
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

  // Network Status & Auto-Sync
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

    // Initial check on mount
    if (navigator.onLine) {
      TripService.syncPendingActions();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial Load with Cache Strategy
  useEffect(() => {
    const savedTripId = localStorage.getItem('tripId');
    const savedMyId = localStorage.getItem('myId');
    const cachedTripJson = localStorage.getItem('cachedTrip');

    if (savedTripId && savedMyId) {
      setMyId(savedMyId);

      // 1. Try to load from cache immediately for instant UI
      if (cachedTripJson) {
        try {
          const cachedTrip = JSON.parse(cachedTripJson);
          if (cachedTrip.id === savedTripId) {
            setCurrentTrip(cachedTrip);
            setLoadingTrip(false); // Show UI immediately
          }
        } catch (e) {
          console.error("Failed to parse cached trip", e);
        }
      }

      // 2. Fetch fresh data from server
      loadTrip(savedTripId, !!cachedTripJson); // Silent if we have cache
    } else {
      // If no active trip, check if we were creating one (persisted state)
      if (localStorage.getItem('trip_setup_state')) {
        setViewMode('create');
      }
      setLoadingTrip(false);
    }
  }, []);

  // Real-time Subscription
  useEffect(() => {
    if (currentTrip?.id && !isOffline) {
      const unsubscribe = TripService.subscribeToTrip(currentTrip.id, () => {
        setIsSyncing(true);
        // Add small delay to show sync indicator
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
      // Persist ID and Data
      localStorage.setItem('tripId', id);
      localStorage.setItem('cachedTrip', JSON.stringify(result.trip));
    } else {
      // If fail to load (e.g. deleted or offline), handle gracefully
      if (isOffline && currentTrip) {
        // Keep current state if offline and already loaded
        setLoadingTrip(false);
      } else if (result.error === 'NOT_FOUND') {
        // Trip no longer exists on server
        toast.error("This trip no longer exists.");
        handleReset();
      } else {
        // Other errors (network etc), just stop loading
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
    // update cache immediately
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
  }

  const handleAddExpense = async (e: Expense) => {
    if (!currentTrip) return;
    const expenseWithCreator = { ...e, createdBy: myId };
    const result = await TripService.addExpense(currentTrip.id, expenseWithCreator);
    if (result.success) {
      setShowAddExpense(false);
      setEditingExpense(null);
      // Trip update will come via subscription
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

    // Optimistic update - remove immediately from UI
    const previousExpenses = currentTrip.expenses;
    setCurrentTrip(prev => prev ? {
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== expenseId)
    } : null);

    const success = await TripService.deleteExpense(expenseId);
    if (!success) {
      // Revert on failure
      setCurrentTrip(prev => prev ? { ...prev, expenses: previousExpenses } : null);
      alert('Failed to delete expense. Please try again.');
    }
  };

  if (loadingTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-pulse">
          <div className="flex justify-center">
            <Skeleton className="w-20 h-20 rounded-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4 mx-auto rounded-xl" />
            <Skeleton className="h-4 w-1/2 mx-auto rounded-lg" />
          </div>
          <div className="space-y-3 pt-10">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (currentTrip) {
    return (
      <div className="min-h-[100dvh] font-sans">
        {/* Global Confirm Dialog for Active Trip View */}
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
        />

        <Suspense fallback={
          <div className="p-6 max-w-7xl mx-auto w-full space-y-8 animate-pulse">
            <div className="flex gap-4 mb-10">
              <Skeleton className="h-64 w-1/3 rounded-[40px]" />
              <Skeleton className="h-64 w-2/3 rounded-[40px]" />
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

  return (
    <div className="min-h-[100dvh] bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans relative overflow-hidden flex flex-col">
      <Toaster position="top-center" toastOptions={{ className: 'font-bold rounded-2xl shadow-xl', duration: 3000 }} />

      <Header key={`header-${viewMode}`} onReset={handleReset} tripId={currentTrip ? (currentTrip as Trip).id : undefined} />

      <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10 pb-20">
        <AnimatePresence mode='wait'>
          {/* Hero Section */}
          {viewMode === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto w-full text-center space-y-12"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20"></div>
                <h1 className="text-6xl sm:text-8xl font-black text-white tracking-tighter mb-6 relative">
                  Split<span className="text-indigo-400">Way</span>
                </h1>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-300 max-w-2xl mx-auto leading-relaxed">
                The modern way to travel with friends. <br />
                <span className="text-indigo-300">Real-time splits. AI Suggestions. Zero drama.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                <button
                  onClick={() => {
                    const handleStartCreation = () => {
                      // User explicitly wants a new trip, so clear any old drafts
                      localStorage.removeItem('trip_setup_state');
                      setViewMode('create');
                    };
                    handleStartCreation();
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-6 rounded-[28px] font-black text-xl shadow-2xl shadow-indigo-900/50 hover:scale-105 hover:shadow-indigo-500/50 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <SparklesIcon className="w-6 h-6" />
                  Plan New Trip
                </button>
                <button
                  onClick={() => setViewMode('join')}
                  className="w-full sm:w-auto glass text-white px-10 py-6 rounded-[28px] font-black text-xl hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <IdentificationIcon className="w-6 h-6" />
                  Join Existing
                </button>
              </div>
            </motion.div>
          )}

          {viewMode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg"
            >
              <Suspense fallback={<div className="p-10 text-center"><Skeleton className="h-96 w-full rounded-2xl" /></div>}>
                <TripSetup
                  onComplete={handleCreateOrJoin}
                  onBack={() => setViewMode('landing')}
                />
              </Suspense>
            </motion.div>
          )}

          {viewMode === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
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
      <div className="p-6 text-center text-slate-300 font-bold text-xs uppercase tracking-[0.2em]">
        Secure • Realtime • Intelligent
      </div>
    </div>
  );
}