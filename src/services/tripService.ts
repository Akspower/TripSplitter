import { supabase } from './supabaseClient';
import type { Trip, Member, Expense } from '../types';

// Map database rows to our app types
const mapTripFromDb = (tripData: any, members: any[], expenses: any[]): Trip => ({
    id: tripData.id,
    name: tripData.name,
    destination: tripData.destination,
    startDate: tripData.start_date,
    endDate: tripData.end_date,
    creatorId: tripData.creator_id,
    members: members.map(m => ({
        id: m.user_id,
        name: m.name,
        isCreator: m.is_creator
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
                creator_id: trip.creatorId
            });

        if (tripError) {
            console.error('Error creating trip:', tripError);
            return { success: false, error: tripError.message };
        }

        // Insert members
        const membersToInsert = trip.members.map(m => ({
            trip_id: trip.id,
            user_id: m.id,
            name: m.name,
            is_creator: m.isCreator
        }));

        const { error: memberError } = await supabase.from('members').insert(membersToInsert);
        if (memberError) {
            console.error('Error creating members:', memberError);
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
            console.error('Trip not found or error:', tripError);
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
            console.error('Error adding member:', memberError);
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
            console.error('Error adding expense:', error);
            return { success: false, error: error.message };
        }
        return { success: true };
    },

    async deleteExpense(expenseId: string): Promise<boolean> {
        const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
        if (error) {
            console.error(error);
            return false;
        }
        return true;
    },

    async deleteTrip(tripId: string): Promise<boolean> {
        const { error } = await supabase.from('trips').delete().eq('id', tripId);
        if (error) {
            console.error('Error deleting trip:', error);
            return false;
        }
        return true;
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
    }
};
