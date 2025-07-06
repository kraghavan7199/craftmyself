# Animation System Documentation

This application includes a comprehensive animation system that provides smooth, engaging transitions throughout the user interface.

## Features

### 1. Page Transition Animations
- Automatic fade-in animations when navigating between routes
- Smooth page loading effects

### 2. Scroll-Triggered Animations
- Elements animate into view as users scroll
- Multiple animation types available
- Customizable delays and thresholds

### 3. Component-Level Animations
- Button hover effects with scale transformations
- Card animations
- Form element transitions

## How to Use

### Page Wrapper Component
Wrap your page content with the `PageWrapperComponent` for automatic page load animations:

```html
<app-page-wrapper>
  <!-- Your page content here -->
</app-page-wrapper>
```

### Scroll Animation Directive
Add scroll-triggered animations to any element:

```html
<div appScrollAnimation 
     animationType="slideUp" 
     [delay]="200">
  Content that animates on scroll
</div>
```

Available animation types:
- `fadeIn`: Simple opacity transition
- `slideUp`: Slide up from bottom
- `slideLeft`: Slide in from left
- `slideRight`: Slide in from right
- `scaleIn`: Scale up from center

### Angular Animations
Import and use Angular animations in your components:

```typescript
import { fadeInAnimation, slideUpAnimation } from '../shared/animations/animations';

@Component({
  // ...
  animations: [fadeInAnimation, slideUpAnimation]
})
```

### CSS Animation Classes
Use predefined CSS classes for quick animations:

```html
<div class="animate-fade-in animate-delayed-2">
  Content with CSS animations
</div>
```

Available classes:
- `animate-fade-in`
- `animate-slide-up`
- `animate-slide-down`
- `animate-slide-left`
- `animate-slide-right`
- `animate-scale-in`
- `animate-bounce-in`
- `animate-delayed-1` through `animate-delayed-5`

## Animation Timing

- **Fast**: 300ms
- **Normal**: 600ms
- **Slow**: 900ms

## Best Practices

1. **Use subtle animations** - Animations should enhance UX, not distract
2. **Respect user preferences** - Consider `prefers-reduced-motion` settings
3. **Stagger complex layouts** - Use delays to create flowing animations
4. **Test performance** - Ensure animations don't impact app performance

## Examples

### Button with Hover Animation
```html
<button class="transition-all duration-300 hover:scale-105 hover:shadow-lg">
  Click me
</button>
```

### Staggered List Animation
```html
<div *ngFor="let item of items; let i = index">
  <div appScrollAnimation 
       animationType="slideUp" 
       [delay]="i * 100">
    {{ item }}
  </div>
</div>
```

### Page with Multiple Animations
```html
<app-page-wrapper>
  <h1 [@fadeIn]>Page Title</h1>
  <p appScrollAnimation animationType="slideUp" [delay]="200">
    Description text
  </p>
  <button appScrollAnimation animationType="scaleIn" [delay]="400">
    Call to Action
  </button>
</app-page-wrapper>
```
