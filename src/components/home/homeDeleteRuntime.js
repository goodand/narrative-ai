import { photoService } from '../../services/PhotoService.js';
import { handleError, showToast, ErrorLevel } from '../../utils/errorHandler.js';

export async function handleDelete(manager) {
    const photos = photoService.getPhotos();
    const current = photos[manager.currentIndex];
    if (!current) return;

    const performDelete = async () => {
        try {
            const actionDayKey = current.dayKey;
            const success = await photoService.deletePhoto(manager.currentIndex);
            if (success) {
                await photoService.recordCurationAction({
                    assetId: current.id,
                    action: 'deleted',
                    dayKey: actionDayKey
                });

                const deletedIdx = manager.currentIndex;
                await manager.consumePhoto(deletedIdx);
                
                console.log('HomeManager: 사진 삭제 성공 및 통계 기록 완료');
                showToast('사진이 정리되었습니다.', ErrorLevel.INFO);
            }
        } catch (err) {
            handleError(err, 'PhotoDelete');
        }
    };

    if (manager.confirmModal) {
        manager.confirmModal.show({
            title: '사진을 비울까요?',
            message: '이 사진을 기기에서 삭제하고 비움 기록을 남깁니다.',
            confirmText: '비우기',
            onConfirm: performDelete
        });
    } else if (confirm('이 사진을 사진첩에서 삭제하시겠습니까?')) {
        await performDelete();
    }
}
