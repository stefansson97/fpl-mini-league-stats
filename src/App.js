import React, { useState } from 'react';
import './App.css';
import Calculation from './calculation';


function App() {

  const [miniLeagueID, setMiniLeagueID] = useState('');
  const [points, setPoints] = useState([]);

  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let points = await Calculation(miniLeagueID)
    setPoints(points);
  }

  return (
    <div className="App">
      Enter your Mini-League ID:
      <form onSubmit={handleFormSubmit}>
        <input value={miniLeagueID} onChange={handleInputChange}/>
      </form>
      {points ? (
        <div>
          {points.map(team => {
            return (
              <div>
                {team.player_name}
                {team.points}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  );
}

export default App;
