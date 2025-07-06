CREATE SCHEMA exercise;
CREATE SCHEMA workout;
CREATE SCHEMA summary;
CREATE SCHEMA admin;
CREATE SCHEMA macros;
CREATE SCHEMA analytics;

-- Create Metabase user (database creation must be done separately)
CREATE USER metabase_user WITH PASSWORD 'metabase_password';

-- Grant read permissions to Metabase user for analytics
GRANT USAGE ON SCHEMA exercise TO metabase_user;
GRANT USAGE ON SCHEMA workout TO metabase_user;
GRANT USAGE ON SCHEMA summary TO metabase_user;
GRANT USAGE ON SCHEMA admin TO metabase_user;
GRANT USAGE ON SCHEMA macros TO metabase_user;
GRANT USAGE ON SCHEMA analytics TO metabase_user;

GRANT SELECT ON ALL TABLES IN SCHEMA exercise TO metabase_user;
GRANT SELECT ON ALL TABLES IN SCHEMA workout TO metabase_user;
GRANT SELECT ON ALL TABLES IN SCHEMA summary TO metabase_user;
GRANT SELECT ON ALL TABLES IN SCHEMA admin TO metabase_user;
GRANT SELECT ON ALL TABLES IN SCHEMA macros TO metabase_user;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics TO metabase_user;

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

CREATE TABLE IF NOT EXISTS workout.user_workout_plans (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin.users(id),
    CONSTRAINT unique_user_date_plan UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS workout.user_workout_plan_exercises (
    id SERIAL PRIMARY KEY,
	user_workout_plan_id INT NOT NULL,
    exercise_id VARCHAR(36) NOT NULL,
	FOREIGN KEY (user_workout_plan_id) REFERENCES workout.user_workout_plans(id),
	FOREIGN KEY (exercise_id) REFERENCES exercise.exercises(id)
);

CREATE OR REPLACE FUNCTION workout.getuserworkouts(
	p_user_id character varying,
	p_date date DEFAULT NULL::date,
	p_week_start date DEFAULT NULL::date,
	p_week_end date DEFAULT NULL::date,
	p_limit integer DEFAULT NULL::integer,
	p_skip integer DEFAULT 0,
	p_timezone text DEFAULT 'UTC')
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
           AND ((p_date IS NULL) OR (DATE(uw.created_at AT TIME ZONE 'UTC' AT TIME ZONE p_timezone) = DATE(p_date)))
    AND ((p_week_start IS NULL) OR (DATE(uw.created_at AT TIME ZONE 'UTC' AT TIME ZONE p_timezone) >= DATE(p_week_start)))
    AND ((p_week_end IS NULL) OR (DATE(uw.created_at AT TIME ZONE 'UTC' AT TIME ZONE p_timezone) <= DATE(p_week_end)))
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
CREATE OR REPLACE FUNCTION summary.updateweeklysummary(
	p_user_id character varying)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
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
                'forearms', COALESCE(SUM((muscle_group_volumes->>'forearms')::NUMERIC), 0),
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
$BODY$;


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
    p_skip INT DEFAULT 0,
    p_search_query VARCHAR(255) DEFAULT NULL
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
    AND ((p_search_query IS NULL) OR (p_search_query = '') OR (LOWER(e.name) LIKE '%' || LOWER(TRIM(p_search_query)) || '%'))
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


CREATE OR REPLACE FUNCTION workout.get_weekly_workout_plans(
    p_user_id VARCHAR(36),
    p_date DATE
)
RETURNS TABLE (
    workout_date DATE,
    exercises JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH week_dates AS (
        SELECT 
            generate_series(
                DATE_TRUNC('week', p_date)::DATE,
                (DATE_TRUNC('week', p_date) + INTERVAL '6 days')::DATE,
                INTERVAL '1 day'
            )::DATE AS date
    ),
    actual_workouts AS (
        SELECT 
            DATE(uw.created_at) AS workout_date,
            COALESCE(
                JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'exerciseId', uwe.exercise_id,
                        'exerciseName', e.name,
                        'muscleGroupName', e.muscleGroupName,
                        'muscleGroupCode', e.muscleGroupCode
                    )
                    ORDER BY e.name
                ) FILTER (WHERE uwe.exercise_id IS NOT NULL),
                '[]'::JSONB
            ) AS exercises
        FROM workout.user_workouts uw
        LEFT JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        LEFT JOIN exercise.exercises e ON uwe.exercise_id = e.id
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) >= DATE_TRUNC('week', p_date)
        AND DATE(uw.created_at) < DATE_TRUNC('week', p_date) + INTERVAL '7 days'
        GROUP BY DATE(uw.created_at)
    ),
    planned_workouts AS (
        SELECT 
            uwp.date AS workout_date,
            COALESCE(
                JSONB_AGG(
                    JSONB_BUILD_OBJECT(
                        'exerciseId', uwpe.exercise_id,
                        'exerciseName', e.name,
                        'muscleGroupName', e.muscleGroupName,
                        'muscleGroupCode', e.muscleGroupCode
                    )
                    ORDER BY e.name
                ) FILTER (WHERE uwpe.exercise_id IS NOT NULL),
                '[]'::JSONB
            ) AS exercises
        FROM workout.user_workout_plans uwp
        LEFT JOIN workout.user_workout_plan_exercises uwpe ON uwp.id = uwpe.user_workout_plan_id
        LEFT JOIN exercise.exercises e ON uwpe.exercise_id = e.id
        WHERE uwp.user_id = p_user_id
        AND uwp.date >= DATE_TRUNC('week', p_date)
        AND uwp.date < DATE_TRUNC('week', p_date) + INTERVAL '7 days'
        GROUP BY uwp.date
    )
    SELECT 
        wd.date AS workout_date,
        COALESCE(
            aw.exercises,
            pw.exercises,
            '[]'::JSONB
        ) AS exercises
    FROM week_dates wd
    LEFT JOIN actual_workouts aw ON wd.date = aw.workout_date
    LEFT JOIN planned_workouts pw ON wd.date = pw.workout_date
    WHERE aw.exercises IS NOT NULL OR pw.exercises IS NOT NULL
    ORDER BY wd.date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION workout.upsert_weekly_workout_plan(
    p_user_id VARCHAR(36),
    p_week_days JSONB
)
RETURNS VOID AS $$
DECLARE
    day_record RECORD;
    exercise_record RECORD;
    plan_id INT;
BEGIN
    -- Loop through each day in the week_days array
    FOR day_record IN 
        SELECT 
            (value->>'date')::DATE AS plan_date,
            value->'exercises' AS exercises
        FROM jsonb_array_elements(p_week_days) AS value
    LOOP
        -- Insert or update the workout plan for this date
        INSERT INTO workout.user_workout_plans (user_id, date, updated_at)
        VALUES (p_user_id, day_record.plan_date, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, date) 
        DO UPDATE SET updated_at = CURRENT_TIMESTAMP
        RETURNING id INTO plan_id;
        
        -- If no conflict occurred, get the id
        IF plan_id IS NULL THEN
            SELECT id INTO plan_id 
            FROM workout.user_workout_plans 
            WHERE user_id = p_user_id AND date = day_record.plan_date;
        END IF;
        
        -- Delete existing exercises for this plan
        DELETE FROM workout.user_workout_plan_exercises 
        WHERE user_workout_plan_id = plan_id;
        
        -- Insert new exercises
        FOR exercise_record IN 
            SELECT 
                (value->>'exerciseId')::VARCHAR(36) AS exercise_id
            FROM jsonb_array_elements(day_record.exercises) AS value
        LOOP
            INSERT INTO workout.user_workout_plan_exercises (user_workout_plan_id, exercise_id)
            VALUES (plan_id, exercise_record.exercise_id);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION workout.get_users_with_planned_exercises(
    p_date DATE
)
RETURNS TABLE (
    user_id VARCHAR(36),
    exercises JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uwp.user_id,
        COALESCE(
            JSONB_AGG(
                JSONB_BUILD_OBJECT(
                    'exerciseId', uwpe.exercise_id,
                    'exerciseName', e.name,
                    'muscleGroupCode', e.musclegroupcode,
                    'muscleGroupName', e.musclegroupname
                )
                ORDER BY e.name
            ) FILTER (WHERE uwpe.exercise_id IS NOT NULL),
            '[]'::JSONB
        ) AS exercises
    FROM workout.user_workout_plans uwp
    LEFT JOIN workout.user_workout_plan_exercises uwpe ON uwp.id = uwpe.user_workout_plan_id
    LEFT JOIN exercise.exercises e ON uwpe.exercise_id = e.id
    WHERE uwp.date = p_date
    AND uwpe.exercise_id IS NOT NULL
    GROUP BY uwp.user_id
    HAVING COUNT(uwpe.exercise_id) > 0;
END;
$$ LANGUAGE plpgsql;





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
	p_user_id character varying)
    RETURNS TABLE(user_id character varying, email character varying, name character varying, created_at timestamp without time zone, last_login timestamp without time zone) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.email,
        u.display_name,
        u.created_at,
        u.last_login
    FROM admin.users u
    WHERE u.id = p_user_id;
END;
$BODY$;
CREATE OR REPLACE FUNCTION exercise.getexercises(
    p_limit INT DEFAULT NULL,
    p_skip INT DEFAULT 0,
    p_search_query VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
    id VARCHAR(36),
    name VARCHAR(255),
    muscleGroupName VARCHAR(255),
    muscleGroupCode VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.musclegroupname AS muscleGroupName,
        e.musclegroupcode AS muscleGroupCode
    FROM exercise.exercises e
    WHERE (
        p_search_query IS NULL 
        OR p_search_query = '' 
        OR LOWER(e.name) LIKE '%' || LOWER(TRIM(p_search_query)) || '%'
        OR LOWER(e.musclegroupname) LIKE '%' || LOWER(TRIM(p_search_query)) || '%'
    )
    ORDER BY e.name ASC
    LIMIT CASE WHEN p_limit IS NOT NULL THEN p_limit ELSE NULL END
    OFFSET p_skip;
END;
$$;

CREATE OR REPLACE FUNCTION analytics.get_comprehensive_workout_analytics(
    p_user_id VARCHAR(36),
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSONB := '{}'::JSONB;
    v_basic_metrics JSONB;
    v_pattern_analysis JSONB;
    v_muscle_analysis JSONB;
    v_rep_analysis JSONB;
    v_pr_tracking JSONB;
    v_progression JSONB;
    v_training_load JSONB;
    v_recovery JSONB;
    v_nutrition JSONB;
    v_periodization JSONB;
    v_additional_metrics JSONB;
BEGIN
    -- Set default date range if not provided (last 90 days)
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '90 days';
    END IF;
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;

    -- 1. Basic Performance Metrics
    WITH workout_data AS (
        SELECT 
            uw.id as workout_id,
            uw.created_at,
            DATE(uw.created_at) as workout_date,
            uwes.weight,
            uwes.reps,
            uwes.set_number,
            e.name as exercise_name,
            e.musclegroupcode,
            (uwes.weight * uwes.reps) as set_volume,
            EXTRACT(HOUR FROM (MAX(uwes.created_at) OVER (PARTITION BY uw.id) - MIN(uwes.created_at) OVER (PARTITION BY uw.id))) * 60 +
            EXTRACT(MINUTE FROM (MAX(uwes.created_at) OVER (PARTITION BY uw.id) - MIN(uwes.created_at) OVER (PARTITION BY uw.id))) as workout_duration
        FROM workout.user_workouts uw
        INNER JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        INNER JOIN exercise.user_workout_exercise_set uwes ON uwe.id = uwes.user_workout_exercise_id
        INNER JOIN exercise.exercises e ON uwe.exercise_id = e.id
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
    ),
    volume_calculations AS (
        SELECT 
            SUM(set_volume) as total_volume,
            COUNT(DISTINCT workout_date) as total_workout_days,
            COUNT(DISTINCT workout_id) as total_workouts,
            SUM(set_volume) / NULLIF(COUNT(DISTINCT workout_id), 0) as avg_volume_per_workout,
            COUNT(*) as total_sets,
            SUM(reps) as total_reps,
            SUM(reps) / NULLIF(COUNT(*), 0) as avg_reps_per_set,
            COUNT(*) / NULLIF(COUNT(DISTINCT exercise_name), 0) as avg_sets_per_exercise,
            SUM(set_volume) / NULLIF(SUM(workout_duration), 0) as training_density
        FROM workout_data
    )
    SELECT jsonb_build_object(
        'totalVolume', COALESCE(vc.total_volume, 0),
        'totalWorkoutDays', COALESCE(vc.total_workout_days, 0),
        'totalWorkouts', COALESCE(vc.total_workouts, 0),
        'avgVolumePerWorkout', COALESCE(vc.avg_volume_per_workout, 0),
        'totalSets', COALESCE(vc.total_sets, 0),
        'totalReps', COALESCE(vc.total_reps, 0),
        'avgRepsPerSet', COALESCE(vc.avg_reps_per_set, 0),
        'avgSetsPerExercise', COALESCE(vc.avg_sets_per_exercise, 0),
        'trainingDensity', COALESCE(vc.training_density, 0)
    ) INTO v_basic_metrics
    FROM volume_calculations vc;

    -- 2. Workout Pattern Analysis
    WITH pattern_data AS (
        SELECT 
            EXTRACT(DOW FROM DATE(uw.created_at)) as day_of_week,
            DATE(uw.created_at) as workout_date,
            COUNT(*) as workouts_count
        FROM workout.user_workouts uw
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(uw.created_at)
    ),
    frequency_metrics AS (
        SELECT 
            COUNT(DISTINCT workout_date) as training_days,
            (p_end_date - p_start_date + 1) as total_days,
            COUNT(DISTINCT workout_date)::DECIMAL / NULLIF((p_end_date - p_start_date + 1), 0) as training_frequency,
            COUNT(DISTINCT workout_date)::DECIMAL / NULLIF(CEIL((p_end_date - p_start_date + 1)::DECIMAL / 7), 0) as weekly_avg_workouts
        FROM pattern_data
    ),
    day_analysis AS (
        SELECT 
            day_of_week,
            COUNT(*) as day_workouts,
            COUNT(*)::DECIMAL / NULLIF((SELECT COUNT(*) FROM pattern_data), 0) * 100 as day_activity_score
        FROM pattern_data
        GROUP BY day_of_week
    )
    SELECT jsonb_build_object(
        'trainingFrequency', COALESCE(fm.training_frequency * 100, 0),
        'weeklyAvgWorkouts', COALESCE(fm.weekly_avg_workouts, 0),
        'dayAnalysis', COALESCE(jsonb_agg(jsonb_build_object(
            'dayOfWeek', da.day_of_week,
            'workouts', da.day_workouts,
            'activityScore', da.day_activity_score
        )), '[]'::jsonb)
    ) INTO v_pattern_analysis
    FROM frequency_metrics fm
    CROSS JOIN day_analysis da
    GROUP BY fm.training_frequency, fm.weekly_avg_workouts;

    -- 3. Muscle Group Training Analysis
    WITH muscle_data AS (
        SELECT 
            e.musclegroupcode,
            COUNT(*) as sessions,
            SUM(uwes.weight * uwes.reps) as total_volume,
            COUNT(DISTINCT DATE(uw.created_at)) as training_days
        FROM workout.user_workouts uw
        INNER JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        INNER JOIN exercise.user_workout_exercise_set uwes ON uwe.id = uwes.user_workout_exercise_id
        INNER JOIN exercise.exercises e ON uwe.exercise_id = e.id
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY e.musclegroupcode
    ),
    muscle_stats AS (
        SELECT 
            AVG(total_volume) as avg_volume,
            STDDEV(total_volume) as std_volume,
            SUM(total_volume) as overall_volume
        FROM muscle_data
    )
    SELECT jsonb_build_object(
        'muscleGroupData', COALESCE(jsonb_agg(jsonb_build_object(
            'muscleGroup', md.musclegroupcode,
            'sessions', md.sessions,
            'totalVolume', md.total_volume,
            'volumePercentage', (md.total_volume / NULLIF(ms.overall_volume, 0) * 100),
            'trainingDays', md.training_days
        )), '[]'::jsonb),
        'balanceScore', CASE 
            WHEN ms.avg_volume > 0 THEN 100 - (ms.std_volume / ms.avg_volume * 100)
            ELSE 0 
        END
    ) INTO v_muscle_analysis
    FROM muscle_data md
    CROSS JOIN muscle_stats ms
    GROUP BY ms.avg_volume, ms.std_volume, ms.overall_volume;

    -- 4. Rep Range Analysis
    WITH rep_ranges AS (
        SELECT 
            CASE 
                WHEN uwes.reps BETWEEN 1 AND 5 THEN 'strength'
                WHEN uwes.reps BETWEEN 6 AND 8 THEN 'power'
                WHEN uwes.reps BETWEEN 9 AND 15 THEN 'hypertrophy'
                ELSE 'endurance'
            END as rep_range,
            COUNT(*) as sets_count,
            SUM(uwes.weight * uwes.reps) as volume,
            AVG(uwes.weight) as avg_weight
        FROM workout.user_workouts uw
        INNER JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        INNER JOIN exercise.user_workout_exercise_set uwes ON uwe.id = uwes.user_workout_exercise_id
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY rep_range
    ),
    total_sets AS (
        SELECT SUM(sets_count) as total FROM rep_ranges
    )
    SELECT jsonb_build_object(
        'repRangeDistribution', COALESCE(jsonb_agg(jsonb_build_object(
            'range', rr.rep_range,
            'sets', rr.sets_count,
            'volume', rr.volume,
            'percentage', (rr.sets_count::DECIMAL / NULLIF(ts.total, 0) * 100),
            'avgWeight', rr.avg_weight
        )), '[]'::jsonb)
    ) INTO v_rep_analysis
    FROM rep_ranges rr
    CROSS JOIN total_sets ts
    GROUP BY ts.total;

    -- 5. Personal Records Tracking
    WITH pr_data AS (
        SELECT 
            e.name as exercise_name,
            uep.weight_pr,
            uep.weight_pr_date,
            uep.volume_pr,
            uep.volume_pr_date,
            uep.estimated_1rm,
            uep.estimated_1rm_date,
            CURRENT_DATE - uep.weight_pr_date as days_since_weight_pr,
            CURRENT_DATE - uep.estimated_1rm_date as days_since_1rm_pr
        FROM exercise.user_exercise_prs uep
        INNER JOIN exercise.exercises e ON uep.exercise_id = e.id
        WHERE uep.user_id = p_user_id
    ),
    pr_stats AS (
        SELECT 
            COUNT(*) as total_prs,
            AVG(days_since_weight_pr) as avg_days_since_weight_pr,
            AVG(days_since_1rm_pr) as avg_days_since_1rm_pr
        FROM pr_data
    )
    SELECT jsonb_build_object(
        'personalRecords', COALESCE(jsonb_agg(jsonb_build_object(
            'exerciseName', pd.exercise_name,
            'weightPR', pd.weight_pr,
            'weightPRDate', pd.weight_pr_date,
            'volumePR', pd.volume_pr,
            'volumePRDate', pd.volume_pr_date,
            'estimated1RM', pd.estimated_1rm,
            'estimated1RMDate', pd.estimated_1rm_date,
            'daysSinceWeightPR', pd.days_since_weight_pr,
            'daysSince1RMPR', pd.days_since_1rm_pr
        )), '[]'::jsonb),
        'totalPRs', COALESCE(ps.total_prs, 0),
        'avgDaysSinceWeightPR', COALESCE(ps.avg_days_since_weight_pr, 0),
        'avgDaysSince1RMPR', COALESCE(ps.avg_days_since_1rm_pr, 0)
    ) INTO v_pr_tracking
    FROM pr_data pd
    CROSS JOIN pr_stats ps
    GROUP BY ps.total_prs, ps.avg_days_since_weight_pr, ps.avg_days_since_1rm_pr;

    -- 6. Progression Analysis
    WITH monthly_data AS (
        SELECT 
            DATE_TRUNC('month', DATE(uw.created_at)) as month,
            SUM(uwes.weight * uwes.reps) as monthly_volume,
            AVG(uwes.weight) as avg_weight,
            COUNT(DISTINCT uw.id) as workouts
        FROM workout.user_workouts uw
        INNER JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        INNER JOIN exercise.user_workout_exercise_set uwes ON uwe.id = uwes.user_workout_exercise_id
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE_TRUNC('month', DATE(uw.created_at))
        ORDER BY month
    ),
    progression_calc AS (
        SELECT 
            month,
            monthly_volume,
            avg_weight,
            workouts,
            LAG(monthly_volume) OVER (ORDER BY month) as prev_volume,
            LAG(avg_weight) OVER (ORDER BY month) as prev_weight,
            (monthly_volume - LAG(monthly_volume) OVER (ORDER BY month)) / 
                NULLIF(LAG(monthly_volume) OVER (ORDER BY month), 0) * 100 as volume_progression,
            (avg_weight - LAG(avg_weight) OVER (ORDER BY month)) / 
                NULLIF(LAG(avg_weight) OVER (ORDER BY month), 0) * 100 as weight_progression
        FROM monthly_data
    )
    SELECT jsonb_build_object(
        'monthlyProgression', COALESCE(jsonb_agg(jsonb_build_object(
            'month', pc.month,
            'volume', pc.monthly_volume,
            'avgWeight', pc.avg_weight,
            'workouts', pc.workouts,
            'volumeProgression', pc.volume_progression,
            'weightProgression', pc.weight_progression
        )), '[]'::jsonb)
    ) INTO v_progression
    FROM progression_calc pc;

    -- 7. Training Load & Stress (simplified TSS calculation)
    WITH load_data AS (
        SELECT 
            DATE(uw.created_at) as workout_date,
            SUM(uwes.weight * uwes.reps) as daily_volume,
            COUNT(*) as daily_sets,
            AVG(uwes.weight) as avg_weight
        FROM workout.user_workouts uw
        INNER JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        INNER JOIN exercise.user_workout_exercise_set uwes ON uwe.id = uwes.user_workout_exercise_id
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(uw.created_at)
        ORDER BY workout_date
    ),
    tss_calc AS (
        SELECT 
            workout_date,
            daily_volume,
            daily_sets,
            avg_weight,
            -- Simplified TSS calculation based on volume and sets
            (daily_volume / 1000 + daily_sets * 5) as daily_tss,
            AVG(daily_volume / 1000 + daily_sets * 5) OVER (
                ORDER BY workout_date 
                ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
            ) as acute_load,
            AVG(daily_volume / 1000 + daily_sets * 5) OVER (
                ORDER BY workout_date 
                ROWS BETWEEN 27 PRECEDING AND CURRENT ROW
            ) as chronic_load
        FROM load_data
    )
    SELECT jsonb_build_object(
        'trainingLoad', COALESCE(jsonb_agg(jsonb_build_object(
            'date', tc.workout_date,
            'dailyTSS', tc.daily_tss,
            'acuteLoad', tc.acute_load,
            'chronicLoad', tc.chronic_load,
            'trainingStressBalance', (tc.chronic_load - tc.acute_load),
            'fatigueRatio', (tc.acute_load / NULLIF(tc.chronic_load, 0))
        )), '[]'::jsonb)
    ) INTO v_training_load
    FROM tss_calc tc;

    -- 8. Recovery Analysis
    WITH recovery_data AS (
        SELECT 
            DATE(uw.created_at) as workout_date,
            LAG(DATE(uw.created_at)) OVER (ORDER BY DATE(uw.created_at)) as prev_workout,
            DATE(uw.created_at) - LAG(DATE(uw.created_at)) OVER (ORDER BY DATE(uw.created_at)) as rest_days
        FROM workout.user_workouts uw
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(uw.created_at)
        ORDER BY workout_date
    )
    SELECT jsonb_build_object(
        'recoveryMetrics', jsonb_build_object(
            'avgRestDays', COALESCE(AVG(rest_days), 0),
            'minRestDays', COALESCE(MIN(rest_days), 0),
            'maxRestDays', COALESCE(MAX(rest_days), 0)
        )
    ) INTO v_recovery
    FROM recovery_data
    WHERE rest_days IS NOT NULL;

    -- 9. Nutrition Correlation (if macro data exists)
    WITH nutrition_performance AS (
        SELECT 
            DATE(uw.created_at) as workout_date,
            SUM(uwes.weight * uwes.reps) as workout_volume,
            udm.totals->>'calories' as calories,
            udm.totals->>'protein' as protein
        FROM workout.user_workouts uw
        INNER JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        INNER JOIN exercise.user_workout_exercise_set uwes ON uwe.id = uwes.user_workout_exercise_id
        LEFT JOIN macros.user_daily_macros udm ON uw.user_id = udm.user_id AND DATE(uw.created_at) = udm.date
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY DATE(uw.created_at), udm.totals
    )
    SELECT jsonb_build_object(
        'nutritionData', COALESCE(jsonb_agg(jsonb_build_object(
            'date', np.workout_date,
            'workoutVolume', np.workout_volume,
            'calories', np.calories,
            'protein', np.protein
        )) FILTER (WHERE np.calories IS NOT NULL), '[]'::jsonb)
    ) INTO v_nutrition
    FROM nutrition_performance np;

    -- 10. Periodization Analysis (4-week blocks)
    WITH block_data AS (
        SELECT 
            FLOOR((DATE(uw.created_at) - p_start_date) / 28) as block_number,
            SUM(uwes.weight * uwes.reps) as block_volume,
            AVG(uwes.weight) as block_avg_weight,
            COUNT(DISTINCT DATE(uw.created_at)) as block_training_days
        FROM workout.user_workouts uw
        INNER JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        INNER JOIN exercise.user_workout_exercise_set uwes ON uwe.id = uwes.user_workout_exercise_id
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
        GROUP BY FLOOR((DATE(uw.created_at) - p_start_date) / 28)
        ORDER BY block_number
    )
    SELECT jsonb_build_object(
        'periodizationBlocks', COALESCE(jsonb_agg(jsonb_build_object(
            'blockNumber', bd.block_number,
            'volume', bd.block_volume,
            'avgWeight', bd.block_avg_weight,
            'trainingDays', bd.block_training_days
        )), '[]'::jsonb)
    ) INTO v_periodization
    FROM block_data bd;

    -- 11. Additional Useful Metrics
    WITH additional_calcs AS (
        SELECT 
            COUNT(DISTINCT DATE(uw.created_at)) as unique_training_days,
            COUNT(DISTINCT uwe.exercise_id) as unique_exercises,
            MAX(DATE(uw.created_at)) - MIN(DATE(uw.created_at)) as training_span_days,
            SUM(uwes.weight * uwes.reps) / NULLIF(COUNT(DISTINCT DATE(uw.created_at)), 0) as avg_daily_volume,
            COUNT(*) / NULLIF(COUNT(DISTINCT DATE(uw.created_at)), 0) as avg_sets_per_day
        FROM workout.user_workouts uw
        INNER JOIN exercise.user_workout_exercises uwe ON uw.id = uwe.user_workout_id
        INNER JOIN exercise.user_workout_exercise_set uwes ON uwe.id = uwes.user_workout_exercise_id
        WHERE uw.user_id = p_user_id
        AND DATE(uw.created_at) BETWEEN p_start_date AND p_end_date
    )
    SELECT jsonb_build_object(
        'uniqueTrainingDays', COALESCE(ac.unique_training_days, 0),
        'uniqueExercises', COALESCE(ac.unique_exercises, 0),
        'trainingSpanDays', COALESCE(ac.training_span_days, 0),
        'avgDailyVolume', COALESCE(ac.avg_daily_volume, 0),
        'avgSetsPerDay', COALESCE(ac.avg_sets_per_day, 0)
    ) INTO v_additional_metrics
    FROM additional_calcs ac;

    -- Combine all metrics into final result
    v_result := jsonb_build_object(
        'dateRange', jsonb_build_object(
            'startDate', p_start_date,
            'endDate', p_end_date
        ),
        'basicMetrics', COALESCE(v_basic_metrics, '{}'::jsonb),
        'patternAnalysis', COALESCE(v_pattern_analysis, '{}'::jsonb),
        'muscleAnalysis', COALESCE(v_muscle_analysis, '{}'::jsonb),
        'repAnalysis', COALESCE(v_rep_analysis, '{}'::jsonb),
        'prTracking', COALESCE(v_pr_tracking, '{}'::jsonb),
        'progression', COALESCE(v_progression, '{}'::jsonb),
        'trainingLoad', COALESCE(v_training_load, '{}'::jsonb),
        'recovery', COALESCE(v_recovery, '{}'::jsonb),
        'nutrition', COALESCE(v_nutrition, '{}'::jsonb),
        'periodization', COALESCE(v_periodization, '{}'::jsonb),
        'additionalMetrics', COALESCE(v_additional_metrics, '{}'::jsonb)
    );

    RETURN v_result;
END;
$$;

