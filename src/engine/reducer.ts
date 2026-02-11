// Initial game state
const initialGameState = {
    level: 1,
    score: 0,
    lives: 3,
};

// Game state reducer function
function gameStateReducer(state = initialGameState, action) {
    switch (action.type) {
        case 'INCREMENT_SCORE':
            return {
                ...state,
                score: state.score + action.payload,
            };
        case 'DECREMENT_LIVES':
            return {
                ...state,
                lives: state.lives - 1,
            };
        case 'LEVEL_UP':
            return {
                ...state,
                level: state.level + 1,
            };
        default:
            return state;
    }
}

export { gameStateReducer, initialGameState };