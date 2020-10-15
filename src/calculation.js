import axios from 'axios';
import { players } from './players';
import { fixtures, gameweekDates } from './fixtures';

async function Calculation(miniLeagueID) {
    
    let gameweekData = getGameweekNumberAndFirstAPIUpdate();
    let gameweek = gameweekData.gameweek;
    let firstAPIUpdate = gameweekData.firstAPIUpdate
    let gameweekFixtures = gameweekData.gameweekFixtures;

    let bonusArray = await getBonusPoints(gameweek);

    let miniLeagueTeams = [];
    try {
        miniLeagueTeams = await getMiniLeagueTeamsAndName(miniLeagueID, gameweek);
    } catch(e) {
        return { teams: [], error: e };
    }
    
    let playerPointsData = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/event/${gameweek}/live/`);
    
    let miniLeagueTeamsDataArray = [];
    for(let i = 0; i < miniLeagueTeams.length; i++) {
        let teamPlayingPositions = teamAnalyze(miniLeagueTeams[i].picks);
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
        let captainName = '';
        let viceCaptainName = '';
        let viceCaptainPoints = 0;
        let captainDidNotEnter = false;
        let didCaptainPlay = false;
        let didViceCaptainPlay = false;
        let pointsSum = 0;
        let miniLeagueTeamsPoints = {};
        let dateNow = new Date();
        for(let j = 0; j < (activeChip === 'bboost' ? 15 : 11); j++) {

            let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
            let playerTeamActivity = miniLeagueTeams[i].picks[j];
            
            let gameData = checkIfGameStarted(playerTeamActivity, gameweekFixtures, dateNow);
            let hisGameStarted = gameData.hisGameStarted;
            let hisGameEnded = gameData.hisGameEnded;
            
            if(playerTeamActivity.is_captain) {
                captainName = players[playerTeamActivity.element - 1].web_name;
                if(hisGameEnded && playerStats.minutes <= 0) {
                    captainDidNotEnter = true;
                }
                if(playerStats.minutes > 0) {
                    didCaptainPlay = true;
                    let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                    captainPoints = (playerStats.total_points + potentialBonus);
                }
            } else if(playerTeamActivity.is_vice_captain) {
                viceCaptainName = players[playerTeamActivity.element - 1].web_name;
                if(playerStats.minutes > 0) {
                    didViceCaptainPlay = true;
                    let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                    viceCaptainPoints = (playerStats.total_points + potentialBonus);
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
            //adding player points to the total score
            if(playerStats.minutes > 0 ) {
                let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                pointsSum += (playerStats.total_points + potentialBonus);
                realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                playCounter++;
                continue;
            }    
        }
        //add captain(or vicecaptain) points after the iteration of the first 11 players
        pointsSum += addCaptainOrViceCaptainPoints(didCaptainPlay, didViceCaptainPlay, activeChip, captainPoints, viceCaptainPoints, captainDidNotEnter);
        if(captainDidNotEnter) {
            captainName = viceCaptainName;
        }
        //checking if the first goalkeeper played. if not we are adding reserve goalkeeper points
        if(activeChip !== 'bboost' && playCounter !== 11) {

            if(!didFirstGKPlayed) {
                //12th element in picks array is the reserve goalkeeper
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[11].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[11];
                let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                pointsSum += (playerStats.total_points + potentialBonus);
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
                        let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                        pointsSum += (playerStats.total_points + potentialBonus);
                        realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                        playCounter++;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                    }
                }
                //if there are no 3 playing players from defence we must take one/two/three with 0 minutes
                if(j === 14) {
                    if(realTeamPlayingPositions.DEF === 0) {
                        realTeamPlayingPositions['DEF'] += 3;
                        playCounter += 3;
                        didNotPlayFieldPlayers['DEF'] -= 3;
                    } else if(realTeamPlayingPositions.DEF === 1) {
                        realTeamPlayingPositions['DEF'] += 2;
                        playCounter += 2;
                        didNotPlayFieldPlayers['DEF'] -= 2;
                    } else if(realTeamPlayingPositions.DEF === 2) {
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
                        let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                        pointsSum += (playerStats.total_points + potentialBonus);
                        realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                        playCounter++;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                    }
                }
                //if there are no 2 playing players from midfield we must take one/two with 0 minutes
                if(j === 14) {
                    if(realTeamPlayingPositions.MID === 0) {
                        realTeamPlayingPositions['MID'] += 2;
                        playCounter += 2;
                        didNotPlayFieldPlayers['MID'] -= 2;
                    } else if(realTeamPlayingPositions.MID === 1) {
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
                        let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                        pointsSum += (playerStats.total_points + potentialBonus);
                        realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                        playCounter++;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                    }
                }
                //if there is no 1 playing attacker we must take one with 0 minutes
                if(j === 14) {
                    if(realTeamPlayingPositions.MID === 0) {
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
                    let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                    pointsSum += (playerStats.total_points + potentialBonus);
                    realTeamPlayingPositions[playerTeamActivity.element_type] += 1;
                    playCounter++;
                    didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                    continue;
                }
                
            } 
        }
        //if the fpl api is not updated the first time in this gameweek, we need to manually deduct potential transfer minus points
        //from the player's overall score
        //after the first update, those points are deducted from the overall score by the API
        let dateForGameweekPickAndAPIUpdate = new Date();
        if((dateForGameweekPickAndAPIUpdate < firstAPIUpdate) && miniLeagueTeams[i].event_transfers_cost) {
            pointsSum -= miniLeagueTeams[i].event_transfers_cost
        }

        //“In the event of a tie between teams, the team who has made the least amount of transfers will be positioned higher."
        // let numOfTransfers = await getNumberOfTransfers(miniLeagueTeams[i].entry);
        //it drasticly slows down the algorithm

        miniLeagueTeamsPoints['entry'] = miniLeagueTeams[i].entry;        
        miniLeagueTeamsPoints['total'] = pointsSum + miniLeagueTeams[i].total_points - miniLeagueTeams[i].event_total;
        miniLeagueTeamsPoints['event_total'] = pointsSum;
        miniLeagueTeamsPoints['player_name'] = miniLeagueTeams[i].player_name; 
        miniLeagueTeamsPoints['entry_name'] = miniLeagueTeams[i].entry_name;
        miniLeagueTeamsPoints['captain'] = captainName;
        miniLeagueTeamsPoints['vice_captain'] = viceCaptainName;
        
        // miniLeagueTeamsPoints['num_of_transfers'] = numOfTransfers;  
        miniLeagueTeamsDataArray.push(miniLeagueTeamsPoints)
    }
    
    quickSort(miniLeagueTeamsDataArray, 0, miniLeagueTeamsDataArray.length - 1);

    return {teams: miniLeagueTeamsDataArray, error: ''};

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

function getGameweekNumberAndFirstAPIUpdate() {
    let gameweek = 0;
    let firstAPIUpdate = new Date();
    let dateForGameweekPickAndAPIUpdate = new Date();
    for(let i = gameweekDates.length - 1; i >= 0; i--) {
        let gameweekDate = new Date(gameweekDates[i].deadlineDate)
        if(dateForGameweekPickAndAPIUpdate > gameweekDate) {
            gameweek = gameweekDates[i].gameweekNo;
            firstAPIUpdate = new Date(gameweekDates[i].firstGameweekAPIUpdate)
            break;
        }
    }
    let gameweekFixtures = fixtures.slice(gameweek * 10 - 10, gameweek * 10); 
    return {gameweek, firstAPIUpdate, gameweekFixtures}
}

function addCaptainOrViceCaptainPoints(didCaptainPlay, didViceCaptainPlay, activeChip, captainPoints, viceCaptainPoints, captainDidNotEnter) {
    if(didCaptainPlay) {
        if(activeChip === '3xc') return captainPoints * 2;
        return captainPoints;
    }
    if(didViceCaptainPlay && captainDidNotEnter) {
        if(activeChip === '3xc') return viceCaptainPoints * 2;
        return viceCaptainPoints
    }
    return 0;
}

export async function getMiniLeagueName(miniLeagueID) {
    let response = {};
    try {
        response = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`);
    } catch (error) {
        error.message = 'Wrong mini-league ID. Please try again'
        throw error;
    }
    
    return response.data.league.name;
}

async function getMiniLeagueTeamsAndName(miniLeagueID, gameweek) {
    
    let miniLeagueData = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`);

    //if there are more than 50 teams
    let next_page = 2;
    let has_next = miniLeagueData.data.standings.has_next;
    while(has_next && next_page < 11) {
        let newTeams = await axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/?page_standings=${next_page}`)
        has_next = newTeams.data.standings.has_next;
        miniLeagueData.data.standings.results.push(...newTeams.data.standings.results);
        next_page++;
    }
    
    //we are limiting our calculation to 500 teams at max 
    //if mini-league has got more than 500 teams throw an error
    if(next_page >= 11) {
        let error = new Error()
        error.message = 'There is more than 500 teams in your league! Please only enter the leagues with less than 500 teams.'
        throw error;
    }

    let miniLeaguePlayersData = miniLeagueData.data.standings.results.map(team => ({'event_total': team.event_total, 'total_points': team.total, 'entry': team.entry, 'player_name': team.player_name, 'entry_name': team.entry_name}));
    
    let miniLeagueTeams = await getEachPlayerInfo(miniLeaguePlayersData, gameweek)
    
    return miniLeagueTeams;
}

async function getEachPlayerInfo(miniLeaguePlayersData, gameweek) {

    let miniLeagueTeams = Promise.all(miniLeaguePlayersData.map(async teamID => {
        const url = `https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${teamID.entry}/event/${gameweek}/picks/`
        let response = await axios.get(url);
        let picks = getPlayersType(response.data.picks);
        return ({'picks': picks, 'active_chip': response.data.active_chip, 'event_transfers_cost': response.data.event_transfers_cost,  ...teamID})
    }));

    return miniLeagueTeams;
}

function checkIfGameStarted(playerTeamActivity, gameweekFixtures, dateNow) {
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
                break;
            }
            break;
        }
    }
    return {hisGameStarted, hisGameEnded};
}

async function getBonusPoints(gameweek) {
    let allFixtures = await axios.get('https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/fixtures/');
    let thisGameweekFixtures = allFixtures.data.slice(gameweek * 10 - 10, gameweek * 10);
    let dayNow = new Date().getDate();
    //only consider fixtures that are played today

    let todayFixtures = thisGameweekFixtures.filter(fixture => {
        let fixtureDayDate = new Date(fixture.kickoff_time).getDate();
        return fixtureDayDate === dayNow
    })

    if(todayFixtures.length === 0) return;

    let bonusPoints = [];

    todayFixtures.forEach(fixture => {
        let awayPlayersBps = fixture.stats[9].a;
        let homePlayersBps = fixture.stats[9].h;

        let bonus = 3;

        while(bonus > 0) {
            if(awayPlayersBps[0].value < homePlayersBps[0].value) {
                if(homePlayersBps[0].value === homePlayersBps[1].value) {
                    homePlayersBps[0]['bonus'] = bonus;
                    homePlayersBps[1]['bonus'] = bonus;
                    bonus -= 2;
                    bonusPoints.push(homePlayersBps[0], homePlayersBps[1])
                    homePlayersBps.shift()
                    homePlayersBps.shift()
                } else {
                    homePlayersBps[0]['bonus'] = bonus;
                    bonus--;
                    bonusPoints.push(homePlayersBps[0])
                    homePlayersBps.shift();
                }
            } else if(awayPlayersBps[0].value === homePlayersBps[0].value) {
                homePlayersBps[0]['bonus'] = bonus;
                awayPlayersBps[0]['bonus'] = bonus;
                bonus -= 2;
                bonusPoints.push(homePlayersBps[0], awayPlayersBps[0]);
                awayPlayersBps.shift();
                homePlayersBps.shift();
            } else {
                if(awayPlayersBps[0].value === awayPlayersBps[1].value) {
                    awayPlayersBps[0]['bonus'] = bonus;
                    awayPlayersBps[1]['bonus'] = bonus;
                    bonus -= 2;
                    bonusPoints.push(awayPlayersBps[0], awayPlayersBps[1])
                    awayPlayersBps.shift()
                    awayPlayersBps.shift()
                } else {
                    awayPlayersBps[0]['bonus'] = bonus;
                    bonus--;
                    bonusPoints.push(awayPlayersBps[0])
                    awayPlayersBps.shift();
                }
            }
        }
    });
    return bonusPoints;
}

function checkIfHeGotBonus(bonusArray = [], playerID) {
    let bonus = 0;
    if(bonusArray.length === 0) return bonus;
    for(let i = 0; i < bonusArray.length; i++) {
        if(bonusArray[i].element === playerID) {
            bonus = bonusArray[i].bonus;
        }
    }
    return bonus;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////

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
        while (items[i].total > pivot.total) {
            i++;
        }
        while (items[j].total < pivot.total) {
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

//////////////////////////////////////////////////////////////////////////////////////////////////////

export default Calculation;
