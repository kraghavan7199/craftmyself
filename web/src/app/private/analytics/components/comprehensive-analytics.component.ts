import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComprehensiveAnalytics } from '../../../shared/interfaces/ComprehensiveAnalytics';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-comprehensive-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprehensive-analytics.component.html',
  styles: [`
    .comprehensive-analytics-container {
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class ComprehensiveAnalyticsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() analytics: ComprehensiveAnalytics | null = null;
  @Output() dateRangeChanged = new EventEmitter<{startDate: Date, endDate: Date}>();
  @ViewChild('progressionChart') progressionChartRef!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;
  
  // Date range properties
  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  
  // Quick preset options
  presets = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'Last 6 months', days: 180 },
    { label: 'Last year', days: 365 }
  ];
  
  selectedPreset = 30; // Default to 30 days

  ngOnInit() {
    // Set default to last 30 days
    this.setPreset(30);
  }

  ngAfterViewInit() {
    if (this.analytics && this.analytics.progression.monthlyProgression.length > 0) {
      setTimeout(() => this.createProgressionChart(), 100);
    }
  }

  ngOnChanges() {
    // If analytics data changes after initial load, update the chart
    if (this.analytics && this.analytics.progression.monthlyProgression.length > 0) {
      setTimeout(() => this.createProgressionChart(), 100);
    }
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayOfWeek] || 'N/A';
  }

  private createProgressionChart(): void {
    if (!this.progressionChartRef || !this.analytics?.progression.monthlyProgression.length) {
      return;
    }

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.progressionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const progressionData = this.analytics.progression.monthlyProgression;
    
    // Prepare data for the chart
    const labels = progressionData.map(data => {
      const date = new Date(data.month);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const volumeData = progressionData.map(data => data.volume);
    const avgWeightData = progressionData.map(data => data.avgWeight);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Total Volume',
            data: volumeData,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Average Weight',
            data: avgWeightData,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 6,
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          title: {
            display: true,
            text: 'Monthly Training Progression',
            color: '#ffffff',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          legend: {
            labels: {
              color: '#ffffff',
              font: {
                size: 12,
                weight: 'bold'
              },
              padding: 20,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: 'rgba(17, 24, 39, 0.95)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#374151',
            borderWidth: 1,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#9ca3af',
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)',
       
            },
            border: {
              display: false
            }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Total Volume (kg)',
              color: '#3b82f6',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            ticks: {
              color: '#9ca3af',
              font: {
                size: 11
              }
            },
            grid: {
              color: 'rgba(156, 163, 175, 0.2)',
     
            },
            border: {
              display: false
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Average Weight (kg)',
              color: '#10b981',
              font: {
                size: 12,
                weight: 'bold'
              }
            },
            ticks: {
              color: '#9ca3af',
              font: {
                size: 11
              }
            },
            grid: {
              drawOnChartArea: false,
              color: 'rgba(156, 163, 175, 0.2)',
             
            },
            border: {
              display: false
            }
          }
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // Date preset methods
  setPreset(days: number) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    this.selectedStartDate = startDate;
    this.selectedEndDate = endDate;
    this.selectedPreset = days;
    this.emitDateChange();
  }

  private emitDateChange() {
    if (this.selectedStartDate && this.selectedEndDate) {
      this.dateRangeChanged.emit({
        startDate: this.selectedStartDate,
        endDate: this.selectedEndDate
      });
    }
  }
}