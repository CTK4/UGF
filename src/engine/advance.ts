// day advancement logic
function advanceDay(currentDate) {
    let nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    return nextDate;
}

// phase transition logic
function transitionPhase(currentPhase) {
    const phases = ['morning', 'afternoon', 'evening', 'night'];
    let currentIndex = phases.indexOf(currentPhase);
    let nextIndex = (currentIndex + 1) % phases.length;
    return phases[nextIndex];
}

// Example usage
const currentDate = new Date('2026-02-11T22:25:30Z');
console.log("Next Date:", advanceDay(currentDate));
console.log("Next Phase:", transitionPhase('evening'));