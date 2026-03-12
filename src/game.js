// Настройки игры
const config = {
    type: Phaser.AUTO,
    width: 450,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#3498db',
    scene: [SceneLevel] // Важно: SceneLevel должен быть загружен до этого момента
};

// Создаем игру (только если её еще нет)
if (!window.gameInstance) {
    window.gameInstance = new Phaser.Game(config);
}