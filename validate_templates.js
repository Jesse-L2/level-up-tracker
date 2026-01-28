
const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'levelUpTracker', 'public', 'program-templates.json');

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const lifts = data.lifts;
    const programs = data.programs;

    const liftIds = new Set(Object.keys(lifts));
    const errors = [];

    Object.keys(programs).forEach(progId => {
        const program = programs[progId];
        console.log(`Checking program: ${program.name} (${progId})`);

        // keys that are not metadata
        const metaKeys = ['id', 'name', 'description', 'structure'];
        const days = Object.keys(program).filter(k => !metaKeys.includes(k));

        days.forEach(day => {
            const exercises = program[day];
            Object.keys(exercises).forEach(exId => {
                if (!liftIds.has(exId)) {
                    errors.push(`Program '${program.name}' Day '${day}' references unknown lift ID: '${exId}'`);
                }
            });
        });
    });

    if (errors.length > 0) {
        console.log("Validation Errors Found:");
        errors.forEach(e => console.error(e));
    } else {
        console.log("All programs validated successfully!");
    }
} catch (e) {
    console.error("Error reading or parsing file:", e);
}
