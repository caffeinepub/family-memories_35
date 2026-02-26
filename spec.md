# Specification

## Summary
**Goal:** Rename the app to "Heavenuse" and add group chat with photo/video sharing and member name display to the existing family memories app.

**Planned changes:**
- Rename the app to "Heavenuse" across all user-facing text, page titles, HTML title tag, landing page hero, and app header
- Add a backend data model and API for group chat messages (sendMessage, getMessages, deleteMessage) with fields for sender principal, sender display name, text, optional media URL, media type, and timestamp
- Build a Group Chat page in the main navigation showing a WhatsApp-style scrollable message thread with right/left aligned bubbles, sender display names, timestamps, and inline image/video rendering; media is shared via URL input
- Add a photo and video gallery tab/section within each family group view, showing a grid of all media messages with sender name and timestamp
- Display all group members' display names on the Family Group page, in the chat header, and in each message bubble; fall back to truncated principal ID if display name is unavailable
- Use polling (React Query refetchInterval) to simulate live chat updates

**User-visible outcome:** Users can open the renamed "Heavenuse" app, join a family group chat, send text and media (by URL), see all members' names in the chat and group page, and browse a gallery of all shared photos and videos.
