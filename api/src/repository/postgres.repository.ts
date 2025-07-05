import { inject, injectable } from "inversify";
import { Exercise } from "../domain/models/Exercise";
import { UserWorkout } from "../domain/models/UserWorkout";
import { UserMacros } from "../domain/models/UserMacros";
import { UserWorkoutHistory } from "../domain/models/UserWorkoutHistory";
import { UserExerciseSummary } from "../domain/models/UserExerciseSummary";
import { UserWeekSummary } from "../domain/models/UserWeekSummary";
import { UserMacroHistory } from "../domain/models/UserMacroHistory";
import { User } from "../domain/models/User";
import { WeekSummary } from "../domain/models/WeekSummary";
import { PoolClient } from "pg";
import TYPES from "../config/types";
import { Database } from "../config/Database";
import { UserWorkoutSearchCriteria } from "../domain/models/UserWorkoutSearchCriteria";
import { UserExercisePRSearchCriteria } from "../domain/models/UserExercisePRSearchCriteria";
import { UserMacrosSearchCriteria } from "../domain/models/UserMacrosSearchCriteria";

@injectable()
export class PostgresRepository {


  constructor(@inject(TYPES.Database) private database: Database) { }

  async getExercises(): Promise<Exercise[]> {
    const result = await this.database.query('SELECT * FROM exercise.exercises');
    return result.rows.map((row: { id: any; name: any; musclegroupname: any; musclegroupcode: any; }) => ({
      id: row.id,
      name: row.name,
      muscleGroupName: row.musclegroupname,
      muscleGroupCode: row.musclegroupcode
    }));
  }

  async upsertUserWorkoutData(userWorkout: UserWorkout): Promise<void> {
    const result = await this.database.query(`SELECT * FROM workout.upsertuserworkout($1,$2,$3,$4,$5,$6)`, [userWorkout.id, userWorkout.userId,
    userWorkout.date, JSON.stringify(userWorkout.exercises), JSON.stringify(userWorkout.muscleGroupVolumes), JSON.stringify(userWorkout.muscleGroupSets)
    ])
  }


  async getUserWorkouts(userWorkoutSearchCriteria: UserWorkoutSearchCriteria): Promise<UserWorkout[]> {
    const result = await this.database.query(`SELECT * FROM workout.getuserworkouts($1, $2, $3, $4, $5, $6)`, [userWorkoutSearchCriteria.userId,
    userWorkoutSearchCriteria.date, userWorkoutSearchCriteria.weekStart, userWorkoutSearchCriteria.weekEnd, userWorkoutSearchCriteria.limit,
    userWorkoutSearchCriteria.skip
    ]);
    return result.rows.map((row: any) => (<UserWorkout>{
      id: row.workout_id,
      userId: row.user_id,
      date: row.created_at,
      exercises: row.exercises,
      muscleGroupSets: row.muscle_group_sets,
      muscleGroupVolumes: row.muscle_group_volumes
    }));

  }

  async deleteUserWorkout(workoutId: string): Promise<boolean> {
    try {
      await this.database.query(`SELECT * FROM workout.deleteuserworkout($1)`, [workoutId]);
      return true;
    } catch (error) {
      return false;
    }
  }

  async upsertMacros(macros: UserMacros): Promise<string> {
    try {
      await this.database.query(`SELECT * FROM macros.addmacros($1, $2, $3, $4, $5)`, [macros.id, macros.userId, macros.date, JSON.stringify(macros.macros),
      JSON.stringify(macros.totals)])
      return macros.id
    }
    catch (error) {
      console.log(error);
      return 'macros error'
    }
  }

  async getCurrentDayUserWorkout(userId: string): Promise<UserWorkout | null> {
    const criteria = <UserWorkoutSearchCriteria>{ userId: userId, date: new Date() };
    const workouts = await this.getUserWorkouts(criteria);
    return workouts.length ? workouts[0] : null;
  }

  async getUserExerciseHistory(exerciseId: string, userId: string): Promise<UserExerciseSummary> {
    const result = await this.getUserExercisePRs({ userId, exerciseId, skip: 0, limit: 1 })
    return result.length ? result[0] : {} as UserExerciseSummary;
  }

  async getUserWeeklySummary(userId: string): Promise<UserWeekSummary[]> {
    const result = await this.database.query(`SELECT * FROM summary.getuserweeklysummary($1)`, [userId])
    if (result.rowCount) {
      return result.rows.map((row: any) => (<UserWeekSummary>{
        userId: row.user_id,
        weekStart: row.week_start_date,
        weekEnd: row.week_end_date,
        muscleGroupSets: row.muscle_group_sets,
        muscleGroupVolumes: row.muscle_group_volumes,
        week: row.week_number,
        year: row.year
      }))
    }
    return [];
  }

  async getCurrentDayMacros(userId: string): Promise<UserMacros | null> {
    const criteria = <UserMacrosSearchCriteria>{ userId: userId, date: new Date() };
    const macros = await this.getUserMacros(criteria);
    return macros.length ? macros[0] : null;
  }

  async getUserMacros(userMacrosSearchCriteria: UserMacrosSearchCriteria): Promise<UserMacros[]> {
    const result = await this.database.query(`SELECT * FROM macros.getusermacros($1, $2, $3, $4, $5, $6)`, [
      userMacrosSearchCriteria.userId, userMacrosSearchCriteria.date, userMacrosSearchCriteria.weekStart, userMacrosSearchCriteria.weekEnd,
      userMacrosSearchCriteria.limit, userMacrosSearchCriteria.skip])
    return result.rows.map((row: any) => (<UserMacros>{
      id: row.macro_id,
      userId: row.user_id,
      date: row.date,
      macros: row.macros,
      totals: row.totals
    }))
  }

  async deleteUserMacros(macrosId: string): Promise<boolean> {
    try {
      await this.database.query(`SELECT * FROM macros.deletemacros($1)`, [macrosId]);
      return true;
    } catch (error) {
      return false;
    }
  }

  async upsertWeeklyWorkoutPlan(payload: any): Promise<string> {
    try {
      const result = await this.database.query(`SELECT workout.upsert_weekly_workout_plan($1, $2)`, [
        payload.userId, 
        JSON.stringify(payload.weekDays)
      ]);
      return 'Complete'
    } catch (error) {
      console.error('Error upserting weekly workout plan:', error);
      return 'ERROR'
    }
  }

  async getWeeklyWorkoutPlan(date: Date, userId: string): Promise<any> {
    const result = await this.database.query(`SELECT * FROM workout.get_weekly_workout_plans($1, $2)`, [userId, date])
    if (result.rowCount) {
      return result.rows.map((row: any) => ({
        workoutDate: row.workout_date,
        exercises: row.exercises,
      }));
    }

    return [];
  }

  async getUserData(userId: string): Promise<User | null> {
    const result = await this.database.query(`SELECT * FROM admin.getuser($1)`, [userId])
    if (result.rowCount) {
      const user = result.rows[0];
      return {
        displayName: user.name,
        id: userId,
        email: user.email,
        createdAt: user.created_at,
        lastLoginAt: user.last_login
      }
    }
    return null
  }

  async getUserExercisePRs(userExercisePRSearchCriteria: UserExercisePRSearchCriteria): Promise<UserExerciseSummary[]> {
    const result = await this.database.query(`SELECT * FROM exercise.getuserexerciseprs($1, $2, $3, $4, $5)`, [
      userExercisePRSearchCriteria.userId, 
      userExercisePRSearchCriteria.exerciseId,
      userExercisePRSearchCriteria.limit, 
      userExercisePRSearchCriteria.skip,
      userExercisePRSearchCriteria.searchQuery
    ]);

    const exercisePRs = result.rows.map((row: any) => (<UserExerciseSummary>{
      userId: row.user_id,
      exerciseName: row.exercise_name,
      maxWeightPR: row.weight_pr,
      maxWeightPRDate: row.weight_pr_date,
      maxVolumePR: row.volume_pr,
      maxVolumePRDate: row.volume_pr_date,
      max1RMPR: row.estimated_1rm,
      max1RMPRDate: row.estimated_1rm_date
    }));

    return exercisePRs;
  }

  async getComprehensiveWorkoutAnalytics(userId: string, startDate?: string, endDate?: string): Promise<any> {
    const result = await this.database.query(`SELECT analytics.get_comprehensive_workout_analytics($1, $2, $3)`, [
      userId, 
      startDate || null, 
      endDate || null
    ]);
    
    return result.rows.length ? result.rows[0].get_comprehensive_workout_analytics : {};
  }

  async appendUser(user: User): Promise<boolean> {
    const result = await this.database.query(`SELECT * FROM admin.adduser($1, $2, $3, $4, $5)`, [user.id, user.email, user.displayName,
    user.createdAt, user.lastLoginAt
    ]);
    return true
  }

  async getUsersWithPlannedExercises(date: Date): Promise<any[]> {
    const result = await this.database.query(`SELECT * FROM workout.get_users_with_planned_exercises($1)`, [date]);
    return result.rows.map((row: any) => ({
      userId: row.user_id,
      exercises: row.exercises
    }));
  }


}