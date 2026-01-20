export interface OfflineAction {
    id: string;
    type: 'ADD_EXPENSE' | 'DELETE_EXPENSE' | 'REMOVE_MEMBER';
    payload: any;
    timestamp: number;
}

const STORAGE_KEY = 'splitway_offline_queue';

export const OfflineQueue = {
    saveAction: (type: OfflineAction['type'], payload: any) => {
        const queue: OfflineAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        queue.push({
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: Date.now()
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    },

    getQueue: (): OfflineAction[] => {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    },

    clearProcessed: (ids: string[]) => {
        const queue = OfflineQueue.getQueue();
        const newQueue = queue.filter(item => !ids.includes(item.id));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newQueue));
    },

    hasPending: (): boolean => {
        return OfflineQueue.getQueue().length > 0;
    }
};
