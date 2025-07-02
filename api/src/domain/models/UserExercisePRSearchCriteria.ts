export interface UserExercisePRSearchCriteria {
    userId: string;
    skip: number;
    limit: number;
    exerciseId?: string;
    searchQuery?: string;
}