import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserExerciseSummary } from '../../../shared/interfaces/UserExerciseSummary';

@Component({
    selector: 'app-exercise-prs',
    imports: [CommonModule, FormsModule],
    templateUrl: './exercise-prs.component.html'
})
export class ExercisePRsComponent implements OnInit, OnChanges {
  @Input() exercisePRs: UserExerciseSummary[] = [];
  
  filteredExercisePRs: UserExerciseSummary[] = [];
  paginatedExercisePRs: UserExerciseSummary[] = [];
  prSearchQuery: string = '';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 0;

  ngOnInit(): void {
    this.updateFilteredData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['exercisePRs']) {
      this.updateFilteredData();
    }
  }

  onPRSearchChange(): void {
    this.currentPage = 1; // Reset to first page when searching
    this.filterExercisePRs();
  }

  filterExercisePRs(): void {
    if (!this.prSearchQuery.trim()) {
      this.filteredExercisePRs = [...this.exercisePRs];
    } else {
      const query = this.prSearchQuery.toLowerCase().trim();
      this.filteredExercisePRs = this.exercisePRs.filter(pr =>
        pr.exerciseName.toLowerCase().includes(query)
      );
    }
    this.updatePagination();
  }

  updateFilteredData(): void {
    this.filteredExercisePRs = [...this.exercisePRs];
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredExercisePRs.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    this.updatePaginatedData();
  }

  updatePaginatedData(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedExercisePRs = this.filteredExercisePRs.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedData();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedData();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedData();
    }
  }

  getVisiblePages(): number[] {
    const maxVisiblePages = 5;
    const pages: number[] = [];
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, this.currentPage - halfVisible);
      let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredExercisePRs.length);
  }
}