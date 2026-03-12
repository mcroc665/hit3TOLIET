class SceneLevel extends Phaser.Scene {
    constructor() {
        super('SceneLevel');
        this.selectedTile = null;
        this.canMove = true;
    }

    create() {
        this.gridSize = 8;
        this.tileSize = 50;
        this.colors = [0xffffff, 0xff0000, 0x00ff00, 0xffff00, 0xff00ff];
        this.offsetX = (this.sys.game.config.width - (this.gridSize * this.tileSize)) / 2;
        this.offsetY = (this.sys.game.config.height - (this.gridSize * this.tileSize)) / 2;

        this.board = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(null));
        this.createBoard();
    }

    createBoard() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                this.spawnTile(r, c);
            }
        }
    }

    spawnTile(row, col, isNew = false) {
        const colorIndex = Math.floor(Math.random() * this.colors.length);
        const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
        // Если плитка новая, она «рождается» выше экрана и падает
        const startY = isNew ? this.offsetY - 100 : this.offsetY + row * this.tileSize + this.tileSize / 2;
        const targetY = this.offsetY + row * this.tileSize + this.tileSize / 2;

        const visual = this.add.rectangle(x, startY, this.tileSize - 4, this.tileSize - 4, this.colors[colorIndex]);
        visual.setInteractive();

        const tileData = { row, col, colorIndex, visual };
        visual.on('pointerdown', () => this.handleTileClick(tileData));
        this.board[row][col] = tileData;

        if (isNew) {
            this.tweens.add({ targets: visual, y: targetY, duration: 300 });
        }
    }

    async handleTileClick(tile) {
        if (!this.canMove) return;

        if (!this.selectedTile) {
            this.selectedTile = tile;
            tile.visual.setStrokeStyle(3, 0x000000);
        } else {
            if (Match3Engine.isAdjacent(this.selectedTile, tile)) {
                this.canMove = false;
                this.selectedTile.visual.setStrokeStyle(0);
                await this.swapTiles(this.selectedTile, tile);
                this.handleMatches();
            } else {
                this.selectedTile.visual.setStrokeStyle(0);
                this.selectedTile = tile;
                tile.visual.setStrokeStyle(3, 0x000000);
            }
        }
    }

    async swapTiles(tile1, tile2) {
        const r1 = tile1.row, c1 = tile1.col;
        const r2 = tile2.row, c2 = tile2.col;

        // Меняем в массиве
        this.board[r1][c1] = tile2;
        this.board[r2][c2] = tile1;
        tile1.row = r2; tile1.col = c2;
        tile2.row = r1; tile2.col = c1;

        // Анимация полета
        return new Promise(resolve => {
            this.tweens.add({
                targets: [tile1.visual],
                x: this.offsetX + c2 * this.tileSize + this.tileSize / 2,
                y: this.offsetY + r2 * this.tileSize + this.tileSize / 2,
                duration: 200
            });
            this.tweens.add({
                targets: [tile2.visual],
                x: this.offsetX + c1 * this.tileSize + this.tileSize / 2,
                y: this.offsetY + r1 * this.tileSize + this.tileSize / 2,
                duration: 200,
                onComplete: resolve
            });
        });
    }

    async handleMatches() {
        const matches = Match3Engine.getMatches(this.board, this.gridSize);
        if (matches.length > 0) {
            // 1. Удаляем плитки
            matches.forEach(m => {
                const tile = this.board[m.row][m.col];
                if (tile) {
                    tile.visual.destroy();
                    this.board[m.row][m.col] = null;
                }
            });

            // 2. Гравитация (падение вниз)
            await this.applyGravity();

            // 3. Рекурсия (проверяем на новые комбо после падения)
            this.handleMatches();
        } else {
            this.canMove = true;
            this.selectedTile = null;
        }
    }

    async applyGravity() {
        for (let c = 0; c < this.gridSize; c++) {
            let emptySpaces = 0;
            for (let r = this.gridSize - 1; r >= 0; r--) {
                if (this.board[r][c] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // Двигаем плитку вниз на пустые места
                    const tile = this.board[r][c];
                    this.board[r + emptySpaces][c] = tile;
                    this.board[r][c] = null;
                    tile.row = r + emptySpaces;

                    this.tweens.add({
                        targets: tile.visual,
                        y: this.offsetY + tile.row * this.tileSize + this.tileSize / 2,
                        duration: 300
                    });
                }
            }
            // Добавляем новые плитки сверху
            for (let i = 0; i < emptySpaces; i++) {
                this.spawnTile(i, c, true);
            }
        }
        await new Promise(r => setTimeout(r, 350));
    }
}