import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserWeekSummary } from '../../../shared/interfaces/UserWeekSummary';

@Component({
    selector: 'app-weekly-muscle-sets',
    imports: [CommonModule],
    templateUrl: './weekly-muscle-sets.component.html'
})
export class WeeklyMuscleSetsComponent {
  @Input() weeklySummary: UserWeekSummary[] = [];
  @Input() muscleGroups: any[] = [];

  getCurrentWeekMuscleGroupSets(muscleCode: string): number {
    if (this.weeklySummary.length === 0) return 0;
    const currentWeek = this.weeklySummary[this.weeklySummary.length - 1];
    return (currentWeek.muscleGroupSets as any)[muscleCode] || 0;
  }
}