// 150+ sarcastic, funny & relatable travel money quotes
// Shuffle-without-repeat in a session via sessionStorage index tracking

export interface Quote {
    text: string;
    author?: string;
    category: 'travel' | 'money' | 'friends' | 'settled';
}

export const ALL_QUOTES: Quote[] = [
    // Travel + Money
    { text: "Not all who wander are lost — but your money definitely is.", category: 'travel' },
    { text: "Travel: the only thing you buy that makes you richer... in debt.", category: 'money' },
    { text: "We came, we saw, we overspent.", category: 'travel' },
    { text: "Home is where the WiFi is, but your money went somewhere else.", category: 'travel' },
    { text: "Collect moments, not things — your bank disagrees.", category: 'travel' },
    { text: "Travelling on a budget means your budget travels with you and disappears.", category: 'money' },
    { text: "The world is a book. You've read two pages and spent rent money.", category: 'travel' },
    { text: "PSA: 'Affordable trip' is a myth someone invented on Reddit.", category: 'money' },
    { text: "Eat, Pray, Love, Check your bank balance, Cry a little.", category: 'money' },
    { text: "Vacation calories don't count. Vacation expenses do — twice.", category: 'travel' },
    { text: "Adventure awaits. So does your credit card statement.", category: 'money' },
    { text: "\"We'll split it equally\" — famous last words before the chaos.", category: 'friends' },
    { text: "A trip with friends: 10% sightseeing, 90% arguing who Googled the restaurant.", category: 'friends' },
    { text: "Travel broadens the mind and narrows the bank balance.", category: 'money' },
    { text: "YOLO is just expensive regret wearing sunglasses.", category: 'money' },
    { text: "The best view comes after the worst bill.", category: 'travel' },
    { text: "Wanderlust: a strong desire to travel, funded by anxiety.", category: 'travel' },
    { text: "Travelling with friends: discovering who's secretly bad at maths.", category: 'friends' },
    { text: "Sun, sand, sea, and a shared spreadsheet nobody opened.", category: 'friends' },
    { text: "Real friends share experiences. Great ones also share bills.", category: 'friends' },
    { text: "Someone always forgets to bring cash. It's a law of nature.", category: 'friends' },
    { text: "\"I'll Venmo you\" is the new 'I'll call you back'.", category: 'money' },
    { text: "The friend who 'doesn't have change' has been the same friend since 2018.", category: 'friends' },
    { text: "Group trips: where 'we'll figure it out later' lives rent-free forever.", category: 'friends' },
    { text: "Travel is fatal to prejudice — and to your savings simultaneously.", category: 'money' },
    { text: "Every trip starts with 'we'll be so responsible' and ends with 'split the Uber?'", category: 'friends' },
    { text: "Memories are priceless. Roaming charges are not.", category: 'travel' },
    { text: "Nobody talks about the post-trip depression of opening your bank app.", category: 'money' },
    { text: "The souvenirs you actually take home: receipts and regrets.", category: 'travel' },
    { text: "All inclusive just means all the spending is included.", category: 'money' },
    { text: "Jet lag hits the body. The hotel minibar hits your wallet.", category: 'money' },
    { text: "Beautiful destinations look better before you check the exchange rate.", category: 'travel' },
    { text: "A budget is what you have before you smell street food.", category: 'money' },
    { text: "Passport: check. Sunscreen: check. Denial of actual costs: check.", category: 'travel' },
    { text: "Travelling light means your luggage is light. Your card statement isn't.", category: 'travel' },
    { text: "Local currency makes everything feel cheaper until it doesn't.", category: 'money' },
    { text: "Every landmark is free — the 47 coffees you had to survive it are not.", category: 'travel' },
    { text: "Packing anxiety: will I need this? Spending anxiety: did I need that?", category: 'travel' },
    { text: "The best group trips have three things: memories, laughs, and a spreadsheet.", category: 'friends' },
    { text: "WhatsApp group named 'GOA 2025🌴🔥' will outlive the actual trip by years.", category: 'friends' },
    { text: "Planning a trip: 2 hours. Actually booking it: 3 weeks of overthinking.", category: 'travel' },
    { text: "Airport food: when you pay ₹400 for a samosa without flinching.", category: 'money' },
    { text: "The real five-star experience is arriving home with exact change.", category: 'money' },
    { text: "Cheap flights don't exist — just expensive cab rides to remote airports.", category: 'money' },
    { text: "Nobody budgets for 'random midnight snack run at a dhaba'.", category: 'friends' },
    { text: "\"It was on my card\" is the beginning of every great friendship dispute.", category: 'friends' },
    { text: "The person who books the Airbnb holds all the power. Choose them wisely.", category: 'friends' },
    { text: "Splitting bills fairly: the true measure of a friendship.", category: 'friends' },
    { text: "You didn't travel to find yourself. You travelled and now can't afford yourself.", category: 'money' },
    { text: "The Himalayas are majestic. The mule ride surcharge is not.", category: 'travel' },
    // More sarcastic
    { text: "Hotel 'complimentary breakfast' is just them redistributing what you spent at the bar.", category: 'money' },
    { text: "Trip planning be like: estimated ₹5K. Actual: ₹17K. Crying: free.", category: 'money' },
    { text: "Nothing bonds people like figuring out who owes whom ₹237 at 2am.", category: 'friends' },
    { text: "On every trip there's that one person who only orders water. They still owe money somehow.", category: 'friends' },
    { text: "Itinerary said beach relaxation. Reality said we walked 18km with no map.", category: 'travel' },
    { text: "The only thing that travels as fast as you is your money — going out.", category: 'money' },
    { text: "Five-star dreams, two-star budget, zero regrets (lies).", category: 'money' },
    { text: "Phone dies at the best view. Wallet dies at the best restaurant. Same energy.", category: 'travel' },
    { text: "Travel tip: always carry more money than you think. It won't be enough.", category: 'money' },
    { text: "Spontaneous trips are just planned overspending with less warning.", category: 'money' },
    { text: "Every taxi driver in every city knows a 'shortcut' that costs extra.", category: 'travel' },
    { text: "Travelling for the culture. Paying for the wifi password.", category: 'travel' },
    { text: "The best part of any trip is the 'we should do this again' on the way home that never happens.", category: 'friends' },
    { text: "Hostels: cheaper than hotels, richer in stories, zero ankle space.", category: 'travel' },
    { text: "Group dinner: 7 people, 1 bill, 40 minutes of phone calculator drama.", category: 'friends' },
    { text: "Real talk: nobody checks in at the same time on a 'group trip'.", category: 'friends' },
    { text: "Maps say 10 mins walk. Your feet say that was a lie.", category: 'travel' },
    { text: "Booking 'budget accommodation': you WILL touch a stranger's suitcase.", category: 'travel' },
    { text: "The only thing free at a resort is the sun. And they'd charge for that if they could.", category: 'money' },
    { text: "Post-trip laundry pile is proportional to how much fun was had.", category: 'travel' },
    { text: "Your body goes home. Your credit card damage arrives 30 days later.", category: 'money' },
    { text: "We should all travel more said no bank account ever.", category: 'money' },
    { text: "Packing 'just in case' items costs more luggage fees than just buying it there.", category: 'travel' },
    { text: "Somewhere between 'let's be budget conscious' and the third cocktail everything went wrong.", category: 'money' },
    { text: "WiFi password obtained. The real tourism can begin.", category: 'travel' },
    { text: "Best travel souvenir: the story about the one thing that went terribly wrong.", category: 'travel' },
    { text: "There are no problems at the beach. There are only problems when you get back and see the bill.", category: 'money' },
    { text: "Group chat about the trip: 400 messages. Actual planning: 3.", category: 'friends' },
    { text: "Someone always gets food poisoning. It's the trip's tradition.", category: 'friends' },
    { text: "Whoever said money can't buy happiness never paid for a window seat.", category: 'money' },
    { text: "The trip photos look amazing. The debt also looks amazing.", category: 'money' },
    { text: "The most dangerous phrase on any trip: 'Let's just see how much it is first'.", category: 'money' },
    { text: "Visiting a local market: ₹200. Everything you impulsively bought: ₹2,000.", category: 'money' },
    { text: "Real tourism is waiting in a queue for something that closes before you get there.", category: 'travel' },
    { text: "Every trip has a 'scenic route' that adds 2 hours and ₹500.", category: 'travel' },
    { text: "Your travel influencer friend spent the whole trip filming. You carried the bag. Fair.", category: 'friends' },
    { text: "Travelling with a morning person when you're not: civilizational conflict.", category: 'friends' },
    { text: "The friend who packs minimally judges everyone who checked in baggage. Always.", category: 'friends' },
    { text: "Rain on the first day: builds character, apparently.", category: 'travel' },
    // Settled quotes
    { text: "Debts cleared. Friendships tested. Memories made. 10/10 would do again.", category: 'settled' },
    { text: "All settled. The group chat lives on longer than any of us expected.", category: 'settled' },
    { text: "Perfectly balanced — as all trips should be. Eventually.", category: 'settled' },
    { text: "Zero debts. The trip is officially in the history books.", category: 'settled' },
    { text: "Settled up. The spreadsheet can finally rest in peace.", category: 'settled' },
    { text: "Nobody owes anyone anything. A rare and beautiful moment.", category: 'settled' },
    { text: "All square. The friendship survived the finances. Remarkable.", category: 'settled' },
    // More general
    { text: "Life is short. The airport queue is long.", category: 'travel' },
    { text: "Nothing humbles you like converting currency in your head wrong.", category: 'money' },
    { text: "Peak travel experience: realising you forgot your charger after boarding.", category: 'travel' },
    { text: "Group trips are just a trust exercise with receipts.", category: 'friends' },
    { text: "Budgeting for a trip: an act of pure fiction.", category: 'money' },
    { text: "The correct amount of luggage is always one bag too many.", category: 'travel' },
    { text: "Someone always sleeps through the alarm on checkout day.", category: 'friends' },
    { text: "Travel teaches you about the world. Group trips teach you about people.", category: 'friends' },
    { text: "You packed light. Then bought things. Now you're the opposite of packed light.", category: 'travel' },
    { text: "Sunsets are free. Everything leading up to the sunset wasn't.", category: 'travel' },
    { text: "The Insta story looked effortless. It took 45 minutes and 12 people opinions.", category: 'travel' },
    { text: "Going off the beaten path means different things. One is expensive.", category: 'travel' },
    { text: "No trip ever went exactly to plan. That's the plan.", category: 'travel' },
    { text: "Friends who split bills honestly are worth keeping for life.", category: 'friends' },
    { text: "The journey of a thousand miles begins with a single 'who's booking the cab?'", category: 'friends' },
    { text: "A group trip without drama is just called 'going alone'.", category: 'friends' },
    { text: "Some people travel to find themselves. Others travel and lose their wallets instead.", category: 'money' },
    { text: "The 'one last drink' before heading back always costs the most.", category: 'money' },
    { text: "Every good trip has one meal that was outrageously good and outrageously priced.", category: 'money' },
    { text: "Travelling with family: free accommodation, priceless therapy later.", category: 'friends' },
    { text: "The minibar is not the enemy. The minibar is you. You are always the minibar.", category: 'money' },
    { text: "Weather app said sunny. Nature said 'lol, no'.", category: 'travel' },
    { text: "That moment when your hotel looks exactly like the photos — plot twist incoming.", category: 'travel' },
    { text: "Tour guides speak slowly. Your credit card runs fast.", category: 'money' },
    { text: "Trip's over. The photos will be posted for months. The debt, slightly longer.", category: 'money' },
    { text: "Rule of travel: if it has a view, it costs extra.", category: 'travel' },
    { text: "Cab share or private? Eternal moral question of every group trip.", category: 'friends' },
    { text: "The Airbnb had character. Character means 'things that don't quite work'.", category: 'travel' },
    { text: "'It's just ₹100 more for the better seat' is how it starts.", category: 'money' },
    { text: "Being the trip treasurer builds financial skills and ruins friendships equally.", category: 'friends' },
    { text: "Every trip ends with 'we should do this again'. One in ten trips actually repeats.", category: 'friends' },
    { text: "Spending money on experiences, not things — but the experiences have entry fees.", category: 'money' },
    { text: "The group photo takes longer than the actual landmark visit.", category: 'friends' },
    { text: "You can't put a price on memories. Accommodation, however, has a very clear price.", category: 'money' },
    { text: "Late checkout fees: the universe telling you the trip isn't over yet.", category: 'money' },
    { text: "Packing: the art of bringing everything you won't need.", category: 'travel' },
    { text: "Every city you visit in India has a 'local special dish' that's the same thing with a different name.", category: 'travel' },
    { text: "The trip group photo where everyone looks good doesn't exist. Accept it.", category: 'friends' },
    { text: "Budget planning meeting lasted 2 hours. Was ignored within the first day.", category: 'money' },
    { text: "Real luxury: a trip where no one fights over the aux cable.", category: 'friends' },
    { text: "Every road trip needs: great music, great company, and zero road construction.", category: 'travel' },
    { text: "The hotel gym was used exactly once (for a photo).", category: 'travel' },
    { text: "Splurging on one good meal per trip is not optional. It's therapy.", category: 'money' },
    { text: "All debts and all tans eventually fade. The photos remain.", category: 'settled' },
    { text: "Money spent on travel never feels wasted — until you check your account on Monday.", category: 'money' },
    { text: "Good trips are measured in laughter, not itinerary checkboxes.", category: 'travel' },
    { text: "The best trips are the ones where nobody checks the time.", category: 'travel' },
    { text: "It wasn't in the budget. It was in the heart.", category: 'money' },
];

const SHUFFLE_KEY = 'tripkhata_quote_order';
const IDX_KEY = 'tripkhata_quote_idx';

function getShuffledOrder(length: number): number[] {
    // Fisher-Yates shuffle
    const arr = Array.from({ length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function getOrCreateOrder(): number[] {
    try {
        const stored = sessionStorage.getItem(SHUFFLE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (_) { /* ignore */ }
    const order = getShuffledOrder(ALL_QUOTES.length);
    try { sessionStorage.setItem(SHUFFLE_KEY, JSON.stringify(order)); } catch (_) { /* ignore */ }
    return order;
}

/** Returns the next quote — never repeats until all 150+ exhausted, then reshuffles */
export function getNextQuote(category?: Quote['category']): Quote {
    const pool = category
        ? ALL_QUOTES.map((q, i) => ({ q, i })).filter(({ q }) => q.category === category)
        : ALL_QUOTES.map((q, i) => ({ q, i }));

    const order = getOrCreateOrder();
    let idx = 0;
    try { idx = parseInt(sessionStorage.getItem(IDX_KEY) || '0', 10); } catch (_) { /* ignore */ }

    // Find the next index in order that belongs to the requested category pool
    let found: Quote | null = null;
    let checked = 0;
    while (checked < order.length) {
        const quoteIdx = order[(idx + checked) % order.length];
        const candidate = pool.find(p => p.i === quoteIdx);
        if (candidate) {
            found = candidate.q;
            try { sessionStorage.setItem(IDX_KEY, String((idx + checked + 1) % order.length)); } catch (_) { /* ignore */ }
            break;
        }
        checked++;
    }

    // Reset if exhausted
    if (!found) {
        const newOrder = getShuffledOrder(ALL_QUOTES.length);
        try {
            sessionStorage.setItem(SHUFFLE_KEY, JSON.stringify(newOrder));
            sessionStorage.setItem(IDX_KEY, '0');
        } catch (_) { /* ignore */ }
        found = category ? ALL_QUOTES.filter(q => q.category === category)[0] : ALL_QUOTES[0];
    }

    return found!;
}

/** Get a random quote immediately (for static use) */
export function getRandomQuote(category?: Quote['category']): Quote {
    const pool = category ? ALL_QUOTES.filter(q => q.category === category) : ALL_QUOTES;
    return pool[Math.floor(Math.random() * pool.length)];
}
