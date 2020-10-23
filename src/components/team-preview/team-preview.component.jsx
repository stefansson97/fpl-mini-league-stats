import React from 'react';
import styled from 'styled-components';
import { players } from '../../players';

const Styles = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 20px;
    padding: 10px;
    background-color: #01BA5C;
    width: 350px;
    height: 550px;
    display: flex;
    flex-flow: column;
    justify-content: space-between;

    .flex-row {
        display: flex;
    }

    .space-arnd {
        justify-content: space-around;
    }

    .center {
        justify-content: center;
    }

    .player-stats-and-kit {
        display: flex;
        flex-flow: column;
        justify-content: center;
        align-items: center;
    }

    .player-kit-img {
        width: 36px;
        height: 48px;
    }

` 

function TeamPreview({ picks }) {

    return(
        <Styles>
            <div className='goalkeeper flex-row center'>
                <div className='player-stats-and-kit'>
                    <img src={require(`../../images/team-${picks[0].team}-gkp.webp`)} alt='player-kit-img' className='player-kit-img' />
                    <div>{players[picks[0].element - 1].web_name + (picks[0].is_captain ? 'C' : '')}</div>
                </div>
            </div>
            <div className='defenders flex-row space-arnd'>
                {picks
                    .filter(player => player.element_type === 'DEF' && player.position < 12)
                    .map(defender => 
                        <div className='player-stats-and-kit'>
                            <img src={require(`../../images/team-${defender.team}.webp`)} alt='player-kit-img' className='player-kit-img' />
                            <div>{players[defender.element - 1].web_name + (defender.is_captain ? '(C)' : '')}</div>
                        </div>)}
            </div>
            <div className='midfielders flex-row space-arnd'>
                {picks
                    .filter(player => player.element_type === 'MID' && player.position < 12)
                    .map(midfielder => 
                        <div className='player-stats-and-kit'>
                            <img src={require(`../../images/team-${midfielder.team}.webp`)} alt='player-kit-img' className='player-kit-img' />
                            <div>{players[midfielder.element - 1].web_name + (midfielder.is_captain ? '(C)' : '')}</div>
                        </div>)}
            </div>
            <div className='forwards flex-row space-arnd'>
                {picks
                    .filter(player => player.element_type === 'FWD' && player.position < 12)
                    .map(forward => 
                        <div className='player-stats-and-kit'>
                            <img src={require(`../../images/team-${forward.team}.webp`)} alt='player-kit-img' className='player-kit-img' />
                            <div>{players[forward.element - 1].web_name + (forward.is_captain ? '(C)' : '')}</div>
                        </div>)}
            </div>
            <div className='subs flex-row space-arnd'>
                <div className='player-stats-and-kit'>
                    <img src={require(`../../images/team-${picks[11].team}-gkp.webp`)} alt='player-kit-img' className='player-kit-img' />
                    <div>{players[picks[11].element - 1].web_name}</div>
                </div>
                {picks
                    .filter(player => player.position >= 13)
                    .map(sub => 
                        <div className='player-stats-and-kit'>
                            <img src={require(`../../images/team-${sub.team}.webp`)} alt='player-kit-img' className='player-kit-img' />
                            <div>{players[sub.element - 1].web_name}</div>
                        </div>)}
            </div>
        </Styles>
    )
}

export default TeamPreview;