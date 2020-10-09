import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const Styles = styled.div`
    display: flex;
    flex-flow: column;
    height: 40px;
    width: 200px;
    background-color: transparent;
    position: relative;
    border-radius: 3px;
    animation-name: input-animation;
    animation-duration: 1s;

    @keyframes input-animation {
        from {opacity: 0.1;}
        to {opacity: 1}
    }
`

const Input = styled.input`
    border: none;
    background: transparent;
    border-bottom: 1px solid #FFFFFF;
    outline: none;
    position:absolute;
    bottom: 0;
    width: 97%;
    padding-left: 4px;
    color: #FFFFFF;

    &:focus, &:valid {
        border-bottom: 1px solid #61892F;
    }

`

const Label = styled.label`
    color: #FFFFFF;
    position: absolute; 
    display: block;
    transition: all 0.3s ease;
    pointer-events: none;
    bottom: 10px;
    left: 4px;

    ${Input}:focus + & {
        color: #61892F;
        transform: translateY(-70%);
        font-size: 14px;
    }

    ${Input}:valid + & {
        color: #61892F;
        transform: translateY(-70%);
        font-size: 14px;
    }

`

function MiniLeagueIDInput({ value, handleChange, ref }) {

    const inputRef = useRef();

    useEffect(() => {
        inputRef.current.focus();
    })

    return (
        <Styles>
            <Input ref={inputRef} id='mini-league-id' value={value} onChange={handleChange} autoComplete='off' required/>
            <Label htmlFor='mini-league-id'>Mini-league ID</Label>
        </Styles>
    )
}

export default MiniLeagueIDInput;