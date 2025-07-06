import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Exercise } from "../shared/interfaces/Exercise";
import { UserWorkout } from "../shared/interfaces/UserWorkout";
import { UserMacros } from "../shared/interfaces/UserMacros";
import { UserWorkoutHistory } from "../shared/interfaces/UserWorkoutHistory";
import { UserExerciseSummary } from "../shared/interfaces/UserExerciseSummary";
import { UserWeekSummary } from "../shared/interfaces/UserWeekSummary";
import { User } from "../shared/interfaces/User";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";



@Injectable({
    providedIn: 'root'
})
export class FirestoreService {
    productsList: Observable<any> = new Observable<any>();

    constructor(private httpClient: HttpClient) { }

    private getUserTimezone(): string {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    }


    createUserRecord(userId: string) {
       return this.httpClient.post(`${environment.apiUrl}/user`, {userId});
    }

    getUserById(userId: string): Observable<User> {
        return this.httpClient.get<User>(`${environment.apiUrl}/user/${userId}`);
    }

    calculateMacros(prompt: string) {
        return this.httpClient.get(`${environment.apiUrl}/macros/calculation?prompt=${prompt}`)
    }

    getExercises(skip: number = 0, limit?: number, searchQuery?: string): Observable<any> {
        let url = `${environment.apiUrl}/exercises?skip=${skip}`;
        if (limit) {
            url += `&limit=${limit}`;
        }
        if (searchQuery && searchQuery.trim()) {
            url += `&searchQuery=${encodeURIComponent(searchQuery)}`;
        }
        return this.httpClient.get(url);
    }

    addUserWorkout(workout: UserWorkout) {
        return this.httpClient.post(`${environment.apiUrl}/workout`, workout)
    }

    deleteUserWorkout(workoutId: string) {
        return this.httpClient.delete(`${environment.apiUrl}/workout/${workoutId}`);
    }

    getCurrentDayUserWorkout(userId: string): Observable<UserWorkout> {
        const timezone = this.getUserTimezone();
        return this.httpClient.get<UserWorkout>(`${environment.apiUrl}/workout/user/${userId}/current?timezone=${encodeURIComponent(timezone)}`);
    }

    updateWorkout(workoutId: string, workout: UserWorkout) {
        return this.httpClient.put(`${environment.apiUrl}/workout/${workoutId}`, workout)
    }

    getCurrentDayMacros(userId: string) {
        return this.httpClient.get<UserWorkout>(`${environment.apiUrl}/macros/user/${userId}/current`);
    }

    addMacros(macros: UserMacros) {
        return this.httpClient.post(`${environment.apiUrl}/macros`, macros)
    }

    updateMacros(macroId: string, macros: UserMacros) {
        return this.httpClient.put(`${environment.apiUrl}/macros/${macroId}`, macros)
    }

    deleteUserMacros(macrosId: string) {
        return this.httpClient.delete(`${environment.apiUrl}/macros/${macrosId}`);
    }

    getUserWorkoutHistory(userId: string, workoutLimit: number, skip: number = 0, startDate?: Date | null, endDate?: Date | null): Observable<UserWorkoutHistory> {
        const payload = { 
            workoutLimit, 
            skip,
            startDate, 
            endDate 
        }
        const timezone = this.getUserTimezone();
        return this.httpClient.get<UserWorkoutHistory>(`${environment.apiUrl}/workout/user/${userId}/history?criteria=${JSON.stringify(payload)}&timezone=${encodeURIComponent(timezone)}`)
    }

    getUserExerciseHistory(exerciseId: string, userId: string): Observable<UserExerciseSummary> {
        return this.httpClient.get<UserExerciseSummary>(`${environment.apiUrl}/summary/user/${userId}/exercise/${exerciseId}`)
    }

    getUserWeeklySummary(userId: any): Observable<UserWeekSummary[]> {
        return this.httpClient.get<UserWeekSummary[]>(`${environment.apiUrl}/summary/user/${userId}/weekly`)
    }

    getUserMacrosHistory(userId: any, macroLimit: number, skip: number = 0, startDate?: Date | null, endDate?: Date | null): Observable<UserMacros[]> {
        const payload = { 
            limit: macroLimit, 
            skip,
            startDate, 
            endDate 
        }
        return this.httpClient.get<UserMacros[]>(`${environment.apiUrl}/macros/user/${userId}/history?criteria=${JSON.stringify(payload)}`)
    }

    upsertWeeklyPlan(weekPlan: any) {
        return this.httpClient.post(`${environment.apiUrl}/workout/weekly/plan`, weekPlan);
    }

    getWeeklyPlan(userId: string, date: Date): Observable<any> {
        const timezone = this.getUserTimezone();
        return this.httpClient.get(`${environment.apiUrl}/workout/weekly/plan/${userId}?date=${date.toISOString()}&timezone=${encodeURIComponent(timezone)}`);
    }

     exportData(userId: string): Observable<any> {
        return this.httpClient.get(`${environment.apiUrl}/export/user/${userId}`, { responseType: 'blob' });
    }

    getUserExercisePRs(userId: string, skip: number = 0, limit: number = 10, searchQuery: string = ''): Observable<any> {
        let url = `${environment.apiUrl}/exercises/prs/user/${userId}?skip=${skip}&limit=${limit}`;
        if (searchQuery && searchQuery.trim()) {
            url += `&searchQuery=${encodeURIComponent(searchQuery)}`;
        }
        return this.httpClient.get(url);
    }

    getAnalysis() : Observable<any> {
       return this.httpClient.get(`${environment.apiUrl}/analysis/comprehensive/4Ogt93Z3z8gWuLBB4o6yji71IGT2`);  
    }

    getComprehensiveAnalytics(userId: string, startDate?: Date | null, endDate?: Date | null): Observable<any> {
        let url = `${environment.apiUrl}/analytics/user/${userId}/comprehensive`;
        const params = [];
        
        if (startDate) {
            params.push(`startDate=${startDate.toISOString().split('T')[0]}`);
        }
        if (endDate) {
            params.push(`endDate=${endDate.toISOString().split('T')[0]}`);
        }
        
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        return this.httpClient.get(url);
    }

}