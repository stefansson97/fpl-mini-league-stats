import React from 'react';
import axios from 'axios';

function Calculation(arr) {


    const array = arr.map(async teamID => {
        const url = `https://cors-anywhere.herokuapp.com/https://fantasy.premierleague.com/api/entry/${teamID}/event/3/picks/`
        let response = await axios.get(url)
        //console.log('caoooooooooooooooooooooooooooooooooooooooooooooooooo');
        //const arrayFinal = response.picks.map(player => [player.element, player.is_captain, player.is_vice_captain])
        return response
    })
    
    console.log(array);
    console.log('hejhej')
}

//Calculation([4503963,1026674,3656196,2318179,678620,4593395,2964278,4330478,3040019,3024256,729896,4952700,1075860,2772400,898078,4568990,1180400,2942551,1017127,1684496]);

export default Calculation;
