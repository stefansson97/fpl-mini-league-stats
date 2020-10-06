import axios from 'axios';
import { players } from './players';
import { fixtures, gameweekDates } from './fixtures';

async function Calculation(miniLeagueID) {
    let dateForGameweekPickAndAPIUpdate = new Date();
    let gameweek = 0;
    let firstAPIUpdate = new Date();
    for(let i = gameweekDates.length - 1; i >= 0; i--) {
        let gameweekDate = new Date(gameweekDates[i].deadlineDate)
        if(dateForGameweekPickAndAPIUpdate > gameweekDate) {
            gameweek = gameweekDates[i].gameweekNo;
            firstAPIUpdate = new Date(gameweekDates[i].firstGameweekAPIUpdate)
            break;
        }
    }
    let miniLeagueData = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`);
    let next_page = 2;
    let has_next = miniLeagueData.data.standings.has_next;
    while(has_next) {
        let newTeams = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/?page_standings=${next_page}`)
        has_next = newTeams.data.standings.has_next;
        miniLeagueData.data.standings.results.push(...newTeams.data.standings.results);
        next_page++;
    }
    let miniLeaguePlayersData = miniLeagueData.data.standings.results.map(team => ({'event_total': team.event_total, 'total_points': team.total, 'entry': team.entry, 'player_name': team.player_name, 'entry_name': team.entry_name}));
    let miniLeagueTeams = []; 
    miniLeaguePlayersData.forEach(async teamID => {
        const url = `https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${teamID.entry}/event/${gameweek}/picks/`
        let response = await axios.get(url);
        let picks = getPlayersType(response.data.picks);
        miniLeagueTeams.push({'picks': picks, 'active_chip': response.data.active_chip, 'event_transfers_cost': response.data.event_transfers_cost,  ...teamID})
    });
    let playerPointsData = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/event/${gameweek}/live/`);
    let miniLeagueTeamsPointsArray = [];
    for(let i = 0; i < miniLeagueTeams.length; i++) {
        let teamPlayingPositions = teamAnalyze(miniLeagueTeams[i].picks);
        let positionsOnBench = {
            'DEF': 5 - teamPlayingPositions.DEF,
            'MID': 5 - teamPlayingPositions.MID,
            'FWD': 3 - teamPlayingPositions.FWD
        }
        let realTeamPlayingPositions = {
            'GKP': 0,
            'DEF': 0,
            'MID': 0,
            'FWD': 0
        };
        let didNotPlayFieldPlayers = {
            'DEF': 0,
            'MID': 0,
            'FWD': 0
        }
        let activeChip = miniLeagueTeams[i].active_chip;
        let playCounter = 0;
        let minimumPlayingPositions = false;
        let didFirstGKPlayed = true;
        let captainPoints = 0;
        let viceCaptainPoints = 0;
        let didCaptainPlay = false;
        let didViceCaptainPlay = false;
        let pointsSum = 0;
        let miniLeagueTeamsPoints = {};
        let dateNow = new Date();
        let gameweekFixtures = fixtures.slice(gameweek * 10 - 10, gameweek * 10);
        if(activeChip !== 'bboost') {
            for(let j = 0; j < 11; j++) {
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                let hisGameStarted = true;
                let hisGameEnded = false;
                for(let g = 0; g < 10; g++) {
                    if(playerTeamActivity.team === gameweekFixtures[g].team_a || playerTeamActivity.team === gameweekFixtures[g].team_h) {
                        let kickoffDate = new Date(gameweekFixtures[g].kickoff_time);
                        //checking if his game started
                        if (dateNow < kickoffDate) {
                            hisGameStarted = false;
                            break;
                        }
                        //checking if his game ended
                        kickoffDate.setHours(kickoffDate.getHours() + 2);
                        if(dateNow > kickoffDate) {
                            hisGameEnded = true;
                        }
                    }
                }
                if(playerTeamActivity.is_captain) {
                    if(playerStats.minutes > 0) {
                        didCaptainPlay = true;
                        captainPoints = playerStats.total_points;
                    }
                } else if(playerTeamActivity.is_vice_captain) {
                    if(playerStats.minutes > 0) {
                        didViceCaptainPlay = true;
                        viceCaptainPoints = playerStats.total_points;
                    }
                }
                //if his game did not start just skip him
                if(!hisGameStarted) continue;
                //if his game ended and player did not enter the game
                if(hisGameEnded && playerStats.minutes <= 0) {
                    if(playerTeamActivity.element_type === 'GKP') {
                        didFirstGKPlayed = false;
                        continue;
                    }
                    didNotPlayFieldPlayers[playerTeamActivity.element_type] += 1
                    continue;   
                }
                if(playerStats.minutes > 0 ) {
                    pointsSum += playerStats.total_points;
                    realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                    playCounter++;
                    continue;
                }    
            }
            //add captain(or vicecaptain) points after the iteration of the first 11 players
            if(didCaptainPlay) {
                if(activeChip === '3xc') {
                    pointsSum += captainPoints * 2
                } else {
                    pointsSum += captainPoints 
                }
            } else if(didViceCaptainPlay) {
                if(activeChip === '3xc') {
                    pointsSum += viceCaptainPoints * 2
                } else {
                    pointsSum += viceCaptainPoints
                }
            }
            //checking if the first goalkeeper played. if not we are adding reserve goalkeeper points
            if(!didFirstGKPlayed) {
                //12th element in picks array is the reserve goalkeeper
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[11].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[11];
                //console.log('tutu')
                pointsSum += playerStats.total_points;
                realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                playCounter++;
            }
            //if we have less than 3 playing players in defence we must pick one from the bench
            let j = 12;
            while(teamPlayingPositions.DEF - didNotPlayFieldPlayers.DEF < 3 && j < 15) {
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                if(playerTeamActivity.element_type === 'DEF') {
                    if(playerStats.minutes > 0) {
                        pointsSum += playerStats.total_points;
                        realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                        playCounter++;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        positionsOnBench[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                    }
                }
                //if there are no 3 playing players from defence we must take one/two/three with 0 minutes
                if(j === 14) {
                    if(realTeamPlayingPositions.DEF === 0) {
                        pointsSum += 0;
                        realTeamPlayingPositions['DEF'] += 3;
                        playCounter += 3;
                        didNotPlayFieldPlayers['DEF'] -= 3;
                    } else if(realTeamPlayingPositions.DEF === 1) {
                        pointsSum += 0;
                        realTeamPlayingPositions['DEF'] += 2;
                        playCounter += 2;
                        didNotPlayFieldPlayers['DEF'] -= 2;
                    } else if(realTeamPlayingPositions.DEF === 2) {
                        pointsSum += 0;
                        realTeamPlayingPositions['DEF'] += 1;
                        playCounter += 1;
                        didNotPlayFieldPlayers['DEF'] -= 1;
                    }
                }
                j++;
            }
            //if we have less than 2 players in midfield we must pick one from the bench
            j =  12;
            while(teamPlayingPositions.MID - didNotPlayFieldPlayers.MID < 2 && j < 15) {
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                if(playerTeamActivity.element_type === 'MID') {
                    if(playerStats.minutes > 0) {  
                        pointsSum += playerStats.total_points;
                        realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                        playCounter++;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        positionsOnBench[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                    }
                }
                //if there are no 2 playing players from midfield we must take one/two with 0 minutes
                if(j === 14) {
                    if(realTeamPlayingPositions.MID === 0) {
                        pointsSum += 0;
                        realTeamPlayingPositions['MID'] += 2;
                        playCounter += 2;
                        didNotPlayFieldPlayers['MID'] -= 2;
                    } else if(realTeamPlayingPositions.MID === 1) {    
                        pointsSum += 0;
                        realTeamPlayingPositions['MID'] += 1;
                        playCounter += 1;
                        didNotPlayFieldPlayers['MID'] -= 1;
                    } 
                }
                j++;
            }
            //if we have less than 1 player in attack we must pick one from the bench
            j = 12;
            while(teamPlayingPositions.FWD - didNotPlayFieldPlayers.FWD < 1 && j < 15) {
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                if(playerTeamActivity.element_type === 'FWD') {
                    if(playerStats.minutes > 0) {    
                        pointsSum += playerStats.total_points;
                        realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                        playCounter++;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        positionsOnBench[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                    }
                }
                //if there is no 1 playing attacker we must take one with 0 minutes
                if(j === 14) {
                    if(realTeamPlayingPositions.MID === 0) {    
                        pointsSum += 0;
                        realTeamPlayingPositions['FWD'] += 1;
                        playCounter += 1;
                        didNotPlayFieldPlayers['FWD'] -= 1;
                    } 
                }
                j++;
            }
            //looping our 3 field subs
            for(let j = 12; j < miniLeagueTeams[i].picks.length; j++) {
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                if(playerStats.minutes <= 0) continue;
                if(playCounter === 11) break;
                if(didNotPlayFieldPlayers.DEF === 0 && didNotPlayFieldPlayers.MID === 0 && didNotPlayFieldPlayers.FWD === 0) break;
                if(realTeamPlayingPositions.DEF >= 3 && realTeamPlayingPositions.MID >= 2 && realTeamPlayingPositions.FWD >=1) {
                    minimumPlayingPositions = true;
                }
                if(minimumPlayingPositions) {
                    pointsSum += playerStats.total_points;
                    realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                    playCounter++;
                    didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                    positionsOnBench[playerTeamActivity.element_type] -= 1;
                    continue;
                }
                
            }
        } else if(activeChip === 'bboost') {
            for(let j = 0; j < 15; j++) {
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                let hisGameStarted = true;
                let hisGameEnded = false;
                for(let g = 0; g < 10; g++) {
                    if(playerTeamActivity.team === gameweekFixtures[g].team_a || playerTeamActivity.team === gameweekFixtures[g].team_h) {
                        let kickoffDate = new Date(gameweekFixtures[g].kickoff_time);
                        //checking if his game started
                        if (dateNow < kickoffDate) {
                            hisGameStarted = false;
                            break;
                        }
                        //checking if his game ended
                        kickoffDate.setHours(kickoffDate.getHours() + 2);
                        if(dateNow > kickoffDate) {
                            hisGameEnded = true;
                        }
                    }
                }
                if(playerTeamActivity.is_captain) {
                    if(playerStats.minutes > 0) {
                        didCaptainPlay = true;
                        captainPoints = playerStats.total_points;
                    }
                } else if(playerTeamActivity.is_vice_captain) {
                    if(playerStats.minutes > 0) {
                        didViceCaptainPlay = true;
                        viceCaptainPoints = playerStats.total_points;
                    }
                }
                //if his game did not start just skip him
                if(!hisGameStarted) continue;
                //if his game ended and player did not enter the game
                if(hisGameEnded && playerStats.minutes <= 0) {
                    if(playerTeamActivity.element_type === 'GKP') {
                        didFirstGKPlayed = false;
                        continue;
                    }
                    didNotPlayFieldPlayers[playerTeamActivity.element_type] += 1
                    continue;   
                }
                if(playerStats.minutes > 0 ) {
                    pointsSum += playerStats.total_points;
                    realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                    playCounter++;
                    continue;
                }    
            }
            //add captain(or vicecaptain) points after the iteration of all players
            if(didCaptainPlay) {
                if(activeChip === '3xc') {
                    pointsSum += captainPoints * 2
                } else {
                    pointsSum += captainPoints 
                }
            } else if(didViceCaptainPlay) {
                if(activeChip === '3xc') {
                    pointsSum += viceCaptainPoints * 2
                } else {
                    pointsSum += viceCaptainPoints
                }
            }
        }
        //if the fpl api is not updated the first time in this gameweek, we need to manually deduct potential transfer minus points
        //from the players overall score
        //after the first update, those points are deducted from the overall score by the API
        
        if((dateForGameweekPickAndAPIUpdate < firstAPIUpdate) && miniLeagueTeams[i].event_transfers_cost) {
            pointsSum -= miniLeagueTeams[i].event_transfers_cost
        }

        //“In the event of a tie between teams, the team who has made the least amount of transfers will be positioned higher."
        // let numOfTransfers = await getNumberOfTransfers(miniLeagueTeams[i].entry);
        //it drasticly slows down the algorithm

        miniLeagueTeamsPoints['entry'] = miniLeagueTeams[i].entry;
        //miniLeagueTeamsPoints['points'] = pointsSum
        miniLeagueTeamsPoints['points'] = pointsSum + miniLeagueTeams[i].total_points - miniLeagueTeams[i].event_total;
        miniLeagueTeamsPoints['player_name'] = miniLeagueTeams[i].player_name; 
        miniLeagueTeamsPoints['entry_name'] = miniLeagueTeams[i].entry_name;
        // miniLeagueTeamsPoints['num_of_transfers'] = numOfTransfers;  
        miniLeagueTeamsPointsArray.push(miniLeagueTeamsPoints)
    }
    
    quickSort(miniLeagueTeamsPointsArray, 0, miniLeagueTeamsPointsArray.length - 1);

    return miniLeagueTeamsPointsArray;

}

// async function getNumberOfTransfers(playerID) {
//     //checking if player activated his wildcard
//     let responseHistory = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${playerID}/history/`)
//     let gameweekHePlayedWC = 0;
//     let gameweekHePlayedFH = 0;
//     for(let i = 0; i < responseHistory.data.chips.length; i++) {
//         if(responseHistory.data.chips[i].name === 'wildcard') {
//             gameweekHePlayedWC = responseHistory.data.chips[i].event;
//         }
//         if(responseHistory.data.chips[i].name === 'freehit') {
//             gameweekHePlayedFH = responseHistory.data.chips[i].event;
//         }
//     }
//     let responseTransfers = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${playerID}/transfers/`)
//     return responseTransfers.data.filter(transfer => transfer.event !== gameweekHePlayedWC && transfer.event !== gameweekHePlayedFH ).length;
// }

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

//thanks to https://www.guru99.com/quicksort-in-javascript.html
//for providing the quick sort algorithm formula
//which I modified to sort by points property and from max value to min value

function swap(items, leftIndex, rightIndex){
    var temp = items[leftIndex];
    items[leftIndex] = items[rightIndex];
    items[rightIndex] = temp;
}

function partition(items, left, right) {
    var pivot   = items[Math.floor((right + left) / 2)], //middle element
        i       = left, //left pointer
        j       = right; //right pointer
    while (i <= j) {
        while (items[i].points > pivot.points) {
            i++;
        }
        while (items[j].points < pivot.points) {
            j--;
        }
        if (i <= j) {
            swap(items, i, j); //swapping two elements
            i++;
            j--;
        }
    }
    return i;
}

function quickSort(items, left, right) {
    var index;
    if (items.length > 1) {
        index = partition(items, left, right); //index returned from partition
        if (left < index - 1) { //more elements on the left side of the pivot
            quickSort(items, left, index - 1);
        }
        if (index < right) { //more elements on the right side of the pivot
            quickSort(items, index, right);
        }
    }
    return items;
}


export default Calculation;
