export interface LiveEvent {
  id: string; // Assuming a UUID or some other string-based ID
  title: string;
  description: string;
  start_time: Date;
  end_time: Date;
  stream_url: string;
  // Timestamps for record creation and updates
  created_at: Date;
  updated_at: Date;
}
