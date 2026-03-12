class SceneUI extends Phaser.Scene {
    constructor() {
        super('SceneUI');
    }

    create() {
        console.log("[UI] Отрисовка обновленного интерфейса...");

        // 1. ПАРАМЕТРЫ ПАНЕЛИ
        // Размещаем панель внизу (высота экрана 800, панель на 660)
        const panelY = 660;

        // Черная подложка (полупрозрачная)
        this.add.rectangle(0, panelY, 450, 140, 0x000000, 0.8).setOrigin(0).setDepth(10000);

        // Зеленая декоративная рамка
        const border = this.add.graphics();
        border.lineStyle(4, 0x2ecc71);
        border.strokeRect(5, panelY + 5, 440, 130);
        border.setDepth(10001);

        // 2. ТЕКСТЫ ИНФОРМАЦИИ
        // Очки игрока (крупно)
        this.scoreText = this.add.text(20, panelY + 20, 'ОЧКИ: 0/0', {
            fontSize: '24px', fill: '#ffffff', fontStyle: 'bold'
        }).setDepth(10002);

        // Оставшиеся ходы (выделим красным, если мало)
        this.movesText = this.add.text(20, panelY + 55, 'ХОДЫ: 0', {
            fontSize: '24px', fill: '#ff4757', fontStyle: 'bold'
        }).setDepth(10002);

        // Статистика (Деньги и Опыт)
        this.statsText = this.add.text(20, panelY + 95, '', {
            fontSize: '16px', fill: '#ffd700', fontStyle: 'bold'
        }).setDepth(10002);

        // 3. ШКАЛА ПРОГРЕССА (ЦЕЛЬ)
        this.add.text(250, panelY + 25, 'ПРОГРЕСС УРОВНЯ:', { fontSize: '12px', fill: '#ffffff' }).setDepth(10002);

        // Фон шкалы (серый)
        this.barBg = this.add.rectangle(250, panelY + 45, 180, 25, 0x333333).setOrigin(0).setDepth(10002);
        // Сама полоска (зеленая)
        this.barFill = this.add.rectangle(250, panelY + 45, 0, 25, 0x2ecc71).setOrigin(0).setDepth(10003);

        // Обновляем данные из PlayerData сразу при старте
        this.refreshStats();
    }

    /**
     * Метод обновления текста денег и опыта
     */
    refreshStats() {
        if (this.statsText) {
            this.statsText.setText(`💰 ${PlayerData.money} | ⭐ ОПЫТ: ${PlayerData.xp}`);
        }
    }

    /**
     * Основной метод обновления данных, который вызывает SceneLevel
     */
    updateUI(currentScore, targetScore, movesLeft) {
        // Обновляем текст очков
        if (this.scoreText) {
            this.scoreText.setText(`ОЧКИ: ${currentScore}/${targetScore}`);
        }

        // Обновляем текст ходов
        if (this.movesText) {
            this.movesText.setText(`ХОДЫ: ${movesLeft}`);
            // Если осталось меньше 5 ходов — текст мигает или краснеет (можно добавить позже)
        }

        // Двигаем полоску прогресса
        if (this.barFill) {
            const progress = Math.min(currentScore / targetScore, 1);
            this.barFill.width = 180 * progress;
        }

        this.refreshStats();
    }

    /**
     * Экран ПОБЕДЫ
     */
    showWinScreen(reward, stars) {
        // Темный фон на весь экран
        const overlay = this.add.rectangle(225, 400, 450, 800, 0x000000, 0.85).setDepth(20000);

        // Рисуем звезды (текстом для простоты)
        let starIcons = "";
        for (let i = 0; i < 3; i++) {
            starIcons += (i < stars) ? "⭐" : "🌑"; // Закрашенная или пустая звезда
        }

        this.add.text(225, 250, starIcons, { fontSize: '64px' }).setOrigin(0.5).setDepth(20001);

        this.add.text(225, 350, 'УРОВЕНЬ ПРОЙДЕН!', {
            fontSize: '36px', fill: '#2ecc71', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20001);

        // Текст награды
        const rewardMsg = `НАГРАДА:\n+${reward.money} Золота\n+${reward.xp} Опыта`;
        this.add.text(225, 460, rewardMsg, {
            fontSize: '24px', fill: '#ffffff', align: 'center'
        }).setOrigin(0.5).setDepth(20001);

        // Кнопка ДАЛЕЕ (в меню)
        const btn = this.add.rectangle(225, 600, 220, 70, 0x2ecc71).setInteractive().setDepth(20001);
        const btnText = this.add.text(225, 600, 'В МЕНЮ', {
            fontSize: '28px', fill: '#000', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20002);

        // Логика кнопки
        btn.on('pointerdown', () => {
            this.scene.stop('SceneLevel');
            this.scene.start('SceneMenu');
        });

        // Анимация появления кнопки (легкая пульсация)
        this.tweens.add({
            targets: [btn, btnText],
            scale: 1.05,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
}