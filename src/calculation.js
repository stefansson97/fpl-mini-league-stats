import React from 'react';
import axios from 'axios';

function Calculation(miniLeagueID) {

    axios.get(`https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/leagues-classic/${miniLeagueID}/standings/`)
        .then(league => {
            let miniLeagueData = league;
            let miniLeaguePlayersIDs = league.data.standings.results.map(team => team.entry);
            return {miniLeagueData, miniLeaguePlayersIDs};
        })
        .then(data => {
            let miniLeagueTeams = [];
            data.miniLeaguePlayersIDs.map(async teamID => {
                const url = `https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/entry/${teamID}/event/3/picks/`
                axios.get(url).then(response => {
                    miniLeagueTeams.push([response.data.picks])
                })
            })
            return miniLeagueTeams;
        })
        .then(async miniLeagueTeams => {
            let playerPointsData = await axios.get('https://ineedthisforfplproject.herokuapp.com/https://fantasy.premierleague.com/api/event/3/live/')
            return {miniLeagueTeams, playerPointsData}
        })
        .then(({miniLeagueTeams, playerPointsData}) => {
            let miniLeagueTeamsPoints = [];
            for(let i = 0; i < miniLeagueTeams.length; i++) {
                let pointsSum = 0;
                for(let j = 0; j < miniLeagueTeams[i].length; j++) {
                  pointsSum += playerPointsData.elements[miniLeagueTeams[i][j].element - 1].stats.total_points;
                }
                miniLeagueTeamsPoints.push(pointsSum);
            }
        })


}

export default Calculation;
