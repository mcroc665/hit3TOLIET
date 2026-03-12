const config = {
    type: Phaser.AUTO,
    width: 450,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#3498db',
    // Обязательно добавь SceneMenu сюда:
    scene: [SceneMenu, SceneLevel, SceneUI]
};

const game = new Phaser.Game(config);