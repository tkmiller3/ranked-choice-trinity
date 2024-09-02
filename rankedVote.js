/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
var data; // the parsed CSV file

// utility to parse the ;-separated rankings
function mkRankList(rankStr) {
    return rankStr.replace(/;$/, "").split(";");
}

function processData(data) {
    let numRows = data.length;
    let numCols = data[0].length;
    let ballotCol, houseCol;
    let ballotArray = [],
        houseArray = [];
    const houses = ["Baxter", "Craig", "McLennen", "Urquhart"];
    const votesByHouse = {
        Baxter: {},
        Craig: {},
        McLennen: {},
        Urquhart: {},
    };
    const totalVotes = {};

    // Determine the lowest vote count in totalVotes
    function computeLow() {
        // eliminate last place
        let lowCount = ballotArray.length;  // max possible votes
        let lowCandidates = [];
        // first determine lowest vote lowCount
        for (let i in totalVotes) {
            if (totalVotes[i] < lowCount)
                lowCount = totalVotes[i]
        }
        // find the low candidate(s)
        for (let i in totalVotes) {
            if (totalVotes[i] == lowCount)
                lowCandidates.push(i)
        }
        return lowCandidates;
    }

    // drop last place candidate
    function dropLow() {
        let lowCandidates = computeLow();
        let last;
        if (lowCandidates.length > 1) {
            console.log(lowCandidates.length + "-way tie for last place");
            last = lowCandidates[Math.floor(Math.random() * (lowCandidates.length + 1))]
            console.log("Randomly dropping candidate " + last);
        } else {
            last = lowCandidates[0];
        }
        // remove last candidate from ballots
        for (let i in ballotArray) {
            let ballot = ballotArray[i];
            let index = ballot.indexOf(last);
            if (index > -1) {
                ballot.splice(index, 1);
            }
        }
        // remove last candidate from vote tallies
        delete totalVotes[last];
        for (let house in votesByHouse) {
            delete votesByHouse[house][last];
        }
    }

    // Tabulate the votes
    function tabulateVotes() {
        // clear existing vote data
        for (let i in totalVotes) {
            totalVotes[i] = 0;
        }
        for (let i in houses) {
            let house = houses[i];
            for (let j in votesByHouse[i]) {
                votesByHouse[i][j] = 0;
            }
        }
        for (let i in ballotArray) {
            let ballot = ballotArray[i];
            let house = houseArray[i];
            let choice1 = ballot[0];
            votesByHouse[house][choice1] += 1;
            totalVotes[choice1] += 1;
        }
    }

    $("#numRows").text(numRows);
    $("#numCols").text(numCols);
    $("#numBallots").text(numRows - 1);

    // analyze the data to find the needed indices

    // Find the column with the ;-separated ballots
    for (let c = 0; c < data[0].length; c++) {
        if (/^Rank your choices by preference/.test(data[0][c])) {
            ballotCol = c;
            break;
        }
    }

    // Find the column with the voter's House
    for (let c = 0; c < data[0].length; c++) {
        if (/^What house are you in\?/.test(data[0][c])) {
            houseCol = c;
            break;
        }
    }

    // Add the candidates to totalVotes votesByHouse and initialize
    let candidates = mkRankList(data[1][ballotCol]);
    for (let i in houses) {
        let house = houses[i];
        for (let j in candidates) {
            let candidate = candidates[j];
            votesByHouse[house][candidate] = 0;
            totalVotes[candidate] = 0;
        }
    }

    // build the houseArray and the ballotArray
    for (let r = 1; r < numRows; r++) {
        houseArray.push(data[r][houseCol]);
        ballotArray.push(mkRankList(data[r][ballotCol]));
    }

    // First round
    tabulateVotes();
    console.log(totalVotes);
    console.log(votesByHouse);

    // Second round
    dropLow();
    tabulateVotes();
    console.log(totalVotes);
    console.log(votesByHouse);

    // Third round
    dropLow();
    tabulateVotes();
    console.log(totalVotes);
    console.log(votesByHouse);
}