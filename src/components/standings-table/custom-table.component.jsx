import React from 'react';
import styled from 'styled-components';

const Styles = styled.div`

    width: 60%;

    

    table {
        width: 100%;
    }
    
    th {
        font-weight: 500;
        line-height:1em;
        color: #61892F
    }

    tr {
        height: 30px;
    }

    td {
        color: #222629;

    }


    .dark-grey {
        background-color: #474B4F;
    }

    .light-grey {
        background-color: #6B6E70;
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
                        <th>Points</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((team, idx) => {
                        return (
                            <tr className={idx % 2 === 0 ? 'dark-grey' : 'light-grey'}>
                                <td>{((pageNumber - 1) * 10) + idx + 1}</td>
                                <td>{team.player_name}</td>
                                <td>{team.entry_name}</td>
                                <td>{team.points}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </Styles>
    )
}

export default CustomTable;