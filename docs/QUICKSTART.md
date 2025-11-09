# MidSet Coach - Quick Start Guide

## 🎮 What is MidSet Coach?

MidSet Coach adds AI-powered game review and coaching to SlippiLabs. It helps you:
- Review your games with structured notes
- Get AI-guided reflection through Socratic questioning
- Prepare for matches with context from your past games
- Chat with an AI coach for strategy and tactics

## 🚀 Setup (5 minutes)

### 1. Get an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### 2. Configure SlippiLabs

1. Open SlippiLabs
2. Click the **Settings** icon (keyboard) in the bottom-left
3. Scroll to "AI Coach Configuration"
4. Paste your API key
5. Click "Save" (you should see ✓ API key saved successfully)
6. Select your preferred model (GPT-4 Turbo recommended)
7. Close settings

## 📝 How to Review a Game

### Manual Review

1. Open the **Local Replays** or **Cloud Replays** panel
2. Select a replay from your list
3. Click **"Add Review Notes"** below the filter
4. Fill in the four fields:
   - **What went well:** Positive moments, good decisions
   - **What went wrong:** Mistakes, bad habits
   - **Key learnings:** What you'll practice next time
   - **Matchup notes:** Character-specific insights
5. Click **"Save"**

✓ The replay will now show a checkmark (✓) in the list!

### AI-Assisted Review

1. Select a replay (must have review notes)
2. Click **"AI Review"** in the review section
3. Answer the AI coach's questions for each field
4. The AI will guide you through Socratic questioning
5. Review the AI-generated summary
6. Click "Next Section" to continue (1/4 → 2/4 → 3/4 → 4/4)
7. Click "Complete Review" when done

🤖 The replay will now show a robot (🤖) in the list!

## 🎯 How to Use Coach Mode

### Pre-Game Preparation

1. Click the **Coach** icon (microphone) in the left navigation
2. Select your matchup:
   - **Your Character:** Select who you're playing
   - **Opponent Character:** Select who you're facing
3. Set how many past games to load (default: 10)
4. Click **"Load Context & Start"**

The AI coach will:
- Load your past review notes for this matchup
- Analyze patterns from your previous games
- Greet you with context-aware insights

### Chatting with Your Coach

Ask questions like:
- "What should I focus on in this matchup?"
- "What mistakes have I been making?"
- "How should I approach neutral?"
- "What's my game plan for this set?"
- "How do I avoid getting grabbed so much?"

The coach will:
- Reference your past games
- Give specific tactical advice
- Help you build a mental game plan

## 🔧 Settings Explained

### AI Coach Configuration

**OpenAI API Key**
- Your personal key for accessing OpenAI's AI models
- Stored locally in your browser (not sent anywhere except OpenAI)
- ⚠️ Keep it secret! Don't share it with anyone

**Chat Model**
- **GPT-4 Turbo** (Recommended): Best quality, moderate cost
- **GPT-4**: Highest quality, higher cost
- **GPT-3.5 Turbo**: Faster and cheaper, lower quality

**Voice (for future live coaching)**
- Select your preferred voice for the Realtime API
- Not used yet (Phase 4 feature)

## 💡 Tips & Tricks

### For Reviews

1. **Review right after playing** while the game is fresh
2. **Be specific** in your notes (e.g., "Missed L-cancel on nair → got punished")
3. **Use AI review** when you're stuck or can't identify issues
4. **Focus on patterns** across multiple games

### For Coach Mode

1. **Load enough context** (10+ games) for better advice
2. **Be specific** with questions (e.g., "How do I edgeguard Marth?" not "Help me")
3. **Ask follow-ups** to dig deeper into strategy
4. **Review your notes** before asking for pre-game advice

### For API Usage

1. **Check your costs** at https://platform.openai.com/usage
2. **Use GPT-3.5 Turbo** if you're concerned about costs
3. **Don't spam** the AI - think before you ask
4. **Shorter questions** = lower costs

## ❓ Troubleshooting

### "Please set your OpenAI API key in Settings"

**Solution:** Go to Settings → Enter your API key → Click "Save"

### "✗ Invalid API key"

**Solutions:**
1. Check you copied the full key (starts with `sk-...`)
2. Make sure you created a new key (old keys may be invalid)
3. Verify your OpenAI account has credits

### Review notes not saving

**Solutions:**
1. Check browser's IndexedDB is enabled
2. Try in a different browser
3. Clear site data and try again (note: loses existing notes)

### AI responses are slow

**Normal:** Streaming can take 5-10 seconds for first response
**If very slow (>30 seconds):**
1. Check your internet connection
2. Try GPT-3.5 Turbo instead
3. OpenAI might be experiencing high load

### Can't load context in Coach Mode

**Solutions:**
1. Make sure you have review notes for the selected matchup
2. Try lowering the context count
3. Check different character combinations

## 🔒 Privacy & Security

### Your Data

- ✅ All review notes stored locally (browser IndexedDB)
- ✅ API key stored locally (browser localStorage)
- ✅ No data sent to any backend server
- ✅ Only you can access your notes

### What Gets Sent to OpenAI

- Your API key (to authenticate)
- Your chat messages (questions to the AI)
- Context from your review notes (when using Coach Mode)
- Nothing else!

### Best Practices

1. **Never share your API key** with anyone
2. **Don't put personal info** in review notes
3. **Review OpenAI's privacy policy** if concerned
4. **Clear site data** before using a public computer

## 📊 Feature Comparison

| Feature | Manual Review | AI Review | Coach Mode |
|---------|---------------|-----------|------------|
| Create notes | ✅ | ✅ | ✅ (loads notes) |
| Edit notes | ✅ | ✅ | - |
| Guided questions | - | ✅ | ✅ |
| Context from past games | - | - | ✅ |
| Real-time chat | - | - | ✅ |
| Requires API key | ❌ | ✅ | ✅ |
| Costs money | ❌ | ✅ | ✅ |

## 🎓 Example Workflow

### After a Tournament

1. Load all your tournament games into SlippiLabs
2. **Review each game manually** (quick notes)
3. **AI review** the most important games (e.g., your losses)
4. Look for patterns across your notes

### Before Your Next Session

1. Open **Coach Mode**
2. Select the matchup you're practicing
3. Load your last 10-20 games
4. Ask: "What should I work on in this matchup?"
5. Ask: "What are my bad habits?"
6. Build a focused practice plan

### During Practice

1. Play games
2. Immediately review after each one
3. Note specific things to improve
4. Repeat with focus on your notes

## 🌟 Advanced Usage

### Power User Tips

1. **Create templates** by copying similar notes
2. **Use keyboard shortcuts** to navigate quickly
3. **Review in batches** (e.g., all your Marth games)
4. **Track improvement** by comparing notes over time

### API Optimization

1. **Use shorter prompts** for lower costs
2. **Batch your questions** instead of one at a time
3. **Copy important responses** to notes (don't re-ask)
4. **Use manual review** when you don't need AI help

## 🚀 What's Next?

### Coming Soon (Phase 4)

- **Live voice coaching** during gameplay
- **Real-time audio** with push-to-talk
- **In-game transcript** of coaching advice

### Future Ideas

- Export/import review notes
- Cloud sync (optional)
- Analytics and win rate tracking
- Video clip integration
- Tournament mode

## 💬 Feedback & Support

For issues or feature requests:
1. Check this guide first
2. Review the implementation docs (`docs/IMPLEMENTATION.md`)
3. Open an issue on GitHub

---

**Enjoy your AI coaching! 🎮🤖**
