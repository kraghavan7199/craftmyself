export interface  UserWorkoutSearchCriteria {
    userId: string;
    date?: Date;
    weekStart?: Date;
    weekEnd?: Date;
    skip: number;
    limit: number;
    timezone?: string;
}