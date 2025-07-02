import { Component, Input, OnInit, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
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
  @Input() totalCount: number = 0;
  @Input() isLoading: boolean = false;
  @Output() pageChanged = new EventEmitter<{page: number, limit: number, searchQuery: string}>();
  @Output() searchChanged = new EventEmitter<string>();
  
  prSearchQuery: string = '';
  
  // Pagination properties
  currentPage: number = 1;
  itemsPerPage: number = 1;
  hasNextPage: boolean = false;

  ngOnInit(): void {
    this.updatePagination();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['exercisePRs']) {
      this.updatePagination();
    }
  }

  onPRSearchChange(): void {
    this.currentPage = 1;
    this.searchChanged.emit(this.prSearchQuery);
  }

  updatePagination(): void {
    // Enable next button only if we received exactly the limit (indicating more data might exist)
    this.hasNextPage = this.exercisePRs.length === this.itemsPerPage;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.emitPageChange();
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage++;
      this.emitPageChange();
    }
  }

  private emitPageChange(): void {
    this.pageChanged.emit({
      page: this.currentPage,
      limit: this.itemsPerPage,
      searchQuery: this.prSearchQuery
    });
  }


  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return this.getStartIndex() + this.exercisePRs.length - 1;
  }
}