export interface UserMacrosSearchCriteria {
      userId: string;
    date?: Date;
    weekStart?: Date;
    weekEnd?: Date;
    skip: number;
    limit: number;
}