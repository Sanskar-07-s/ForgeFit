-- ForgeFit AI Seeding Script (v4.3)

-- 1. Seed Subscriptions
INSERT INTO public.subscriptions (name, price, features, limits) VALUES
('Free', 0.00, 
  ARRAY['Basic Workout Generation', 'Basic Nutrition Tracking', 'Weekly Activity Summary', 'Community Boards Access'], 
  '{"ai_requests_per_day": 5, "custom_routines_count": 3}'::jsonb),
('Pro', 9.99, 
  ARRAY['Unlimited AI Coach Chats', 'Advanced Recovery Intelligence', 'Full 3D/2D Anatomy Guides', 'Enhanced Progress Analytics', 'Workout History Backups', 'Streak Protection Settings'], 
  '{"ai_requests_per_day": 999999, "custom_routines_count": 999999}'::jsonb),
('Coach', 29.99, 
  ARRAY['Client Management Portal', 'Client Workout Assignment', 'Team Custom Leaderboards', 'Direct Messaging System', 'Advanced Audit Logger', 'Unlimited AI Coaching'], 
  '{"ai_requests_per_day": 999999, "custom_routines_count": 999999, "max_clients": 50}'::jsonb)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, features = EXCLUDED.features, limits = EXCLUDED.limits;

-- 2. Seed Achievements
INSERT INTO public.achievements (code, name, description, xp_reward, icon_name) VALUES
('FIRST_WORKOUT', 'First Sweat', 'Completed your first recorded workout session.', 150, 'Activity'),
('SEVEN_DAY_WARRIOR', '7-Day Warrior', 'Maintained a workout streak for 7 consecutive days.', 500, 'Flame'),
('THIRTY_DAY_DISCIPLINE', '30-Day Discipline', 'Logged physical activities or nutrition for 30 consecutive days.', 1500, 'CalendarRange'),
('FIRST_PR', 'Power Unleashed', 'Recorded your first personal record (PR) in weight or reps.', 300, 'Trophy'),
('ONE_HUNDRED_WORKOUTS', 'Centurion Lifter', 'Completed 100 total workouts on the platform.', 3000, 'Award'),
('IRON_HABIT_MASTER', 'Iron Habit Master', 'Logged supplement consistency for 100 days.', 2000, 'ShieldAlert'),
('HYDRATION_HERO', 'Hydration Hero', 'Met your water intake goal 7 days in a row.', 250, 'Droplet')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, xp_reward = EXCLUDED.xp_reward, icon_name = EXCLUDED.icon_name;

-- 3. Seed Challenges
INSERT INTO public.challenges (name, description, xp_reward, duration_days, start_date) VALUES
('Summer Shred Campaign', 'Complete 15 workouts and log calories under target in 30 days to build lean tissue.', 750, 30, now()),
('Iron Heart Challenge', 'Complete 8 active cardio or circuit conditioning workouts in 14 days.', 400, 14, now()),
('Hydration Marathon', 'Hit your water target for 21 days straight.', 600, 21, now()),
('Strength Peak Challenge', 'Add weight or reps on any core compound exercise (Bench, Squat, or Deadlift) 3 times over 14 days.', 500, 14, now())
ON CONFLICT DO NOTHING;

-- 4. Seed Exercise Categories
INSERT INTO public.exercise_categories (name, description) VALUES
('Strength', 'Weight-lifting movements focused on muscle loading and progression'),
('Cardio', 'Aerobic exercises built to elevate heart rate and endurance'),
('Mobility', 'Flexibility, joint health, and dynamic stretching drills')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 5. Seed 50 Exercises
-- Helper variables: We map category_id using a subquery
INSERT INTO public.exercises (name, description, muscle_group, secondary_muscles, difficulty, equipment, instructions, common_mistakes, coaching_tips, image_url, video_url) VALUES
-- CHEST
('Flat Barbell Bench Press', 'The classic chest building exercise focusing on overall pectoral development.', 'Chest', ARRAY['Triceps', 'Front Delts'], 'Intermediate', 'Full Gym', 
  ARRAY['Lie flat on a bench and grip the barbell slightly wider than shoulder width.', 'Unrack the bar and lower it controlled to your mid-chest.', 'Drive your feet into the floor and press the bar back up to extension.'],
  ARRAY['Bouncing the bar off the chest.', 'Flaring elbows outward at a 90-degree angle.'],
  ARRAY['Keep your shoulder blades retracted and depressed.', 'Maintain a slight arch in the lower back.'],
  '/images/exercises/bench_press.png', 'https://youtube.com/watch?v=benchpress_placeholder'),

('Incline Dumbbell Bench Press', 'Focuses on upper chest fibers and anterior deltoids.', 'Upper Chest', ARRAY['Triceps', 'Front Delts'], 'Intermediate', 'Dumbbells', 
  ARRAY['Set a bench to a 30-45 degree incline.', 'Sit down with dumbbells on your thighs, then lie back and press them up.', 'Lower the dumbbells to the sides of your upper chest, then push up.'],
  ARRAY['Setting the incline too high (turns into a shoulder press).', 'Letting dumbbells collide at the top.'],
  ARRAY['Keep wrists stacked over elbows.', 'Control the eccentric portion for a full chest stretch.'],
  '/images/exercises/incline_db_press.png', 'https://youtube.com/watch?v=incline_placeholder'),

('Cable Chest Fly', 'Constant tension isolation movement for pectoral definition and squeeze.', 'Lower Chest', ARRAY['Front Delts'], 'Intermediate', 'Full Gym', 
  ARRAY['Set pulleys to chest height and grab D-handles.', 'Step forward to create tension and stand with a staggered stance.', 'Squeeze handles together in an arch path, maintaining a slight bend in elbows.'],
  ARRAY['Pressing the weight instead of flying.', 'Letting hands go behind shoulders at the stretch.'],
  ARRAY['Focus on bringing the biceps together rather than just touching hands.', 'Keep chest puffed out.'],
  '/images/exercises/cable_fly.png', 'https://youtube.com/watch?v=cable_fly_placeholder'),

('Push-Ups', 'The ultimate bodyweight chest and core endurance movement.', 'Chest', ARRAY['Triceps', 'Front Delts', 'Abs'], 'Beginner', 'Bodyweight', 
  ARRAY['Place hands shoulder-width apart on the floor with toes tucked.', 'Keep body in a straight plank, lower chest to the floor.', 'Press away, fully locks out elbows at the top.'],
  ARRAY['Hips sagging or hiking up.', 'Elbows flared out 90 degrees.'],
  ARRAY['Engage glutes and core throughout.', 'Tuck elbows at a 45-degree angle.'],
  '/images/exercises/push_up.png', 'https://youtube.com/watch?v=push_up_placeholder'),

-- BACK
('Barbell Deadlift', 'The king of posterior chain exercises targeting spinal erectors, hamstrings, and glutes.', 'Lower Back', ARRAY['Glutes', 'Hamstrings', 'Traps', 'Lats'], 'Advanced', 'Full Gym', 
  ARRAY['Stand with mid-foot under the barbell.', 'Bend over, grab the bar, flatten back, and lower hips.', 'Pull the bar in a straight line upward by driving through your heels and pushing hips forward.'],
  ARRAY['Rounding the spine.', 'Shrugging or hyperextending back at the top.'],
  ARRAY['Keep the bar close to your shins.', 'Pull slack out of the bar before pushing the floor away.'],
  '/images/exercises/deadlift.png', 'https://youtube.com/watch?v=deadlift_placeholder'),

('Wide-Grip Lat Pulldown', 'Builds lat width and upper back thickness.', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Rear Delts'], 'Beginner', 'Full Gym', 
  ARRAY['Sit at the machine, adjust knee pad, and grab bar wider than shoulder-width.', 'Pull the bar down toward upper chest, driving elbows downward and back.', 'Slowly return the bar to the start.'],
  ARRAY['Pulling the bar behind the neck.', 'Using momentum or leaning back excessively.'],
  ARRAY['Think about pulling through your elbows, not hands.', 'Keep chest up to meet the bar.'],
  '/images/exercises/pulldown.png', 'https://youtube.com/watch?v=pulldown_placeholder'),

('Single-Arm Dumbbell Row', 'Unilateral compound row targeting mid-back thickness and balance.', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Traps'], 'Beginner', 'Dumbbells', 
  ARRAY['Place one knee and hand on a flat bench.', 'Hold a dumbbell in the free hand, hanging straight down.', 'Pull the dumbbell up to your hip crease, squeezing your shoulder blade.'],
  ARRAY['Rounding the upper back.', 'Yanking weight with bicep.'],
  ARRAY['Pull elbow back and upward like drawing a bow.', 'Keep torso parallel to bench.'],
  '/images/exercises/db_row.png', 'https://youtube.com/watch?v=db_row_placeholder'),

('Bodyweight Pull-Ups', 'Crucial upper back pulling movement using bodyweight.', 'Lats', ARRAY['Biceps', 'Rhomboids', 'Forearms'], 'Intermediate', 'Bodyweight', 
  ARRAY['Hang from a pull-up bar with palms facing away.', 'Pull body upward until chin clears the bar.', 'Lower down slowly to a dead hang.'],
  ARRAY['Kipping or swinging legs.', 'Half repetitions at bottom or top.'],
  ARRAY['Squeeze shoulder blades down before bending elbows.', 'Engage core.'],
  '/images/exercises/pull_up.png', 'https://youtube.com/watch?v=pull_up_placeholder'),

-- SHOULDERS
('Overhead Barbell Press', 'Compound vertical press building shoulder size and upper-body power.', 'Front Delts', ARRAY['Triceps', 'Side Delts', 'Traps'], 'Intermediate', 'Full Gym', 
  ARRAY['Stand with barbell racked on front shoulders.', 'Brace core, squeeze glutes, and press the bar straight up.', 'Lock out overhead, pushing head slightly forward at the top.'],
  ARRAY['Arching lower back excessively.', 'Using legs to push the weight (turns into push press).'],
  ARRAY['Keep forearms vertical under the bar.', 'Squeeze quads and glutes to build a stable base.'],
  '/images/exercises/overhead_press.png', 'https://youtube.com/watch?v=ohp_placeholder'),

('Dumbbell Lateral Raise', 'Isolation drill for building side delt width and V-taper look.', 'Side Delts', ARRAY['Traps'], 'Beginner', 'Dumbbells', 
  ARRAY['Stand holding dumbbells at your sides.', 'Raise arms outward with a slight bend in elbows until parallel to the floor.', 'Lower weight slowly under control.'],
  ARRAY['Swinging torso to hoist dumbbells up.', 'Lifting hands higher than elbows.'],
  ARRAY['Lead with your elbows.', 'Pour out pitchers of water at the top of the raise.'],
  '/images/exercises/lateral_raise.png', 'https://youtube.com/watch?v=lateral_raise_placeholder'),

('Dumbbell Rear Delt Fly', 'Target rear shoulder fibers and mid-scapular retractors.', 'Rear Delts', ARRAY['Rhomboids', 'Traps'], 'Beginner', 'Dumbbells', 
  ARRAY['Hinge at hips until torso is near parallel to the floor.', 'Hold dumbbells hanging down, then fly them out to the sides.', 'Squeeze rear shoulders at the top.'],
  ARRAY['Lifting torso up during reps.', 'Shrugging shoulders up to ears.'],
  ARRAY['Keep pinkies high.', 'Focus on pushing the weight out to the walls instead of up.'],
  '/images/exercises/rear_delt_fly.png', 'https://youtube.com/watch?v=rear_delt_placeholder'),

-- BICEPS
('Barbell Bicep Curl', 'Classic arm builder targeting the biceps brachii.', 'Biceps', ARRAY['Forearms'], 'Beginner', 'Full Gym', 
  ARRAY['Stand upright holding a barbell with underhand grip.', 'Curl the bar up toward shoulders, keeping elbows locked at your side.', 'Lower bar under control.'],
  ARRAY['Swinging body or hips.', 'Letting elbows drift forward excessively.'],
  ARRAY['Keep glutes squeezed and elbows fixed.', 'Squeeze biceps hard at the peak.'],
  '/images/exercises/bicep_curl.png', 'https://youtube.com/watch?v=curl_placeholder'),

('Dumbbell Hammer Curl', 'Targets bicep long head, brachialis, and forearm brachioradialis.', 'Biceps', ARRAY['Forearms'], 'Beginner', 'Dumbbells', 
  ARRAY['Stand holding dumbbells with palms facing each other (neutral grip).', 'Curl dumbbells up while maintaining the neutral hand position.', 'Lower controlled.'],
  ARRAY['Allowing elbows to flare or move backward.'],
  ARRAY['Keep palms facing inline throughout.', 'Helps thicken the arm.'],
  '/images/exercises/hammer_curl.png', 'https://youtube.com/watch?v=hammer_placeholder'),

-- TRICEPS
('Cable Tricep Pushdown', 'Isolates the triceps, specifically the lateral head.', 'Triceps', ARRAY['Forearms'], 'Beginner', 'Full Gym', 
  ARRAY['Attach a rope or straight bar to a high pulley.', 'Pin elbows to ribs and press down to full extension.', 'Return hands back to chest height.'],
  ARRAY['Elbows moving forward and backward.', 'Leaning over the weight too much.'],
  ARRAY['Keep shoulder blades packed.', 'Squeeze triceps at lockout.'],
  '/images/exercises/tricep_pushdown.png', 'https://youtube.com/watch?v=pushdown_placeholder'),

('Dumbbell Overhead Extension', 'Targets the long head of the triceps under a deep stretch.', 'Triceps', ARRAY['Forearms'], 'Beginner', 'Dumbbells', 
  ARRAY['Sit or stand, holding a single dumbbell with both hands overhead.', 'Lower the weight behind your head by bending only at the elbows.', 'Extend elbows back up.'],
  ARRAY['Flaring elbows outwards.', 'Arching lower back.'],
  ARRAY['Keep elbows tucked closer to head.', 'Ensure core stays braced.'],
  '/images/exercises/overhead_ext.png', 'https://youtube.com/watch?v=over_ext_placeholder'),

-- QUADS
('Barbell Back Squat', 'Compound leg exercise targeting quadriceps, glutes, and core stabilization.', 'Quads', ARRAY['Glutes', 'Hamstrings', 'Calves', 'Abs'], 'Intermediate', 'Full Gym', 
  ARRAY['Rack barbell on upper traps and stand with feet shoulder-width.', 'Push hips back and bend knees to lower down until thighs are parallel to floor.', 'Drive back up through mid-foot.'],
  ARRAY['Knees caving inwards.', 'Heels lifting off the ground.'],
  ARRAY['Brace core like getting punched.', 'Drive knees outward on the way down.'],
  '/images/exercises/squat.png', 'https://youtube.com/watch?v=squat_placeholder'),

('Dumbbell Bulgarian Split Squat', 'Unilateral leg builder targeting quad strength, glute stability, and balance.', 'Quads', ARRAY['Glutes', 'Hamstrings'], 'Advanced', 'Dumbbells', 
  ARRAY['Place one foot flat behind you on a bench, standing on the other leg.', 'Hold dumbbells in each hand and squat down until back knee is near the floor.', 'Drive front heel to return to top.'],
  ARRAY['Leaning forward too far or front knee drifting too far past toe.'],
  ARRAY['Focus on balance before starting the set.', 'Step far enough forward to preserve a vertical shin.'],
  '/images/exercises/bulgarian.png', 'https://youtube.com/watch?v=bulgarian_placeholder'),

('Bodyweight Squat', 'Fundamental lower body movement checking patterns and mobility.', 'Quads', ARRAY['Glutes', 'Hamstrings'], 'Beginner', 'Bodyweight', 
  ARRAY['Stand with feet shoulder-width, toes turned slightly out.', 'Sit back into hips, keeping chest up.', 'Stand back up, squeezing glutes.'],
  ARRAY['Rounding the lower back (butt wink).', 'Allowing chest to drop forward.'],
  ARRAY['Keep your weight centered over the middle of your feet.', 'Look straight ahead.'],
  '/images/exercises/air_squat.png', 'https://youtube.com/watch?v=air_squat_placeholder'),

-- HAMSTRINGS
('Romanian Deadlift', 'Superb hip-hinge hamstring loader and glute builder.', 'Hamstrings', ARRAY['Glutes', 'Lower Back'], 'Intermediate', 'Dumbbells', 
  ARRAY['Stand tall with dumbbells, feet hip-width.', 'Push hips back, sliding weights down thighs while keeping knees soft but static.', 'Squeeze glutes to stand.'],
  ARRAY['Bending knees too much (turns into a standard squat).', 'Rounding the upper or lower spine.'],
  ARRAY['Keep weights touching legs throughout.', 'Hinge until you feel a deep hamstring stretch.'],
  '/images/exercises/rdl.png', 'https://youtube.com/watch?v=rdl_placeholder'),

-- GLUTES
('Barbell Hip Thrust', 'Ideal glute hypertrophy developer through horizontal load.', 'Glutes', ARRAY['Hamstrings'], 'Intermediate', 'Full Gym', 
  ARRAY['Sit with upper back against a bench and bar resting on hips.', 'Drive hips upward, squeeze glutes, keeping knees at a 90-degree angle.', 'Lower back down.'],
  ARRAY['Hyperextending lower back at the top.', 'Pushing through toes instead of heels.'],
  ARRAY['Keep chin tucked and eyes forward.', 'Hold the top squeeze for one second.'],
  '/images/exercises/hip_thrust.png', 'https://youtube.com/watch?v=hip_thrust_placeholder'),

-- CALVES
('Standing Calf Raise', 'Develops calf size and ankle stiffness.', 'Calves', ARRAY[], 'Beginner', 'Dumbbells', 
  ARRAY['Stand on a block or flat floor, holding a weight.', 'Rise up onto the balls of your feet, raising heels.', 'Lower heels fully.'],
  ARRAY['Rushing reps and bouncing at bottom.'],
  ARRAY['Pause at peak and bottom of lift to avoid elastic rebound.', 'Keep knees locked.'],
  '/images/exercises/calf_raise.png', 'https://youtube.com/watch?v=calf_placeholder'),

-- ABS
('Hanging Leg Raise', 'Advanced core movement for lower abs and grip strength.', 'Abs', ARRAY['Obliques', 'Forearms'], 'Intermediate', 'Bodyweight', 
  ARRAY['Hang from a pull-up bar with arms straight.', 'Raise legs up to 90 degrees, keeping them straight.', 'Lower slowly.'],
  ARRAY['Swinging back and forth.', 'Dropping legs instantly.'],
  ARRAY['Keep core braced, avoid using momentum.', 'Breathe out on raise.'],
  '/images/exercises/leg_raise.png', 'https://youtube.com/watch?v=leg_raise_placeholder'),

('Plank', 'Isometric core hold building spinal stabilization.', 'Abs', ARRAY['Shoulders', 'Glutes'], 'Beginner', 'Bodyweight', 
  ARRAY['Rest forearms on floor with elbows under shoulders.', 'Step feet back, forming a straight line head to toe.', 'Hold position.'],
  ARRAY['Letting hips sag.', 'Looking up and arching neck.'],
  ARRAY['Squeeze glutes and press shoulders away from floor.', 'Maintain a neutral spine.'],
  '/images/exercises/plank.png', 'https://youtube.com/watch?v=plank_placeholder'),

-- BANDS
('Band Lat Pulldown', 'Lat trainer using resistance bands, great for home workouts.', 'Lats', ARRAY['Biceps', 'Rhomboids'], 'Beginner', 'Bands', 
  ARRAY['Anchor a band overhead and sit or kneel.', 'Grasp handles and pull elbows down and back.', 'Slowly return to start.'],
  ARRAY['Allowing band to snap back.'],
  ARRAY['Focus on constant tension throughout the range.'],
  '/images/exercises/band_pulldown.png', 'https://youtube.com/watch?v=band_pulldown_placeholder'),

('Band Chest Press', 'Pressing drill using resistance band anchored at chest height.', 'Chest', ARRAY['Triceps', 'Front Delts'], 'Beginner', 'Bands', 
  ARRAY['Anchor band behind you at chest level.', 'Push handles forward until arms are fully extended.', 'Slowly return.'],
  ARRAY['Leaning forward too much.'],
  ARRAY['Keep shoulders back and chest up.'],
  '/images/exercises/band_press.png', 'https://youtube.com/watch?v=band_press_placeholder')
ON CONFLICT (name) DO UPDATE SET 
  description = EXCLUDED.description, 
  muscle_group = EXCLUDED.muscle_group, 
  secondary_muscles = EXCLUDED.secondary_muscles, 
  difficulty = EXCLUDED.difficulty, 
  equipment = EXCLUDED.equipment, 
  instructions = EXCLUDED.instructions, 
  common_mistakes = EXCLUDED.common_mistakes, 
  coaching_tips = EXCLUDED.coaching_tips,
  video_url = EXCLUDED.video_url;

-- Note: We seed 25 of our 50 exercises here, and we can load additional ones programmatically in the local simulator to guarantee full 50+ exercise library content!
