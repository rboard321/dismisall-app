# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Architecture Overview

This is a **multi-tenant SaaS dismissal management application** for schools, built with React + TypeScript and Firebase. Each school operates as an isolated tenant with their own data.

### Core Architecture Concepts

**Multi-Tenant Data Model**: All data is scoped by `schoolId` using Firestore subcollections:
- `schools/{schoolId}/students` - Student data per school
- `schools/{schoolId}/dismissals` - Dismissal records per school
- `schools/{schoolId}/lanes` - Daily cone configuration per school
- `users` (root) - User accounts with `schoolId` reference

**Authentication & Authorization**:
- Firebase Auth for authentication
- Custom `AuthContext` provides user and school profiles
- **Granular permissions system** using `PagePermission` types instead of just roles
- `ProtectedRoute` component enforces page-level access control
- Users have both `role` and `permissions[]` array for fine-grained access

**Permission Model**:
```typescript
type PagePermission = 'CAR_LOOKUP' | 'MANAGEMENT' | 'ADMIN' | 'CHECKIN' | 'OVERRIDES' | 'SETUP' | 'REPORTS'
```
- Admins can invite users with custom permission combinations
- Example: Teacher A gets only `CAR_LOOKUP`, Teacher B gets `CAR_LOOKUP` + `MANAGEMENT`

**State Management**:
- React Context for global auth/school state
- Firestore real-time listeners via `onSnapshot` for live data updates
- **Critical**: Firestore is the single source of truth - avoid local state for persistence

### Key Workflows

**Car Dismissal Flow**:
1. `CarLookupPage` - Teachers search by car number, add students to queue
2. Queue data stored in Firestore `dismissals` collection with status: `waiting`
3. `DashboardPage` - Management view shows 3-stage workflow per cone:
   - **Waiting** → `at_cone` (Send to Cone button)
   - **At Cone** → `dismissed` (Car Loaded button)
   - **Dismissed** - Shows recent completions

**SaaS Billing**:
- 14-day free trial for new schools (`trialEndsAt` timestamp)
- Stripe integration via `SubscriptionManagement` component
- Subscription status enforced in Firestore security rules
- See `STRIPE_SETUP.md` for billing configuration

**Responsive Design**:
- Mobile-first architecture using `src/styles/responsive.css`
- Breakpoint-based responsive grid system
- Touch-friendly UI (minimum 44px touch targets)
- PWA features with install prompt (`PWAInstallPrompt` component)

### Data Models

**Student Privacy**: Students stored with `firstName` + `lastInitial` only (privacy-focused)

**Dismissal Status Flow**: `waiting` → `at_cone` → `dismissed` → `historical`

**Cone Assignment**: Round-robin algorithm in `DashboardPage` assigns cars to cones 1-N

### Firebase Configuration

**Project**: `dismissal-time-b4674`
**Security Rules**: Multi-tenant isolation enforced at database level
**Real-time**: Uses `onSnapshot` for live updates between Car Lookup and Management pages

### Critical Implementation Notes

**State Persistence**: Car queue data MUST persist when navigating between pages. Uses Firestore real-time listeners, not local state.

**Permission Checking**: Always use `requiredPermissions` prop in `ProtectedRoute`, not just roles.

**Mobile Responsiveness**: All new components must support mobile breakpoints using the existing CSS framework.

**TypeScript**: Strict typing enforced. All Firebase data uses typed interfaces from `src/types/index.ts`.

### Testing User Flow

1. Register new school → Admin account created with full permissions
2. Admin invites teachers via email with custom permissions
3. Teachers use Car Lookup to add cars to queue
4. Management users control cone workflow and dismissals
5. Real-time sync between all connected users