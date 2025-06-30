

export interface UserWorkout {
  id: string
  userId: string;
  date: Date
  exercises: ExerciseEntry[];
  muscleGroupVolumes?: MuscleGroupVolumes;
  muscleGroupSets?: MuscleGroupSets;
}

export interface ExerciseEntry {
  exerciseId: string;
  sets: { reps: number, weight: number, timestamp: Date }[]
  workoutId?: string;
  exerciseName?: string
  muscleGroupCode: string;
  muscleGroupName: string;
}

export interface MuscleGroupVolumes {
  back: number;
  biceps: number;
  chest: number;
  core: number;
  legs: number;
  shoulders: number;
  triceps: number;
}

export interface MuscleGroupSets {
  chest: number;
  back: number;
  legs: number;
  shoulders: number;
  biceps: number;
  triceps: number;
  core: number;
  forearms: number;
}