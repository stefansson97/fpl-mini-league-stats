import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from './ThemeProvider';
import Calculation, { getMiniLeagueName } from './calculation';
import MiniLeagueIDInput from './components/ml-id-input/ml-id-input.component';
import SubmitButton from './components/submit-button/submit-button.component';
import Loading from './components/loading/loading.component';
import CustomTable from './components/standings-table/custom-table.component';
import ThemeSwitch from './components/theme-switch/theme-switch.component';


const Styles = styled.div`
  display: flex;
  height: 100%;
  flex-flow: column;
  text-align: center;
  justify-content: flex-start;
  align-items: center;
  padding: 50px;
  position: relative;
  background-color: ${(props) => props.theme.darkTheme ? '#0e182a' : 'white'};

  @keyframes title-animation {
    from {opacity: 0.1;}
    to {opacity: 1;}
  }

  .mini-league-input:active:focus {
    outline: none;
  }

  form {
    width: 250px;
  }

  .mini-league-title {
    padding-top: 30px;
    padding-bottom: 30px;
    font-size: 2.5rem;
    font-weight: 500;
    color: ${(props) => props.theme.darkTheme ? 'white' : '#0e182a'};
    animation-name: title-animation;
    animation-duration: 1s;
  }

  .buttons-div {
    display: flex;
    justify-content: space-between;
    width: 90%;
  }

  .page-btn {
    border: none;
    border-radius: 5px;
    background-color: ${(props) => props.theme.darkTheme ? 'white' : '#0e182a'};
    color: ${(props) => props.theme.darkTheme ? '#0e182a' : 'white'};
    cursor: pointer;
    outline: none;
    width: 20%;
    height: 50px;
    margin-top: 5px;
    font-size: 1.2rem;
    transition: all 0.5s ease;
  }

  .disabled {
    opacity: 0.3;
    pointer-events: none;
  }

  a {
    margin-top: 10px;
  }
  
`

function App() {

  const [miniLeagueID, setMiniLeagueID] = useState('');
  const [miniLeagueName, setMiniLeagueName] = useState('');
  const [miniLeagueData, setMiniLeagueData] = useState('');

  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [pageNumber, setPageNumber] = useState(1);
  const [standingsData, setStandingsData] = useState('');
  const [totalPages, setTotalPages] = useState(0);

  const { darkTheme } = useContext(ThemeContext);
  console.log(darkTheme)
  Styles.defaultProps = {
    theme: {
      darkTheme: darkTheme  }
  }

  useEffect(() => {
    setTotalPages(Math.ceil(miniLeagueData.length / 10));
  }, [miniLeagueData])

  useEffect(() => {
    setStandingsData(miniLeagueData.slice((pageNumber - 1) * 10, (pageNumber - 1) * 10 + 10));
  }, [pageNumber, miniLeagueData])

  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingName(true);
    setIsLoadingData(true);
    let name = await getMiniLeagueName(miniLeagueID);
    setMiniLeagueName(name);
    setIsLoadingName(false);
    let data = await Calculation(miniLeagueID)
    setMiniLeagueData(data);
    setIsLoadingData(false);
  }

  const handleButtonClickNext = () => {
    setPageNumber(prevValue => prevValue + 1);
  }

  const handleButtonClickPrevious = () => {
    setPageNumber(prevValue => prevValue - 1);
  }

  return (
    <Styles>
      <form onSubmit={handleFormSubmit}>
        <MiniLeagueIDInput  value={miniLeagueID} handleChange={handleInputChange}/>
        <SubmitButton>Submit</SubmitButton>
      </form>
      <ThemeSwitch />
      <a href='https://i.imgur.com/6TS3j2d.png' target='_blank' rel='noopener noreferrer'>What's the mini-league ID?</a>
      {miniLeagueName ? <div className='mini-league-title'>{miniLeagueName}</div> : null}
      {isLoadingName || isLoadingData ? <Loading /> : (
        standingsData ? (
          <>
            <CustomTable data={standingsData} pageNumber={pageNumber} />
            <div className='buttons-div'>
              <button onClick={handleButtonClickPrevious} className={'page-btn' + (pageNumber === 1 ? ' disabled' : '')}>Previous</button>
              <button onClick={handleButtonClickNext} className={'page-btn' + (pageNumber === totalPages ? ' disabled' : '')}>Next</button>
            </div>
        </>
        ) : null
      )}
    </Styles>
  );
}

export default App;
