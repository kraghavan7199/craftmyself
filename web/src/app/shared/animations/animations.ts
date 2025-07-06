import { trigger, transition, style, animate, query, group, state } from '@angular/animations';

export const fadeInAnimation = trigger('fadeIn', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('600ms ease-in', style({ opacity: 1 }))
  ])
]);

export const slideUpAnimation = trigger('slideUp', [
  transition(':enter', [
    style({ transform: 'translateY(30px)', opacity: 0 }),
    animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ])
]);

export const slideInFromRightAnimation = trigger('slideInFromRight', [
  transition(':enter', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
  ])
]);

export const slideInFromLeftAnimation = trigger('slideInFromLeft', [
  transition(':enter', [
    style({ transform: 'translateX(-100%)', opacity: 0 }),
    animate('600ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
  ])
]);

export const scaleInAnimation = trigger('scaleIn', [
  transition(':enter', [
    style({ transform: 'scale(0.8)', opacity: 0 }),
    animate('600ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
  ])
]);

export const routeTransitionAnimation = trigger('routeTransition', [
  transition('* <=> *', [
    query(':enter', [
      style({ position: 'absolute', width: '100%', opacity: 0, transform: 'translateY(20px)' }),
    ], { optional: true }),
    query(':leave', [
      style({ position: 'absolute', width: '100%' }),
      animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
    ], { optional: true }),
    query(':enter', [
      animate('300ms 150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true })
  ])
]);

export const staggerAnimation = trigger('stagger', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(30px)' }),
      animate('{{timing}}ms {{delay}}ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ], { optional: true })
  ])
]);

export const hoverScaleAnimation = trigger('hoverScale', [
  state('default', style({ transform: 'scale(1)' })),
  state('hovered', style({ transform: 'scale(1.05)' })),
  transition('default <=> hovered', animate('200ms ease-in-out'))
]);

export const bounceInAnimation = trigger('bounceIn', [
  transition(':enter', [
    style({ transform: 'scale(0.3)', opacity: 0 }),
    animate('600ms cubic-bezier(0.68, -0.55, 0.265, 1.55)', 
      style({ transform: 'scale(1)', opacity: 1 }))
  ])
]);

export const slideDownAnimation = trigger('slideDown', [
  transition(':enter', [
    style({ transform: 'translateY(-30px)', opacity: 0 }),
    animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ])
]);
