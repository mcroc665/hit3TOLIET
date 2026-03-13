const Match3Engine = {
    isAdjacent(tile1, tile2) {
        const rowDiff = Math.abs(tile1.row - tile2.row);
        const colDiff = Math.abs(tile1.col - tile2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    },

    getMatches(board, gridSize) {
        const matches = [];

        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize - 2; c++) {
                const t1 = board[r][c];
                const t2 = board[r][c + 1];
                const t3 = board[r][c + 2];
                if (t1 && t2 && t3 && t1.colorIndex === t2.colorIndex && t1.colorIndex === t3.colorIndex) {
                    matches.push(`${r},${c}`, `${r},${c + 1}`, `${r},${c + 2}`);
                }
            }
        }

        for (let c = 0; c < gridSize; c++) {
            for (let r = 0; r < gridSize - 2; r++) {
                const t1 = board[r][c];
                const t2 = board[r + 1][c];
                const t3 = board[r + 2][c];
                if (t1 && t2 && t3 && t1.colorIndex === t2.colorIndex && t1.colorIndex === t3.colorIndex) {
                    matches.push(`${r},${c}`, `${r + 1},${c}`, `${r + 2},${c}`);
                }
            }
        }

        return [...new Set(matches)].map((str) => {
            const [r, c] = str.split(',').map(Number);
            return { row: r, col: c };
        });
    }
};
