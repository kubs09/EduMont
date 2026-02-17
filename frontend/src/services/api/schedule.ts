import api from '../apiConfig';

export interface Schedule {
  id: number;
  child_id: number;
  class_id: number;
  name: string;
  category?: string;
  display_order?: number;
  status: 'prerequisites not met' | 'to be presented' | 'presented' | 'practiced' | 'mastered';
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
  name: string;
  category?: string;
  display_order?: number;
  status?: 'prerequisites not met' | 'to be presented' | 'presented' | 'practiced' | 'mastered';
  notes?: string;
}

export interface UpdateScheduleData extends CreateScheduleData {
  id: number;
}

// Get all schedules (admin and teacher only)
export const getAllSchedules = async (filters?: { status?: string }): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  const url = `/api/schedules${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

// Get schedule for a specific child
export const getChildSchedule = async (
  childId: number,
  filters?: { status?: string }
): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString();
  const url = `/api/schedules/child/${childId}${queryString ? `?${queryString}` : ''}`;

  const response = await api.get(url);
  return response.data;
};

// Get schedule for a specific class
export const getClassSchedule = async (
  classId: number,
  filters?: { status?: string }
): Promise<Schedule[]> => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);

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
