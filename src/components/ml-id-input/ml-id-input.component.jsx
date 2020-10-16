import React, { useEffect, useRef, useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from '../../themeProvider';

const Styles = styled.div`
    display: flex;
    flex-flow: column;
    height: 80px;
    width: 100%;
`

const Input = styled.input`
    border: 2px solid ${props => props.theme.darkTheme ? '#222f44' : '#e2e7ed'};
    background-color: ${props => props.theme.darkTheme ? '#132035' : '#f0f2f7'};
    border-radius: 7px;
    height: 30px;
    padding-left: 10px;
    font-size: 15px;
    color: ${props => props.theme.darkTheme ? 'white' : 'black'};

    :focus {
        outline: none;
        border: 2px solid ${props => props.theme.darkTheme ? '#81a7ff' : '#4372fc'};
    }
    
`

const Label = styled.label`
    width: 100%;
    text-align: left;
    margin-bottom: 5px;
    font-size: 14px;
    color: ${(props) => props.theme.darkTheme ? 'white' : 'black'}
`

function MiniLeagueIDInput({ value, handleChange }) {

    const inputRef = useRef();

    useEffect(() => {
        inputRef.current.focus();
    }, [])

    const { darkTheme } = useContext(ThemeContext);

    Input.defaultProps = {
        theme: {
          darkTheme: darkTheme  }
    }

    Label.defaultProps = {
        theme: {
          darkTheme: darkTheme  }
    }

    return (
        <Styles>
            <Label htmlFor='mini-league-id'>Mini-league ID</Label>
            <Input ref={inputRef} id='mini-league-id' value={value} onChange={handleChange} autoComplete='off' required/>
        </Styles>
    )
}

export default MiniLeagueIDInput;