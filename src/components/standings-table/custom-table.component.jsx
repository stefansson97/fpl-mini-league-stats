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
                        <th>Rank</th>
                        <th>Player Name</th>
                        <th>Team Name</th>
                        <th>Captain</th>
                        <th>Gameweek {gameweek}</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((team, idx) => {
                        return (
                            <tr key={team.entry} className={idx % 2 === 0 ? 'dark' : 'light'}>
                                <td>{((pageNumber - 1) * 10) + idx + 1}</td>
                                <td>{team.player_name}</td>
                                <td>
                                <a href={`https://fantasy.premierleague.com/entry/${team.entry}/event/${gameweek}`} target='_blank' rel='noopener noreferrer'>
                                    {team.entry_name}
                                    </a>
                                </td>
                                <td>{team.captain}</td>
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