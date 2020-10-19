import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../../ThemeProvider';
import { getGameweekNumberAndFirstAPIUpdate } from '../../calculation';

const Styles = styled.div`

    @media only screen and (max-width: 780px) {
        display: none;
    }

    width: 90%;
    transition: all 0.3s ease;
    
    table {
        width: 100%;
        border-collapse: collapse;
    }
    
    th {
        font-weight: 500;
        line-height:1em;
        background-color: ${props => props.theme.darkTheme ? '#0e182a' : 'white'};
        border: 1px solid ${props => props.theme.darkTheme ? '#222f44' : '#ddd'};
        color: ${props => props.theme.darkTheme ? 'white' : '#0e182a'};
    }

    tr {
        height: 30px;
    }

    td {
        color: #222629;
        border: 1px solid ${props => props.theme.darkTheme ? '#222f44' : '#ddd'};
        color: ${props => props.theme.darkTheme ? 'white' : '#0e182a'};
    }


    .dark {
        background-color: ${props => props.theme.darkTheme ? '#0e182a' : 'white'};
    }

    .light {
        background-color:  ${props => props.theme.darkTheme ? '#132035' : '#f2f2f2'};
    }

    animation-name: table-animation;
    animation-duration: 1s;
  
    @keyframes table-animation {
        from {opacity: 0.5;}
        to {opacity: 1}
    }

    .rank-icon-up {
        color: rgb(0, 217, 0);
    }

    .rank-icon-down {
        color: rgb(255, 0, 90);
    }

    .rank-icon-same {
        color: rgb(148, 150, 140);
    }
`

function CustomTable({data, pageNumber}) {

    const { darkTheme } = useContext(ThemeContext)
    
    Styles.defaultProps = {
        theme: {
          darkTheme: darkTheme  }
    }

    const { gameweek } = getGameweekNumberAndFirstAPIUpdate();

    return(
        <Styles>
            <table>
                <thead>
                    <tr>
                        <th>Rank (Old Rank)</th>
                        <th>Player Name</th>
                        <th>Team Name</th>
                        <th>Captain</th>
                        <th>Left To Play</th>
                        <th>Gameweek {gameweek}</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((team, idx) => {
                        let rank = ((pageNumber - 1) * 20) + idx + 1;
                        let oldRank = team.last_rank;
                        return (
                            <tr key={team.entry} className={idx % 2 === 0 ? 'dark' : 'light'}>
                                <td>{`${rank} (${oldRank}) `}
                                {rank > oldRank ? <i class="fas fa-caret-down rank-icon-down"></i> : null}
                                {rank < oldRank ? <i class="fas fa-caret-up rank-icon-up"></i> : null}
                                {rank === oldRank ? <i class="fas fa-circle rank-icon-same fa-xs"></i> : null}
                                </td>
                                <td>{team.player_name}</td>
                                <td>
                                <a href={`https://fantasy.premierleague.com/entry/${team.entry}/event/${gameweek}`} target='_blank' rel='noopener noreferrer'>
                                    {team.entry_name}
                                    </a>
                                </td>
                                <td>{team.captain}</td>
                                <td>{team.left_to_play}</td>
                                <td>{team.event_total}</td>
                                <td>{team.total}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </Styles>
    )
}

export default CustomTable;