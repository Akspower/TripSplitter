import { supabase } from './supabaseClient';
import type { Trip, Member, Expense } from '../types';
import { OfflineQueue } from './offlineQueue';

// Map database rows to our app types
const mapTripFromDb = (tripData: any, members: any[], expenses: any[]): Trip => ({
    id: tripData.id,
    name: tripData.name,
    destination: tripData.destination,
    startDate: tripData.start_date,
    endDate: tripData.end_date,
    creatorId: tripData.creator_id,
    adminPin: tripData.admin_pin,
    tripStyle: tripData.trip_style,
    budgetType: tripData.budget_type,
    ageGroup: tripData.age_group,
    members: members.map((m, idx) => ({
        id: m.user_id,
        name: m.name,
        isCreator: m.is_creator,
        avatarColor: m.avatar_color || `color-${idx}`
    })),
    expenses: expenses.map(e => ({
        id: e.id,
        description: e.description,
        amount: parseFloat(e.amount),
        date: e.date,
        category: e.category,
        payerId: e.payer_id,
        participantIds: e.participant_ids,
        createdBy: e.created_by
    }))
});

export const TripService = {
    async createTrip(trip: Trip): Promise<{ success: boolean, error?: string }> {
        const { error: tripError } = await supabase
            .from('trips')
            .insert({
                id: trip.id,
                name: trip.name,
                destination: trip.destination,
                start_date: trip.startDate,
                end_date: trip.endDate,
                creator_id: trip.creatorId,
                admin_pin: trip.adminPin,
                trip_style: trip.tripStyle,
                budget_type: trip.budgetType,
                age_group: trip.ageGroup
            });

        if (tripError) {
            // console.error('Error creating trip:', tripError);
            return { success: false, error: tripError.message };
        }

        // Insert members with avatar colors
        const membersToInsert = trip.members.map((m, idx) => ({
            trip_id: trip.id,
            user_id: m.id,
            name: m.name,
            is_creator: m.isCreator,
            avatar_color: m.avatarColor || `color-${idx}`
        }));

        const { error: memberError } = await supabase.from('members').insert(membersToInsert);
        if (memberError) {
            // console.error('Error creating members:', memberError);
            // Try to cleanup trip if member insert fails
            await supabase.from('trips').delete().eq('id', trip.id);
            return { success: false, error: memberError.message };
        }

        return { success: true };
    },

    async joinTrip(tripId: string, member: Member): Promise<{ success: boolean, trip?: Trip }> {
        // 1. Check if trip exists
        const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single();

        if (tripError || !tripData) {
            // console.error('Trip not found or error:', tripError);
            return { success: false };
        }

        // 2. Add new member
        const { error: memberError } = await supabase
            .from('members')
            .insert({
                trip_id: tripId,
                user_id: member.id,
                name: member.name,
                is_creator: member.isCreator
            });

        if (memberError) {
            // console.error('Error adding member:', memberError);
            return { success: false };
        }

        // 3. Fetch full trip details to return
        return this.getTrip(tripId);
    },

    async getTrip(tripId: string): Promise<{ success: boolean, trip?: Trip }> {
        const { data: tripData, error: tripError } = await supabase
            .from('trips')
            .select('*')
            .eq('id', tripId)
            .single();

        if (tripError || !tripData) return { success: false };

        const { data: members, error: memberError } = await supabase
            .from('members')
            .select('*')
            .eq('trip_id', tripId);

        if (memberError) return { success: false };

        const { data: expenses, error: expenseError } = await supabase
            .from('expenses')
            .select('*')
            .eq('trip_id', tripId);

        if (expenseError) return { success: false };

        const trip = mapTripFromDb(tripData, members || [], expenses || []);
        return { success: true, trip };
    },



    async addExpense(tripId: string, expense: Expense): Promise<{ success: boolean, error?: string }> {
        // Generate a simple ID if one isn't provided (schema demands text id)
        const expenseId = expense.id || Math.random().toString(36).substr(2, 9);
        const expenseWithId = { ...expense, id: expenseId };

        if (!navigator.onLine) {
            OfflineQueue.saveAction('ADD_EXPENSE', { tripId, expense: expenseWithId });
            return { success: true }; // Optimistically return true
        }

        const { error } = await supabase.from('expenses').insert({
            id: expenseId,
            trip_id: tripId,
            description: expense.description,
            amount: expense.amount,
            date: expense.date,
            category: expense.category,
            payer_id: expense.payerId,
            participant_ids: expense.participantIds,
            created_by: expense.createdBy
        });

        if (error) {
            // If offline error, queue it
            if (error.message.includes('fetch') || error.message.includes('network')) {
                OfflineQueue.saveAction('ADD_EXPENSE', { tripId, expense: expenseWithId });
                return { success: true };
            }
            // console.error('Error adding expense:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    async deleteExpense(expenseId: string): Promise<boolean> {
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (error) {
            // console.error(error);
            return false;
        }
        return true;
    },

    async deleteTrip(tripId: string): Promise<boolean> {
        const { error } = await supabase.from('trips').delete().eq('id', tripId);
        if (error) {
            // console.error('Error deleting trip:', error);
            return false;
        }
        return true;
    },

    async removeMember(tripId: string, memberId: string): Promise<boolean> {
        // 1. Fetch all expenses to analyze
        const { data: expenses } = await supabase
            .from('expenses')
            .select('*')
            .eq('trip_id', tripId);

        if (!expenses) return false;

        const expensesToDelete: string[] = [];
        const expensesToUpdate: { id: string, participant_ids: string[] }[] = [];

        for (const e of expenses) {
            // Case A: Member created or paid for it -> Delete the expense
            // (Assuming "fake name" means their entered expenses are invalid)
            if (e.payer_id === memberId || e.created_by === memberId) {
                expensesToDelete.push(e.id);
                continue;
            }

            // Case B: Member is a participant -> Remove from split
            if (e.participant_ids.includes(memberId)) {
                const newParticipants = e.participant_ids.filter((id: string) => id !== memberId);

                if (newParticipants.length === 0) {
                    // If no one else is paying, delete it
                    expensesToDelete.push(e.id);
                } else {
                    expensesToUpdate.push({ id: e.id, participant_ids: newParticipants });
                }
            }
        }

        // 2. Perform Batch Updates
        if (expensesToDelete.length > 0) {
            const { error } = await supabase.from('expenses').delete().in('id', expensesToDelete);
            if (error) {
                // console.error("Error deleting expenses:", error);
                return false;
            }
        }

        for (const update of expensesToUpdate) {
            const { error } = await supabase
                .from('expenses')
                .update({ participant_ids: update.participant_ids })
                .eq('id', update.id);
            if (error) {
                // console.error("Error updating split:", error);
                return false;
            }
        }

        // 3. Delete the Member
        const { error: memberError } = await supabase
            .from('members')
            .delete()
            .match({ trip_id: tripId, user_id: memberId });

        return !memberError;
    },

    subscribeToTrip(tripId: string, onUpdate: () => void) {
        const channel = supabase
            .channel(`trip:${tripId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'expenses', filter: `trip_id=eq.${tripId}` },
                () => onUpdate()
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'members', filter: `trip_id=eq.${tripId}` },
                () => onUpdate()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    },

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
                // Handle other types if needed
            } catch (e) {
                console.error("Sync failed for action", action.id, e);
            }
        }

        if (processedIds.length > 0) {
            OfflineQueue.clearProcessed(processedIds);
        }
    }
};
