function parseDiceInput(input) {
    const regex = /(\d+)d(\d+)([+-]\d+)?/;
    const match = input.match(regex);
    if (match) {
        const numDice = parseInt(match[1]);
        const numFaces = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        return { numDice, numFaces, modifier };
    }
    return null;
}

function generatePDF() {
    const input = document.getElementById("dice-input").value;
    const parsed = parseDiceInput(input);

    if (!parsed) {
        alert("Invalid input. Use format XdY+Z (e.g., 2d6+3).");
        return;
    }

    const { numDice, numFaces, modifier } = parsed;
    const pdf = calculatePDF(numDice, numFaces, modifier);
    displayPDF(pdf);
}

function calculatePDF(numDice, numFaces, modifier) {
    let pdf = {};
    let isPdfInitialized = false;

    for (let i = 0; i < numDice; i++) {
        const singleDiePdf = {};
        for (let face = 1; face <= numFaces; face++) {
            singleDiePdf[face] = 1 / numFaces;
        }

        pdf = isPdfInitialized ? convolve(pdf, singleDiePdf) : singleDiePdf;
        isPdfInitialized = true;
    }

    const shiftedPdf = {};
    for (const outcome in pdf) {
        shiftedPdf[parseInt(outcome) + modifier] = pdf[outcome];
    }

    return shiftedPdf;
}

function convolve(p_x, p_y) {
    const probabilityDistribution = {};

    for (const x in p_x) {
        for (const y in p_y) {
            const s = parseInt(x) + parseInt(y);
            probabilityDistribution[s] = (probabilityDistribution[s] || 0) + p_x[x] * p_y[y];
        }
    }

    return probabilityDistribution;
}

function displayPDF(pdf) {
    const pdfOutput = document.getElementById("pdf-output");
    pdfOutput.innerHTML = ""; // Clear any previous output

    // Calculate cumulative probability
    let cumulativeProbability = 0;
    const cumulativePDF = {};

    for (const outcome of Object.keys(pdf).sort((a, b) => a - b)) {
        cumulativeProbability += pdf[outcome];
        cumulativePDF[outcome] = cumulativeProbability;
    }

    // Find the maximum probability to use for scaling the bars
    const maxProbability = Math.max(...Object.values(pdf));

    // Create the table and add headers
    const table = document.createElement("table");
    table.style.width = "100%";
    const headerRow = document.createElement("tr");

    const headerOutcome = document.createElement("th");
    headerOutcome.textContent = "Outcome";
    headerOutcome.style.width = "3%";
    headerRow.appendChild(headerOutcome);

    const headerPercent = document.createElement("th");
    headerPercent.textContent = "P(X)";
    headerPercent.style.width = "3%";
    headerRow.appendChild(headerPercent);

    const headerCumulative = document.createElement("th");
    headerCumulative.textContent = "P(x ≤ X)";
    headerCumulative.style.width = "4%";
    headerRow.appendChild(headerCumulative);

    const headerBar = document.createElement("th");
    headerBar.textContent = "Graph";
    headerBar.style.width = "80%";
    headerRow.appendChild(headerBar);

    table.appendChild(headerRow);

    // Populate table rows based on the probability distribution
    for (const [outcome, probability] of Object.entries(pdf)) {
        const row = document.createElement("tr");

        // Outcome cell
        const outcomeCell = document.createElement("td");
        outcomeCell.textContent = outcome;
        row.appendChild(outcomeCell);

        // Individual probability cell (P(X))
        const percentCell = document.createElement("td");
        percentCell.textContent = (probability * 100).toFixed(2);
        row.appendChild(percentCell);

        // Cumulative probability cell (P(x ≤ X))
        const cumulativeCell = document.createElement("td");
        cumulativeCell.textContent = (cumulativePDF[outcome] * 100).toFixed(2);
        row.appendChild(cumulativeCell);

        // Graph (bar) cell with adjusted scaling
        const barCell = document.createElement("td");
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.width = `${(probability / maxProbability) * 100}%`;
        bar.style.height = "17px";
        bar.style.backgroundColor = "#a767f1";
        barCell.appendChild(bar);
        row.appendChild(barCell);

        table.appendChild(row);
    }

    // Append the completed table to the output container
    pdfOutput.appendChild(table);
}
