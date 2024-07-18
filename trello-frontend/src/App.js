import React, { useState } from 'react';
import './App.css';

function App() {
  const [boards, setBoards] = useState([
    { id: 1, name: 'To Do', cards: ['Task 1', 'Task 2'] },
    { id: 2, name: 'In Progress', cards: ['Task 3'] },
    { id: 3, name: 'Done', cards: ['Task 4'] },
  ]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Trello Clone</h1>
      </header>
      <div className="boards">
        {boards.map((board) => (
          <div key={board.id} className="board">
            <h2>{board.name}</h2>
            <div className="cards">
              {board.cards.map((card, index) => (
                <div key={index} className="card">
                  {card}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
