import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserWeekSummary } from '../../../shared/interfaces/UserWeekSummary';

@Component({
    selector: 'app-progressive-overload',
    imports: [CommonModule],
    templateUrl: './progressive-overload.component.html'
})
export class ProgressiveOverloadComponent {
  @Input() weeklySummary: UserWeekSummary[] = [];
  @Input() muscleGroups: any[] = [];
  @Input() progressiveOverloadStatus: { [key: string]: { status: string, change: number, percentage: number, propotionalChange: number } } = {};
  
  Math = Math;

  getProgressiveOverloadForMuscle(muscleCode: string): any {
    return this.progressiveOverloadStatus[muscleCode] || { status: 'none', change: 0, percentage: 0 };
  }

  getMuscleCodeValue(s: any, v: any): number {
    return (s.muscleGroupVolumes as any)[(v as any)] || 0;
  }
}