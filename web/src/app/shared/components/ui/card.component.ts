import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { cn } from '../../lib/utils';

@Component({
  selector: 'ui-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('rounded-lg border bg-card text-card-foreground shadow-sm', class)">
      <ng-content></ng-content>
    </div>
  `,
})
export class CardComponent {
  @Input() class?: string;
  cn = cn;
}

@Component({
  selector: 'ui-card-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('flex flex-col space-y-1.5 p-6', class)">
      <ng-content></ng-content>
    </div>
  `,
})
export class CardHeaderComponent {
  @Input() class?: string;
  cn = cn;
}

@Component({
  selector: 'ui-card-title',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h3 [class]="cn('text-2xl font-semibold leading-none tracking-tight', class)">
      <ng-content></ng-content>
    </h3>
  `,
})
export class CardTitleComponent {
  @Input() class?: string;
  cn = cn;
}

@Component({
  selector: 'ui-card-description',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p [class]="cn('text-sm text-muted-foreground', class)">
      <ng-content></ng-content>
    </p>
  `,
})
export class CardDescriptionComponent {
  @Input() class?: string;
  cn = cn;
}

@Component({
  selector: 'ui-card-content',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('p-6 pt-0', class)">
      <ng-content></ng-content>
    </div>
  `,
})
export class CardContentComponent {
  @Input() class?: string;
  cn = cn;
}

@Component({
  selector: 'ui-card-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cn('flex items-center p-6 pt-0', class)">
      <ng-content></ng-content>
    </div>
  `,
})
export class CardFooterComponent {
  @Input() class?: string;
  cn = cn;
}