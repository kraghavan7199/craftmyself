CREATE SCHEMA exercise;
CREATE SCHEMA workout;
CREATE SCHEMA summary;
CREATE SCHEMA admin;
CREATE SCHEMA macros;

CREATE TABLE IF NOT EXISTS exercise.exercises (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    muscleGroupName VARCHAR(255) NOT NULL,
    muscleGroupCode VARCHAR(255) NOT NULL
);


CREATE TABLE IF NOT EXISTS admin.users(
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    display_name VARCHAR(255) NOT NULL,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS workout.user_workouts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    muscle_group_sets JSONB NOT NULL,
    muscle_group_volumes JSONB NOT NULL,
    FOREIGN KEY (user_id) REFERENCES admin.users(id)
);

CREATE TABLE IF NOT EXISTS exercise.user_workout_exercises (
    id SERIAL PRIMARY KEY,
    user_workout_id VARCHAR(36) NOT NULL,
    exercise_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (user_workout_id) REFERENCES workout.user_workouts(id),
    FOREIGN KEY (exercise_id) REFERENCES exercise.exercises(id)
);

CREATE TABLE IF NOT EXISTS exercise.user_workout_exercise_set (
    id SERIAL PRIMARY KEY,
    user_workout_exercise_id INT NOT NULL,
    set_number INT NOT NULL,
    reps INT NOT NULL, 
    weight DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_workout_exercise_id) REFERENCES exercise.user_workout_exercises(id)
);

CREATE TABLE IF NOT EXISTS summary.user_weekly_summary (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    muscle_group_sets JSONB NOT NULL,
    muscle_group_volumes JSONB NOT NULL,
    FOREIGN KEY (user_id) REFERENCES admin.users(id),
    CONSTRAINT unique_user_week UNIQUE (user_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS exercise.user_exercise_prs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    exercise_id VARCHAR(36) NOT NULL,
    weight_pr DECIMAL(10, 2),
    weight_pr_date DATE,
    weight_pr_reps INT,
    volume_pr DECIMAL(10, 2), -- total weight * reps for single workout
    volume_pr_date DATE,
    estimated_1rm DECIMAL(10, 2),
    estimated_1rm_date DATE,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin.users(id),
    FOREIGN KEY (exercise_id) REFERENCES exercise.exercises(id),
    CONSTRAINT unique_user_exercise_pr UNIQUE (user_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS macros.user_daily_macros (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    macros JSONB NOT NULL,
    totals JSONB NOT NULL, 
    FOREIGN KEY (user_id) REFERENCES admin.users(id),
    CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS workout.user_weekly_plans (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    week_days JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin.users(id),
    CONSTRAINT unique_user_week_plan UNIQUE (user_id, week_start)
);

CREATE OR REPLACE FUNCTION workout.getuserworkouts(
	p_user_id character varying,
	p_date date DEFAULT NULL::date,
	p_week_start date DEFAULT NULL::date,
	p_week_end date DEFAULT NULL::date,
	p_limit integer DEFAULT NULL::integer,
	p_skip integer DEFAULT 0)
    RETURNS TABLE(workout_id character varying, user_id character varying, created_at timestamp without time zone, updated_at timestamp without time zone, muscle_group_sets jsonb, muscle_group_volumes jsonb, exercises jsonb) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
    RETURN QUERY
    WITH filtered_workouts AS (
        SELECT * 
        FROM workout.user_workouts uw
        WHERE uw.user_id = p_user_id
            AND (
                (p_date IS NOT NULL AND DATE(uw.created_at) = DATE(p_date))
                OR (p_week_start IS NOT NULL AND p_week_end IS NOT NULL 
                    AND DATE(uw.created_at) >= p_week_start 
                    AND DATE(uw.created_at) <= p_week_end)
                OR (p_date IS NULL AND p_week_start IS NULL AND p_week_end IS NULL)
            )
         ORDER BY uw.created_at DESC
        LIMIT CASE WHEN p_limit IS NOT NULL THEN p_limit ELSE NULL END
        OFFSET p_skip
    ),
    exercise_sets_agg AS (
        SELECT 
            uwes.user_workout_exercise_id,
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', uwes.id,
                    'setNumber', uwes.set_number,
                    'reps', uwes.reps,
                    'weight', uwes.weight,
                    'timestamp', TO_CHAR(uwes.created_at, 'YYYY-MM-DD"T"HH24:MI:SS.US') || 'Z'
                ) ORDER BY uwes.set_number
            ) AS sets
        FROM exercise.user_workout_exercise_set uwes
        INNER JOIN exercise.user_workout_exercises uwe ON uwes.user_workout_exercise_id = uwe.id
        INNER JOIN filtered_workouts fw ON uwe.user_workout_id = fw.id
        GROUP BY uwes.user_workout_exercise_id
    ),
    workout_exercises_agg AS (
        SELECT 
            fw.id AS workout_id,
            fw.user_id,
            fw.created_at,
            fw.updated_at,
            fw.muscle_group_sets,
            fw.muscle_group_volumes,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'exerciseId', uwe.exercise_id,
                        'exerciseName', e.name,
                        'muscleGroupName', e.muscleGroupName,
                        'muscleGroupCode', e.muscleGroupCode,
                        'userWorkoutExerciseId', uwe.id,
                        'sets', COALESCE(esa.sets, '[]'::json)
                    ) ORDER BY uwe.id
                ) FILTER (WHERE uwe.exercise_id IS NOT NULL),
                '[]'::json
            ) AS exercises
        FROM filtered_workouts fw
        LEFT JOIN exercise.user_workout_exercises uwe ON fw.id = uwe.user_workout_id
        LEFT JOIN exercise.exercises e ON uwe.exercise_id = e.id
        LEFT JOIN exercise_sets_agg esa ON uwe.id = esa.user_workout_exercise_id
        GROUP BY fw.id, fw.user_id, fw.created_at, fw.updated_at, fw.muscle_group_sets, fw.muscle_group_volumes
    )
    SELECT 
        wea.workout_id,
        wea.user_id,
        wea.created_at,
        wea.updated_at,
        wea.muscle_group_sets,
        wea.muscle_group_volumes,
        wea.exercises::jsonb
    FROM workout_exercises_agg wea
    ORDER BY wea.created_at DESC;
END;
$BODY$;

CREATE OR REPLACE FUNCTION workout.upsertuserworkout(
	p_workout_id character varying,
	p_user_id character varying,
	p_date timestamp without time zone,
	p_exercises jsonb,
	p_muscle_group_volumes jsonb DEFAULT NULL::jsonb,
	p_muscle_group_sets jsonb DEFAULT NULL::jsonb)
    RETURNS TABLE(workout_id character varying, updated_at timestamp without time zone) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    v_workout_id VARCHAR(36);
    v_created_at TIMESTAMP;
    v_updated_at TIMESTAMP;
    r_exercise RECORD;
BEGIN
    -- Upsert the main workout record
    INSERT INTO workout.user_workouts (
        id,
        user_id,
        created_at,
        updated_at,
        muscle_group_sets,
        muscle_group_volumes
    )
    VALUES (
        p_workout_id,
        p_user_id,
        COALESCE(p_date, CURRENT_TIMESTAMP),
        CURRENT_TIMESTAMP,
        COALESCE(p_muscle_group_sets, '{}'::jsonb),
        COALESCE(p_muscle_group_volumes, '{}'::jsonb)
    )
    ON CONFLICT (id) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP,
        muscle_group_sets = COALESCE(p_muscle_group_sets, workout.user_workouts.muscle_group_sets),
        muscle_group_volumes = COALESCE(p_muscle_group_volumes, workout.user_workouts.muscle_group_volumes)
    RETURNING id, created_at, workout.user_workouts.updated_at INTO v_workout_id, v_created_at, v_updated_at;

    -- Delete existing exercises for this workout (we'll recreate them)
    DELETE FROM exercise.user_workout_exercise_set 
    WHERE user_workout_exercise_id IN (
        SELECT id FROM exercise.user_workout_exercises 
        WHERE user_workout_id = v_workout_id
    );
    
    DELETE FROM exercise.user_workout_exercises 
    WHERE user_workout_id = v_workout_id;

    -- Insert new exercises and sets
    WITH exercise_data AS (
        SELECT 
            jsonb_array_elements(p_exercises) AS exercise_json
    ),
    inserted_exercises AS (
        INSERT INTO exercise.user_workout_exercises (
            user_workout_id,
            exercise_id
        )
        SELECT 
            v_workout_id,
            (exercise_json->>'exerciseId')::VARCHAR(36)
        FROM exercise_data
        RETURNING id, exercise_id
    ),
    exercise_sets_data AS (
        SELECT 
            ie.id AS user_workout_exercise_id,
            ie.exercise_id,
            (set_json->>'reps')::INT AS reps,
            (set_json->>'weight')::DECIMAL(10,2) AS weight,
            (set_json->>'timestamp')::TIMESTAMP AS set_timestamp,
            ROW_NUMBER() OVER (
                PARTITION BY ie.id 
                ORDER BY (set_json->>'timestamp')::TIMESTAMP
            ) AS set_number
        FROM exercise_data ed
        CROSS JOIN inserted_exercises ie
        CROSS JOIN jsonb_array_elements(ed.exercise_json->'sets') AS set_json
        WHERE ie.exercise_id = (ed.exercise_json->>'exerciseId')::VARCHAR(36)
    )
    INSERT INTO exercise.user_workout_exercise_set (
        user_workout_exercise_id,
        set_number,
        reps,
        weight,
        created_at
    )
    SELECT 
        user_workout_exercise_id,
        set_number,
        reps,
        weight,
        COALESCE(set_timestamp, CURRENT_TIMESTAMP)
    FROM exercise_sets_data;

        FOR r_exercise IN
        SELECT DISTINCT (exercise_json->>'exerciseId')::VARCHAR(36) AS exercise_id
        FROM jsonb_array_elements(p_exercises) AS exercise_json
    LOOP
        PERFORM exercise.updateexercisepr(p_user_id, r_exercise.exercise_id);
    END LOOP;

    PERFORM summary.updateWeeklySummary(p_user_id);

    RETURN QUERY
    SELECT v_workout_id,v_updated_at;

END;
$BODY$;

CREATE OR REPLACE FUNCTION summary.updateWeeklySummary(
    p_user_id VARCHAR(36)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_week_start DATE;
    v_current_week_end DATE;
    v_summary_id VARCHAR(36);
BEGIN
    -- Calculate current week boundaries (Monday to Sunday)
    v_current_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;
    v_current_week_end := (v_current_week_start + INTERVAL '6 days')::DATE;

    -- Generate UUID for summary record
    v_summary_id := gen_random_uuid()::VARCHAR(36);

    -- Calculate aggregated muscle group data for the current week
    WITH weekly_workout_data AS (
        SELECT 
            uw.user_id,
            uw.muscle_group_sets,
            uw.muscle_group_volumes
        FROM workout.user_workouts uw
        WHERE uw.user_id = p_user_id
            AND DATE(uw.created_at) >= v_current_week_start
            AND DATE(uw.created_at) <= v_current_week_end
    ),
    aggregated_data AS (
        SELECT 
            p_user_id AS user_id,
            COUNT(*) AS workouts_count,
            -- Aggregate muscle group sets
            JSONB_BUILD_OBJECT(
                'chest', COALESCE(SUM((muscle_group_sets->>'chest')::NUMERIC), 0),
                'back', COALESCE(SUM((muscle_group_sets->>'back')::NUMERIC), 0),
                'legs', COALESCE(SUM((muscle_group_sets->>'legs')::NUMERIC), 0),
                'shoulders', COALESCE(SUM((muscle_group_sets->>'shoulders')::NUMERIC), 0),
                'biceps', COALESCE(SUM((muscle_group_sets->>'biceps')::NUMERIC), 0),
                'triceps', COALESCE(SUM((muscle_group_sets->>'triceps')::NUMERIC), 0),
                'core', COALESCE(SUM((muscle_group_sets->>'core')::NUMERIC), 0),
                'forearms', COALESCE(SUM((muscle_group_sets->>'forearms')::NUMERIC), 0)
            ) AS total_sets,
            -- Aggregate muscle group volumes
            JSONB_BUILD_OBJECT(
                'chest', COALESCE(SUM((muscle_group_volumes->>'chest')::NUMERIC), 0),
                'back', COALESCE(SUM((muscle_group_volumes->>'back')::NUMERIC), 0),
                'legs', COALESCE(SUM((muscle_group_volumes->>'legs')::NUMERIC), 0),
                'shoulders', COALESCE(SUM((muscle_group_volumes->>'shoulders')::NUMERIC), 0),
                'biceps', COALESCE(SUM((muscle_group_volumes->>'biceps')::NUMERIC), 0),
                'triceps', COALESCE(SUM((muscle_group_volumes->>'triceps')::NUMERIC), 0),
                'core', COALESCE(SUM((muscle_group_volumes->>'core')::NUMERIC), 0)
            ) AS total_volumes
        FROM weekly_workout_data
    )
    -- Upsert the weekly summary
    INSERT INTO summary.user_weekly_summary (
        id,
        user_id,
        week_start_date,
        week_end_date,
        muscle_group_sets,
        muscle_group_volumes
    )
    SELECT 
        v_summary_id,
        ad.user_id,
        v_current_week_start,
        v_current_week_end,
        ad.total_sets,
        ad.total_volumes
    FROM aggregated_data ad
    ON CONFLICT (user_id, week_start_date) DO UPDATE SET
        week_end_date = v_current_week_end,
        muscle_group_sets = EXCLUDED.muscle_group_sets,
        muscle_group_volumes = EXCLUDED.muscle_group_volumes;

    -- Return the updated summary data
  

END;
$$;


CREATE OR REPLACE FUNCTION exercise.updateexercisepr(
    p_user_id VARCHAR(36),
    p_exercise_id VARCHAR(36)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_has_data BOOLEAN := FALSE;
BEGIN
    -- Check if user has any workout data for this exercise
    SELECT EXISTS(
        SELECT 1 
        FROM exercise.user_workout_exercise_set uwes
        INNER JOIN exercise.user_workout_exercises uwe ON uwes.user_workout_exercise_id = uwe.id
        INNER JOIN workout.user_workouts uw ON uwe.user_workout_id = uw.id
        WHERE uw.user_id = p_user_id 
            AND uwe.exercise_id = p_exercise_id
    ) INTO v_has_data;

    -- If no data exists, delete any existing PR record
    IF NOT v_has_data THEN
        DELETE FROM exercise.user_exercise_prs 
        WHERE user_id = p_user_id AND exercise_id = p_exercise_id;
        RETURN;
    END IF;

    -- Calculate PRs from all workout sets for this user/exercise combination
    WITH exercise_sets AS (
        SELECT 
            uwes.weight,
            uwes.reps,
            DATE(uw.created_at) AS workout_date,
            uw.created_at AS workout_timestamp,
            -- Calculate estimated 1RM using Epley formula: weight * (1 + reps/30)
            CASE 
                WHEN uwes.reps = 1 THEN uwes.weight
                ELSE ROUND(uwes.weight * (1 + uwes.reps::DECIMAL / 30), 2)
            END AS estimated_1rm,
            -- Calculate volume for this set (weight * reps)
            (uwes.weight * uwes.reps) AS set_volume
        FROM exercise.user_workout_exercise_set uwes
        INNER JOIN exercise.user_workout_exercises uwe ON uwes.user_workout_exercise_id = uwe.id
        INNER JOIN workout.user_workouts uw ON uwe.user_workout_id = uw.id
        WHERE uw.user_id = p_user_id 
            AND uwe.exercise_id = p_exercise_id
    ),
    workout_volumes AS (
        SELECT 
            workout_date,
            SUM(set_volume) AS total_workout_volume
        FROM exercise_sets
        GROUP BY workout_date
    ),
    pr_calculations AS (
        SELECT 
            -- Weight PR (heaviest single set)
            (SELECT es.weight FROM exercise_sets es ORDER BY es.weight DESC, es.workout_timestamp DESC LIMIT 1) AS max_weight,
            (SELECT es.workout_date FROM exercise_sets es ORDER BY es.weight DESC, es.workout_timestamp DESC LIMIT 1) AS max_weight_date,
            (SELECT es.reps FROM exercise_sets es ORDER BY es.weight DESC, es.workout_timestamp DESC LIMIT 1) AS max_weight_reps,
            
            -- Volume PR (highest single workout volume)
            (SELECT wv.total_workout_volume FROM workout_volumes wv ORDER BY wv.total_workout_volume DESC LIMIT 1) AS max_volume,
            (SELECT wv.workout_date FROM workout_volumes wv ORDER BY wv.total_workout_volume DESC LIMIT 1) AS max_volume_date,
            
            -- 1RM PR (highest estimated 1RM)
            (SELECT es.estimated_1rm FROM exercise_sets es ORDER BY es.estimated_1rm DESC, es.workout_timestamp DESC LIMIT 1) AS max_1rm,
            (SELECT es.workout_date FROM exercise_sets es ORDER BY es.estimated_1rm DESC, es.workout_timestamp DESC LIMIT 1) AS max_1rm_date
    )
    -- Upsert the PR record (we know data exists at this point)
    INSERT INTO exercise.user_exercise_prs (
        user_id,
        exercise_id,
        weight_pr,
        weight_pr_date,
        weight_pr_reps,
        volume_pr,
        volume_pr_date,
        estimated_1rm,
        estimated_1rm_date,
        last_calculated
    )
    SELECT 
        p_user_id,
        p_exercise_id,
        pc.max_weight,
        pc.max_weight_date,
        pc.max_weight_reps,
        pc.max_volume,
        pc.max_volume_date,
        pc.max_1rm,
        pc.max_1rm_date,
        CURRENT_TIMESTAMP
    FROM pr_calculations pc
    ON CONFLICT (user_id, exercise_id) DO UPDATE SET
        weight_pr = EXCLUDED.weight_pr,
        weight_pr_date = EXCLUDED.weight_pr_date,
        weight_pr_reps = EXCLUDED.weight_pr_reps,
        volume_pr = EXCLUDED.volume_pr,
        volume_pr_date = EXCLUDED.volume_pr_date,
        estimated_1rm = EXCLUDED.estimated_1rm,
        estimated_1rm_date = EXCLUDED.estimated_1rm_date,
        last_calculated = CURRENT_TIMESTAMP;

END;
$$;


CREATE OR REPLACE FUNCTION exercise.getuserexercisepr(
    p_user_id VARCHAR(36),
    p_exercise_id VARCHAR(36)
)
RETURNS TABLE (
    pr_id INT,
    user_id VARCHAR(36),
    exercise_id VARCHAR(36),
    exercise_name VARCHAR(255),
    weight_pr DECIMAL(10, 2),
    weight_pr_date DATE,
    weight_pr_reps INT,
    volume_pr DECIMAL(10, 2),
    volume_pr_date DATE,
    estimated_1rm DECIMAL(10, 2),
    estimated_1rm_date DATE,
    last_calculated TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uep.id AS pr_id,
        uep.user_id,
        uep.exercise_id,
        e.name AS exercise_name,
        uep.weight_pr,
        uep.weight_pr_date,
        uep.weight_pr_reps,
        uep.volume_pr,
        uep.volume_pr_date,
        uep.estimated_1rm,
        uep.estimated_1rm_date,
        uep.last_calculated
    FROM exercise.user_exercise_prs uep
    INNER JOIN exercise.exercises e ON uep.exercise_id = e.id
    WHERE uep.user_id = p_user_id 
        AND uep.exercise_id = p_exercise_id;
END;
$$;

CREATE OR REPLACE FUNCTION exercise.getuserexercisepr(
    p_user_id VARCHAR(36),
    p_exercise_id VARCHAR(36)
)
RETURNS TABLE (
    pr_id INT,
    user_id VARCHAR(36),
    exercise_id VARCHAR(36),
    exercise_name VARCHAR(255),
    weight_pr DECIMAL(10, 2),
    weight_pr_date DATE,
    weight_pr_reps INT,
    volume_pr DECIMAL(10, 2),
    volume_pr_date DATE,
    estimated_1rm DECIMAL(10, 2),
    estimated_1rm_date DATE,
    last_calculated TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uep.id AS pr_id,
        uep.user_id,
        uep.exercise_id,
        e.name AS exercise_name,
        uep.weight_pr,
        uep.weight_pr_date,
        uep.weight_pr_reps,
        uep.volume_pr,
        uep.volume_pr_date,
        uep.estimated_1rm,
        uep.estimated_1rm_date,
        uep.last_calculated
    FROM exercise.user_exercise_prs uep
    INNER JOIN exercise.exercises e ON uep.exercise_id = e.id
    WHERE uep.user_id = p_user_id 
        AND uep.exercise_id = p_exercise_id;
END;
$$;

    CREATE OR REPLACE FUNCTION workout.deleteuserworkout(
        p_workout_id character varying)
        RETURNS void
        LANGUAGE 'plpgsql'
        COST 100
        VOLATILE PARALLEL UNSAFE
    AS $BODY$
    DECLARE
        v_user_id VARCHAR(36);
        exercise_id VARCHAR(36);
        v_affected_exercises VARCHAR(36)[];
    BEGIN
        SELECT 
            uw.user_id,
            ARRAY_AGG(DISTINCT uwe.exercise_id)
        INTO v_user_id, v_affected_exercises
        FROM workout.user_workouts uw
        LEFT JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        WHERE uw.id = p_workout_id
        GROUP BY uw.user_id;

        DELETE FROM exercise.user_workout_exercise_set 
        WHERE user_workout_exercise_id IN (
            SELECT id FROM exercise.user_workout_exercises 
            WHERE user_workout_id = p_workout_id
        );

        DELETE FROM exercise.user_workout_exercises WHERE user_workout_id = p_workout_id;

        DELETE FROM workout.user_workouts WHERE id = p_workout_id;

        IF v_affected_exercises IS NOT NULL AND array_length(v_affected_exercises, 1) > 0 THEN
            v_affected_exercises := array_remove(v_affected_exercises, NULL);
            
            FOR exercise_id IN SELECT * FROM unnest(v_affected_exercises) WHERE unnest IS NOT NULL
            LOOP
                PERFORM exercise.updateexercisepr(v_user_id, exercise_id);
            END LOOP;
        END IF;

        PERFORM summary.updateWeeklySummary(v_user_id);

    END;
    $BODY$;


CREATE OR REPLACE FUNCTION summary.getuserweeklysummary(
    p_user_id VARCHAR(36)
)
RETURNS TABLE (
    summary_id VARCHAR(36),
    user_id VARCHAR(36),
    week_start_date DATE,
    week_end_date DATE,
    muscle_group_sets JSONB,
    muscle_group_volumes JSONB,
    week_number INT,
    year INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uws.id AS summary_id,
        uws.user_id,
        uws.week_start_date,
        uws.week_end_date,
        uws.muscle_group_sets,
        uws.muscle_group_volumes,
        EXTRACT(WEEK FROM uws.week_start_date)::INT AS week_number,
        EXTRACT(YEAR FROM uws.week_start_date)::INT AS year
    FROM summary.user_weekly_summary uws
    WHERE uws.user_id = p_user_id
    ORDER BY uws.week_start_date ASC;
END;
$$;


CREATE OR REPLACE FUNCTION exercise.getuserexerciseprs(
    p_user_id VARCHAR(36),
	p_exercise_id VARCHAR(36) DEFAULT NULL,
    p_limit INT DEFAULT NULL,
    p_skip INT DEFAULT 0
)
RETURNS TABLE (
    pr_id INT,
    user_id VARCHAR(36),
    exercise_id VARCHAR(36),
    exercise_name VARCHAR(255),
    weight_pr DECIMAL(10, 2),
    weight_pr_date DATE,
    weight_pr_reps INT,
    volume_pr DECIMAL(10, 2),
    volume_pr_date DATE,
    estimated_1rm DECIMAL(10, 2),
    estimated_1rm_date DATE,
    last_calculated TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uep.id AS pr_id,
        uep.user_id,
        uep.exercise_id,
        e.name AS exercise_name,
        uep.weight_pr,
        uep.weight_pr_date,
        uep.weight_pr_reps,
        uep.volume_pr,
        uep.volume_pr_date,
        uep.estimated_1rm,
        uep.estimated_1rm_date,
        uep.last_calculated
    FROM exercise.user_exercise_prs uep
    INNER JOIN exercise.exercises e ON uep.exercise_id = e.id
    WHERE uep.user_id = p_user_id 
    AND ((p_exercise_id IS NULL) OR (uep.exercise_id = p_exercise_id))
    ORDER BY uep.estimated_1rm DESC NULLS LAST, e.name ASC
    LIMIT CASE WHEN p_limit IS NOT NULL THEN p_limit ELSE NULL END
    OFFSET p_skip;
END;
$$;



CREATE OR REPLACE FUNCTION macros.getusermacros(
    p_user_id VARCHAR(36),
    p_date DATE DEFAULT NULL,
    p_week_start DATE DEFAULT NULL,
    p_week_end DATE DEFAULT NULL,
    p_limit INT DEFAULT NULL,
    p_skip INT DEFAULT 0
)
RETURNS TABLE (
    macro_id VARCHAR(36),
    user_id VARCHAR(36),
    date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    macros JSONB,
    totals JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        udm.id AS macro_id,
        udm.user_id,
        udm.date,
        udm.created_at,
        udm.updated_at,
        udm.macros,
        udm.totals
    FROM macros.user_daily_macros udm
    WHERE udm.user_id = p_user_id
        AND (
            -- If specific date is provided, filter by that date
            (p_date IS NOT NULL AND udm.date = p_date)
            OR
            -- If week range is provided, filter by week range
            (p_week_start IS NOT NULL AND p_week_end IS NOT NULL 
             AND udm.date >= p_week_start 
             AND udm.date <= p_week_end)
            OR
            -- If no date filters provided, return all macros for user
            (p_date IS NULL AND p_week_start IS NULL AND p_week_end IS NULL)
        )
    ORDER BY udm.date DESC
    LIMIT CASE WHEN p_limit IS NOT NULL THEN p_limit ELSE NULL END
    OFFSET p_skip;
END;
$$;

CREATE OR REPLACE FUNCTION macros.addmacros(
    p_id VARCHAR(36),
    p_user_id VARCHAR(36),
    p_date DATE,
    p_macros JSONB,
    p_totals JSONB
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_macro_id VARCHAR(36);
    v_created_at TIMESTAMP;
    v_updated_at TIMESTAMP;
BEGIN
    -- Upsert the macro record
    INSERT INTO macros.user_daily_macros (
        id,
        user_id,
        date,
        created_at,
        updated_at,
        macros,
        totals
    )
    VALUES (
        p_id,
        p_user_id,
        p_date,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        p_macros,
        p_totals
    )
    ON CONFLICT (user_id, date) DO UPDATE SET
        id = EXCLUDED.id,
        updated_at = CURRENT_TIMESTAMP,
        macros = EXCLUDED.macros,
        totals = EXCLUDED.totals
    RETURNING id, created_at, updated_at INTO v_macro_id, v_created_at, v_updated_at;

END;
$$;


CREATE OR REPLACE FUNCTION macros.deletemacros(
    p_macro_id VARCHAR(36)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$

BEGIN
    DELETE FROM macros.user_daily_macros 
    WHERE id = p_macro_id;

END;
$$;


    CREATE OR REPLACE FUNCTION workout.upsertweeklyplan(
        p_user_id VARCHAR(36),
        p_week_days JSONB,
        p_week_start DATE,
        p_week_end DATE
    )
    RETURNS VOID
    LANGUAGE plpgsql
    AS $$
    DECLARE
    
        v_week_start_ts TIMESTAMP;
        v_week_end_ts TIMESTAMP;
    BEGIN

    v_week_start_ts := DATE_TRUNC('week', p_week_start::TIMESTAMP);
        v_week_end_ts := v_week_start_ts + INTERVAL '6 days 23 hours 59 minutes 59 seconds 999 milliseconds';
        INSERT INTO workout.user_weekly_plans (
            user_id,
            week_start,
            week_end,
            week_days,
            created_at,
            updated_at
        )
        VALUES (
            v_plan_id,
            p_user_id,
            v_week_start_ts,
            v_week_end_ts,
            p_week_days,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id, week_start) DO UPDATE SET
            id = EXCLUDED.id,
            week_days = EXCLUDED.week_days,
            updated_at = CURRENT_TIMESTAMP;

    END;
    $$;



    CREATE OR REPLACE FUNCTION workout.getweeklyplan(
        p_user_id VARCHAR(36),
        p_date DATE
    )
    RETURNS TABLE (
        plan_id integer,
        user_id VARCHAR(36),
        week_start DATE,
        week_end DATE,
        week_days JSONB,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            uwp.id AS plan_id,
            uwp.user_id,
            uwp.week_start,
            uwp.week_end,
            uwp.week_days,
            uwp.created_at,
            uwp.updated_at
        FROM workout.user_weekly_plans uwp
        WHERE uwp.user_id = p_user_id
            AND p_date >= uwp.week_start
            AND p_date <= uwp.week_end
        LIMIT 1;
    END;
    $$;


   CREATE OR REPLACE FUNCTION admin.adduser(
	p_id character varying,
	p_email character varying,
	p_name character varying,
	p_created_at timestamp without time zone,
	p_last_login timestamp without time zone DEFAULT NULL::timestamp without time zone)
    RETURNS TABLE(user_id character varying, email character varying, name character varying, created_at timestamp without time zone, last_login timestamp without time zone, was_created boolean, message text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
DECLARE
    v_user_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(
        SELECT 1 FROM admin.users WHERE id = p_id
    ) INTO v_user_exists;

    IF v_user_exists IS FALSE THEN
    INSERT INTO admin.users (
        id,
        email,
        display_name,
        created_at,
        last_login
    )
    VALUES (
        p_id,
        p_email,
        p_name,
        p_created_at,
        p_last_login
    );
    END IF;

END;
$BODY$;

CREATE OR REPLACE FUNCTION admin.getuser(
    p_user_id VARCHAR(36)
)
RETURNS TABLE (
    user_id VARCHAR(36),
    email VARCHAR(255),
    name VARCHAR(255),
    created_at TIMESTAMP,
    last_login TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.email,
        u.name,
        u.created_at,
        u.last_login
    FROM admin.users u
    WHERE u.id = p_user_id;
END;
$$;