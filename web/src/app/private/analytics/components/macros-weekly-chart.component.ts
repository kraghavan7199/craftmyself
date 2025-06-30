import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, OnInit, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { UserWeekSummary } from '../../../shared/interfaces/UserWeekSummary';

Chart.register(...registerables);

@Component({
    selector: 'app-macros-weekly-chart',
    imports: [CommonModule, FormsModule],
    templateUrl: './macros-weekly-chart.component.html'
})
export class MacrosWeeklyChartComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @ViewChild('macrosChart') private macrosChartRef!: ElementRef;
  @Input() weeklySummary: UserWeekSummary[] = [];
  @Input() macroAttribute: any[] = [];
  @Input() selectedMacroAttribute: any;
  @Output() selectedMacroAttributeChange = new EventEmitter<any>();
  
  macrosChart!: Chart;

  ngOnInit() {
    // Initial setup
  }

  ngAfterViewInit() {
    // Wait for view to initialize before creating chart
    setTimeout(() => {
      if (this.weeklySummary.length > 0 && this.selectedMacroAttribute) {
        this.initMacroChart();
      }
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['weeklySummary'] && this.weeklySummary.length > 0 && this.selectedMacroAttribute) {
      if (this.macrosChart) {
        this.updateMacroChart();
      } else {
        setTimeout(() => {
          this.initMacroChart();
        }, 100);
      }
    }
  }

  ngOnDestroy() {
    if (this.macrosChart) {
      this.macrosChart.destroy();
    }
  }

  trackByCode(index: number, macro: any): any {
    return macro.code;
  }

  updateMacroChart(): void {
    this.selectedMacroAttributeChange.emit(this.selectedMacroAttribute);
    
    if (!this.macrosChart) return;

    const color = '#DD6B20';
    const filteredDatasets = {
      label: this.selectedMacroAttribute.name,
      data: this.weeklySummary.map((week: any) => week.macroAverages && week.macroAverages[this.selectedMacroAttribute.code]).filter(Boolean),
      borderColor: color,
      backgroundColor: color + '33',
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5
    };

    this.macrosChart.data.datasets = [filteredDatasets];
    if (this.macrosChart.options.plugins && this.macrosChart.options.plugins.title && this.macrosChart.options.plugins.title.text)
      this.macrosChart.options.plugins.title = {
        display: true,
         text: `${this.selectedMacroAttribute.name} Weekly Average`
      }

      if (this.macrosChart && this.macrosChart.options && this.macrosChart.options.scales && this.macrosChart.options.scales['y']) {
        const yScale = this.macrosChart.options.scales['y'] as any;
        if (yScale.title) {
          yScale.title.text = this.selectedMacroAttribute.unitLabel;
        }
      }
    this.macrosChart.update('active');
  }

  private initMacroChart() {
     if (!this.macrosChartRef || !this.weeklySummary.length) 
      return;

    // Destroy existing chart if it exists
    if (this.macrosChart) {
      this.macrosChart.destroy();
    }

    const ctx = this.macrosChartRef.nativeElement.getContext('2d');
    const color ='#DD6B20'
    const data = {
      label: this.selectedMacroAttribute.name,
      data: this.weeklySummary.map((week: any) => week.macroAverages && week.macroAverages[this.selectedMacroAttribute.code]).filter(Boolean),
      borderColor: color,
      backgroundColor: color + '33',
      borderWidth: 2,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5
    };

    const opts = { month: 'short', day: 'numeric' } as const;
    const fmt = new Intl.DateTimeFormat('en-US', opts);
    const weekLabels = this.weeklySummary.map((week: UserWeekSummary) => {
      if(week.macroAverages) { const { start, end } = this.getISOWeekRange(week.week, week.year);
      if (typeof fmt.formatRange === 'function') {
        return fmt.formatRange(start, end);
      }

      return `${fmt.format(start)} – ${fmt.format(end)}`;}
     return null;
    }).filter(Boolean);

    const chartConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels: weekLabels,
        datasets: [data]
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
              text: this.selectedMacroAttribute.unitLabel,
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
            display: false,
          },
          title: {
            display: true,
            text: `${this.selectedMacroAttribute.name} Weekly Average`
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        }
      }
    };

    this.macrosChart = new Chart(ctx, chartConfig);
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
}