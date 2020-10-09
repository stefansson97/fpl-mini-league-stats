import React, { useState, useEffect } from 'react';
import './App.css';
import Calculation, { getMiniLeagueName } from './calculation';
import Table from './components/standings-table/standings-table.component';
import MiniLeagueIDInput from './components/ml-id-input/ml-id-input.component';
import Loading from './components/loading/loading.component';

function App() {

  const [miniLeagueID, setMiniLeagueID] = useState('');
  const [miniLeagueName, setMiniLeagueName] = useState('');
  const [miniLeagueData, setMiniLeagueData] = useState('');

  const [isLoadingName, setIsLoadingName] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    setIsLoadingName(false);
  }, [miniLeagueName])

  useEffect(() => {
    setIsLoadingData(false);
  }, [miniLeagueData])

  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoadingName(true);
    setIsLoadingData(true);
    let name = await getMiniLeagueName(miniLeagueID);
    setMiniLeagueName(name);
    let data = await Calculation(miniLeagueID)
    setMiniLeagueData(data);
  }

  return (
    <div className="App">
      <form onSubmit={handleFormSubmit}>
        <MiniLeagueIDInput value={miniLeagueID} handleChange={handleInputChange}/>
      </form>
      {miniLeagueName ? <div className='mini-league-title'>{miniLeagueName}</div> : null}
      {isLoadingName || isLoadingData ? <Loading /> : (miniLeagueData ? <Table data={miniLeagueData} /> : null)}
    </div>
  );
}

export default App;
