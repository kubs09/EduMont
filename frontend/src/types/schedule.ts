export interface Schedule {
  id: number;
  child_id: number;
  class_id: number;
  date: string;
  start_time: string;
  duration_hours: number;
  activity?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  class_name: string;
  child_firstname: string;
  child_surname: string;
  created_by_firstname?: string;
  created_by_surname?: string;
  updated_by_firstname?: string;
  updated_by_surname?: string;
}

export interface CreateScheduleData {
  child_id: number;
  class_id: number;
  date: string;
  start_time: string;
  duration_hours: number;
  activity?: string;
  notes?: string;
}

export interface UpdateScheduleData extends CreateScheduleData {
  id: number;
}

export type ScheduleViewType = 'day' | 'week' | 'month';
