/**
 * SoundManager - управление звуковыми эффектами
 * Воспроизводит звуки при взятиях, шахах, ошибках и повторных ходах
 */
export class SoundManager {
    /**
     * Инициализирует звуки (предзагрузка)
     * Звуки загружаются лениво при первом воспроизведении
     */
    constructor() {
        this.sounds = new Map();
        this.enabled = true;
        this.loaded = false;
        // Не загружаем сразу - загрузим при первом использовании
        // Это экономит ресурсы если звуки отключены
    }
    /**
     * Загружает звуковой файл
     */
    loadSound(type) {
        const paths = {
            capture: 'assets/sounds/capture.mp3',
            check: 'assets/sounds/check.mp3',
            error: 'assets/sounds/error.mp3',
            already: 'assets/sounds/already.mp3'
        };
        try {
            const audio = new Audio(paths[type]);
            audio.preload = 'auto';
            audio.volume = 0.5;
            this.sounds.set(type, audio);
            return audio;
        }
        catch (e) {
            console.warn(`Не удалось загрузить звук: ${type}`, e);
            return undefined;
        }
    }
    /**
     * Воспроизводит звук указанного типа
     * @param type - Тип звука
     */
    play(type) {
        if (!this.enabled)
            return;
        // Ленивая загрузка звука
        let audio = this.sounds.get(type);
        if (!audio) {
            audio = this.loadSound(type);
            if (!audio)
                return;
        }
        // Сбросить и воспроизвести
        try {
            audio.currentTime = 0;
            audio.play().catch(e => {
                // Браузер может заблокировать автовоспроизведение
                console.debug('Звук заблокирован браузером:', e);
            });
        }
        catch (e) {
            console.debug('Ошибка воспроизведения:', e);
        }
    }
    /**
     * Воспроизводит звук шаха
     */
    playCheck() {
        this.play('check');
    }
    /**
     * Воспроизводит звук взятия
     */
    playCapture() {
        this.play('capture');
    }
    /**
     * Воспроизводит звук ошибки
     */
    playError() {
        this.play('error');
    }
    /**
     * Воспроизводит звук "уже найдено"
     */
    playAlready() {
        this.play('already');
    }
    /**
     * Включает/выключает звуки
     * @param enabled - Включены ли звуки
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`🔊 Звуки ${enabled ? 'включены' : 'выключены'}`);
    }
    /**
     * Предзагружает все звуки
     * Вызвать после пользовательского взаимодействия для избежания блокировки
     */
    preload() {
        if (this.loaded)
            return;
        const types = ['capture', 'check', 'error', 'already'];
        types.forEach(type => this.loadSound(type));
        this.loaded = true;
        console.log('✅ Звуки предзагружены');
    }
}
// Глобальный экземпляр для простоты использования
export const soundManager = new SoundManager();
//# sourceMappingURL=SoundManager.js.map