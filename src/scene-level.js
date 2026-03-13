class SceneLevel extends Phaser.Scene {
    constructor() {
        super('SceneLevel');
    }

    init() {
        this.score = 0;
        this.selectedTile = null;
        this.canMove = true;
        this.levelData = LevelsConfig[0];
        this.movesLeft = this.levelData.maxMoves;
        this.gridSize = 8;
        this.tileSize = 48;
        this.colors = [0xf94144, 0xf3722c, 0xf9c74f, 0x43aa8b, 0x577590];
    }

    create() {
        if (!this.scene.isActive('SceneUI')) {
            this.scene.run('SceneUI');
        }

        const boardSize = this.gridSize * this.tileSize;
        this.offsetX = (this.scale.width - boardSize) / 2;
        this.offsetY = 130;
        this.board = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(null));

        this.add.rectangle(this.scale.width / 2, this.offsetY + boardSize / 2, boardSize + 10, boardSize + 10, 0xffffff, 0.08)
            .setStrokeStyle(3, 0xffffff, 0.2);

        this.fillBoardWithoutMatches();
        this.updateUI();
    }

    fillBoardWithoutMatches() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                let colorIndex;
                do {
                    colorIndex = Phaser.Math.Between(0, this.colors.length - 1);
                } while (this.wouldCreateMatch(r, c, colorIndex));
                this.spawnTile(r, c, colorIndex);
            }
        }

        if (!this.hasPossibleMoves()) {
            this.clearBoard();
            this.fillBoardWithoutMatches();
        }
    }

    clearBoard() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                this.board[r][c]?.visual.destroy();
                this.board[r][c] = null;
            }
        }
    }

    wouldCreateMatch(row, col, colorIndex) {
        if (col >= 2 && this.board[row][col - 1] && this.board[row][col - 2]
            && this.board[row][col - 1].colorIndex === colorIndex
            && this.board[row][col - 2].colorIndex === colorIndex) {
            return true;
        }

        if (row >= 2 && this.board[row - 1][col] && this.board[row - 2][col]
            && this.board[row - 1][col].colorIndex === colorIndex
            && this.board[row - 2][col].colorIndex === colorIndex) {
            return true;
        }

        return false;
    }

    spawnTile(row, col, colorIndex, fromTop = false) {
        const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
        const finalY = this.offsetY + row * this.tileSize + this.tileSize / 2;
        const startY = fromTop ? finalY - this.tileSize * 8 : finalY;

        const visual = this.add.circle(x, startY, this.tileSize / 2 - 5, this.colors[colorIndex])
            .setStrokeStyle(2, 0xffffff, 0.4)
            .setInteractive({ useHandCursor: true });

        const tile = { row, col, colorIndex, visual };

        visual.on('pointerdown', () => this.handleTileClick(tile));
        this.board[row][col] = tile;

        if (fromTop) {
            this.tweens.add({ targets: visual, y: finalY, duration: 220 });
        }
    }

    async handleTileClick(tile) {
        if (!this.canMove) return;

        if (!this.selectedTile) {
            this.selectedTile = tile;
            tile.visual.setStrokeStyle(5, 0xffffff, 0.95);
            return;
        }

        const first = this.selectedTile;
        first.visual.setStrokeStyle(2, 0xffffff, 0.4);

        if (first === tile) {
            this.selectedTile = null;
            return;
        }

        if (!Match3Engine.isAdjacent(first, tile)) {
            this.selectedTile = tile;
            tile.visual.setStrokeStyle(5, 0xffffff, 0.95);
            return;
        }

        this.selectedTile = null;
        this.canMove = false;
        this.movesLeft -= 1;
        this.updateUI();

        await this.swapTiles(first, tile);

        const hasMatch = Match3Engine.getMatches(this.board, this.gridSize).length > 0;

        if (!hasMatch) {
            await this.swapTiles(first, tile);
            this.canMove = true;
            if (this.movesLeft <= 0) {
                this.finishLevel(false);
            }
            return;
        }

        await this.resolveMatchesCascade();

        if (this.score >= this.levelData.targetScore) {
            this.finishLevel(true);
            return;
        }

        if (this.movesLeft <= 0) {
            this.finishLevel(false);
            return;
        }

        if (!this.hasPossibleMoves()) {
            this.shuffleBoard();
        }

        this.canMove = true;
    }

    swapTiles(tileA, tileB) {
        const { row: r1, col: c1 } = tileA;
        const { row: r2, col: c2 } = tileB;

        this.board[r1][c1] = tileB;
        this.board[r2][c2] = tileA;
        tileA.row = r2; tileA.col = c2;
        tileB.row = r1; tileB.col = c1;

        return new Promise((resolve) => {
            this.tweens.add({
                targets: tileA.visual,
                x: this.offsetX + c2 * this.tileSize + this.tileSize / 2,
                y: this.offsetY + r2 * this.tileSize + this.tileSize / 2,
                duration: 180
            });
            this.tweens.add({
                targets: tileB.visual,
                x: this.offsetX + c1 * this.tileSize + this.tileSize / 2,
                y: this.offsetY + r1 * this.tileSize + this.tileSize / 2,
                duration: 180,
                onComplete: resolve
            });
        });
    }

    async resolveMatchesCascade() {
        while (true) {
            const matches = Match3Engine.getMatches(this.board, this.gridSize);
            if (!matches.length) break;

            this.score += matches.length * 10;
            this.updateUI();

            for (const match of matches) {
                const tile = this.board[match.row][match.col];
                if (!tile) continue;
                this.board[match.row][match.col] = null;
                this.tweens.add({ targets: tile.visual, alpha: 0, scale: 0.3, duration: 140, onComplete: () => tile.visual.destroy() });
            }

            await this.wait(160);
            await this.applyGravity();
            await this.wait(130);
        }
    }

    async applyGravity() {
        for (let c = 0; c < this.gridSize; c++) {
            let empty = 0;
            for (let r = this.gridSize - 1; r >= 0; r--) {
                const tile = this.board[r][c];
                if (!tile) {
                    empty += 1;
                    continue;
                }

                if (empty > 0) {
                    this.board[r + empty][c] = tile;
                    this.board[r][c] = null;
                    tile.row = r + empty;
                    this.tweens.add({
                        targets: tile.visual,
                        y: this.offsetY + tile.row * this.tileSize + this.tileSize / 2,
                        duration: 180
                    });
                }
            }

            for (let i = 0; i < empty; i++) {
                const row = i;
                const colorIndex = Phaser.Math.Between(0, this.colors.length - 1);
                this.spawnTile(row, c, colorIndex, true);
            }
        }

        await this.wait(230);
    }

    hasPossibleMoves() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                if (c + 1 < this.gridSize && this.checkPotentialSwap(r, c, r, c + 1)) return true;
                if (r + 1 < this.gridSize && this.checkPotentialSwap(r, c, r + 1, c)) return true;
            }
        }

        return false;
    }

    checkPotentialSwap(r1, c1, r2, c2) {
        const a = this.board[r1][c1];
        const b = this.board[r2][c2];
        if (!a || !b) return false;

        this.board[r1][c1] = b;
        this.board[r2][c2] = a;
        const hasMatch = Match3Engine.getMatches(this.board, this.gridSize).length > 0;
        this.board[r1][c1] = a;
        this.board[r2][c2] = b;

        return hasMatch;
    }

    shuffleBoard() {
        const tiles = [];
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                tiles.push(this.board[r][c]);
            }
        }

        Phaser.Utils.Array.Shuffle(tiles);

        let i = 0;
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const tile = tiles[i++];
                tile.row = r;
                tile.col = c;
                this.board[r][c] = tile;
                this.tweens.add({
                    targets: tile.visual,
                    x: this.offsetX + c * this.tileSize + this.tileSize / 2,
                    y: this.offsetY + r * this.tileSize + this.tileSize / 2,
                    duration: 240
                });
            }
        }
    }

    finishLevel(isWin) {
        this.canMove = false;

        if (isWin) {
            PlayerData.addRewards(this.levelData.reward.money, this.levelData.reward.xp);
            PlayerData.unlockedLevels = Math.max(PlayerData.unlockedLevels, 1);
            PlayerData.save();
        }

        const ui = this.scene.get('SceneUI');
        ui?.showEndScreen(isWin, this.levelData, this.score, () => {
            this.scene.stop('SceneUI');
            this.scene.restart();
        });
    }

    updateUI() {
        this.scene.get('SceneUI')?.updateUI(this.score, this.levelData.targetScore, this.movesLeft);
    }

    wait(ms) {
        return new Promise((resolve) => this.time.delayedCall(ms, resolve));
    }
}
