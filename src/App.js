import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';

function App() {

  const [miniLeagueID, setMiniLeagueID] = useState('');
  const [miniLeagueData, setMiniLeagueData] = useState(null);
  const [miniLeaguePlayersIDs, setMiniLeaguePlayersIDs] = useState(null);
  const [miniLeagueTeams, setMiniLeagueTeams] = useState([]);

  useEffect(() => {
    if(miniLeaguePlayersIDs) {
      Calculation(miniLeaguePlayersIDs)
    }
  }, [miniLeaguePlayersIDs])


  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let league = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`)
    setMiniLeagueData(league.data);
    setMiniLeaguePlayersIDs(league.data.standings.results.map(team => team.entry));
  }

  function Calculation(arr) {

    arr.map(async teamID => {
        const url = `https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${teamID}/event/3/picks/`
        let response = await axios.get(url)
        setMiniLeagueTeams((prevValue) => [...prevValue, response.data]);
    })


    
    console.log('hejhej')
}

  return (
    <div className="App">
      Enter your Mini-League ID:
      <form onSubmit={handleFormSubmit}>
        <input value={miniLeagueID} onChange={handleInputChange}/>
      </form>
      {miniLeagueData ? (
        <>
          <div>
            {miniLeagueData.league.name}
          </div>
          <div>
            {miniLeagueData.standings.results.map(team => <div key={team.id}>{team.player_name + team.total}</div>)}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default App;
