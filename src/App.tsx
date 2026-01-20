import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import type { Trip, Expense } from './types';
import { TripService } from './services/tripService';
import { IdentificationIcon, SparklesIcon } from '@heroicons/react/24/outline'; // Icons used in landing

// Components
import Header from './components/Header';
import TripSetup from './components/TripSetup';
import TripJoin from './components/TripJoin';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';

export default function App() {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [myId, setMyId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'landing' | 'create' | 'join'>('landing');
  const [initialTripId, setInitialTripId] = useState<string>('');

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

  // Initial Load
  useEffect(() => {
    const savedTripId = localStorage.getItem('tripId');
    const savedMyId = localStorage.getItem('myId');

    // If we have local data but are offline, we should still try to load view
    // (In a real PWA context, React Query or local caching would handle this better.
    // For now we assume TripService might need network, unless we cache trip data too.)

    if (savedTripId && savedMyId) {
      setMyId(savedMyId);
      loadTrip(savedTripId);
    } else {
      setLoadingTrip(false);
    }
  }, []);

  // Real-time Subscription
  useEffect(() => {
    if (currentTrip?.id && !isOffline) {
      // console.log("Subscribing to trip:", currentTrip.id);
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
      // Persist ID only
      localStorage.setItem('tripId', id);
    } else {
      // If fail to load (e.g. deleted or offline), handle gracefully
      if (isOffline && currentTrip) {
        // Keep current state if offline and already loaded
      } else {
        // Maybe show error or retry? 
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
    saveLocalContext(trip.id, id);
  };

  const handleReset = () => {
    localStorage.removeItem('tripId');
    localStorage.removeItem('myId');
    setCurrentTrip(null);
    setMyId('');
    setViewMode('landing');
  };

  const handleDeleteTrip = async () => {
    if (currentTrip && confirm("Are you sure you want to delete this trip for everyone? This cannot be undone.")) {
      await TripService.deleteTrip(currentTrip.id);
      handleReset();
    }
  }

  const handleAddExpense = async (e: Expense) => {
    if (!currentTrip) return;
    const expenseWithCreator = { ...e, createdBy: myId };
    const result = await TripService.addExpense(currentTrip.id, expenseWithCreator);
    if (result.success) {
      setShowAddExpense(false);
      // Trip update will come via subscription
    } else {
      toast.error(`Failed to add expense: ${result.error}`);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (currentTrip) {
    return (
      <div className="min-h-[100dvh] bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
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
        />

        <Dashboard
          trip={currentTrip}
          myId={myId}
          onAddExpense={() => setShowAddExpense(true)}
          onDeleteExpense={handleDeleteExpense}
        />

        {showAddExpense && (
          <ExpenseForm
            members={currentTrip.members}
            onAdd={handleAddExpense}
            onCancel={() => setShowAddExpense(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900 font-sans relative overflow-hidden flex flex-col">
      <Toaster position="top-center" toastOptions={{ className: 'font-bold rounded-2xl shadow-xl', duration: 3000 }} />
      <Header key={`header-${viewMode}`} onReset={handleReset} tripId={currentTrip ? (currentTrip as Trip).id : undefined} />

      <div className="flex-1 flex flex-col justify-center items-center px-6 relative z-10 pb-20">

        {/* Hero Section */}
        {viewMode === 'landing' && (
          <div className="max-w-4xl mx-auto w-full text-center space-y-12 animate-in fade-in zoom-in duration-700">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-20"></div>
              <h1 className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tighter mb-6 relative">
                Split<span className="text-indigo-600">Way</span>
              </h1>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-400 max-w-2xl mx-auto leading-relaxed">
              The modern way to travel with friends. <br />
              <span className="text-indigo-500">Real-time splits. AI Suggestions. Zero drama.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <button
                onClick={() => setViewMode('create')}
                className="w-full sm:w-auto bg-slate-900 text-white px-10 py-6 rounded-[28px] font-black text-xl shadow-2xl shadow-slate-200 hover:scale-105 transition-transform active:scale-95 flex items-center justify-center gap-3"
              >
                <SparklesIcon className="w-6 h-6 text-indigo-400" />
                Plan New Trip
              </button>
              <button
                onClick={() => setViewMode('join')}
                className="w-full sm:w-auto bg-white text-slate-900 px-10 py-6 rounded-[28px] font-black text-xl shadow-xl border border-white hover:border-indigo-100 hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <IdentificationIcon className="w-6 h-6 text-slate-400" />
                Join Existing
              </button>
            </div>
          </div>
        )}

        {viewMode === 'create' && (
          <>
            <button onClick={() => setViewMode('landing')} className="absolute top-24 left-6 sm:left-10 text-slate-400 font-bold hover:text-slate-800 transition-colors">← Back</button>
            <TripSetup onComplete={handleCreateOrJoin} />
          </>
        )}

        {viewMode === 'join' && (
          <TripJoin onJoin={handleCreateOrJoin} onBack={() => setViewMode('landing')} initialTripId={initialTripId} />
        )}

      </div>

      {/* Footer */}
      <div className="p-6 text-center text-slate-300 font-bold text-xs uppercase tracking-[0.2em]">
        Secure • Realtime • Intelligent
      </div>
    </div>
  );
}