/**
 * SoundManager - управление звуковыми эффектами
 * Воспроизводит звуки при взятиях, шахах, ошибках и повторных ходах
 */
export type SoundType = 'capture' | 'check' | 'error' | 'already';
export declare class SoundManager {
    private sounds;
    private enabled;
    private loaded;
    /**
     * Инициализирует звуки (предзагрузка)
     * Звуки загружаются лениво при первом воспроизведении
     */
    constructor();
    /**
     * Загружает звуковой файл
     */
    private loadSound;
    /**
     * Воспроизводит звук указанного типа
     * @param type - Тип звука
     */
    play(type: SoundType): void;
    /**
     * Воспроизводит звук шаха
     */
    playCheck(): void;
    /**
     * Воспроизводит звук взятия
     */
    playCapture(): void;
    /**
     * Воспроизводит звук ошибки
     */
    playError(): void;
    /**
     * Воспроизводит звук "уже найдено"
     */
    playAlready(): void;
    /**
     * Включает/выключает звуки
     * @param enabled - Включены ли звуки
     */
    setEnabled(enabled: boolean): void;
    /**
     * Возвращает статус звуков
     */
    isEnabled(): boolean;
    /**
     * Предзагружает все звуки
     * Вызвать после пользовательского взаимодействия для избежания блокировки
     */
    preload(): void;
}
export declare const soundManager: SoundManager;
//# sourceMappingURL=SoundManager.d.ts.map