import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { UserWeekSummary } from '../../../shared/interfaces/UserWeekSummary';

Chart.register(...registerables);

@Component({
    selector: 'app-weekly-progress-chart',
    imports: [CommonModule],
    templateUrl: './weekly-progress-chart.component.html'
})
export class WeeklyProgressChartComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('progressChart') private chartRef!: ElementRef;
  @Input() weeklySummary: UserWeekSummary[] = [];
  @Input() muscleGroups: any[] = [];
  @Input() selectedMuscleGroup: any;
  @Output() selectedMuscleGroupChange = new EventEmitter<any>();
  
  chart!: Chart;
  selectedMuscleGroups: any[] = [];
  isDropdownOpen = false;

  ngOnInit() {
    // Initialize with first muscle group if available
    if (this.muscleGroups.length > 0 && this.selectedMuscleGroups.length === 0) {
      this.selectedMuscleGroups = [this.muscleGroups[0]];
    }
  }

  ngAfterViewInit() {
    // Wait for view to initialize before creating chart
    setTimeout(() => {
      if (this.weeklySummary.length > 0 && this.selectedMuscleGroups.length > 0) {
        this.initChart();
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['weeklySummary'] && this.weeklySummary.length > 0 && this.selectedMuscleGroups.length > 0) {
      if (this.chart) {
        this.updateChart();
      } else {
        setTimeout(() => {
          this.initChart();
        }, 100);
      }
    }
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  trackByCode(index: number, muscle: any): any {
    return muscle.code;
  }

  updateChart(): void {
    if (!this.chart) return;

    const datasets = this.selectedMuscleGroups.map(muscle => {
      const color = this.getColorForMuscle(muscle.code);
      return {
        label: muscle.name,
        data: this.weeklySummary.map((week: any) => week.muscleGroupVolumes[muscle.code] || 0),
        borderColor: color,
        backgroundColor: color + '33',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
      };
    });

    this.chart.data.datasets = datasets;
    
    const titleText = this.selectedMuscleGroups.length === 1 
      ? `${this.selectedMuscleGroups[0].name} Weekly Volume`
      : `Multiple Muscle Groups Weekly Volume`;
      
    if (this.chart.options.plugins && this.chart.options.plugins.title) {
      this.chart.options.plugins.title = {
        display: true,
        text: titleText
      }
    }
    this.chart.update('active');
  }

  private initChart(): void {
    if (!this.chartRef || !this.weeklySummary.length || !this.selectedMuscleGroups.length) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartRef.nativeElement.getContext('2d');
    
    const datasets = this.selectedMuscleGroups.map(muscle => {
      const color = this.getColorForMuscle(muscle.code);
      return {
        label: muscle.name,
        data: this.weeklySummary.map((week: any) => week.muscleGroupVolumes[muscle.code] || 0),
        borderColor: color,
        backgroundColor: color + '33',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5
      };
    });

    const opts = { month: 'short', day: 'numeric' } as const;
    const fmt = new Intl.DateTimeFormat('en-US', opts);
    const weekLabels = this.weeklySummary.map((week: UserWeekSummary) => {
      const { start, end } = this.getISOWeekRange(week.week, week.year);
      if (typeof fmt.formatRange === 'function') {
        return fmt.formatRange(start, end);
      }

      return `${fmt.format(start)} – ${fmt.format(end)}`;
    });

    const titleText = this.selectedMuscleGroups.length === 1 
      ? `${this.selectedMuscleGroups[0].name} Weekly Volume`
      : `Multiple Muscle Groups Weekly Volume`;

    const chartConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels: weekLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            },
            title: {
              display: true,
              text: 'Volume (kg)',
              color: 'rgba(255, 255, 255, 0.9)'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)'
            }
          }
        },
        plugins: {
          legend: {
            display: this.selectedMuscleGroups.length > 1,
            labels: {
              color: 'rgba(255, 255, 255, 0.9)'
            }
          },
          title: {
            display: true,
            text: titleText,
            color: 'rgba(255, 255, 255, 0.9)'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    };

    this.chart = new Chart(ctx, chartConfig);
  }

   getColorForMuscle(muscle: string): string {
    const colors: any = {
      chest: '#3182CE', // blue-600
      back: '#E53E3E', // red-600
      legs: '#2F855A', // green-600
      shoulders: '#DD6B20', // orange-600
      biceps: '#805AD5', // purple-600
      core: '#D69E2E', // yellow-600
      triceps: '#D53F8C', // pink-600
      forearms: '#38B2AC', // teal-600
    };

    return colors[muscle] || '#CBD5E0';
  }

  private getISOWeekRange(isoWeek: number, isoYear: number): { start: Date; end: Date } {
    const jan4 = new Date(isoYear, 0, 4);
    const jan4IsoDay = jan4.getDay() === 0 ? 7 : jan4.getDay();
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - (jan4IsoDay - 1));
    week1Monday.setHours(0, 0, 0, 0);
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (isoWeek - 1) * 7);
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);
    targetSunday.setHours(23, 59, 59, 999);

    return { start: targetMonday, end: targetSunday };
  }

  // Multi-select methods
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  isSelected(muscle: any): boolean {
    return this.selectedMuscleGroups.some(selected => selected.code === muscle.code);
  }

  toggleMuscleSelection(muscle: any): void {
    const isCurrentlySelected = this.isSelected(muscle);
    
    if (isCurrentlySelected) {
      this.selectedMuscleGroups = this.selectedMuscleGroups.filter(
        selected => selected.code !== muscle.code
      );
    } else {
      this.selectedMuscleGroups.push(muscle);
    }
    
    if (this.selectedMuscleGroups.length === 0) {
      if (this.chart) {
        this.chart.destroy();
        this.chart = null as any;
      }
    } else {
      if (this.chart) {
        this.updateChart();
      } else {
        setTimeout(() => {
          this.initChart();
        }, 100);
      }
    }
  }

  selectAll(): void {
    this.selectedMuscleGroups = [...this.muscleGroups];
    if (this.chart) {
      this.updateChart();
    } else {
      setTimeout(() => {
        this.initChart();
      }, 100);
    }
  }

  selectNone(): void {
    this.selectedMuscleGroups = [];
    if (this.chart) {
      this.chart.destroy();
      this.chart = null as any;
    }
  }

  getSelectedText(): string {
    if (this.selectedMuscleGroups.length === 0) {
      return 'Select muscle groups';
    } else if (this.selectedMuscleGroups.length === 1) {
      return this.selectedMuscleGroups[0].name;
    } else if (this.selectedMuscleGroups.length === this.muscleGroups.length) {
      return 'All muscle groups';
    } else {
      return `${this.selectedMuscleGroups.length} muscle groups`;
    }
  }
}