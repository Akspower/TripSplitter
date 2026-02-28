import {
    doc, setDoc, getDoc, collection, getDocs,
    deleteDoc, onSnapshot, serverTimestamp, writeBatch,
    updateDoc
} from 'firebase/firestore';
import { db } from './firebaseClient';
import type { Trip, Member, Expense } from '../types';
import { OfflineQueue } from './offlineQueue';

// ─── Helpers ───────────────────────────────────────────────────────────────

const mapExpenseFromDoc = (id: string, data: Record<string, any>): Expense => ({
    id,
    description: data.description,
    amount: Number(data.amount),
    date: data.date?.toDate?.()?.toISOString?.() ?? data.date ?? new Date().toISOString(),
    category: data.category,
    payerId: data.payerId,
    participantIds: data.participantIds ?? [],
    createdBy: data.createdBy,
    splitType: data.splitType ?? 'EQUAL',
    splitDetails: data.splitDetails ?? {},
});

const mapMemberFromDoc = (id: string, data: Record<string, any>, idx: number): Member => ({
    id,
    name: data.name,
    isCreator: data.isCreator ?? false,
    avatarColor: data.avatarColor ?? `color-${idx}`,
});

// ─── TripService ────────────────────────────────────────────────────────────

export const TripService = {

    /**
     * Create a new trip with all its members in Firestore.
     * Uses a batch write so it's atomic — either everything succeeds or nothing does.
     */
    async createTrip(trip: Trip): Promise<{ success: boolean; error?: string }> {
        try {
            const batch = writeBatch(db);

            // Trip document
            const tripRef = doc(db, 'trips', trip.id);
            batch.set(tripRef, {
                name: trip.name,
                destination: trip.destination,
                startDate: trip.startDate,
                endDate: trip.endDate,
                creatorId: trip.creatorId,
                adminPin: trip.adminPin ?? null,
                tripStyle: trip.tripStyle ?? 'adventure',
                budgetType: trip.budgetType ?? 'moderate',
                ageGroup: trip.ageGroup ?? 'mixed',
                createdAt: serverTimestamp(),
            });

            // Members as sub-collection documents
            for (const member of trip.members) {
                const memberRef = doc(db, 'trips', trip.id, 'members', member.id);
                batch.set(memberRef, {
                    name: member.name,
                    isCreator: member.isCreator,
                    avatarColor: member.avatarColor ?? 'color-0',
                });
            }

            await batch.commit();
            return { success: true };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            return { success: false, error: msg };
        }
    },

    /**
     * Join an existing trip. Adds the new member to the members sub-collection.
     */
    async joinTrip(tripId: string, member: Member): Promise<{ success: boolean; trip?: Trip }> {
        try {
            const tripRef = doc(db, 'trips', tripId);
            const tripSnap = await getDoc(tripRef);
            if (!tripSnap.exists()) return { success: false };

            // Add member
            const memberRef = doc(db, 'trips', tripId, 'members', member.id);
            await setDoc(memberRef, {
                name: member.name,
                isCreator: member.isCreator,
                avatarColor: member.avatarColor ?? 'color-1',
            });

            return this.getTrip(tripId);
        } catch {
            return { success: false };
        }
    },

    /**
     * Fetch a full trip (trip doc + members + expenses sub-collections).
     */
    async getTrip(tripId: string): Promise<{ success: boolean; trip?: Trip; error?: string }> {
        try {
            const tripRef = doc(db, 'trips', tripId);
            const tripSnap = await getDoc(tripRef);

            if (!tripSnap.exists()) return { success: false, error: 'NOT_FOUND' };
            const tripData = tripSnap.data();

            // Members
            const membersSnap = await getDocs(collection(db, 'trips', tripId, 'members'));
            const members: Member[] = membersSnap.docs.map((d, idx) =>
                mapMemberFromDoc(d.id, d.data(), idx)
            );

            // Expenses
            const expensesSnap = await getDocs(collection(db, 'trips', tripId, 'expenses'));
            const expenses: Expense[] = expensesSnap.docs.map(d =>
                mapExpenseFromDoc(d.id, d.data())
            );

            const trip: Trip = {
                id: tripId,
                name: tripData.name,
                destination: tripData.destination,
                startDate: tripData.startDate,
                endDate: tripData.endDate,
                creatorId: tripData.creatorId,
                adminPin: tripData.adminPin ?? undefined,
                tripStyle: tripData.tripStyle,
                budgetType: tripData.budgetType,
                ageGroup: tripData.ageGroup,
                members,
                expenses,
            };

            return { success: true, trip };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            return { success: false, error: msg };
        }
    },

    /**
     * Add an expense to a trip's expenses sub-collection.
     */
    async addExpense(tripId: string, expense: Expense): Promise<{ success: boolean; error?: string }> {
        const expenseId = expense.id || Math.random().toString(36).substr(2, 9);
        const expenseWithId = { ...expense, id: expenseId };

        if (!navigator.onLine) {
            OfflineQueue.saveAction('ADD_EXPENSE', { tripId, expense: expenseWithId });
            return { success: true };
        }

        try {
            const expenseRef = doc(db, 'trips', tripId, 'expenses', expenseId);
            await setDoc(expenseRef, {
                description: expense.description,
                amount: expense.amount,
                date: expense.date,
                category: expense.category,
                payerId: expense.payerId,
                participantIds: expense.participantIds,
                createdBy: expense.createdBy,
                splitType: expense.splitType ?? 'EQUAL',
                splitDetails: expense.splitDetails ?? {},
                createdAt: serverTimestamp(),
            });
            return { success: true };
        } catch (err: unknown) {
            if (!navigator.onLine) {
                OfflineQueue.saveAction('ADD_EXPENSE', { tripId, expense: expenseWithId });
                return { success: true };
            }
            const msg = err instanceof Error ? err.message : 'Unknown error';
            return { success: false, error: msg };
        }
    },

    /**
     * Update an existing expense.
     */
    async updateExpense(tripId: string, expense: Expense): Promise<{ success: boolean; error?: string }> {
        try {
            const expenseRef = doc(db, 'trips', tripId, 'expenses', expense.id);
            await updateDoc(expenseRef, {
                description: expense.description,
                amount: expense.amount,
                date: expense.date,
                category: expense.category,
                payerId: expense.payerId,
                participantIds: expense.participantIds,
                splitType: expense.splitType ?? 'EQUAL',
                splitDetails: expense.splitDetails ?? {},
            });
            return { success: true };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            return { success: false, error: msg };
        }
    },

    /**
     * Delete a single expense.
     */
    async deleteExpense(expenseId: string, tripId?: string): Promise<boolean> {
        try {
            // We need tripId to locate the sub-collection
            if (!tripId) return false;
            await deleteDoc(doc(db, 'trips', tripId, 'expenses', expenseId));
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Delete an entire trip and all its sub-collections.
     * Firestore doesn't auto-delete sub-collections, so we batch-delete them.
     */
    async deleteTrip(tripId: string): Promise<boolean> {
        try {
            const batch = writeBatch(db);

            // Delete all expenses
            const expSnap = await getDocs(collection(db, 'trips', tripId, 'expenses'));
            expSnap.docs.forEach(d => batch.delete(d.ref));

            // Delete all members
            const memSnap = await getDocs(collection(db, 'trips', tripId, 'members'));
            memSnap.docs.forEach(d => batch.delete(d.ref));

            // Delete the trip itself
            batch.delete(doc(db, 'trips', tripId));

            await batch.commit();
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Remove a member from a trip (and clean up their expenses).
     */
    async removeMember(tripId: string, memberId: string): Promise<boolean> {
        try {
            const batch = writeBatch(db);

            // Fetch all expenses to check involvement
            const expSnap = await getDocs(collection(db, 'trips', tripId, 'expenses'));

            for (const d of expSnap.docs) {
                const data = d.data();
                // If member paid or created — delete expense
                if (data.payerId === memberId || data.createdBy === memberId) {
                    batch.delete(d.ref);
                    continue;
                }
                // If member is in the split — remove from participantIds
                if ((data.participantIds as string[]).includes(memberId)) {
                    const newIds = (data.participantIds as string[]).filter(id => id !== memberId);
                    if (newIds.length === 0) {
                        batch.delete(d.ref);
                    } else {
                        batch.update(d.ref, { participantIds: newIds });
                    }
                }
            }

            // Delete member doc
            batch.delete(doc(db, 'trips', tripId, 'members', memberId));

            await batch.commit();
            return true;
        } catch {
            return false;
        }
    },

    /**
     * Real-time subscription to trip changes (expenses + members).
     * Returns an unsubscribe function — same interface as Supabase's subscribe.
     */
    subscribeToTrip(tripId: string, onUpdate: () => void, onDelete?: () => void): () => void {
        // Listen to expenses sub-collection
        const unsubExpenses = onSnapshot(
            collection(db, 'trips', tripId, 'expenses'),
            () => onUpdate(),
            () => { } // silent error
        );

        // Listen to members sub-collection
        const unsubMembers = onSnapshot(
            collection(db, 'trips', tripId, 'members'),
            () => onUpdate(),
            () => { }
        );

        // Listen to the trip document itself (catches delete)
        const unsubTrip = onSnapshot(
            doc(db, 'trips', tripId),
            (snap) => {
                if (!snap.exists() && onDelete) onDelete();
            },
            () => { }
        );

        // Return a combined unsubscribe
        return () => {
            unsubExpenses();
            unsubMembers();
            unsubTrip();
        };
    },

    /**
     * Process any queued offline actions once back online.
     */
    async syncPendingActions(): Promise<void> {
        if (!navigator.onLine || !OfflineQueue.hasPending()) return;

        const queue = OfflineQueue.getQueue();
        const processedIds: string[] = [];

        for (const action of queue) {
            try {
                if (action.type === 'ADD_EXPENSE') {
                    const { tripId, expense } = action.payload;
                    const { success } = await this.addExpense(tripId, expense);
                    if (success) processedIds.push(action.id);
                }
            } catch (e) {
                console.error('Sync failed for action', action.id, e);
            }
        }

        if (processedIds.length > 0) {
            OfflineQueue.clearProcessed(processedIds);
        }
    },
};
