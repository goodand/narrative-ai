/**
 * NotificationService - 일일 오전 6시 로컬 알림 관리
 * Capacitor Local Notifications 플러그인 활용
 */

import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { handleError } from '../utils/errorHandler.js';

const NOTIFICATION_ID = 6000;

const NOTIFICATION_MESSAGES = [
    {
        title: '오늘의 추억 정리 시간',
        body: '어제의 사진 속에 숨은 이야기를 들어볼까요?'
    },
    {
        title: '리코코가 기다리고 있어요',
        body: '쌓인 사진을 비우고, 마음도 가볍게 시작해요.'
    }
];

/**
 * 현재 알림 권한 상태 확인
 * @returns {Promise<string>} 'prompt' | 'granted' | 'denied'
 */
export async function checkPermission() {
    if (!Capacitor.isNativePlatform()) return 'denied';

    try {
        const { display } = await LocalNotifications.checkPermissions();
        return display;
    } catch (err) {
        handleError(err, 'Notification', { silent: true });
        return 'denied';
    }
}

/**
 * 알림 권한 요청
 * @returns {Promise<boolean>} 권한 허용 여부
 */
export async function requestPermission() {
    if (!Capacitor.isNativePlatform()) return false;

    try {
        const { display } = await LocalNotifications.requestPermissions();
        return display === 'granted';
    } catch (err) {
        handleError(err, 'Notification', { silent: true });
        return false;
    }
}

/**
 * 매일 오전 6시 알림 예약
 * @returns {Promise<boolean>} 예약 성공 여부
 */
export async function scheduleDailyNotification() {
    if (!Capacitor.isNativePlatform()) return false;

    try {
        // 기존 알림 제거 후 재등록 (중복 방지)
        await cancelAll();

        const msg = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];

        await LocalNotifications.schedule({
            notifications: [
                {
                    id: NOTIFICATION_ID,
                    title: msg.title,
                    body: msg.body,
                    schedule: {
                        on: { hour: 6, minute: 0 },
                        repeats: true,
                        allowWhileIdle: true
                    },
                    sound: 'default',
                    smallIcon: 'ic_launcher',
                    autoCancel: true
                }
            ]
        });

        console.log('[NOTIFICATION] Scheduled daily 06:00 notification');
        return true;
    } catch (err) {
        handleError(err, 'Notification', { silent: true });
        return false;
    }
}

/**
 * 모든 예약된 알림 취소
 */
export async function cancelAll() {
    if (!Capacitor.isNativePlatform()) return;

    try {
        const { notifications } = await LocalNotifications.getPending();
        if (notifications.length > 0) {
            await LocalNotifications.cancel({ notifications });
        }
        console.log('[NOTIFICATION] Cancelled all pending notifications');
    } catch (err) {
        handleError(err, 'Notification', { silent: true });
    }
}

/**
 * 알림 터치 시 홈 이동 리스너 등록
 * @param {Object} router - Router 인스턴스
 */
export function setupActionListener(router) {
    if (!Capacitor.isNativePlatform()) return;

    LocalNotifications.addListener('localNotificationActionPerformed', () => {
        console.log('[NOTIFICATION] Action performed — navigating home');
        router.navigate('home');
    });
}
