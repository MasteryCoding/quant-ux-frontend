# Removed Features - Quant-UX Frontend Simplification

This document tracks all features that have been removed from the Quant-UX frontend to create a simplified, maintainable version.

## Date: November 4, 2025

---

## 🗑️ Major Feature Removals

### 1. **Analytics & User Testing System** ✅
**Impact:** ~15-20% codebase reduction

**Deleted Components:**
- `src/canvas/analytic/` (entire directory - 10 files)
  - AnalyticCanvas.vue
  - AnalyticController.js
  - AnalyticHomeMenu.vue
  - AnalyticToolbar.vue
  - AnalyticToolbarRender.vue
  - AnalyticViewModeButton.vue
  - DataProcessing.vue
  - DropOff.vue
  - SessionList.vue
  - UserJourney.vue

- `src/views/apps/analytics/` (entire directory - 14 files)
  - AnalyticsHeader.vue
  - AnalyticsTab.vue
  - AnalyticTaskList.vue
  - DistributionSection.vue
  - DistributionTable.vue
  - HeatTab.vue
  - OutlierPlot.vue
  - ScatterPlot.vue
  - ScatterPlotDetails.vue
  - SurveyDialog.vue
  - SurveySection.vue
  - SurveyTable.vue
  - TaskCreateDialog.vue
  - TaskPerfGram.vue

- `src/views/apps/test/` (entire directory - 5 files)
  - TestSettings.vue
  - TestTab.vue
  - VideoAnnotation.vue
  - VideoPlayer.vue
  - VideoTab.vue

- `src/views/apps/XAnalyze.vue`
- `src/plugins/AnalyticPagePlugin.vue`

**Modified Files:**
- `src/router.js` - Removed analytics routes (`/apps/:id/analyze/workspace.html`, replay routes)
- `src/views/apps/Design.vue` - Removed analytics canvas/toolbar integration
- `src/views/apps/StudioOverview.vue` - Removed Test, Analytics, Heat, and Video tabs

---

### 2. **Third-Party Integrations** ✅
**Impact:** Reduced complexity, removed external API dependencies

**Deleted Services:**
- `src/services/FigmaService.js` - Figma design import
- `src/services/SketchService.js` - Sketch file import  
- `src/services/GitService.js` - Git export functionality
- `src/services/SwaggerService.js` - OpenAPI/Swagger import

**Deleted Components:**
- `src/canvas/toolbar/dialogs/ExportGit.vue`

**Modified Files:**
- `src/canvas/toolbar/dialogs/ImportDialog.vue` - Removed Figma/Swagger import tabs and logic
- `src/router.js` - Removed Figma test route

---

### 3. **Keycloak SSO Authentication** ✅
**Impact:** Simplified authentication to cookie-based system

**Deleted:**
- `src/services/KeyCloakService.js`

**Modified Files:**
- `src/services/Services.js` - Removed Keycloak import and simplified `getUserService()`
- `src/main.js` - Removed Keycloak initialization

**Removed Dependencies:**
- `keycloak-js` (npm package)

---

### 4. **Real-time Collaboration (WebSocket)** ✅
**Impact:** Eliminated WebSocket server dependency

**Deleted:**
- `src/canvas/Collab.vue` - Collaboration mixin
- `src/canvas/controller/CollabSession.js` - Session management
- `src/services/WebSocketService.js` - WebSocket client
- `src/canvas/toolbar/components/CollabUser.vue` - User avatars display

**Stubbed (no-op):**
- `src/canvas/controller/CollabService.js` - Kept as stub to avoid breaking BaseController

**Modified Files:**
- `src/canvas/Canvas.vue` - Removed Collab mixin
- `src/canvas/toolbar/Toolbar.vue` - Removed CollabUser component and methods
- `src/views/apps/Design.vue` - Removed CollabSession initialization
- `src/services/Services.js` - Removed WebSocket service method
- `src/canvas/controller/BaseController.js` - Stubbed collaboration methods

---

### 5. **Team Management** ✅
**Impact:** Removed multi-user team features

**Deleted:**
- `src/page/Team.vue`
- `src/page/TeamDialog.vue`
- `src/page/TeamMember.vue`

**Modified Files:**
- `src/views/apps/StudioOverview.vue` - Removed Team component and `findTeam()` calls
- `src/views/apps/SettingsTab.vue` - Removed Team tab and `resetTeam()` call

---

### 6. **Authentication Views & User Management** ✅
**Impact:** Removed all login/signup UI, simplified to cookie-based auth

**Deleted:**
- `src/views/LoginPage.vue`
- `src/views/LogoutPage.vue`
- `src/views/user/Account.vue`
- `src/views/user/ResetPassword.vue`

**Modified Files:**
- `src/router.js` - Removed routes: `my-account.html`, `logout.html`
- `src/views/QUX.vue` - Removed LoginPage component and guest login flow
- `src/services/UserService.js` - **Completely rewritten** with new authentication:
  - Removed: `signup()`, `login()`, `reset()`, `reset2()`
  - Added: `exchangeToken()` - Cookie-based token exchange
  - Simplified: `logout()` - Just clears cookies
  - Updated: `load()` - Now async, auto-calls token exchange

---

## 🔧 New Authentication System

### Cookie-Based Token Exchange

**Flow:**
1. External auth system sets `authorization` cookie
2. On app load, `UserService.load()` is called automatically
3. Calls `/rest/user/token-exchange` with cookie in Authorization header
4. Receives Quant-UX JWT token
5. Stores token in localStorage for API calls
6. Token auto-expires based on JWT expiration

**Implementation:**
```javascript
// In main.js
await Services.getUserService().load();

// UserService.js
async exchangeToken () {
    const authCookie = Cookies.get('authorization')
    const response = await fetch('/rest/user/token-exchange', {
        method: 'POST',
        headers: {
            'Authorization': authCookie,
            'Content-Type': 'application/json'
        },
        credentials: 'include'
    })
    // ... processes JWT response
}
```

---

## 📦 Removed npm Dependencies

- ❌ `keycloak-js` - Keycloak authentication
- ❌ `d3` - ~~Initially removed, then re-added (needed for canvas Lines)~~
- ❌ `umap-js` - Analytics clustering
- ⚠️ **Kept (still needed):**
  - `qrcode` - QR code generation for simulator
  - `jszip` - ZIP import/export
  - `d3` - Drawing connection lines in canvas

---

## 🧪 Disabled Unit Tests

The following test files have been disabled (stubbed with "DISABLED" messages):

- `src/unit/OutlierTest.vue` - Analytics outlier detection
- `src/unit/TaskPerfGramTest.vue` - Analytics task performance
- `src/unit/TaskCreateDialogTest.vue` - Analytics task creation
- `src/unit/WebSocketTest.vue` - WebSocket collaboration
- `src/unit/SketchTest.vue` - Sketch import
- `src/unit/FigmaTest.vue` - Figma import

**Routes still exist** in `router.js` (lines 101-227) but components are disabled.

---

## 🐳 Docker Build Improvements

**Updated `Dockerfile`:**
- Added Python 3, make, and g++ to builder stage for native module compilation
- Added symlink `python -> python3` for node-gyp compatibility
- Added `BUILD_DATE` arg for cache invalidation
- Multi-stage build keeps final image lightweight

```dockerfile
FROM node:16-alpine AS builder
# Install build dependencies for native modules (python3, make, g++)
USER root
RUN apk add --no-cache python3 make g++ && \
    ln -sf python3 /usr/bin/python
```

---

## 📊 Code Reduction Summary

**Files Deleted:** ~50+ files
- 10 analytics canvas components
- 14 analytics view components  
- 5 test/video components
- 4 third-party integration services
- 7 collaboration components
- 3 team management components
- 4 authentication views
- Various test files

**Files Modified:** ~15 files
- Router configuration
- Main app initialization
- Service layer
- Canvas and toolbar components
- View components

**Estimated Codebase Reduction:** 40-50%

---

## ✅ What Remains (Core Functionality)

- ✅ **Design Canvas** - Full prototyping functionality
- ✅ **Components & Widgets** - All UI elements
- ✅ **Simulator** - Prototype testing/preview
- ✅ **Comments** - Design feedback
- ✅ **Import/Export** - Images and ZIP files
- ✅ **Themes** - All design templates (175 JSON files)
- ✅ **Help System** - Documentation
- ✅ **Notifications** - User notifications
- ✅ **AI Features** - Still present (AIService, AISimService)

---

## 🔄 Migration Notes

### For Backend Integration

The backend needs to implement:

**Endpoint:** `POST /rest/user/token-exchange`

**Request Headers:**
```
Authorization: <value-from-authorization-cookie>
Content-Type: application/json
```

**Expected Response:**
```json
{
  "id": "user-id",
  "name": "User Name",
  "lastname": "Last Name",
  "email": "user@example.com",
  "role": "user",
  "token": "<jwt-token>",
  "image": "optional-profile-image.jpg",
  "lastlogin": 1234567890,
  "lastNotification": 1234567890,
  "tos": true,
  "paidUntil": 0,
  "plan": "Free"
}
```

The JWT token should include:
- Standard JWT claims (iss, sub, exp, iat)
- User identification
- Expiration time (used for auto-logout)

---

## ✅ Additional Removed Features

### Contact Form
- **Deleted Files:**
  - `src/views/apps/StudioContact.vue` - Contact form dialog
  - `src/canvas/toolbar/components/ContactButton.vue` - Contact button component
  - `src/help/en/contact.js` - Contact help documentation
- **Modified Files:**
  - `src/views/apps/Studio.vue` - Removed contact form UI
  - `src/services/UserService.js` - Removed `contact()` method
- **Reason:** Contact form relied on backend email infrastructure that was removed

### Updates/Notifications System
- **Deleted Files:**
  - `src/views/apps/StudioNotification.vue` - Notifications UI component
  - `src/services/NotificationService.js` - User journey notification service
- **Modified Files:**
  - `src/views/apps/Studio.vue` - Removed notifications UI
  - `src/services/Services.js` - Removed `getNotificationService()` method
- **Reason:** User journey notifications and updates were no longer needed

---

## 🚀 Next Steps (Optional Further Simplification)

If you want to reduce the codebase further, consider removing:

1. **AI Features** (AIService, AISimService, DesignGPT dialogs)
2. **Comments System** (CommentService, Comment components)
3. **Help System** (30+ help files)
5. **Themes** (Keep only 2-3 essential themes, remove 170+ others)
6. **Unit Test Routes** (30+ test pages in router)
7. **Examples** (HelloWorld.vue)
8. **Pricing/Plans** (Plan.vue, Pricing.vue)

---

## 🐛 Known Issues / TODOs

1. ⚠️ CSS chunk order warnings (cosmetic, doesn't break functionality)
2. ⚠️ Large bundle sizes in some chunks (could be optimized further)
3. ⚠️ Some analytics helper files in `src/dash/` may still exist
4. ⚠️ StudioOverview.vue still has some unused analytics data structures

---

## 📝 Build Instructions

```bash
# Install dependencies
yarn install

# Development
yarn serve

# Production build
yarn build

# Docker build
docker build -t quant-ux-frontend .

# Docker build multi-platform
docker buildx build --platform linux/amd64,linux/arm64 -t quant-ux-frontend .
```

---

**Maintained by:** MasteryCoding
**Original Project:** https://github.com/KlausSchaefers/quant-ux
**License:** GPL-3.0





