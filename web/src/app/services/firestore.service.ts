import { inject, Injectable, Query } from "@angular/core";
import { Timestamp } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { Exercise } from "../shared/interfaces/Exercise";
import { Functions, httpsCallable, HttpsCallableResult } from "@angular/fire/functions";
import { UserWorkout } from "../shared/interfaces/UserWorkout";
import { Macros, UserMacros } from "../shared/interfaces/UserMacros";
import { UserWorkoutHistory } from "../shared/interfaces/UserWorkoutHistory";
import { UserExerciseSummary } from "../shared/interfaces/UserExerciseSummary";
import { UserWeekSummary } from "../shared/interfaces/UserWeekSummary";
import { UserMacroHistory } from "../shared/interfaces/UserMacroHistory";
import { User } from "../shared/interfaces/User";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";



@Injectable({
    providedIn: 'root'
})
export class FirestoreService {
    functions: Functions = inject(Functions);
    productsList: Observable<any> = new Observable<any>();

    constructor(private httpClient: HttpClient) { }


    createUserRecord(userId: string) {
       return this.httpClient.post(`${environment.localApiUrl}/user`, {userId});
    }

    getUserById(userId: string): Observable<User> {
        return this.httpClient.get<User>(`${environment.localApiUrl}/user/${userId}`);
    }

    calculateMacros(prompt: string) {
        return this.httpClient.get(`${environment.localApiUrl}/macros/calculation?prompt=${prompt}`)
    }

    getExercises(): Observable<Exercise[]> {
        return this.httpClient.get<Exercise[]>(`${environment.localApiUrl}/exercises`)
    }

    addUserWorkout(workout: UserWorkout) {
        return this.httpClient.post(`${environment.localApiUrl}/workout`, workout)
    }

    deleteUserWorkout(workoutId: string) {
        return this.httpClient.delete(`${environment.localApiUrl}/workout/${workoutId}`);
    }

    getCurrentDayUserWorkout(userId: string): Observable<UserWorkout> {
        return this.httpClient.get<UserWorkout>(`${environment.localApiUrl}/workout/user/${userId}/current`);
    }

    updateWorkout(workoutId: string, workout: UserWorkout) {
        return this.httpClient.put(`${environment.localApiUrl}/workout/${workoutId}`, workout)
    }

    getCurrentDayMacros(userId: string) {
        return this.httpClient.get<UserWorkout>(`${environment.localApiUrl}/macros/user/${userId}/current`);
    }

    addMacros(macros: UserMacros) {
        return this.httpClient.post(`${environment.localApiUrl}/macros`, macros)
    }

    updateMacros(macroId: string, macros: UserMacros) {
        return this.httpClient.put(`${environment.localApiUrl}/macros/${macroId}`, macros)
    }

    deleteUserMacros(macrosId: string) {
        return this.httpClient.delete(`${environment.localApiUrl}/macros/${macrosId}`);
    }

    getUserWorkoutHistory(userId: string, workoutLimit: number, skip: number = 0, startDate?: Date | null, endDate?: Date | null): Observable<UserWorkoutHistory> {
        const payload = { 
            workoutLimit, 
            skip,
            startDate, 
            endDate 
        }
        return this.httpClient.get<UserWorkoutHistory>(`${environment.localApiUrl}/workout/user/${userId}/history?criteria=${JSON.stringify(payload)}`)
    }

    getUserExerciseHistory(exerciseId: string, userId: string): Observable<UserExerciseSummary> {
        return this.httpClient.get<UserExerciseSummary>(`${environment.localApiUrl}/summary/user/${userId}/exercise/${exerciseId}`)
    }

    getUserWeeklySummary(userId: any): Observable<UserWeekSummary[]> {
        return this.httpClient.get<UserWeekSummary[]>(`${environment.localApiUrl}/summary/user/${userId}/weekly`)
    }

    getUserMacrosHistory(userId: any, macroLimit: number, skip: number = 0, startDate?: Date | null, endDate?: Date | null): Observable<UserMacros[]> {
        const payload = { 
            limit: macroLimit, 
            skip,
            startDate, 
            endDate 
        }
        return this.httpClient.get<UserMacros[]>(`${environment.localApiUrl}/macros/user/${userId}/history?criteria=${JSON.stringify(payload)}`)
    }

    upsertWeeklyPlan(weekPlan: any) {
        return this.httpClient.post(`${environment.localApiUrl}/workout/weekly/plan`, weekPlan);
    }

    getWeeklyPlan(userId: string, date: Date): Observable<any> {
        return this.httpClient.get(`${environment.localApiUrl}/workout/weekly/plan/${userId}?date=${date.toISOString()}`);
    }

     exportData(userId: string): Observable<any> {
        return this.httpClient.get(`${environment.apiUrl}/export/user/${userId}`, { responseType: 'blob' });
    }

    getUserExercisePRs(userId: string): Observable<any> {
        return this.httpClient.get(`${environment.localApiUrl}/exercises/prs/user/${userId}`);
    }

    getAnalysis() : Observable<any> {
       return this.httpClient.get(`${environment.apiUrl}/analysis/comprehensive/4Ogt93Z3z8gWuLBB4o6yji71IGT2`);  
    }

}