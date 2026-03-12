const PlayerData = {
    money: 0,
    xp: 0,
    level: 1,
    unlockedLevels: 1,
    currentLevelToPlay: 1,
    bestiary: [],

    addBossToCollection(bossId) {
        if (!this.bestiary.includes(bossId)) {
            this.bestiary.push(bossId);
            this.save();
            console.log(`[Data] Босс ${bossId} добавлен в бестиарий!`);
        }
    },

    save() {
        const data = {
            money: this.money,
            xp: this.xp,
            level: this.level,
            unlockedLevels: this.unlockedLevels,
            bestiary: this.bestiary
        };
        localStorage.setItem('toiletMatch3Save', JSON.stringify(data));
        console.log("[Data] Данные сохранены:", data);
    },

    load() {
        const saved = localStorage.getItem('toiletMatch3Save');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(this, parsed);
            console.log("[Data] Данные загружены:", this);
        }
    },

    addRewards(m, x) {
        this.money += m;
        this.xp += x;
        // Простая логика уровня: каждые 100 XP — новый уровень
        if (this.xp >= this.level * 100) {
            this.level++;
            console.log("[Data] НОВЫЙ УРОВЕНЬ ИГРОКА:", this.level);
        }
        this.save();
    }
};

PlayerData.load();