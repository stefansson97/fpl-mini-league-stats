import React, { useState } from 'react';
import './App.css';
import Calculation from './calculation';
import Table from './components/standings-table/standings-table.component';
import MiniLeagueIDInput from './components/ml-id-input/ml-id-input.component';

function App() {

  const [miniLeagueID, setMiniLeagueID] = useState('');
  const [miniLeagueName, setMiniLeagueName] = useState('');
  const [miniLeagueData, setMiniLeagueData] = useState([]);

  const handleInputChange = (e) => {
    setMiniLeagueID(e.target.value);
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let data = await Calculation(miniLeagueID)
    setMiniLeagueName(data.miniLeagueName)
    setMiniLeagueData(data.miniLeagueTeamsDataArray);
  }

  return (
    <div className="App">
      <form onSubmit={handleFormSubmit}>
        <MiniLeagueIDInput value={miniLeagueID} handleChange={handleInputChange}/>
      </form>
      <div className='mini-league-title'>{miniLeagueName}</div>
      <Table data={miniLeagueData} />
    </div>
  );
}



export default App;
