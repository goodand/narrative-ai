/**
 * StatsService - Detox Statistics Management
 * 사용자의 사진 비움 성과를 Supabase에 기록하고 통계를 관리합니다.
 */

import { supabase } from './supabase.js';

export class StatsService {
    /**
     * 사진 비움 로그를 기록하고 사용자의 전체 통계를 업데이트합니다.
     * @param {Object} data - 비움 데이터 (fileSize, reason, photoDate, location)
     */
    static async logDetox({ fileSize, reason, photoDate, location }) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. 비움 로그(detox_logs) 기록
            const { error: logError } = await supabase
                .from('detox_logs')
                .insert({
                    user_id: user.id,
                    file_size_bytes: fileSize,
                    filter_reason: reason,
                    photo_date: photoDate,
                    photo_location: location
                });

            if (logError) throw logError;

            // 2. 사용자 통계(user_stats) 업데이트 (Upsert)
            // 실제 구현에서는 RPC(Stored Procedure)를 사용하여 원자적으로 증가시키는 것이 좋으나,
            // 여기서는 단순화하여 처리합니다.
            const { data: stats } = await supabase
                .from('user_stats')
                .select('*')
                .eq('user_id', user.id)
                .single();

            const updatedStats = {
                user_id: user.id,
                total_cleared_bytes: (stats?.total_cleared_bytes || 0) + (fileSize || 0),
                total_cleared_count: (stats?.total_cleared_count || 0) + 1,
                last_activity_date: new Date().toISOString().split('T')[0]
            };

            const { error: statsError } = await supabase
                .from('user_stats')
                .upsert(updatedStats);

            if (statsError) throw statsError;

            console.log('[STATS] 비움 데이터가 성공적으로 기록되었습니다.');
        } catch (error) {
            console.error('[STATS] 통계 기록 중 오류 발생:', error);
        }
    }
}
