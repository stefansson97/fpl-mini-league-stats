import React, { useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../../ThemeProvider';
import { getGameweekNumberAndFirstAPIUpdate } from '../../calculation';

const Styles = styled.div`
    
    width: 100%;
    display: none;

    @media only screen and (max-width: 780px) {
        display: block;
    }

    .team-and-manager {
        display: flex;
        flex-flow: column;
    }


    table {
        width: 100%;
        border-collapse: collapse;
    }

    th {
        font-weight: 500;
        line-height:1em;
        height: 30px;
        background-color: ${props => props.theme.darkTheme ? '#0e182a' : 'white'};
        border: 1px solid ${props => props.theme.darkTheme ? '#222f44' : '#ddd'};
        color: ${props => props.theme.darkTheme ? 'white' : '#0e182a'};
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
        margin-left: 3px;
    }

    .rank-icon-down {
        color: rgb(255, 0, 90);
        margin-left: 3px;
    }

    .rank-icon-same {
        color: rgb(148, 150, 140);
        margin-left: 3px;
    }
`



function ResponsiveTable({data, pageNumber}) {

    const { darkTheme } = useContext(ThemeContext);

    Styles.defaultProps = {
        theme: {
          darkTheme: darkTheme  }
    }

    const [ gameweek ] = getGameweekNumberAndFirstAPIUpdate();

    return (
        <Styles>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team & Manager</th>
                        <th>GW {gameweek}</th>
                        <th>TOT</th>
                    </tr>
                </thead>
                <tbody>
                {data.map((team, idx) => {
                        let rank = ((pageNumber - 1) * 20) + idx + 1;
                        let oldRank = team.last_rank === 0 ? 'New' : team.last_rank;
                        return (
                            <tr key={team.entry} className={idx % 2 === 0 ? 'dark' : 'light'}>
                                <td>{`${rank}`}
                                {rank > oldRank ? <i className="fas fa-caret-down rank-icon-down"></i> : null}
                                {rank < oldRank ? <i className="fas fa-caret-up rank-icon-up"></i> : null}
                                {rank === oldRank ? <i className="fas fa-circle rank-icon-same fa-xs"></i> : null}
                                </td>
                                <td className='team-and-manager'>
                                    <div>
                                        <a href={`https://fantasy.premierleague.com/entry/${team.entry}/event/${gameweek}`} target='_blank' rel='noopener noreferrer'>
                                            {team.entry_name}
                                        </a>
                                    </div>
                                    <div>{team.player_name}</div>
                                </td>
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

export default React.memo(ResponsiveTable);