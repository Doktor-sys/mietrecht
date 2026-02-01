# Keyboard Navigation Enhancements

## Overview
This document describes the implementation of enhanced keyboard navigation features for improved accessibility in the SmartLaw Mietrecht application. These enhancements provide users with efficient keyboard-based navigation and shortcuts for common tasks.

## Features Implemented

### 1. Global Keyboard Shortcuts
- **Ctrl+Alt+H**: Show keyboard shortcuts help dialog
- **Ctrl+Alt+P**: Navigate to user profile
- **Ctrl+Alt+A**: Navigate to accessibility settings
- **Escape**: Close open dialogs, menus, and overlays

### 2. Focus Management
- Enhanced SkipToContent component with multiple target options
- Focus trapping within modal dialogs
- Proper focus restoration after closing dialogs
- Screen reader announcements for navigation actions

### 3. Keyboard Shortcut Help
- Interactive help dialog showing all available shortcuts
- Categorized shortcuts for easier reference
- Visual key combination display using `<kbd>` elements
- Accessible dialog with proper ARIA attributes

## Components

### KeyboardNavigationManager
Central component that handles global keyboard events and shortcut management.

#### Props
- `children`: React nodes to wrap with keyboard navigation functionality

#### Features
- Global keyboard event listeners
- Navigation shortcut handling
- Focus trap management for dialogs
- Screen reader announcements

### KeyboardShortcutsHelp
Dialog component that displays all available keyboard shortcuts.

#### Props
- `open`: Boolean indicating if dialog should be open
- `onClose`: Function to call when dialog should be closed

#### Features
- Categorized shortcut display
- Visual key combination indicators
- Accessible dialog implementation
- Proper focus management

## Implementation Details

### Event Handling
The KeyboardNavigationManager component listens for global `keydown` events and processes them according to the following logic:

1. **Modifier Key Detection**: Checks for Ctrl/Cmd and Alt keys
2. **Shortcut Matching**: Matches key combinations to predefined actions
3. **Prevention**: Prevents default browser behavior for handled shortcuts
4. **Execution**: Performs the appropriate action (navigation, dialog opening, etc.)

### Focus Trapping
Modal dialogs implement focus trapping to ensure keyboard users cannot tab out of the dialog:

1. **Focusable Element Detection**: Identifies all focusable elements within the dialog
2. **Tab Key Handling**: Manages forward and backward tab navigation
3. **Boundary Management**: Wraps focus from last to first element and vice versa
4. **Escape Handling**: Closes dialog when Escape key is pressed

### Screen Reader Announcements
Accessibility improvements include audible feedback for screen reader users:

1. **Dynamic Announcement Elements**: Creates temporary elements with `aria-live` attributes
2. **Contextual Messages**: Provides relevant information about navigation actions
3. **Automatic Cleanup**: Removes announcement elements after they've been read

## Integration

### App Integration
The KeyboardNavigationManager is integrated at the root level of the application in `App.tsx`:

```tsx
<AccessibilityProvider>
  <KeyboardNavigationManager>
    <Layout>
      {/* Routes */}
    </Layout>
  </KeyboardNavigationManager>
</AccessibilityProvider>
```

### Dependency Requirements
- React Router for navigation functions
- Material-UI for dialog components
- react-i18next for translations

## Testing

### Unit Tests
Comprehensive tests cover:

1. **Shortcut Activation**: Verifying keyboard shortcuts trigger correct actions
2. **Dialog Management**: Testing help dialog open/close functionality
3. **Focus Trapping**: Ensuring proper focus behavior in modal dialogs
4. **Screen Reader Support**: Validating announcement functionality

### Test Files
- `keyboard-navigation-enhanced.test.tsx`: Enhanced keyboard navigation tests

## Accessibility Compliance

### WCAG Guidelines
Implementation follows these WCAG 2.1 guidelines:

- **2.1.1 Keyboard**: All functionality available via keyboard
- **2.1.2 No Keyboard Trap**: Users can navigate away from components
- **2.4.1 Bypass Blocks**: Skip links provided for main content
- **2.4.3 Focus Order**: Logical tab order maintained
- **4.1.2 Name, Role, Value**: Proper ARIA attributes for components

### ARIA Implementation
- `aria-live` for dynamic announcements
- `aria-hidden` for dialog management
- `aria-label` for descriptive element labeling
- `role` attributes for semantic structure

## Translation Keys

### New Keys Added
```json
{
  "accessibility": {
    "shortcuts": {
      "title": "Tastaturkürzel",
      "description": "Effiziente Navigation durch die Anwendung",
      "toggleHelp": "Hilfe für Tastaturkürzel ein-/ausblenden",
      "helpShortcut": "Strg+Alt+H",
      "navigation": "Navigation",
      "skipToContent": "Zum Hauptinhalt springen",
      "skipToNavigation": "Zur Navigation springen",
      "skipToChat": "Zum Chat springen",
      "skipToDocuments": "Zu den Dokumenten springen",
      "skipToLawyers": "Zu den Anwälten springen",
      "globalShortcuts": "Globale Tastaturkürzel",
      "openProfile": "Profil öffnen",
      "openAccessibility": "Barrierefreiheitseinstellungen öffnen",
      "toggleDarkMode": "Dunkelmodus ein-/ausschalten",
      "showShortcuts": "Tastaturkürzel-Hilfe anzeigen",
      "helpOverlay": "Hilfe-Overlay",
      "closeOverlay": "Overlay schließen",
      "escKey": "Esc-Taste"
    }
  }
}
```

## Future Improvements

### Planned Enhancements
1. **Dark Mode Toggle**: Add keyboard shortcut for theme switching
2. **Extended Shortcuts**: More navigation and action shortcuts
3. **Customization**: User-configurable keyboard shortcuts
4. **Mobile Support**: Touch gesture equivalents for keyboard shortcuts

### Potential Issues
1. **Browser Conflicts**: Some shortcuts may conflict with browser defaults
2. **Platform Differences**: Mac users may need Cmd instead of Ctrl
3. **Screen Reader Compatibility**: May need adjustments for specific screen readers

## Deployment Notes

### No Breaking Changes
- Implementation is additive only
- Existing keyboard navigation continues to work
- Backward compatibility maintained

### Dependencies
- No additional npm packages required
- Uses existing Material-UI and React Router dependencies

## Usage Examples

### Opening Help Dialog
Press `Ctrl+Alt+H` to open the keyboard shortcuts help dialog.

### Navigating to Profile
Press `Ctrl+Alt+P` to navigate directly to the user profile page.

### Closing Overlays
Press `Escape` to close any open dialogs, menus, or overlays.

## Troubleshooting

### Common Issues
1. **Shortcuts Not Working**: Check if modifier keys are correct for your platform
2. **Focus Trapping Issues**: Ensure dialogs have focusable elements
3. **Announcement Problems**: Verify screen reader compatibility

### Debugging Tips
1. Use browser dev tools to inspect event listeners
2. Check console for JavaScript errors
3. Test with different screen readers for compatibility