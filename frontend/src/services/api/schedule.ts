import api from '../apiConfig';

export interface Schedule {
  id: number;
  child_id: number;
  class_id: number;
  date: string;
  start_time: string;
  duration_hours: number | string;
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
  duration_hours: number | string;
  activity?: string;
  notes?: string;
}

export interface UpdateScheduleData extends CreateScheduleData {
  id: number;
}

// Get all schedules (admin and teacher only)
export const getAllSchedules = async (filters?: {
  date?: string;
  week?: string;
  month?: string;
}): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.week) params.append('week', filters.week);
  if (filters?.month) params.append('month', filters.month);

  const queryString = params.toString();
  const url = `/api/schedules${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

// Get schedule for a specific child
export const getChildSchedule = async (
  childId: number,
  filters?: { date?: string; week?: string; month?: string }
): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.week) params.append('week', filters.week);
  if (filters?.month) params.append('month', filters.month);

  const queryString = params.toString();
  const url = `/api/schedules/child/${childId}${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

// Get schedule for a specific class
export const getClassSchedule = async (
  classId: number,
  filters?: { date?: string; week?: string; month?: string }
): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.week) params.append('week', filters.week);
  if (filters?.month) params.append('month', filters.month);

  const queryString = params.toString();
  const url = `/api/schedules/class/${classId}${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

// Create a new schedule entry
export const createSchedule = async (scheduleData: CreateScheduleData): Promise<Schedule> => {
  const response = await api.post('/api/schedules', scheduleData);
  return response.data;
};

// Update an existing schedule entry
export const updateSchedule = async (scheduleData: UpdateScheduleData): Promise<Schedule> => {
  const { id, ...data } = scheduleData;
  const response = await api.put(`/api/schedules/${id}`, data);
  return response.data;
};

// Delete a schedule entry
export const deleteSchedule = async (id: number): Promise<void> => {
  await api.delete(`/api/schedules/${id}`);
};
