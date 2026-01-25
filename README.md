# 🌍 SplitWay - Zero Drama Trip Expense Splitter

**The modern way to travel with friends. Real-time splits. AI Suggestions. Zero drama.**

🔗 **Live App**: [https://splitway.netlify.app](https://splitway.netlify.app)

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_BADGE_ID/deploy-status)](https://app.netlify.com/sites/splitway/deploys)

---

## ✨ Features

### 💸 Smart Expense Tracking
- **Real-time Updates** - Everyone sees changes instantly, no refresh needed
- **Equal & Unequal Splits** - Split equally or customize exact amounts
- **Multiple Categories** - Food, Drinks, Transport, Hotels, Shopping & more
- **Rich Analytics** - Visualize spending patterns with charts
- **PDF Export** - Download complete trip report with all expenses

### 🤖 AI-Powered Insights
- **Smart Suggestions** - AI analyzes your expenses and suggests optimizations
- **Budget Tracking** - Get alerts when spending exceeds expectations
- **Expense Categorization** - Automatic smart categorization

### 👥 Team Management
- **6-Digit Room IDs** - Easy sharing with friends
- **Admin Controls** - Trip creator has full control (delete members, expenses)
- **Member Permissions** - Each member can add/edit their own expenses
- **Secure PIN Protection** - Optional 4-digit admin PIN

### 🔄 Real-Time Synchronization
- **Live Updates** - Changes sync across all devices instantly
- **Offline Support** - Works without internet, syncs when back online
- **Optimistic UI** - Changes appear immediately for smooth UX

### 📱 Progressive Web App (PWA)
- **Install to Home Screen** - Works like a native app
- **Offline Capable** - Access your trips anytime
- **Fast & Reliable** - Instant loading with service workers

---

## 🚀 Quick Start

### For Your Next Trip

1. **Visit** → [https://splitway.netlify.app](https://splitway.netlify.app)
2. **Click** → "Plan New Trip"
3. **Add** → Trip details, dates, and squad members
4. **Share** → 6-digit Room ID with friends
5. **Track** → Add expenses as you spend
6. **Settle** → See who owes whom at the end

### Install as Mobile App

#### On iPhone/iOS:
1. Open [https://splitway.netlify.app](https://splitway.netlify.app) in **Safari**
2. Tap the **Share** button (□↑)
3. Scroll and tap **"Add to Home Screen"**
4. Tap **"Add"**

#### On Android:
1. Open [https://splitway.netlify.app](https://splitway.netlify.app) in **Chrome**
2. Tap the **three dots** (⋮) menu
3. Tap **"Add to Home Screen"**
4. Tap **"Add"**

---

## 📖 How to Use

### Creating a Trip (Trip Creator)

1. **Enter Your Name**
   - Start by identifying yourself
   
2. **Trip Details**
   - Trip name (e.g., "Goa Road Trip 2026")
   - Destination
   - Start & End dates
   
3. **Add Your Squad**
   - Add friends who'll join the trip
   - Up to 20 members supported
   - Skip members joining later (they can join via Room ID)
   
4. **Optional: Set Admin PIN**
   - 4-digit PIN for extra security
   - Required when deleting members/expenses
   
5. **Get Room ID**
   - Share the 6-digit code with friends
   - They use it to join your trip

### Joining a Trip (Members)

1. **Click "Join Existing"**
2. **Enter 6-Digit Room ID**
   - Get this from your trip organizer
3. **Select Your Name**
   - If pre-added by creator, claim your profile
   - Or enter new name to join
4. **Start Adding Expenses!**

### Adding Expenses

1. **Click "+" Button** in expenses tab
2. **Fill Details**:
   - Description (e.g., "Dinner at Beach Shack")
   - Amount (₹)
   - Category (Food, Transport, etc.)
   - **Who Paid?** (Required - select the person)
   - **Who Owes?** (Select participants)
   
3. **Split Options**:
   - **Equal Split**: Divide equally among selected participants
   - **Exact Split**: Specify custom amount for each person
   
4. **Submit** - Syncs instantly across all devices!

### Viewing Settlements

1. **Go to Summary Tab**
2. **See Your Balance**:
   - 🟢 Positive = You'll get money back
   - 🔴 Negative = You owe money
3. **Settlement List**:
   - Clear breakdown of who owes whom
   - Optimal payment suggestions
   
4. **Download PDF Report**:
   - Click green **"Download Report"** button (top-right)
   - Get complete expense breakdown

### Admin Powers (Trip Creator)

As the trip creator, you have special powers:

- ✅ **Delete Any Expense** - Remove incorrect entries
- ✅ **Delete Members** - Remove people who didn't join
- ✅ **View All Details** - Full visibility
- ✅ **Admin PIN Protection** - Secure critical actions

### AI Insights (Experimental)

1. **Go to Insights Tab**
2. **Click "Get AI Suggestions"**
3. **View Smart Analysis**:
   - Spending patterns
   - Budget optimization tips
   - Category-wise breakdown
   - Savings recommendations

---

## 🎯 Key Features Explained

### Real-Time Updates
When **anyone** adds/edits/deletes an expense, **everyone's** app updates automatically. No refresh needed. Uses Supabase real-time subscriptions.

### Optimistic UI
Changes appear instantly on your screen while saving in the background. Feels super fast even on slow networks.

### Smart Validation
- ✅ Can't submit without selecting who paid
- ✅ Can't add duplicate member names
- ✅ Date logic validation (end >= start)
- ✅ Character limits prevent crashes
- ✅ Amount validation (must be > 0)

### Security Features
- 🔐 Optional Admin PIN
- 🔒 Secure API endpoints
- 🛡️ Input sanitization
- 📱 HTTPS enforced

### Offline Support
- Works without internet
- Syncs when connection restored
- Service worker caching

---

## 💡 Pro Tips

1. **Add Expenses Daily** - Don't wait till the end of trip
2. **Use Categories** - Makes analytics more useful
3. **Equal Split by Default** - Faster for most expenses
4. **Download PDF** - Keep record after trip ends
5. **Share Room ID Early** - Let friends join before trip starts

---

## 🛠️ Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS + Custom CSS
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Subscriptions
- **AI**: Groq (Llama 3.3 70B)
- **Hosting**: Netlify
- **PWA**: Workbox + Vite PWA Plugin

---

## 📊 Analytics & Insights

### Dashboard Stats
- Total Expenses
- Your Net Balance
- Category Breakdown
- Top Spenders
- Daily Spending Trends

### Visualizations
- Pie charts for category distribution
- Bar graphs for member contributions
- Timeline view of expenses

---

## 🔒 Privacy & Data

- All trip data stored securely in Supabase
- No personal information required (just names)
- Trip IDs are random 6-digit codes
- Optional PIN protection for extra security
- No tracking or analytics cookies

---

## 🐛 Troubleshooting

### App Not Loading?
- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear browser cache
- Try incognito/private mode

### Changes Not Syncing?
- Check internet connection
- Refresh the page
- Check if others can see their changes

### Can't Find PDF Button?
- Look for green **"Download Report"** button at top-right
- Only visible when viewing an active trip

### Forgot Room ID?
- Check with trip creator
- It's shown at the top of active trip screen

---

## 📱 Supported Platforms

- ✅ Chrome (Desktop & Mobile)
- ✅ Safari (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Edge (Desktop & Mobile)
- ✅ iOS (Safari + PWA)
- ✅ Android (Chrome + PWA)

---

## 🤝 Contributing

This is a personal project, but if you find bugs or have suggestions:
1. Use the app and report issues
2. Share feedback on UX improvements
3. Suggest new features

---

## 📄 License & Copyright

**© 2026 SplitWay. All Rights Reserved.**

This project is proprietary software. Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited without explicit written permission from the copyright holder.

For licensing inquiries or permissions, please contact the project maintainer.

---

## 🌟 Acknowledgments

Built with ❤️ for hassle-free group travel.

Special thanks to:
- Supabase for awesome real-time database
- Groq for lightning-fast AI inference  
- Netlify for seamless deployment
- The open-source community

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check the troubleshooting section above
- Contact: [Your Contact Info]

---

## 🎉 Ready to Split?

**Start your next trip with zero expense drama!**

👉 **[Launch SplitWay Now](https://splitway.netlify.app)** 👈

---

**Made with 🚀 by [Your Name/Team]**

*Last Updated: January 2026*
