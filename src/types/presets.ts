export interface PresetSet { reps: number; weight: number }
export interface PresetExercise { exercise_id: number; sets: PresetSet[] }
export interface WorkoutPreset { id: number; name: string; exercise_ids: number[]; exercises: PresetExercise[]; archived?: number }
export interface PresetOrigin { preset_id: number; preset_name: string }
