import React from 'react';
import styled from 'styled-components';

const Styles = styled.div`

    width: 90%;

    table {
        width: 100%;
        border-collapse: collapse;
    }
    
    th {
        font-weight: 500;
        line-height:1em;
        background-color: #FFFFFF;
        border: 1px solid #ddd;
    }

    tr {
        height: 30px;
    }

    td {
        color: #222629;
        border: 1px solid #ddd;
    }


    .dark {
        background-color: #FFFFFF;
    }

    .light {
        background-color: #F2F2F2;
    }

    animation-name: table-animation;
    animation-duration: 1s;
  
    @keyframes table-animation {
        from {opacity: 0.1;}
        to {opacity: 1}
    }

`

function CustomTable({data, pageNumber}) {
    return(
        <Styles>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Player Name</th>
                        <th>Team Name</th>
                        <th>Captain</th>
                        <th>Vice Captain</th>
                        <th>Gameweek</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((team, idx) => {
                        return (
                            <tr key={team.entry} className={idx % 2 === 0 ? 'dark' : 'light'}>
                                <td>{((pageNumber - 1) * 10) + idx + 1}</td>
                                <td>{team.player_name}</td>
                                <td>{team.entry_name}</td>
                                <td>{team.captain}</td>
                                <td>{team.vice_captain}</td>
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