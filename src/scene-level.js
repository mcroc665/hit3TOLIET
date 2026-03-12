class SceneLevel extends Phaser.Scene {
    constructor() {
        super('SceneLevel');
    }

    /**
     * INIT - Выполняется ПЕРВЫМ при запуске сцены.
     * Здесь мы обнуляем все переменные, чтобы старые очки не перешли в новый уровень.
     */
    init() {
        this.score = 0;
        this.movesLeft = 0;
        this.selectedTile = null;
        this.canMove = true; // Блокирует клики, пока идет анимация
        console.log("[SceneLevel] Данные уровня сброшены.");
    }

    /**
     * CREATE - Отрисовка уровня.
     */
    create() {
        // 1. Запускаем параллельно интерфейс (UI)
        if (!this.scene.isActive('SceneUI')) {
            this.scene.run('SceneUI');
        }

        // 2. Определяем, какой уровень загружать
        const selectedLevel = PlayerData.currentLevelToPlay || 1;
        const levelIdx = selectedLevel - 1;

        // Берем данные из нашего конфига (если уровня нет — берем первый)
        this.currentLevelData = LevelsConfig[levelIdx] || LevelsConfig[0];

        // Устанавливаем лимит ходов из конфига
        this.movesLeft = this.currentLevelData.maxMoves || 20;

        // 3. Настройки сетки (Масштаб 40px, чтобы всё влезло)
        this.gridSize = 8;
        this.tileSize = 40;
        const boardSize = this.gridSize * this.tileSize;

        // Центрируем поле: (Ширина экрана - Ширина поля) / 2
        this.offsetX = (this.sys.game.config.width - boardSize) / 2;
        this.offsetY = 120; // Оставляем место сверху

        // Цвета фишек (в будущем заменим на иконки)
        this.colors = [0xffffff, 0xff0000, 0x00ff00, 0xffff00, 0xff00ff];

        // Создаем пустую матрицу поля
        this.board = Array.from({ length: this.gridSize }, () => Array(this.gridSize).fill(null));

        // Заполняем поле фишками
        this.createBoard();

        // Обновляем UI через 100мс, чтобы сцена успела прогрузиться
        this.time.delayedCall(100, () => this.updateUI());
    }

    /**
     * Создание начальной сетки фишек
     */
    createBoard() {
        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                this.spawnTile(r, c);
            }
        }
    }

    /**
     * Создание одной фишки
     * @param {number} row - ряд
     * @param {number} col - колонка
     * @param {boolean} isNew - падает ли она сверху (для анимации)
     */
    spawnTile(row, col, isNew = false) {
        const colorIndex = Math.floor(Math.random() * this.colors.length);
        const x = this.offsetX + col * this.tileSize + this.tileSize / 2;
        const targetY = this.offsetY + row * this.tileSize + this.tileSize / 2;

        // Если новая — стартует выше экрана, иначе — сразу на месте
        const startY = isNew ? targetY - 400 : targetY;

        const visual = this.add.rectangle(x, startY, this.tileSize - 4, this.tileSize - 4, this.colors[colorIndex]);
        visual.setInteractive();
        visual.setDepth(10);

        const tileData = { row, col, colorIndex, visual };

        // Вешаем событие клика
        visual.on('pointerdown', () => this.handleTileClick(tileData));
        this.board[row][col] = tileData;

        // Если фишка новая — запускаем анимацию падения
        if (isNew) {
            this.tweens.add({ targets: visual, y: targetY, duration: 300 });
        }
    }

    /**
     * Обработка клика по фишке
     */
    async handleTileClick(tile) {
        if (!this.canMove) return; // Ждем окончания анимаций

        if (!this.selectedTile) {
            // ПЕРВЫЙ КЛИК: выбираем фишку
            this.selectedTile = tile;
            tile.visual.setStrokeStyle(3, 0x000000); // Рисуем рамку
        } else {
            // ВТОРОЙ КЛИК: проверяем, можно ли поменять
            if (Match3Engine.isAdjacent(this.selectedTile, tile)) {
                this.canMove = false; // Блокируем ввод
                this.movesLeft--;     // ТРАТИМ ХОД

                this.selectedTile.visual.setStrokeStyle(0); // Убираем рамку

                await this.swapTiles(this.selectedTile, tile);
                this.handleMatches(); // Ищем совпадения
            } else {
                // Если кликнули далеко — перевыбираем фишку
                this.selectedTile.visual.setStrokeStyle(0);
                this.selectedTile = tile;
                tile.visual.setStrokeStyle(3, 0x000000);
            }
        }
    }

    /**
     * Анимация перемещения двух фишек
     */
    async swapTiles(tile1, tile2) {
        const r1 = tile1.row, c1 = tile1.col, r2 = tile2.row, c2 = tile2.col;

        // Меняем местами в логической матрице
        this.board[r1][c1] = tile2;
        this.board[r2][c2] = tile1;

        // Обновляем координаты внутри объектов
        tile1.row = r2; tile1.col = c2;
        tile2.row = r1; tile2.col = c1;

        // Запускаем визуальное движение
        return new Promise(resolve => {
            this.tweens.add({
                targets: tile1.visual,
                x: this.offsetX + c2 * this.tileSize + this.tileSize / 2,
                y: this.offsetY + r2 * this.tileSize + this.tileSize / 2,
                duration: 200
            });
            this.tweens.add({
                targets: tile2.visual,
                x: this.offsetX + c1 * this.tileSize + this.tileSize / 2,
                y: this.offsetY + r1 * this.tileSize + this.tileSize / 2,
                duration: 200,
                onComplete: resolve
            });
        });
    }

    /**
     * Основная логика поиска и удаления совпадений
     */
    async handleMatches() {
        const matches = Match3Engine.getMatches(this.board, this.gridSize);

        if (matches.length > 0) {
            // 1. Начисляем очки
            this.score += matches.length * 10;
            this.updateUI();

            // 2. Удаляем совпавшие фишки
            matches.forEach(m => {
                const tile = this.board[m.row][m.col];
                if (tile) {
                    tile.visual.destroy();
                    this.board[m.row][m.col] = null;
                }
            });

            // 3. Ждем немного и включаем гравитацию
            await this.applyGravity();

            // 4. Проверяем: не набрали ли мы нужное количество очков?
            if (this.score >= this.currentLevelData.targetScore) {
                this.finishLevel(true);
            } else {
                // Ищем новые совпадения (каскадная реакция)
                this.handleMatches();
            }
        } else {
            // Совпадений нет — проверяем, не закончились ли ходы
            if (this.movesLeft <= 0) {
                this.finishLevel(false);
            } else {
                this.canMove = true; // Возвращаем управление игроку
                this.selectedTile = null;
            }
        }
    }

    /**
     * Гравитация: заставляет фишки падать вниз в пустые места
     */
    async applyGravity() {
        for (let c = 0; c < this.gridSize; c++) {
            let emptySpaces = 0;
            for (let r = this.gridSize - 1; r >= 0; r--) {
                if (this.board[r][c] === null) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
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
            // Создаем новые фишки сверху вместо улетевших
            for (let i = 0; i < emptySpaces; i++) this.spawnTile(i, c, true);
        }
        await new Promise(r => setTimeout(r, 400));
    }

    /**
     * Завершение уровня (Победа или Проигрыш)
     */
    finishLevel(isWin) {
        if (isWin) {
            console.log("[Level] Победа!");

            // Если это босс — добавляем в коллекцию
            if (this.currentLevelData.isBoss) {
                PlayerData.addBossToCollection(this.currentLevelData.bossId);
            }

            // Начисляем награды
            PlayerData.addRewards(this.currentLevelData.reward.money, this.currentLevelData.reward.xp);

            // Если прошли текущий максимальный уровень — открываем следующий
            if (PlayerData.currentLevelToPlay >= PlayerData.unlockedLevels) {
                PlayerData.unlockedLevels++;
            }
            PlayerData.save();

            // Показываем окно победы со звездами
            const stars = this.calculateStars();
            const ui = this.scene.get('SceneUI');
            if (ui) ui.showWinScreen(this.currentLevelData.reward, stars);

        } else {
            console.log("[Level] Проигрыш (кончились ходы)");
            alert("Ходы закончились! Попробуйте снова.");
            this.scene.start('SceneMenu');
        }
    }

    /**
     * Расчет количества звезд на основе очков
     */
    calculateStars() {
        const s = this.currentLevelData.stars;
        if (this.score >= s[2]) return 3;
        if (this.score >= s[1]) return 2;
        if (this.score >= s[0]) return 1;
        return 0;
    }

    /**
     * Обновление текста и полоски в UI
     */
    updateUI() {
        const ui = this.scene.get('SceneUI');
        if (ui && ui.updateUI) {
            // Передаем очки, цель и оставшиеся ходы
            ui.updateUI(this.score, this.currentLevelData.targetScore, this.movesLeft);
        }
    }
}