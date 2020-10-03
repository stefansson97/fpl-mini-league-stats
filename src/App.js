import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import { players } from './players';
import { gameweekFixtures } from './gameweekFixtures';

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

  function getPlayersType(picks) {
    let updatedPicks = picks;
    for(let i = 0; i < picks.length; i++) {
      let type = players[(picks[i].element - 1)].element_type;
      let team = players[(picks[i].element - 1)].team;
      if (type === 1) {
        type = 'GKP'
      } else if(type === 2) {
        type = 'DEF'
      } else if(type === 3) {
        type = 'MID'
      } else if (type === 4) {
        type = 'FWD'
      }
      updatedPicks[i]['element_type'] = type;
      updatedPicks[i]['team'] = team;
    }
    
    return updatedPicks;
  }

  function teamAnalyze(picks) {
    let playerPositions = {
      'GKP': 0,
      'DEF': 0,
      'MID': 0,
      'FWD': 0
    }
    for(let i = 0; i < 11; i++) {
      playerPositions[picks[i].element_type] += 1;
    }
    return playerPositions;
  }

  function Calculation(miniLeagueID) {

    axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`)
        .then(league => {
            let miniLeagueData = league;
            let miniLeaguePlayersData = league.data.standings.results.map(team => ({'total_points': team.total, 'entry': team.entry, 'player_name': team.player_name, 'entry_name': team.entry_name}));
            return {miniLeagueData, miniLeaguePlayersData};
        })
        .then(data => {
            let miniLeagueTeams = [];
            data.miniLeaguePlayersData.map(async teamID => {
                const url = `https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${teamID.entry}/event/4/picks/`
                axios.get(url).then(response => {
                    let picks = getPlayersType(response.data.picks);
                    miniLeagueTeams.push({'picks': picks, ...teamID})
                })
                
            })
            return miniLeagueTeams;
        })
        .then(async miniLeagueTeams => {
            let playerPointsData = await axios.get('https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/event/4/live/')
            return {miniLeagueTeams, playerPointsData}
        })
        .then(({miniLeagueTeams, playerPointsData}) => {
            let miniLeagueTeamsPointsArray = [];
            console.log(miniLeagueTeams)
            console.log(playerPointsData)
            for(let i = 0; i < miniLeagueTeams.length; i++) {
                let teamPlayingPositions = teamAnalyze(miniLeagueTeams[i].picks);
                console.log(teamPlayingPositions);
                let realTeamPlayingPositions = {
                  'GKP': 0,
                  'DEF': 0,
                  'MID': 0,
                  'FWD': 0
                };
                let pointsSum = 0;
                let miniLeagueTeamsPoints = {};
                let playCounter = 0;
                let didFirstGKPlay = true;
                let counter = 0;
                let captainPoints = 0;
                let didCaptainPlay = false;
                let viceCaptainPoints = 0;
                let dateNow = new Date();
                for(let j = 0; j < miniLeagueTeams[i].picks.length; j++) {
                  let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                  let playerTeamActivity = miniLeagueTeams[i].picks[j];
                  let hisGameStarted = true;
                  for(let g = 0; g < 10; g++) {
                    if(playerTeamActivity.team === gameweekFixtures[g].team_a || playerTeamActivity.team === gameweekFixtures[g].team_h) {
                      let kickoffDate = new Date(gameweekFixtures[g].kickoff_time);
                      if (dateNow < kickoffDate) {
                        hisGameStarted = false;
                        break;
                      }
                    }
                  }
                  counter++;
                  if(!hisGameStarted) continue;
                  if(playCounter === 11) break;
                  if(j === 0) {
                    if(playerStats.minutes <= 0) {
                      didFirstGKPlay = false;
                    }
                  }
                  if(!didFirstGKPlay && j === 11) {
                    pointsSum += playerStats.total_points;
                    playCounter++;
                    realTeamPlayingPositions['GKP'] += 1;
                    continue;
                  }
                
                  if(playerTeamActivity.is_vice_captain) {
                    viceCaptainPoints = playerStats.total_points;
                  }
                  if(playerTeamActivity.is_captain && playerStats.minutes > 0) {
                    didCaptainPlay = true;
                    captainPoints = playerStats.total_points;
                  }
                  if(counter === 11) {
                    if(didCaptainPlay) {
                      pointsSum += captainPoints;
                    } else {
                      pointsSum += viceCaptainPoints;
                    }
                  }
                  if(playerStats.minutes > 0 && playCounter < 11 && playerTeamActivity.position <= 11) {
                    pointsSum += playerStats.total_points;
                    playCounter++;
                    realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                    continue;
                  }
                  
                  
                  
                }
                console.log(playCounter);
                miniLeagueTeamsPoints['entry'] = miniLeagueTeams[i].entry; 
                miniLeagueTeamsPoints['points'] = pointsSum + miniLeagueTeams[i].total_points;
                miniLeagueTeamsPoints['player_name'] = miniLeagueTeams[i].player_name; 
                miniLeagueTeamsPoints['entry_name'] = miniLeagueTeams[i].entry_name; 
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
