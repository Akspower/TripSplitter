import { calculateDebts } from '../utils/debtCalculator';

// Mock Interfaces to match src/types/index.ts
interface Member {
    id: string;
    name: string;
    // other fields irrelevant for math
}
interface Expense {
    id: string;
    description: string;
    amount: number;
    payerId: string;
    participantIds: string[];
    splitType?: 'EQUAL' | 'EXACT';
    splitDetails?: Record<string, number>;
    date: string;
    category: string;
    createdBy: string;
}
// Minimal Trip for calculation
interface Trip {
    id: string;
    members: Member[];
    expenses: Expense[];
    // others irrelevant
}

const runBrutalTest = () => {
    console.log("🔥 STARTING BRUTAL STRESS TEST (V2) 🔥");

    const userIds = ['u1', 'u2', 'u3', 'u4', 'u5'];
    const members: Member[] = userIds.map(id => ({ id, name: id.toUpperCase() }));
    const expenses: Expense[] = [];

    // 1. Generate 100 Random Expenses
    for (let i = 0; i < 100; i++) {
        const payerId = userIds[Math.floor(Math.random() * userIds.length)];
        // Random participants (at least 2)
        const participants = userIds.filter(() => Math.random() > 0.5);
        if (participants.length < 2) participants.push(userIds[0], userIds[1]);

        const isExact = Math.random() > 0.7; // 30% exact splits
        const amount = Math.floor(Math.random() * 5000) + 100;

        const expense: Expense = {
            id: `exp_${i}`,
            description: `Expense ${i}`,
            amount: amount,
            payerId: payerId,
            participantIds: participants,
            splitType: isExact ? 'EXACT' : 'EQUAL',
            splitDetails: {},
            date: new Date().toISOString(),
            category: 'Food',
            createdBy: payerId
        };

        if (isExact) {
            let remaining = amount;
            participants.forEach((p, idx) => {
                if (idx === participants.length - 1) {
                    expense.splitDetails![p] = remaining; // Last one takes remainder
                } else {
                    const share = Math.floor(remaining / 2);
                    expense.splitDetails![p] = share;
                    remaining -= share;
                }
            });
        }
        expenses.push(expense);
    }

    console.log(`> Generated ${expenses.length} complex expenses.`);

    // 2. Run Calculation
    const mockTrip = { id: 'test_trip', members, expenses } as any as Trip;

    const start = performance.now();
    const debts = calculateDebts(mockTrip);
    const end = performance.now();

    console.log(`> Calculation Time: ${(end - start).toFixed(2)}ms`); // Should be < 10ms
    console.log(`> Debts Generated: ${debts.length}`);

    // 3. Verify Zero Sum
    const hasNaN = debts.some((d: any) => isNaN(d.amount));

    if (!hasNaN) {
        console.log("✅ INTEGRITY CHECK PASSED: Logic executed without NaNs.");
    } else {
        console.error("❌ INTEGRITY CHECK FAILED: NaN detected.");
    }

    console.log("🔥 TEST COMPLETE 🔥");
};

runBrutalTest();
