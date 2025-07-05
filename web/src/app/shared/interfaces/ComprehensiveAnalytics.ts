export interface ComprehensiveAnalytics {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  basicMetrics: {
    totalVolume: number;
    totalWorkoutDays: number;
    totalWorkouts: number;
    avgVolumePerWorkout: number;
    totalSets: number;
    totalReps: number;
    avgRepsPerSet: number;
    avgSetsPerExercise: number;
    trainingDensity: number;
  };
  patternAnalysis: {
    trainingFrequency: number;
    weeklyAvgWorkouts: number;
    dayAnalysis: Array<{
      dayOfWeek: number;
      workouts: number;
      activityScore: number;
    }>;
  };
  muscleAnalysis: {
    muscleGroupData: Array<{
      muscleGroup: string;
      sessions: number;
      totalVolume: number;
      volumePercentage: number;
      trainingDays: number;
    }>;
    balanceScore: number;
  };
  repAnalysis: {
    repRangeDistribution: Array<{
      range: string;
      sets: number;
      volume: number;
      percentage: number;
      avgWeight: number;
    }>;
  };
  prTracking: {
    personalRecords: Array<{
      exerciseName: string;
      weightPR: number;
      weightPRDate: string;
      volumePR: number;
      volumePRDate: string;
      estimated1RM: number;
      estimated1RMDate: string;
      daysSinceWeightPR: number;
      daysSince1RMPR: number;
    }>;
    totalPRs: number;
    avgDaysSinceWeightPR: number;
    avgDaysSince1RMPR: number;
  };
  progression: {
    monthlyProgression: Array<{
      month: string;
      volume: number;
      avgWeight: number;
      workouts: number;
      volumeProgression: number;
      weightProgression: number;
    }>;
  };
  trainingLoad: {
    trainingLoad: Array<{
      date: string;
      dailyTSS: number;
      acuteLoad: number;
      chronicLoad: number;
      trainingStressBalance: number;
      fatigueRatio: number;
    }>;
  };
  recovery: {
    recoveryMetrics: {
      avgRestDays: number;
      minRestDays: number;
      maxRestDays: number;
    };
  };
  nutrition: {
    nutritionData: Array<{
      date: string;
      workoutVolume: number;
      calories: string;
      protein: string;
    }>;
  };
  periodization: {
    periodizationBlocks: Array<{
      blockNumber: number;
      volume: number;
      avgWeight: number;
      trainingDays: number;
    }>;
  };
  additionalMetrics: {
    uniqueTrainingDays: number;
    uniqueExercises: number;
    trainingSpanDays: number;
    avgDailyVolume: number;
    avgSetsPerDay: number;
  };
}