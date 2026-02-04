/**
 * StatsService - Detox Statistics Management
 * 사용자의 사진 비움 성과를 Supabase에 기록하고 통계를 관리합니다.
 */

import { supabase } from './supabase.js';

export class StatsService {
    /**
     * 사진 비움 로그를 기록하고 사용자의 전체 통계를 원자적으로 업데이트합니다.
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

            // 2. RPC를 통한 원자적 통계 증가 (Race Condition 방지)
            // SQL: update user_stats set bytes = bytes + val, count = count + 1 ...
            const { error: rpcError } = await supabase.rpc('increment_user_stats', {
                user_id_param: user.id,
                bytes_to_add: fileSize || 0
            });

            if (rpcError) {
                console.warn('[STATS] RPC 호출 실패, Fallback(Upsert) 시도:', rpcError);
                await this._fallbackUpdateStats(user.id, fileSize);
            }

            console.log('[STATS] 비움 성과가 안전하게 기록되었습니다.');
        } catch (error) {
            console.error('[STATS] 통계 기록 중 오류 발생:', error);
        }
    }

    /**
     * RPC 실패 시 기존 방식으로 업데이트 시도
     */
    static async _fallbackUpdateStats(userId, fileSize) {
        const { data: stats } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        await supabase
            .from('user_stats')
            .upsert({
                user_id: userId,
                total_cleared_bytes: (stats?.total_cleared_bytes || 0) + (fileSize || 0),
                total_cleared_count: (stats?.total_cleared_count || 0) + 1,
                last_activity_date: new Date().toISOString().split('T')[0]
            });
    }
}