# UX.md

## User Experience Design Documentation

### Design Philosophy
The Family Chores App prioritizes simplicity and accessibility for all age groups (3+ years) while maintaining sophisticated functionality for parents. The interface employs a focus-based interaction model with visual hierarchy through selective blurring and expansion states.

## Core Interface Structure

### Primary Dashboard Layout

#### Landscape Mode (Primary)
- **Avatar Section:** Top 20% of screen height
  - Horizontal row of collapsed avatar columns
  - Each column displays: avatar image + name
  - Evenly distributed across screen width
- **Family Information Space:** Bottom 80% of screen height
  - Scrollable content area
  - Contains: leaderboards, family points, rewards, announcements
  - Shared family-wide information and metrics

#### Portrait Mode (Adaptive)
- **Avatar Section:** Vertical stack of avatar rows
  - Full width rows containing avatar + name
  - Compact vertical spacing
- **Family Information Space:** Remaining screen real estate
  - Scrollable content area
  - Same content as landscape mode

### Interaction States

#### Collapsed State (Default)
- **Visual:** Avatar + name only
- **Behavior:** Tap to expand
- **Focus:** All content equally visible
- **Auto-Return:** Default state after 1-minute timeout

#### Expanded State (Individual Focus)
- **Landscape Dimensions:** 30% width × 100% height
- **Portrait Dimensions:** 100% width × necessary height
- **Visual Effects:** Slight blur applied to all surrounding content
- **Content Display:**
  - Personal chore list with checkboxes
  - Age-appropriate formatting (pictures for young children, text for older)
  - Personal point total and badges
  - Available buyout options
  - Progress indicators

#### Focus Management
- **Exclusive Expansion:** Only one user column/row can be expanded at a time
- **Auto-Close Timer:** 1-minute timeout returns to collapsed state
- **Manual Close:** Tap avatar to immediately collapse
- **Background Blur:** All non-active content receives slight blur effect

## Age-Adaptive Interface Design

### Young Children (Ages 3-6)
- **Visual Elements:** Large, colorful avatars
- **Chore Display:** Picture-based with minimal text
- **Interaction:** Extra-large checkboxes and touch targets
- **Feedback:** Immediate visual/audio confirmation
- **Text:** Simple, large fonts with high contrast

### School Age (Ages 7-12)
- **Visual Elements:** Balanced picture and text
- **Chore Display:** Icons with descriptive text
- **Interaction:** Standard touch targets
- **Feedback:** Visual confirmation with point display
- **Text:** Clear, readable fonts

### Teenagers (Ages 13+)
- **Visual Elements:** Text-focused with subtle icons
- **Chore Display:** Detailed descriptions and context
- **Interaction:** Compact interface elements
- **Feedback:** Detailed progress and statistics
- **Text:** Standard interface typography

## Parent Command Center

### Access Method
- **Location:** Available within expanded parent column/row
- **Trigger:** Dedicated "Admin" or gear icon
- **Security:** Password/PIN protection (optional)

### Presentation
- **Type:** Modal overlay
- **Background:** Blurred underlying content
- **Size:** Full screen or large modal (responsive)
- **Navigation:** Clear close/back options

### Content Organization
- **Dashboard:** Quick overview of family metrics
- **User Management:** Add/remove family members, edit profiles
- **Chore Management:** Create, assign, reassign chores
- **Point Management:** Award, deduct, modify points
- **Allowance Settings:** Set rates, calculate payments
- **Override Controls:** Vacation mode, sick days, special circumstances
- **Analytics:** Performance reports and trends

## User Flow Patterns

### Standard User Journey
1. **Entry:** View family dashboard in collapsed state
2. **Selection:** Tap personal avatar to expand
3. **Interaction:** Review chores, check off completed tasks
4. **Feedback:** Receive immediate point/badge confirmation
5. **Exit:** Auto-timeout or manual close returns to family view

### Parent Administrative Journey
1. **Entry:** Tap personal avatar to expand
2. **Admin Access:** Select command center option
3. **Authentication:** Enter PIN/password if enabled
4. **Administration:** Perform management tasks
5. **Context Return:** Close modal, return to family dashboard

### Chore Completion Flow
1. **Task Review:** View assigned chores in expanded state
2. **Completion:** Tap checkbox to mark complete
3. **Confirmation:** Visual/audio feedback confirms action
4. **Point Award:** Immediate point credit display
5. **Badge Check:** Notification if badge earned

## Visual Design Principles

### Color Scheme
- **Primary:** Warm, family-friendly colors
- **Secondary:** Age-appropriate accent colors
- **Feedback:** Green for completion, yellow for partial, red for incomplete
- **Neutral:** Soft grays and whites for backgrounds

### Typography
- **Headers:** Bold, clear sans-serif fonts
- **Body Text:** Highly readable, scalable fonts
- **Children's Text:** Larger sizes with increased spacing
- **UI Labels:** Concise, clear language

### Iconography
- **Chore Icons:** Universally recognizable symbols
- **Age Scaling:** Size and detail appropriate to user age
- **Consistency:** Coherent visual language throughout app
- **Accessibility:** High contrast, clear distinctions

## Interaction Feedback

### Visual Feedback
- **Completion:** Checkmark animation, color change
- **Points:** Floating point awards, progress bars
- **Badges:** Celebration animations, achievement displays
- **Errors:** Subtle red highlights, clear error messages

### Audio Feedback (Optional)
- **Completion:** Satisfying "complete" sound
- **Points:** Coin-drop or achievement sound
- **Badges:** Celebration chime
- **Navigation:** Subtle click/tap sounds

## Accessibility Considerations

### Motor Skills
- **Touch Targets:** Minimum 44px for easy tapping
- **Spacing:** Adequate space between interactive elements
- **Gestures:** Simple tap interactions, no complex gestures

### Cognitive Load
- **Information Hierarchy:** Clear visual priorities
- **Progressive Disclosure:** Show relevant information only
- **Consistent Patterns:** Predictable interaction models
- **Error Prevention:** Clear feedback and confirmation

### Visual Accessibility
- **Contrast:** WCAG compliant color ratios
- **Text Size:** Scalable fonts for different ages
- **Color Independence:** Information not conveyed by color alone
- **Motion:** Respectful use of animations and transitions

## Performance Considerations

### Loading States
- **Initial Load:** Skeleton screens for family dashboard
- **Expansion:** Smooth transitions without loading delays
- **Command Center:** Quick modal presentation
- **Background Updates:** Seamless point/badge updates

### Memory Management
- **Image Optimization:** Appropriately sized avatars and icons
- **Data Caching:** Efficient storage of user progress
- **Background Processing:** Minimal impact on device performance

## Error Handling

### Connection Issues
- **Offline Mode:** Basic functionality without internet
- **Sync Indicators:** Clear online/offline status
- **Data Recovery:** Automatic sync when connection restored

### User Errors
- **Accidental Completion:** Undo functionality within time limit
- **Invalid Actions:** Clear error messages and guidance
- **Age-Appropriate Messaging:** Simple language for children

### System Errors
- **Graceful Degradation:** App continues to function with reduced features
- **Error Reporting:** Automatic crash reporting for debugging
- **Recovery:** Clear paths to restore functionality
