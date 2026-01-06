export const calculateLevel = (xp) => {
    if (!xp || xp < 0) return 1;
    // Level N requires 100 * (N-1)^2 XP
    // Inverse: Level = floor(sqrt(xp / 100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const calculateXpForNextLevel = (currentLevel) => {
    // XP required to reach next level (currentLevel + 1)
    return 100 * Math.pow(currentLevel, 2);
};

export const calculateProgressToNextLevel = (xp) => {
    const currentLevel = calculateLevel(xp);
    const nextLevelXp = calculateXpForNextLevel(currentLevel);
    const currentLevelBaseXp = 100 * Math.pow(currentLevel - 1, 2);

    const xpInCurrentLevel = xp - currentLevelBaseXp;
    const xpNeededForLevel = nextLevelXp - currentLevelBaseXp;

    return (xpInCurrentLevel / xpNeededForLevel) * 100;
};

export const XP_REWARDS = {
    WORKOUT_COMPLETION: 50,
    PR_BONUS: 10,
};
