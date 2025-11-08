# MidSet Coach - Implementation Plan

## Overview

MidSet Coach extends SlippiLabs with AI-powered game review and live coaching capabilities using OpenAI APIs. The system enables players to review their gameplay with AI-guided Socratic questioning and receive real-time coaching during matches.

## Core Features

### 1. AI-Assisted Game Review
- Attach structured review notes to each replay file
- Optional Socratic review mode where ChatGPT guides players through reflection
- Four structured fields: What went well, What went wrong, Key learnings, Matchup notes
- All data stored locally (IndexedDB)

### 2. Coach Mode
- New sidebar navigation route
- Pre-game phase: Select matchup, load relevant review context, chat with AI to prepare gameplan
- Live session phase: Voice-enabled Realtime API session during gameplay
- Context-aware: Load last X games (default 10, user configurable) of the selected matchup
- Post-game: Load replay into SlippiLabs and repeat the cycle (review → coach)

## Architecture Decisions

### Data Storage
- **Local-first approach**: All data stored client-side
- **IndexedDB** for review notes (structured data, better than localStorage)
- **localStorage** for OpenAI API key and user preferences
- No backend required

### API Integration
- **Client-side API calls**: User provides their own OpenAI API key
- **Chat API** for Socratic review and pre-game coaching
- **Realtime API** for live voice coaching during gameplay
- Context handoff: Pre-game chat summarized and sent to Realtime session

### Review Notes Data Model
```typescript
interface ReviewNote {
  id: string; // unique ID tied to replay file
  replayFileName: string;
  replayMetadata: {
    playerCharacter: number; // character ID
    opponentCharacter: number;
    stage: number;
    date: Date;
  };
  review: {
    whatWentWell: string;
    whatWentWrong: string;
    keyLearnings: string;
    matchupNotes: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isAiGenerated: boolean;
}
```

### IndexedDB Schema
```typescript
Database: "midset-coach-db"
Store: "review-notes"
  - keyPath: "id"
  - indexes:
    - "replayFileName" (non-unique)
    - "playerCharacter" (non-unique)
    - "opponentCharacter" (non-unique)
    - "date" (non-unique)
    - Compound index: ["playerCharacter", "opponentCharacter", "date"]
```

## UI/UX Design

### Review Notes Integration (Replays Panel)

**Replay List Enhancements:**
- Review status indicators:
  - ✓ = Has review notes
  - AI icon = AI-assisted review
  - Empty = No review yet
- Expandable view to show review notes inline
- "Add Review" button for replays without notes

**Review Notes Display:**
- Structured fields displayed when replay expanded
- Action buttons: Edit, AI Review, Delete
- Post-game prompt: "Would you like to review this game?" (manual or AI-assisted)

**AI Socratic Review Dialog:**
- Modal dialog with chat-style interface
- Guides user through each review field with follow-up questions
- Progress indicator (1/4, 2/4, etc.)
- AI generates summary for each field → user approves/edits
- "Skip AI, enter manually" option available
- Token usage indicator

### Coach Mode UI

**Navigation:**
- New "Coach" icon in sidebar navigation (between Inputs and Settings)
- Updates navigationStore Sidebar type to include "coach"

**Pre-Game Setup State:**
```
┌─────────────────────────────────┐
│ Matchup Selector                │
│ [Your Character ▼] vs [Opp ▼]  │
│                                 │
│ Context Controls                │
│ Load last [10] games            │
│ "Loaded 15 reviews from your    │
│  last 10 Fox vs Marth games"    │
│                                 │
│ Chat Interface                  │
│ ┌─────────────────────────────┐ │
│ │ Message history...          │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ [Type your message...]          │
│                                 │
│ [Start Live Session]            │
└─────────────────────────────────┘
```

**Live Session State:**
```
┌─────────────────────────────────┐
│ 🔴 Live Session Active          │
│                                 │
│ [Audio Visualizer]              │
│                                 │
│ Transcript Display              │
│ ┌─────────────────────────────┐ │
│ │ User: "I keep getting grabbed"│
│ │ Coach: "Try varying your...  │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Hold Space to Talk]            │
│                                 │
│ [End Live Session]              │
└─────────────────────────────────┘
```

### Settings Dialog Enhancements
- OpenAI API key field (with security warning)
- Model selection (gpt-4-turbo, gpt-3.5-turbo)
- Realtime API voice selection (alloy, echo, fable, etc.)
- API key validation on save

## State Management

### New State Stores

**`reviewNotesStore.tsx`**
```typescript
// Signals
reviewNotes(): Map<string, ReviewNote>
loadReviewNotes(): Promise<void>
getReviewNote(replayId: string): ReviewNote | undefined
saveReviewNote(note: ReviewNote): Promise<void>
deleteReviewNote(replayId: string): Promise<void>
getMatchupReviews(char1: number, char2: number, limit: number): ReviewNote[]
```

**`coachStore.tsx`**
```typescript
// Signals
matchup(): {player: number, opponent: number}
contextGameCount(): number // default: 10
loadedContext(): ReviewNote[]
chatHistory(): ChatMessage[]
isLiveSession(): boolean
realtimeConnection(): WebSocket | null

// Actions
setMatchup(player: number, opponent: number): void
setContextGameCount(count: number): void
addChatMessage(message: ChatMessage): void
startLiveSession(): Promise<void>
endLiveSession(): void
```

**`aiStore.tsx`**
```typescript
// Signals
apiKey(): string
preferredModel(): string
preferredVoice(): string

// Functions
sendChatMessage(messages: ChatMessage[]): Promise<ReadableStream>
startRealtimeSession(initialContext: string): Promise<WebSocket>
endRealtimeSession(): void
validateApiKey(key: string): Promise<boolean>
```

## Data Flows

### Flow 1: AI-Assisted Review
1. User loads replay → fileStore updates
2. Post-load prompt appears → user clicks "AI Review"
3. AIReviewDialog opens → initializes Chat API with replay metadata
4. User completes Socratic review → generates structured ReviewNote
5. Save to IndexedDB via reviewNotesStore.saveReviewNote()
6. Replay list updates to show review indicator

### Flow 2: Coach Mode Session
1. User selects Coach in nav → navigationStore.setSidebar("coach")
2. Select matchup → coachStore.setMatchup()
3. Query reviews → reviewNotesStore.getMatchupReviews() → updates coachStore.loadedContext()
4. User chats with AI → messages stored in coachStore.chatHistory()
5. "Start Live Session" → aiStore.startRealtimeSession() with context summary
6. Live session active → coachStore.isLiveSession(true)
7. Voice interaction via WebSocket (push-to-talk with Space key)
8. "End Session" → close WebSocket, return to pre-game state
9. Load replay file → return to review flow

### Flow 3: Context Loading
1. User changes matchup OR context count
2. Query IndexedDB: filter by character matchup, sort by date DESC, limit by contextGameCount
3. Format review notes into AI context string
4. Update coachStore.loadedContext()
5. Display summary: "Loaded X reviews from your last Y games"
6. If chat in progress: warn user that context has changed

## Implementation Phases

### Phase 1: Foundation (Review Notes)
1. Create IndexedDB schema and `reviewNotesStore.tsx`
2. Add API key management to Settings dialog
3. Create `aiStore.tsx` with basic Chat API integration
4. Update `Replays.tsx` to show review status indicators

**Files to create:**
- `src/state/reviewNotesStore.tsx`
- `src/state/aiStore.tsx`
- `src/common/indexedDB.ts` (helper utilities)

**Files to modify:**
- `src/components/panels/SettingsDialog.tsx`
- `src/components/panels/Replays.tsx`

### Phase 2: Manual & AI Review
5. Build review notes UI (expand/collapse in Replays panel)
6. Implement manual note editing
7. Create `AIReviewDialog.tsx` with Socratic review flow
8. Add post-game review prompt

**Files to create:**
- `src/components/panels/ReviewNotesSection.tsx`
- `src/components/panels/AIReviewDialog.tsx`
- `src/components/common/ChatInterface.tsx`

**Files to modify:**
- `src/components/panels/Replays.tsx`
- `src/state/fileStore.tsx` (add post-load hook)

### Phase 3: Coach Mode - Pre-Game
9. Add Coach navigation item and `CoachPanel.tsx`
10. Build matchup selector and context controls
11. Create `coachStore.tsx` and context loading logic
12. Implement pre-game chat interface (Chat API)

**Files to create:**
- `src/components/panels/CoachPanel.tsx`
- `src/components/coach/MatchupSelector.tsx`
- `src/components/coach/ContextControls.tsx`
- `src/components/coach/PreGameChat.tsx`
- `src/state/coachStore.tsx`

**Files to modify:**
- `src/components/panels/Navigation.tsx`
- `src/components/panels/Sidebar.tsx`
- `src/state/navigationStore.tsx`
- `src/components/common/icons.tsx` (add coach icon)

### Phase 4: Coach Mode - Live Session
13. Implement Realtime API WebSocket connection
14. Build live session UI (audio visualizer, transcript, push-to-talk)
15. Add context handoff (summary generation)
16. Implement session start/end flow

**Files to create:**
- `src/components/coach/LiveSession.tsx`
- `src/components/coach/AudioVisualizer.tsx`
- `src/components/coach/PushToTalkButton.tsx`
- `src/common/realtimeAPI.ts` (WebSocket utilities)

**Files to modify:**
- `src/components/panels/CoachPanel.tsx`
- `src/state/coachStore.tsx`
- `src/state/aiStore.tsx`

### Phase 5: Polish
17. Error handling and edge cases
18. Performance optimizations
19. UI/UX refinements
20. Testing and bug fixes

## Technical Considerations

### OpenAI API Integration

**Chat API (Pre-Game & Review)**
- Endpoint: `https://api.openai.com/v1/chat/completions`
- Model: `gpt-4-turbo` or `gpt-3.5-turbo` (user configurable)
- Streaming responses for better UX
- System prompts:
  - Socratic Review: "Guide player through reflection on their gameplay"
  - Coach Mode: "You are a Super Smash Bros. Melee coach" + loaded review context

**Realtime API (Live Session)**
- Endpoint: WebSocket to `wss://api.openai.com/v1/realtime`
- Model: `gpt-4o-realtime-preview`
- Voice: User selectable (alloy, echo, fable, etc.)
- Session initialization:
  1. Generate ephemeral token using Chat API
  2. Connect WebSocket with token
  3. Send initial context as system message (summary from pre-game chat)
  4. Configure voice settings, turn detection (push-to-talk mode)

### Performance Optimizations
- Lazy load review notes (don't load all on app startup)
- Virtual scrolling for replay list (already using `@tanstack/solid-virtual`)
- Debounce context count changes to avoid excessive queries
- Cache loaded context until matchup/count changes
- Stream Chat API responses (don't wait for full completion)

### Token Management
- Estimate tokens before API calls (rough: 1 token ≈ 4 characters)
- Warn user if context + chat history approaches model limits
- For Realtime API: keep live session context minimal
- Truncate old messages if conversation gets too long

### Browser Compatibility
- IndexedDB: Supported in all modern browsers
- WebSocket: Universal support
- Web Audio API: Check Safari quirks for Realtime API voice
- Microphone permissions: Handle gracefully with clear instructions

## Edge Cases & Error Handling

### Review Notes
- **No replay metadata**: Allow review creation but disable matchup filtering
- **Duplicate replay files**: Use file hash or timestamp to differentiate
- **Corrupted IndexedDB**: Graceful fallback, offer to reset database
- **Large review notes**: Warn if note exceeds reasonable size

### API Integration
- **Invalid API key**: Validate on save, show clear error message
- **Rate limiting**: Detect 429 errors, show cooldown message with retry timer
- **Network timeout**: Retry logic with exponential backoff
- **Quota exceeded**: Clear error message, disable AI features gracefully
- **Model deprecation**: Allow model selection in settings for future-proofing

### Coach Mode
- **No reviews for matchup**: "No reviews found. Play some games and review them first!"
- **Context too large**: Auto-truncate oldest reviews, show warning
- **Matchup changed mid-chat**: Warn user, offer to restart with new context
- **WebSocket disconnect**: Auto-reconnect attempt, fallback to "Session Ended" state

### Realtime API
- **Microphone permission denied**: Clear instructions to enable
- **Audio playback fails**: Fallback message, check browser compatibility
- **Push-to-talk while AI speaking**: Queue user input or interrupt AI
- **Session timeout**: Handle gracefully, show "Session expired" message

### General
- **localStorage full**: Handle quota exceeded errors
- **Offline mode**: Disable AI features, manual review still works
- **Browser compatibility**: Feature detection for required APIs

## Testing Strategy

### Unit Tests
- reviewNotesStore - IndexedDB CRUD operations
- Context query logic (matchup filtering, sorting, limiting)
- Review note data validation
- API request/response formatting

### Integration Tests
- Full review flow: create → edit → delete
- Coach mode context loading with different matchup selections
- API key validation and error handling
- WebSocket connection lifecycle

### Manual Testing Scenarios
- OpenAI API calls with real key
- Voice interaction quality during live sessions
- Performance with 100+ review notes
- Offline behavior and error states

## Security Considerations
- API key stored in localStorage with clear warning: "Store securely, never share"
- All API calls from client-side (no backend)
- No review notes or personal data sent to any backend
- Option to clear API key from storage
- Consider encryption for API key in future enhancement

## Future Enhancements (Post-MVP)
- Export/import review notes (backup/restore)
- Cloud sync option (optional backend)
- Advanced analytics (win rate by matchup, common patterns)
- Video clip integration (link specific moments to review notes)
- Multiple AI provider support (Anthropic Claude, etc.)
- Voice training for better recognition of Melee terminology
- Tournament mode (special coaching features for bracket play)
- Shared coaching (coach can connect remotely)

## Success Metrics
- Review notes created per user
- AI review completion rate
- Coach mode usage frequency
- Live session duration and engagement
- User feedback on coaching quality
