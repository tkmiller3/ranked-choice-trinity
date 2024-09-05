/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

// define globals
const houses = ["Baxter", "Craig", "McLennen", "Urquhart"];
var votesByHouse = {    // stores votes by house
    Baxter: {},
    Craig: {},
    McLennen: {},
    Urquhart: {},
};
var data;               // the parsed CSV file
var firstTime = true;   // to prevent stacking event handlers
var votingRound = 1;
var totalVotes;         // object to hold total votes per candidate
var totalVotesCounted;  // for calculating percentage and majority
var infoDiv;             // unordered list for tabulation results
var votingDone;         // set to true when a majority is achieved

// main processing function
function processData(data) {
    let numRows = data.length;
    let numCols = data[0].length;
    let ballotCols = [],
        ballotArray = [],
        houseArray = [];

    // clear out old stuff
    votingRound = 1;
    totalVotes = {}
    totalVotesCounted = 0;
    votesByHouse = {
        Baxter: {},
        Craig: {},
        McLennen: {},
        Urquhart: {},
    };
    $("#table-container").empty();

    // utility to parse the ;-separated rankings
    function mkRankList(rankStr) {
        return rankStr.replace(/;$/, "").split(";");
    }

    // utility for building table nodes
    function mkNode(type, parent) {
        return $(`<${type}><${type}`).appendTo(parent).addClass(`${type}-node`);
    }

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
            mkNode("p", infoDiv).text(`There was a ${lowCandidates.length}-way tie for last place.`)
            last = lowCandidates[Math.floor(Math.random() * lowCandidates.length)]
            mkNode("p", infoDiv).text(`Candidate ${last} drew the short straw.`)
        } else {
            last = lowCandidates[0];
            mkNode("p", infoDiv).text(`Dropping last place candidate ${last}.`)
        }
        // remove last candidate from ballots
        for (let i in ballotArray) {
            let ballot = ballotArray[i];
            let index;
            while ((index = ballot.indexOf(last)) > -1) {
                ballot.splice(index, 1);
            }
        }
        // remove last candidate from vote tallies
        delete totalVotes[last];
        for (let house in votesByHouse) {
            delete votesByHouse[house][last];
        }
        totalVotesCounted = 0;
        votingRound++;
    }

    // Tabulate the votes
    function tabulateVotes() {
        // clear existing vote data
        for (let i in totalVotes) {
            totalVotes[i] = 0;
        }
        for (let i in houses) {
            let house = houses[i];
            for (let i in votesByHouse[house]) {
                votesByHouse[house][i] = 0;
            }
        }
        for (let i in ballotArray) {
            let ballot = ballotArray[i];
            let house = houseArray[i];
            if (ballot.length > 0) {
                let choice1 = ballot[0];
                votesByHouse[house][choice1] += 1;
                totalVotes[choice1] += 1;
                totalVotesCounted++;
            }
        }
        showResults();
    }

    // create the results table
    function showResults() {
        // Populate results
        let table_container = $("#table-container");
        mkNode("h3", table_container).text(`Round ${votingRound}`);
        let table = mkNode("table", table_container)
        let tr;
        // make the header row
        tr = mkNode("tr", table);
        mkNode("th", tr);
        for (let candidate in totalVotes) {
            mkNode("th", tr).text(candidate);
        }
        // add the house vote tallies
        for (let house in votesByHouse) {
            tr = mkNode("tr", table);
            mkNode("th", tr).text(house);
            for (let candidate in votesByHouse[house]) {
                mkNode("td", tr).text(votesByHouse[house][candidate]);
            }
        }
        // add the total votes
        tr = mkNode("tr", table);
        mkNode("th", tr).text("Total");
        let winner = "";
        for (let candidate in totalVotes) {
            let votes = totalVotes[candidate];
            let pct = Math.round(votes / totalVotesCounted * 1000) / 10; // nearest 10th
            if (votes / totalVotesCounted > .5) {
                winner = candidate; // majority achieved
            }
            mkNode("td", tr).text(`${votes} (${pct}%)`);
        }
        infoDiv = mkNode("div", table_container);
        let info = mkNode("p", infoDiv);
        if (winner == "") {
            info.text("No candidate received a majority.");
            votingDone = false;
        } else {
            info.text(`Candidate ${winner} wins the election with a majority of votes!`);
            votingDone = true;
            $("#tabulate").hide();
        }
    }

    $("#numBallots").text(numRows - 1);
    $("#tabulate").show();

    // analyze the data to find the needed indices

    ballotCols = [null, null, null];

    // Find the columns with the first, second and third choice selections
    for (let c = 0; c < numCols; c++) {
        let colHeader = data[0][c]
        if (/first choice/i.test(colHeader)) {
            ballotCols[0] = c;
        } else if (/second choice/i.test(colHeader)) {
            ballotCols[1] = c;
        } else if (/third choice/i.test(colHeader)) {
            ballotCols[2] = c;
        }
    }
    console.log(ballotCols)

    // Find the column with the voter's House
    for (let c = 0; c < numCols; c++) {
        if (/^What house are you in\?/.test(data[0][c])) {
            houseCol = c;
            break;
        }
    }

    // Add the candidates to totalVotes votesByHouse and initialize
    // Search the choice columns to find all candidate names
    let candidates = [];
    let candidate;
    for (let r = 1; r < numRows; r++) {
        for (c in ballotCols) {
            candidate = data[r][ballotCols[c]]
            if (candidate == '') continue;
            if (!candidates.includes(candidate)) {
                candidates.push(candidate)
            }
        }
    }

    for (let i in houses) {
        let house = houses[i];
        for (let j in candidates) {
            let candidate = candidates[j];
            votesByHouse[house][candidate] = 0;
            totalVotes[candidate] = 0;
        }
    }

    // build the houseArray and the ballotArray
    houseArray = [];
    ballotArray = [];
    for (let r = 1; r < numRows; r++) {
        houseArray.push(data[r][houseCol]);
        let ballot = [];
        for (c in ballotCols) {
            let candidate = data[r][ballotCols[c]];
            if (candidate != '') {
                ballot.push(candidate);
            }
        }
        ballotArray.push(ballot);
    }


    if (firstTime) {
        $("#tabulate").click(function () {
            tabulateVotes();
            $("#tabulate").text("Next Round");
            if (!votingDone) {
                dropLow();
            }
        });
        firstTime = false;
    }
}

$(function () {
    function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        let file = evt.dataTransfer.files[0]; // First FileList object

        // clear out the old results
        $("#numRows").text("");
        $("#numCols").text("");

        $("#fileName").text(file.name);

        if (!/\.csv$/i.test(file.name)) {
            alert("Please give me a CSV file!");
            return;
        }

        $(dropZone).hide()

        Papa.parse(file, {
            complete: function (results) {
                if (results.errors.length != 0) {
                    alert(
                        "I was not able to parse this file. Are you sure it's CSV?"
                    );
                } else {
                    // clean the data
                    let data = results.data;
                    let numRows = data.length;
                    if (data[data.length-1].length == 1) {
                        data.pop();
                    }
                    processData(results.data);
                }
            },
        });
    }

    ////////////////////// drag and drop stuff //////////////////////

    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = "copy"; // Explicitly show this is a copy.
    }

    // Setup the dnd listeners.

    let dropZone = document.getElementById("drop_zone");
    dropZone.addEventListener("dragover", handleDragOver, false);
    dropZone.addEventListener("drop", handleFileSelect, false);
});