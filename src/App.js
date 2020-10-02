import React, { useState } from 'react';
import './App.css';
import axios from 'axios';

function App() {

  const [miniLeagueID, setMiniLeagueID] = useState('');
  const [points, setPoints] = useState([]);

  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    Calculation(miniLeagueID);
    
  }

  function Calculation(miniLeagueID) {

    axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`)
        .then(league => {
            let miniLeagueData = league;
            let miniLeaguePlayersData = league.data.standings.results.map(team => ({'entry': team.entry, 'player_name': team.player_name, 'entry_name': team.entry_name}));
            return {miniLeagueData, miniLeaguePlayersData};
        })
        .then(data => {
            let miniLeagueTeams = [];
            data.miniLeaguePlayersData.map(async teamID => {
                const url = `https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${teamID.entry}/event/3/picks/`
                axios.get(url).then(response => {
                    miniLeagueTeams.push({'picks': response.data.picks, ...teamID})
                })
                
            })
            return miniLeagueTeams;
        })
        .then(async miniLeagueTeams => {
            let playerPointsData = await axios.get('https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/event/3/live/')
            return {miniLeagueTeams, playerPointsData}
        })
        .then(({miniLeagueTeams, playerPointsData}) => {
            let miniLeagueTeamsPointsArray = [];
            console.log(miniLeagueTeams)
            console.log(playerPointsData)
            for(let i = 0; i < miniLeagueTeams.length; i++) {
                let pointsSum = 0;
                let miniLeagueTeamsPoints = {};
                let counter = 0;
                let playCounter = 0;
                for(let j = 0; j < miniLeagueTeams[i].picks.length; j++) {
                  if(playCounter >= 12) {
                    break;
                  }
                  counter++;
                  let playerTeamActivity = miniLeagueTeams[i].picks[j];
                  let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                  let didCaptainPlay = true;
                  let viceCaptainPoints = 0;
                  if (playerTeamActivity.position > 11) continue;
                  if (playerTeamActivity.is_captain && playerStats.minutes <= 0) {
                    didCaptainPlay = false;
                    continue;
                  }
                  if (playerTeamActivity.is_vice_captain) {
                    viceCaptainPoints = playerStats.total_points;
                  }
                  if (playerStats.minutes <= 0) continue;
                  if (!didCaptainPlay && (counter >= miniLeagueTeams[i].picks.length - 1 || playCounter === 11)) {
                    pointsSum += viceCaptainPoints
                    playCounter++;
                    continue;
                  }
                  
                  if (playerTeamActivity.is_captain) {
                    pointsSum += (playerStats.total_points * 2)
                    playCounter++;
                  } else {
                    pointsSum += playerStats.total_points;
                    playCounter++;
                  }
                  
                }
                miniLeagueTeamsPoints['entry'] = miniLeagueTeams[i].entry; 
                miniLeagueTeamsPoints['points'] = pointsSum;
                miniLeagueTeamsPoints['player_name'] = miniLeagueTeams[i].player_name; 
                miniLeagueTeamsPoints['player_name'] = miniLeagueTeams[i].entry_name; 
                miniLeagueTeamsPointsArray.push(miniLeagueTeamsPoints)
            }
            setPoints(miniLeagueTeamsPointsArray);
        })


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
