const LevelsConfig = [
    {
        id: 1,
        targetScore: 500,
        maxMoves: 15,
        stars: [200, 400, 500], // Пороги для 1, 2, 3 звезд
        reward: { money: 100, xp: 50 },
        isBoss: false
    },
    {
        id: 5,
        targetScore: 2000,
        maxMoves: 20,
        stars: [800, 1500, 2000],
        reward: { money: 500, xp: 200 },
        isBoss: true,
        bossName: "Грязный Бачок",
        bossId: "boss_tank"
    },
    // Добавь промежуточные уровни по аналогии...
];