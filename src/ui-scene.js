class SceneUI extends Phaser.Scene {
    constructor() {
        super('SceneUI');
    }

    create() {
        const width = this.scale.width;

        this.add.rectangle(0, 0, width, 100, 0x000000, 0.35).setOrigin(0).setDepth(1000);
        this.scoreText = this.add.text(20, 16, 'Очки: 0/0', {
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setDepth(1001);

        this.movesText = this.add.text(20, 54, 'Ходы: 0', {
            fontSize: '24px',
            color: '#ffd166',
            fontStyle: 'bold'
        }).setDepth(1001);

        this.tipText = this.add.text(width - 20, 30, 'Тап/клик + соседняя фишка', {
            fontSize: '16px',
            color: '#cde7ff',
            align: 'right'
        }).setOrigin(1, 0).setDepth(1001);
    }

    updateUI(score, targetScore, movesLeft) {
        this.scoreText?.setText(`Очки: ${score}/${targetScore}`);
        this.movesText?.setText(`Ходы: ${movesLeft}`);
        this.movesText?.setColor(movesLeft <= 5 ? '#ff6b6b' : '#ffd166');
    }

    showEndScreen(isWin, levelData, score, onRestart) {
        const width = this.scale.width;
        const height = this.scale.height;

        this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.72).setDepth(2000);

        const title = isWin ? 'Уровень пройден!' : 'Ходы закончились';
        const subtitle = isWin
            ? `Награда: +${levelData.reward.money} золота, +${levelData.reward.xp} XP`
            : 'Попробуйте ещё раз';

        this.add.text(width / 2, height / 2 - 100, title, {
            fontSize: '42px',
            color: isWin ? '#7bed9f' : '#ff6b6b',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2001);

        this.add.text(width / 2, height / 2 - 20, `Счёт: ${score}`, {
            fontSize: '30px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(2001);

        this.add.text(width / 2, height / 2 + 30, subtitle, {
            fontSize: '22px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(2001);

        const btn = this.add.rectangle(width / 2, height / 2 + 120, 250, 70, 0x2ed573)
            .setInteractive()
            .setDepth(2001);
        this.add.text(width / 2, height / 2 + 120, 'Переиграть', {
            fontSize: '30px',
            color: '#102027',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2002);

        btn.on('pointerdown', onRestart);
    }
}
