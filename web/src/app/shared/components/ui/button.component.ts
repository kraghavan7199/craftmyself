import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
}

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [class]="cn(buttonVariants({ variant, size }), class)"
      (click)="onClick.emit($event)"
    >
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent implements ButtonProps {
  @Input() variant: ButtonProps['variant'] = 'default';
  @Input() size: ButtonProps['size'] = 'default';
  @Input() disabled = false;
  @Input() type: ButtonProps['type'] = 'button';
  @Input() class?: string;
  @Output() onClick = new EventEmitter<MouseEvent>();

  cn = cn;
  buttonVariants = buttonVariants;
}