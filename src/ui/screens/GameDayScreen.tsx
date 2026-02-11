import React from 'react';

const GameDayScreen = () => {
    const [gameResults, setGameResults] = React.useState(null);

    const simulateGame = () => {
        // Simulate a game and set the result
        const result = Math.random() > 0.5 ? 'Win' : 'Loss';
        setGameResults(result);
    };

    return (
        <div>
            <h1>Game Day Information</h1>
            <button onClick={simulateGame}>Simulate Game</button>
            {gameResults && <p>Game Result: {gameResults}</p>}
        </div>
    );
};

export default GameDayScreen;