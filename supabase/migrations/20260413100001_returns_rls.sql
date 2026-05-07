ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own return requests"
  ON return_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own return requests"
  ON return_requests FOR SELECT
  USING (auth.uid() = user_id);
