-- ============================================================
-- RECOCO Supabase 초기 설정 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요.
-- ============================================================

-- 1. detox_logs: 사진 비움 개별 기록
CREATE TABLE IF NOT EXISTS detox_logs (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_size_bytes  BIGINT DEFAULT 0,
    filter_reason    TEXT,
    photo_date       TEXT,
    photo_location   TEXT,
    cleared_at       TIMESTAMPTZ DEFAULT now()
);

-- 인덱스: 유저별 최근 기록 조회 최적화
CREATE INDEX IF NOT EXISTS idx_detox_logs_user_cleared
    ON detox_logs (user_id, cleared_at DESC);

-- RLS 활성화
ALTER TABLE detox_logs ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 INSERT/SELECT 허용
CREATE POLICY "Users can insert own detox logs"
    ON detox_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own detox logs"
    ON detox_logs FOR SELECT
    USING (auth.uid() = user_id);


-- 2. user_stats: 유저별 누적 통계
CREATE TABLE IF NOT EXISTS user_stats (
    user_id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_cleared_bytes BIGINT DEFAULT 0,
    total_cleared_count INT DEFAULT 0,
    last_activity_date  DATE DEFAULT CURRENT_DATE
);

-- RLS 활성화
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stats"
    ON user_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
    ON user_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
    ON user_stats FOR UPDATE
    USING (auth.uid() = user_id);


-- 3. increment_user_stats RPC: 원자적 통계 증가 (Race Condition 방지)
CREATE OR REPLACE FUNCTION increment_user_stats(
    user_id_param UUID,
    bytes_to_add BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_stats (user_id, total_cleared_bytes, total_cleared_count, last_activity_date)
    VALUES (user_id_param, bytes_to_add, 1, CURRENT_DATE)
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_cleared_bytes = user_stats.total_cleared_bytes + bytes_to_add,
        total_cleared_count = user_stats.total_cleared_count + 1,
        last_activity_date  = CURRENT_DATE;
END;
$$;
