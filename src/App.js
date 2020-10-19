import React, { useState, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { ThemeContext } from './ThemeProvider';
import Calculation, { getMiniLeagueName } from './calculation';
import MiniLeagueIDInput from './components/ml-id-input/ml-id-input.component';
import SubmitButton from './components/submit-button/submit-button.component';
import Loading from './components/loading/loading.component';
import CustomTable from './components/standings-table/custom-table.component';
import ResponsiveTable from './components/standings-table/responsive-table.component';
import TableButtons from './components/table-buttons/table-buttons.component';
import ThemeSwitch from './components/theme-switch/theme-switch.component';
import ErrorBox from './components/error-box/error-box.component';

const Styles = styled.div`
  min-height: 100%;
  display: flex;
  flex-flow: column;
  text-align: center;
  justify-content: flex-start;
  align-items: center;
  padding: 50px;
  padding-bottom: 100px;
  position: relative;
  transition: all 0.3s ease;
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
    display: flex;
    flex-flow: column;
    justify-content: center;
    align-items: center;
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

  .mini-league-image-link {
    margin-top: 10px;
  }

  a {
    color: #0087e2;
  }

  a:active {
    color: red;
  }

  .suggestion {
    border: 1px solid ${(props) => props.theme.darkTheme ? 'white' : '#808080'};
    border-radius: 7px;
    color: ${(props) => props.theme.darkTheme ? 'white' : '#808080'};
    width: 50%;
    height: 30px;
    line-height: 30px;
    cursor: pointer;
    margin-top: -10px;
    margin-bottom: 10px;

    :hover {
      border: 1px solid ${(props) => props.theme.darkTheme ? '#999999' : 'black'};
      color: ${(props) => props.theme.darkTheme ? '#999999' : 'black'};
      transition: all 0.2s ease;
    }
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

  const [miniLeagueIDLocalStorage, setMiniLeagueIDLocalStorage] = useState(() => {
    return (window.localStorage.getItem('miniLeagueID') || false)
  });

  const [error, setError] = useState('');

  const { darkTheme } = useContext(ThemeContext);

  Styles.defaultProps = {
    theme: {
      darkTheme: darkTheme  }
  }

  useEffect(() => {
    setTotalPages(Math.ceil(miniLeagueData.length / 20));
  }, [miniLeagueData])

  useEffect(() => {
    setStandingsData(miniLeagueData.slice((pageNumber - 1) * 20, (pageNumber - 1) * 20 + 20));
  }, [pageNumber, miniLeagueData])

  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }

  const handleFormSubmit = async (e) => {
    
    e.preventDefault();

    setError('');
    setPageNumber(1);

    setIsLoadingName(true);
    setIsLoadingData(true);

    setMiniLeagueIDLocalStorage(miniLeagueID);
    window.localStorage.setItem('miniLeagueID', miniLeagueID);
    

    let name = '';
    try {
      name = await getMiniLeagueName(miniLeagueID);
    } catch(error) {
      setError(error);
      setIsLoadingName(false);
      setIsLoadingData(false);
      return;
    }
    setMiniLeagueName(name);
    setIsLoadingName(false);
    
    let { teams, error } = await Calculation(miniLeagueID)
    setError(error);
    setMiniLeagueData(teams);
    setIsLoadingData(false);
  }

  const handleButtonClickNext = () => {
    setPageNumber(prevValue => prevValue + 1);
  }

  const handleButtonClickPrevious = () => {
    setPageNumber(prevValue => prevValue - 1);
  }

  const handleSuggestion = async (e) => {
    setMiniLeagueID(miniLeagueIDLocalStorage);
  }

  return (
    <Styles>
      {error ? <ErrorBox error={error} /> : null}
      <form onSubmit={handleFormSubmit}>
        <MiniLeagueIDInput  value={miniLeagueID} handleChange={handleInputChange}/>
        {miniLeagueIDLocalStorage ? (
          <div className='suggestion' onClick={handleSuggestion}>
            {miniLeagueIDLocalStorage}
          </div>
        ) : null}
        <SubmitButton>Submit</SubmitButton>
      </form>
      <ThemeSwitch />
      <a href='https://i.imgur.com/6TS3j2d.png' className='mini-league-image-link' target='_blank' rel='noopener noreferrer'>What's the mini-league ID?</a>
      {miniLeagueName ? <div className='mini-league-title'>{miniLeagueName}</div> : null}
      {isLoadingName || isLoadingData ? <Loading /> : (
        (standingsData && (standingsData.length > 0)) ? (
          <>
            <CustomTable data={standingsData} pageNumber={pageNumber} />
            <ResponsiveTable data={standingsData} pageNumber={pageNumber} />
            <TableButtons clickPrevious={handleButtonClickPrevious} clickNext={handleButtonClickNext} pageNumber={pageNumber} totalPages={totalPages}/>
        </>
        ) : null
      )}
    </Styles>
  );
}

export default App;
