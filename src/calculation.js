import axios from 'axios';

const corsUrl = 'https://ineedthisforfplproject.herokuapp.com/';

async function Calculation(miniLeagueID) {

    const [gameweek, firstAPIUpdate, gameweekFixtures] = await getGameweekNumberAndFirstAPIUpdate();

    const players = await getPlayersData()

    const [bonusArray, playerPointsData, miniLeagueTeams] = await Promise.all([
        getBonusPoints(gameweek, gameweekFixtures),
        getPlayerPointsData(gameweek),
        getMiniLeagueTeamsAndName(miniLeagueID, gameweek, players),
    ])

    let miniLeagueTeamsDataArray = [];
    
    for(let i = 0; i < miniLeagueTeams.length; i++) {
        let didNotPlayFieldPlayers = {
            'GKP': 0,
            'DEF': 0,
            'MID': 0,
            'FWD': 0
        }
        let benchBoostDidNotPlay = {
            'GKP': 0,
            'DEF': 0,
            'MID': 0,
            'FWD': 0
        }
        let activeChip = miniLeagueTeams[i].active_chip;
        let playCounter = 0;
        let leftToPlay = activeChip === 'bboost' ? 15 : 11;
        let didFirstGKPlayed = true;
        let captainPoints = 0;
        let captainName = '';
        let viceCaptainName = '';
        let viceCaptainPoints = 0;
        let captainDidNotEnter = false;
        let didCaptainPlay = false;
        let didViceCaptainPlay = false;
        let pointsSum = 0;
        let dateNow = new Date();
        for(let j = 0; j < (activeChip === 'bboost' ? 15 : 11); j++) {
            let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
            let playerTeamActivity = miniLeagueTeams[i].picks[j];
            
            let [hisGameStarted, hisGameEnded] = checkIfGameStarted(playerTeamActivity, gameweekFixtures, dateNow);
            
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
                if(activeChip === 'bboost') {
                    benchBoostDidNotPlay[playerTeamActivity.element_type] += 1;
                }
                didNotPlayFieldPlayers[playerTeamActivity.element_type] += 1;
                if(playerTeamActivity.element_type === 'GKP') {
                    didFirstGKPlayed = false;
                    continue;
                }
                continue;   
            }
            //adding player points to the total score
            if(playerStats.minutes > 0 ) {
                let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                pointsSum += (playerStats.total_points + potentialBonus);
                playCounter++;
                leftToPlay--;
                continue;
            }    
        }
        //add captain(or vicecaptain) points after the iteration of the first 11 players
        pointsSum += addCaptainOrViceCaptainPoints(didCaptainPlay, didViceCaptainPlay, activeChip, captainPoints, viceCaptainPoints, captainDidNotEnter, captainName);
        if(captainDidNotEnter || !captainName) {
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
                didNotPlayFieldPlayers['GKP'] -= 1;
                playCounter++;
                leftToPlay--;
            }
            //if we have less than 3 playing players in defence we must pick one from the bench
            let teamPlayingPositions = teamAnalyze(miniLeagueTeams[i].picks);
            let j = 12;
            while(teamPlayingPositions.DEF - didNotPlayFieldPlayers.DEF < 3) {
                //if there are no 3 playing players from defence we must take one/two/three with 0 minutes
                if(j === 15 || (miniLeagueTeams[i].picks[j] === undefined)) {
                    if(teamPlayingPositions.DEF - didNotPlayFieldPlayers.DEF === 0) {
                        playCounter += 3;
                        leftToPlay -= 3;
                        didNotPlayFieldPlayers['DEF'] -= 3;
                        break;
                    } else if(teamPlayingPositions.DEF - didNotPlayFieldPlayers.DEF === 1) {
                        playCounter += 2;
                        leftToPlay -= 2;
                        didNotPlayFieldPlayers['DEF'] -= 2;
                        break;
                    } else if(teamPlayingPositions.DEF - didNotPlayFieldPlayers.DEF === 2) {
                        playCounter += 1;
                        leftToPlay -= 1;
                        didNotPlayFieldPlayers['DEF'] -= 1;
                        break;
                    }
                }
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                let [hisGameStarted] = checkIfGameStarted(playerTeamActivity, gameweekFixtures, dateNow);
                if(playerTeamActivity.element_type === 'DEF') {
                    if(playerStats.minutes > 0) {
                        let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                        pointsSum += (playerStats.total_points + potentialBonus);
                        playCounter++;
                        leftToPlay--;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                        j--;
                    } else if(!hisGameStarted) {
                        break;
                    }
                }
                
                j++;
            }
            //if we have less than 2 players in midfield we must pick one from the bench
            j =  12;
            while(teamPlayingPositions.MID - didNotPlayFieldPlayers.MID < 2) {
                //if there are no 2 playing players from midfield we must take one/two with 0 minutes
                if(j === 15 || (miniLeagueTeams[i].picks[j] === undefined)) {
                    if(teamPlayingPositions.MID - didNotPlayFieldPlayers.MID === 0) {
                        playCounter += 2;
                        leftToPlay -= 2;
                        didNotPlayFieldPlayers['MID'] -= 2;
                        break;
                    } else if(teamPlayingPositions.MID - didNotPlayFieldPlayers.MID === 1) {
                        playCounter += 1;
                        leftToPlay -= 1;
                        didNotPlayFieldPlayers['MID'] -= 1;
                        break;
                    } 
                }
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                let [hisGameStarted] = checkIfGameStarted(playerTeamActivity, gameweekFixtures, dateNow);
                if(playerTeamActivity.element_type === 'MID') {
                    if(playerStats.minutes > 0) {
                        let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                        pointsSum += (playerStats.total_points + potentialBonus);
                        playCounter++;
                        leftToPlay--;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                        j--;
                    } else if(!hisGameStarted) {
                        break;
                    }
                }
                j++;
            } 
            //if we have less than 1 player in attack we must pick one from the bench
            j = 12;
            while(teamPlayingPositions.FWD - didNotPlayFieldPlayers.FWD < 1) {
                //if there is no 1 playing attacker we must take one with 0 minutes
                if(j === 15 || (miniLeagueTeams[i].picks[j] === undefined) ) {
                    if(teamPlayingPositions.FWD - didNotPlayFieldPlayers.FWD === 0) {
                        playCounter += 1;
                        leftToPlay--;
                        didNotPlayFieldPlayers['FWD'] -= 1;
                        break;
                    } 
                }
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                let [hisGameStarted] = checkIfGameStarted(playerTeamActivity, gameweekFixtures, dateNow);
                if(playerTeamActivity.element_type === 'FWD') {
                    if(playerStats.minutes > 0) {    
                        let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                        pointsSum += (playerStats.total_points + potentialBonus);
                        playCounter++;
                        leftToPlay--;
                        didNotPlayFieldPlayers[playerTeamActivity.element_type] -= 1;
                        miniLeagueTeams[i].picks.splice(j, 1);
                        j--;
                    } else if(!hisGameStarted) {
                        break;
                    }
                }

                j++;
            }
            //looping our 3 field subs
            for(let j = 12; j < miniLeagueTeams[i].picks.length; j++) {

                if(playCounter === 11) break;
                
                let playerStats = playerPointsData.data.elements[miniLeagueTeams[i].picks[j].element - 1].stats;
                let playerTeamActivity = miniLeagueTeams[i].picks[j];
                let minimumPlayingPositions = false;
                
                if(playerStats.minutes <= 0) continue;
                
                if(didNotPlayFieldPlayers.DEF === 0 && didNotPlayFieldPlayers.MID === 0 && didNotPlayFieldPlayers.FWD === 0) break;
                
                if(teamPlayingPositions.DEF - didNotPlayFieldPlayers.DEF >= 3 && teamPlayingPositions.MID - didNotPlayFieldPlayers.MID >= 2 && teamPlayingPositions.FWD - didNotPlayFieldPlayers.FWD >=1) {
                    minimumPlayingPositions = true;
                }
                
                if(minimumPlayingPositions) {
                    let potentialBonus = checkIfHeGotBonus(bonusArray, playerTeamActivity.element);
                    pointsSum += (playerStats.total_points + potentialBonus);
                    playCounter++;
                    leftToPlay--;
					if(didNotPlayFieldPlayers.DEF > 0) {
						didNotPlayFieldPlayers.DEF -= 1;
					} else if(didNotPlayFieldPlayers.MID > 0) {
						didNotPlayFieldPlayers.MID -= 1;
					} else if(didNotPlayFieldPlayers.FWD > 0) {
						didNotPlayFieldPlayers.FWD -= 1;
					}
                    continue;
                }
                
            } 
        }
        
        //if the FPL API is not updated the first time in this gameweek, we need to manually deduct potential transfer minus points
        //from the player's overall score
        //after the first update, those points are deducted from the overall score by the API
        const dateForGameweekPickAndAPIUpdate = new Date().toISOString();
        if((dateForGameweekPickAndAPIUpdate < firstAPIUpdate) && miniLeagueTeams[i].event_transfers_cost) {
            pointsSum -= miniLeagueTeams[i].event_transfers_cost
        }

        //“In the event of a tie between teams, the team who has made the least amount of transfers will be positioned higher."
        // let numOfTransfers = await getNumberOfTransfers(miniLeagueTeams[i].entry);
        //it drasticly slows down the algorithm

        if(activeChip !== 'bboost') {
            //this is the number of players that did not play and can't be substituted
            let zeroPointPlayers = didNotPlayFieldPlayers['GKP'] + didNotPlayFieldPlayers['DEF'] + didNotPlayFieldPlayers['MID'] + didNotPlayFieldPlayers['FWD'];
            if(zeroPointPlayers === leftToPlay) {
                leftToPlay = 0;
            }
        } else {
            let zeroPointPlayers = benchBoostDidNotPlay['GKP'] + benchBoostDidNotPlay['DEF'] + benchBoostDidNotPlay['MID'] + benchBoostDidNotPlay['FWD'];
            if(zeroPointPlayers === leftToPlay) {
                leftToPlay = 0;
            }
        }

        let miniLeagueTeamsPoints = {};

        miniLeagueTeamsPoints['entry'] = miniLeagueTeams[i].entry;        
        miniLeagueTeamsPoints['event_total'] = pointsSum;
        miniLeagueTeamsPoints['player_name'] = miniLeagueTeams[i].player_name; 
        miniLeagueTeamsPoints['entry_name'] = miniLeagueTeams[i].entry_name;
        miniLeagueTeamsPoints['active_chip'] = miniLeagueTeams[i].active_chip;
        miniLeagueTeamsPoints['captain'] = captainName;
        miniLeagueTeamsPoints['left_to_play'] = leftToPlay;
        miniLeagueTeamsPoints['last_rank'] = miniLeagueTeams[i].last_rank;
        miniLeagueTeamsPoints['picks'] = miniLeagueTeams[i].picks;
        
        //if the fpl api is not updated the first time this gameweek, we are working with data from the last gameweek
        if(dateForGameweekPickAndAPIUpdate < firstAPIUpdate) {
            miniLeagueTeamsPoints['total'] = pointsSum + miniLeagueTeams[i].total_points;
        } else {
            miniLeagueTeamsPoints['total'] = pointsSum + miniLeagueTeams[i].total_points - miniLeagueTeams[i].event_total;
        }
        
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

export async function getPlayersData() {
    const response = await axios.get(corsUrl + 'https://fantasy.premierleague.com/api/bootstrap-static/')
    const players = response.data.elements.sort((a, b) => a.id > b.id ? 1 : -1)
    return players
}

function getPlayersType(picks, players) {
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

async function getPlayerPointsData(gameweek) {
    return await axios.get(`${corsUrl}https://fantasy.premierleague.com/api/event/${gameweek}/live/`)
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

export async function getGameweekNumberAndFirstAPIUpdate() {

    const res = await axios.get(corsUrl + 'https://fantasy.premierleague.com/api/bootstrap-static/')
    const events = res.data.events;

    function pad(number) {
        if (number < 10) {
          return '0' + number;
        }
        return number;
    }

    let gameweek = 0;
    let firstAPIUpdate = new Date();
    const dateForGameweekPickAndAPIUpdate = new Date().toISOString();
    for(let i = events.length - 1; i >= 0; i--) {
        const gameweekDate = new Date(events[i].deadline_time).toISOString()
        if(dateForGameweekPickAndAPIUpdate > gameweekDate) {
            gameweek = events[i].id;
            const gwDate = new Date(events[i].deadline_time) 
            firstAPIUpdate = new Date(
                gwDate.getUTCFullYear() +
                '-' + pad(gwDate.getUTCMonth() + 1) +
                '-' + pad(gwDate.getUTCDate() + 1) +
               'T01:00:00Z'
            ).toISOString()
            break;
        }
    }

    const { data: fixtures } = await axios.get(corsUrl + 'https://fantasy.premierleague.com/api/fixtures/') 
    let gameweekFixtures = fixtures.filter(fixture => fixture.event === gameweek);
    
    return [gameweek, firstAPIUpdate, gameweekFixtures]
}

function addCaptainOrViceCaptainPoints(didCaptainPlay, didViceCaptainPlay, activeChip, captainPoints, viceCaptainPoints, captainDidNotEnter, captainName) {
    if(didCaptainPlay) {
        if(activeChip === '3xc') return captainPoints * 2;
        return captainPoints;
    }
    if(didViceCaptainPlay && (captainDidNotEnter || !captainName)) {
        if(activeChip === '3xc') return viceCaptainPoints * 2;
        return viceCaptainPoints
    }
    return 0;
}

export async function getMiniLeagueName(miniLeagueID) {
    
    try {
        let response = await axios.get(`${corsUrl}https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`);
        return response.data.league.name;
    } catch (error) {
        error.message = 'Wrong mini-league ID. Please try again'
        throw error;
    }
}

async function getMiniLeagueTeamsAndName(miniLeagueID, gameweek, players) {
    
    let miniLeagueData = await axios.get(`${corsUrl}https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`);

    //if there are more than 50 teams
    let next_page = 2;
    let has_next = miniLeagueData.data.standings.has_next;
    while(has_next && next_page < 11) {
        let newTeams = await axios.get(`${corsUrl}https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/?page_standings=${next_page}`)
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

    let miniLeaguePlayersData = miniLeagueData.data.standings.results.map(team => ({'event_total': team.event_total, 'total_points': team.total, 'entry': team.entry, 'player_name': team.player_name, 'entry_name': team.entry_name, 'last_rank': team.last_rank}));
    
    let miniLeagueTeams = await getEachPlayerInfo(miniLeaguePlayersData, gameweek, players)
    
    return miniLeagueTeams;
}

async function getEachPlayerInfo(miniLeaguePlayersData, gameweek, players) {

    let miniLeagueTeams = Promise.all(miniLeaguePlayersData.map(async teamID => {
        const url = `${corsUrl}https://fantasy.premierleague.com/api/entry/${teamID.entry}/event/${gameweek}/picks/`
        let response = await axios.get(url);
        let picks = getPlayersType(response.data.picks, players);
        return ({'picks': picks, 'active_chip': response.data.active_chip, 'event_transfers_cost': response.data.entry_history.event_transfers_cost,  ...teamID})
    }));
    
    return miniLeagueTeams;
}

function checkIfGameStarted(playerTeamActivity, gameweekFixtures, dateNow) {

    //check if this player has more than one game this gameweek
    let numberOfGames = 0;
    for(let i = 0; i < gameweekFixtures.length; i++) {
        if(playerTeamActivity.team === gameweekFixtures[i].team_a || playerTeamActivity.team === gameweekFixtures[i].team_h) {
            numberOfGames++;
        }
    }
    
    let hisGameStarted = true;
    let hisGameEnded = false;

    if(numberOfGames <= 1) {
        for(let g = 0; g < gameweekFixtures.length; g++) {
            if(playerTeamActivity.team === gameweekFixtures[g].team_a || playerTeamActivity.team === gameweekFixtures[g].team_h) {
                let kickoffDate = new Date(gameweekFixtures[g].kickoff_time);
                //checking if his game started
                if (dateNow < kickoffDate) {
                    hisGameStarted = false;
                }
                //checking if his game ended
                kickoffDate.setHours(kickoffDate.getHours() + 2);
                if(dateNow > kickoffDate) {
                    hisGameEnded = true;
                }
                break;
            }
        }
    } else {
        //checking if first game started
        for(let g = 0; g < gameweekFixtures.length; g++) {
            if(playerTeamActivity.team === gameweekFixtures[g].team_a || playerTeamActivity.team === gameweekFixtures[g].team_h) {
                let kickoffDate = new Date(gameweekFixtures[g].kickoff_time);
                //checking if first game started
                if (dateNow < kickoffDate) {
                    hisGameStarted = false;
                }
                break;
            }
        }
        //checking if last game ended
        for(let g = gameweekFixtures.length - 1; g >= 0 ; g--) {
            if(playerTeamActivity.team === gameweekFixtures[g].team_a || playerTeamActivity.team === gameweekFixtures[g].team_h) {
                let kickoffDate = new Date(gameweekFixtures[g].kickoff_time);
                kickoffDate.setHours(kickoffDate.getHours() + 2);
                if(dateNow > kickoffDate) {
                    hisGameEnded = true;
                }
                break;
            }
        }
    }
    return [hisGameStarted, hisGameEnded];
}

async function getBonusPoints(gameweek, fixtures) {
    let dateNow = new Date();
    let dayNow = dateNow.getDate();
    //only consider fixtures that have started

    let todayFixtures = fixtures.filter(fixture => {
        let fixtureDate = new Date(fixture.kickoff_time);
        let fixtureDay = fixtureDate.getDate();
        return (fixtureDate < dateNow && dayNow === fixtureDay)
    })

    if(todayFixtures.length === 0) return;

    let bonusPoints = [];

    if(todayFixtures.length !== 0) {
        todayFixtures.forEach(fixture => {
            if(fixture.stats[9] === undefined) {
                return [];
            }
            let awayPlayersBps = fixture.stats[9].a;
            let homePlayersBps = fixture.stats[9].h;
            let bonus = 3;
            while(bonus > 0) {
                if(awayPlayersBps.length === 0) {
                    awayPlayersBps.push({value: 0})
                }
                if(homePlayersBps.length === 0) {
                    homePlayersBps.push({value: 0})
                }
                if(awayPlayersBps[0].value < homePlayersBps[0].value) {
                    if(homePlayersBps[0].value === homePlayersBps[1].value) {
                        let i;
                        for(i = 0; i < homePlayersBps.length; i++) {
                            if(homePlayersBps.length === i + 1) break;
                            if(homePlayersBps[i].value !== homePlayersBps[i+1].value) {
                                break;
                            }
                        }
                        for(let j = 0; j <= i; j++) {
                            homePlayersBps[0]['bonus'] = bonus;
                            bonusPoints.push(homePlayersBps[0])
                            homePlayersBps.shift()
                        }
                        bonus -= 2;
                    } else {
                        homePlayersBps[0]['bonus'] = bonus;
                        bonus--;
                        bonusPoints.push(homePlayersBps[0])
                        homePlayersBps.shift();
                    }
                } else if(awayPlayersBps[0].value === homePlayersBps[0].value) {
                    let i, j;
                    for(i = 0; i < awayPlayersBps.length; i++) {
                        if(awayPlayersBps.length === i + 1) break;
                        if(awayPlayersBps[i].value !== awayPlayersBps[i+1].value) {
                            break;
                        }
                    }
                    for(j = 0; j <= i; j++) {
                        awayPlayersBps[0]['bonus'] = bonus;
                        bonusPoints.push(awayPlayersBps[0])
                        awayPlayersBps.shift()
                    }
                    for(i = 0; i < homePlayersBps.length; i++) {
                        if(homePlayersBps.length === i + 1) break;
                        if(homePlayersBps[i].value !== homePlayersBps[i+1].value) {
                            break;
                        }
                    }
                    for(j = 0; j <= i; j++) {
                        homePlayersBps[0]['bonus'] = bonus;
                        bonusPoints.push(homePlayersBps[0])
                        homePlayersBps.shift()
                    }
                    bonus -= 2;
                } else {
                    if(awayPlayersBps[0].value === awayPlayersBps[1].value) {
                        let i;
                        for(i = 0; i < awayPlayersBps.length; i++) {
                            if(awayPlayersBps.length === i + 1) break;
                            if(awayPlayersBps[i].value !== awayPlayersBps[i+1].value) {
                                break;
                            }
                        }
                        for(let j = 0; j <= i; j++) {
                            awayPlayersBps[0]['bonus'] = bonus;
                            bonusPoints.push(awayPlayersBps[0])
                            awayPlayersBps.shift()
                        }
                        bonus -= 2;
                    } else {
                        awayPlayersBps[0]['bonus'] = bonus;
                        bonus--;
                        bonusPoints.push(awayPlayersBps[0])
                        awayPlayersBps.shift();
                    }
                }
            }
        });
    }
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
