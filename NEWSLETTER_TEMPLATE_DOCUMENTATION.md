# Newsletter Template Documentation

This document explains the structure and components of the HTML newsletter template for the Mietrecht Court Decisions Agent.

## Template Files

1. [newsletter_template.html](newsletter_template.html) - Complete HTML template with embedded CSS
2. [newsletter_styles.css](newsletter_styles.css) - External CSS stylesheet
3. [newsletter_template_external.html](newsletter_template_external.html) - HTML template referencing external CSS

## Visual Structure

### 1. Header Section
- **Logo**: Scales⚖️icon in a circular badge
- **Title**: "Mietrechts-Urteile der Woche" in large, bold text
- **Subtitle**: "Ihre wöchentliche Zusammenfassung wichtiger Gerichtsentscheidungen"
- **Week Info**: Current calendar week and date range in a highlighted badge

### 2. Welcome Message
- Personalized greeting with lawyer's name
- Brief introduction to the newsletter content
- Background color with left border accent

### 3. Decision Sections
Each section is organized by court level:

#### BGH-Urteile (Federal Court of Justice)
- Section header with icon and count
- Individual decision cards with:
  - Court name and location
  - Decision date
  - Case number
  - Topic tags with color coding
  - Summary of the decision
  - Practice implications
  - Link to full decision

#### Landgerichts-Urteile (Regional Court Decisions)
- Similar structure to BGH section
- Different icon for visual distinction

### 4. Practice Summary
- Highlighted section with gradient background
- Consolidated practice implications
- Recommendations for implementation

### 5. Footer
- Service information
- Navigation links (Settings, Unsubscribe, Archive)
- Legal disclaimer

## CSS Classes and Styling

### Color Scheme
- **Primary**: Dark blue (#2c3e50) for headers and footers
- **Secondary**: Blue (#3498db) for accents and buttons
- **Background**: Light gray (#f5f7fa) for page, white for content
- **Importance Colors**:
  - High: Red accents (#c62828)
  - Medium: Yellow accents (#f9a825)
  - Standard: Blue accents (#0d47a1)

### Responsive Design
- Adapts to mobile devices with:
  - Reduced padding
  - Stacked court information
  - Flexible container widths

### Visual Elements
- **Cards**: Drop shadows and hover effects
- **Tags**: Rounded badges with topic colors
- **Buttons**: Hover state color changes
- **Icons**: Emoji-based for simplicity

## Implementation Guide

### For Inline CSS (newsletter_template.html)
Use this version when sending emails as it contains all styling within the HTML file.

### For External CSS (newsletter_template_external.html)
Use this version for web display or when CSS can be referenced externally.

## Customization Options

### Personalization Variables
- Lawyer name
- Week number and date range
- Decision count
- Practice area focus

### Importance Levels
- **High**: Red color scheme for critical decisions
- **Medium**: Yellow color scheme for important decisions
- **Standard**: Blue color scheme for regular decisions

### Topic Tags
- Color-coded based on importance
- Rounded badges for visual appeal
- Multiple tags per decision

## Best Practices

### Email Compatibility
- Uses table-free layout for better email client support
- Inline CSS for maximum compatibility
- Web-safe fonts

### Accessibility
- Sufficient color contrast
- Semantic HTML structure
- Clear visual hierarchy

### Performance
- Optimized CSS with minimal selectors
- Efficient class naming
- Lightweight design elements

## Integration with Mietrecht Agent

### Data Points to Replace
1. Lawyer name in welcome message
2. Current week and date range
3. Decision count in section headers
4. Individual decision details:
   - Court name and location
   - Decision date
   - Case number
   - Topic tags
   - Summary text
   - Practice implications
   - Decision URL

### Dynamic Content Areas
- Welcome message personalization
- Decision card generation
- Practice summary content
- Date and week information

## Testing

### Email Clients
- Tested with major email clients
- Compatible with webmail services
- Works on mobile email apps

### Browsers
- Chrome, Firefox, Safari, Edge
- Mobile browsers
- Responsive behavior verification

## Maintenance

### Updating Styles
- Modify [newsletter_styles.css](newsletter_styles.css) for style changes
- Update both template versions when making changes
- Test across email clients after updates

### Adding New Sections
- Follow existing section structure
- Maintain consistent styling
- Update section counts dynamically

This template provides a professional, visually appealing newsletter that effectively presents German rental law court decisions to legal practitioners.