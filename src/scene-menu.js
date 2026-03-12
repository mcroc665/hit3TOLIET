class SceneMenu extends Phaser.Scene {
    constructor() {
        super('SceneMenu');
    }

    create() {
        console.log("[Menu] Сцена меню запущена");

        // Заголовок
        this.add.text(225, 80, 'ВЫБОР УРОВНЯ', {
            fontSize: '42px',
            fill: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(0.5);

        const startX = 85;
        const startY = 200;
        const spacing = 110;

        // Рисуем сетку 3x4 (12 уровней)
        for (let i = 0; i < 12; i++) {
            const row = Math.floor(i / 3);
            const col = i % 3;
            const levelNum = i + 1;

            const x = startX + col * spacing;
            const y = startY + row * spacing;

            // Кнопка
            const isUnlocked = levelNum <= PlayerData.unlockedLevels;
            const color = isUnlocked ? 0x2ecc71 : 0x7f8c8d; // Зеленый если открыт, серый если нет

            const btn = this.add.rectangle(x, y, 90, 90, color).setInteractive();
            btn.setStrokeStyle(3, 0xffffff);

            this.add.text(x, y, levelNum, {
                fontSize: '32px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // Логика нажатия
            btn.on('pointerdown', () => {
                console.log(`[Menu] Переход на уровень ${levelNum}`);
                PlayerData.currentLevelToPlay = levelNum;
                this.scene.start('SceneLevel');
            });

            // Эффект наведения
            btn.on('pointerover', () => btn.setStrokeStyle(5, 0xf1c40f));
            btn.on('pointerout', () => btn.setStrokeStyle(3, 0xffffff));
        }

        // Инфо внизу экрана
        this.add.rectangle(225, 740, 450, 120, 0x000000, 0.5);
        this.add.text(225, 740, `💰 ЗОЛОТО: ${PlayerData.money}\n⭐ УРОВЕНЬ: ${PlayerData.level}`, {
            fontSize: '20px', fill: '#ffd700', align: 'center'
        }).setOrigin(0.5);
    }
}