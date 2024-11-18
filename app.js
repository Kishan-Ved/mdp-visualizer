const canvas = document.getElementById('mdpCanvas');
const ctx = canvas.getContext('2d');
const addStateButton = document.getElementById('addStateButton');
const addTransitionButton = document.getElementById('addTransitionButton');
const transitionList = document.getElementById('transitionList');

let states = [];
let transitions = [];
let selectedStates = [];
let isAddingState = false;
let isAddingTransition = false;

// State representation
class State {
    constructor(x, y, id) {
        this.x = x;
        this.y = y;
        this.id = id;
        this.radius = 30;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.fillText(this.id, this.x - 5, this.y + 5);
    }
}

// Function to calculate point on circle's circumference
function calculateCircumferencePoint(x1, y1, x2, y2, radius) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const newX = x1 + radius * Math.cos(angle);
    const newY = y1 + radius * Math.sin(angle);
    return { x: newX, y: newY };
}

// Function to draw the reward and action in a box
function drawRPBox(x, y, reward, action) {
    const text = `R: ${reward}, A: ${action}`;
    const padding = 5;

    // Measure the text width
    const textWidth = ctx.measureText(text).width;
    const textHeight = 16; // Approximate text height

    // Set blue background and white text
    ctx.fillStyle = 'blue';
    ctx.fillRect(x - textWidth / 2 - padding, y - textHeight / 2 - padding, textWidth + 2 * padding, textHeight + 2 * padding);

    // Set text color and draw the text
    ctx.fillStyle = 'white';
    ctx.fillText(text, x - textWidth / 2, y + textHeight / 4);
}

function isOppositeArrow(fromState, toState) {
    return transitions.some(transition =>
        transition.toState === fromState && transition.fromState === toState
    );
}

function drawArrow(fromX, fromY, toX, toY, isCurved = false) {
    const headlen = 10; // Length of arrowhead

    if (isCurved) {
        // Calculate control points for the curve
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        const dx = toX - fromX;
        const dy = toY - fromY;
        const offset = 30; // Distance for the curve

        // Perpendicular offset
        const controlX = midX - 2* offset * (dy / Math.hypot(dx, dy));
        const controlY = midY + 2 * offset * (dx / Math.hypot(dx, dy));

        // Draw the curved line
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.quadraticCurveTo(controlX, controlY, toX, toY);
        ctx.stroke();

        // Draw the arrowhead at the end of the curve
        const angle = Math.atan2(toY - controlY, toX - controlX);
        ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    } else {
        // Draw the straight arrow (original logic)
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);

        // Add arrowhead
        ctx.lineTo(
            toX - headlen * Math.cos(angle - Math.PI / 6),
            toY - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toX, toY);
        ctx.lineTo(
            toX - headlen * Math.cos(angle + Math.PI / 6),
            toY - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
    }
}


// Transition representation (with arrows adjusted for circumference and RP box)
class Transition {
    constructor(fromState, toState, reward, action) {
        this.fromState = fromState;
        this.toState = toState;
        this.reward = reward;
        this.action = action;
    }

    draw() {
        const { x: fromX, y: fromY } = this.fromState;
        const { x: toX, y: toY } = this.toState;

        const radius = this.fromState.radius; // Assume both states have the same radius
        const startPoint = calculateCircumferencePoint(fromX, fromY, toX, toY, radius);
        const endPoint = calculateCircumferencePoint(toX, toY, fromX, fromY, radius);

        const isCurved = isOppositeArrow(this.fromState, this.toState);

        let midX, midY;

        if (isCurved) {
            // Calculate control point for the curve
            const midPointX = (startPoint.x + endPoint.x) / 2;
            const midPointY = (startPoint.y + endPoint.y) / 2;

            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            const offset = 30; // Curve offset

            // Perpendicular offset
            const controlX = midPointX - offset * (dy / Math.hypot(dx, dy));
            const controlY = midPointY + offset * (dx / Math.hypot(dx, dy));

            // Draw curved arrow
            ctx.beginPath();
            ctx.moveTo(startPoint.x, startPoint.y);
            ctx.quadraticCurveTo(controlX, controlY, endPoint.x, endPoint.y);
            ctx.stroke();

            // Arrowhead at end
            const angle = Math.atan2(endPoint.y - controlY, endPoint.x - controlX);
            ctx.lineTo(
                endPoint.x - 10 * Math.cos(angle - Math.PI / 8),
                endPoint.y - 10 * Math.sin(angle - Math.PI / 8)
            );
            ctx.moveTo(endPoint.x, endPoint.y);
            ctx.lineTo(
                endPoint.x - 10 * Math.cos(angle + Math.PI / 8),
                endPoint.y - 10 * Math.sin(angle + Math.PI / 8)
            );
            ctx.stroke();

            // Set box position at control point
            midX = controlX;
            midY = controlY;
        } else {
            // Straight arrow
            ctx.beginPath();
            drawArrow(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            midX = (startPoint.x + endPoint.x) / 2;
            midY = (startPoint.y + endPoint.y) / 2;
        }

        // Draw the rectangle at the calculated position
        drawRPBox(midX, midY, this.reward, this.action);
    }
}



// Add State button logic
addStateButton.addEventListener('click', () => {
    isAddingState = ~isAddingState;
    isAddingTransition = false;
    addTransitionButton.innerText = "Add Transition";
    if (isAddingState) {
        addStateButton.innerText = "Stop Adding State";
    } else {
        addStateButton.innerText = "Add State";
    }
});

// Add Transition button logic
addTransitionButton.addEventListener('click', () => {
    isAddingTransition = ~isAddingTransition;
    isAddingState = false;
    selectedStates = [];
    addStateButton.innerText = "Add State";
    if (isAddingTransition) {
        addTransitionButton.innerText = "Stop Adding Transition";
    } else {
        addTransitionButton.innerText = "Add Transition";
    }
});

// Canvas click event to add state or transition
canvas.addEventListener('click', (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    if (isAddingState) {
        const id = `S${states.length + 1}`;
        const state = new State(x, y, id);
        states.push(state);
        // isAddingState = false;
        draw();
    }

    if (isAddingTransition) {
        const clickedState = states.find(state => Math.hypot(state.x - x, state.y - y) < state.radius);

        // while(selectedStates.length < 2) {
            if (clickedState) {
                selectedStates.push(clickedState);
    
                if (selectedStates.length === 2) {
                    const [fromState, toState] = selectedStates;
    
                    // Ask for reward and action
                    const reward = prompt('Enter reward:');
                    const action = prompt('Enter transition action (0 to 1):');
                    
                    const transition = new Transition(fromState, toState, parseFloat(reward), parseFloat(action));
                    transitions.push(transition);
                    updateTransitionList();
                    selectedStates = [];
                    draw();
                    // isAddingTransition = false;
                    // break;
                }
            // }
        }

        // isAddingTransition = false;
    }
});

// Function to update the transition list in the sidebar
function updateTransitionList() {
    transitionList.innerHTML = '';
    transitions.forEach(transition => {
        const listItem = document.createElement('li');
        listItem.textContent = `From ${transition.fromState.id} to ${transition.toState.id} - Reward: ${transition.reward}, action: ${transition.action}`;
        transitionList.appendChild(listItem);
    });
}

// Draw all elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    states.forEach(state => state.draw());
    transitions.forEach(transition => transition.draw());
}

function updateQValues() {
    const alpha = 0.1; // Learning rate
    const gamma = 0.9; // Discount factor
    const maxIterations = 1000;

    // Ensure the Q-table is initialized
    const q = {};
    states.forEach(state => {
        q[state.id] = {};
        transitions.forEach(transition => {
            if (transition.fromState.id === state.id) {
                q[state.id][transition.action] = 0; // Initialize all Q-values to 0
            }
        });
    });

    // Run the Q-learning algorithm
    for (let iteration = 0; iteration < maxIterations; iteration++) {
        transitions.forEach(transition => {
            const { fromState, toState, reward, action } = transition;

            // Current Q-value
            const currentQ = q[fromState.id][action] || 0;

            // Max Q-value for the next state
            const nextStateQValues = q[toState.id] || {};
            const maxNextQ = Math.max(...Object.values(nextStateQValues), 0);

            // Update Q-value using the formula
            q[fromState.id][action] = currentQ + alpha * (reward + gamma * maxNextQ - currentQ);
        });
    }

    console.log("Q-table after solving:", q); // Debugging: print the Q-table
    return q; // Return Q-table for display
}

function displayQValues() {
    const qTableList = document.getElementById('qTableList');
    qTableList.innerHTML = ''; // Clear previous entries

    const q = updateQValues(); // Get the updated Q-table
    for (const state in q) {
        for (const action in q[state]) {
            const listItem = document.createElement('li');
            listItem.textContent = `Q(${state}, ${action}): ${q[state][action].toFixed(2)}`;
            qTableList.appendChild(listItem);
        }
    }
}

const solveButton = document.getElementById('solveButton');
solveButton.addEventListener('click', () => {
    updateQValues(); // Run Q-learning algorithm
    displayQValues(); // Optionally display the Q-values
});

let qb = {}; // Q-table
let currentIteration = 0; // Track the current iteration
const iterations = 1000; // Total number of iterations
var discountFactor = 0.9; // Gamma

// Initialize Q-table
function initializeQTable() {
    qb = {};
    states.forEach(state => {
        qb[state.id] = {}; // Create an entry for each state
        transitions
            .filter(transition => transition.fromState.id === state.id)
            .forEach(transition => {
                qb[state.id][transition.action] = 0; // Initialize Q-values to 0
            });
    });
}

// Perform one iteration of the Bellman update
function bellmanUpdate() {
    var newQ = JSON.parse(JSON.stringify(qb)); // Clone Q-table for this iteration

    // Loop through all states to update Q-values
    states.forEach(state => {
        transitions
            .filter(transition => transition.fromState.id === state.id)
            .forEach(transition => {
                const fromState = transition.fromState.id;
                const toState = transition.toState.id;
                const reward = transition.reward;
                const action = transition.action;

                // Ensure newQ[fromState] exists
            if (!newQ[fromState]) {
                newQ[fromState] = {};
            }

                // Ensure qb[toState] exists
                if (!qb[toState]) {
                    qb[toState] = {};
                    transitions
                        .filter(t => t.fromState.id === toState)
                        .forEach(t => {
                            qb[toState][t.action] = 0;
                        });
                }

                // Find max Q-value for the next state
                const maxNextQ = Math.max(
                    0, ...Object.values(qb[toState]) // Ensure toState actions are valid
                );

                // Update Q-value for (fromState, action)
                newQ[fromState][action] = reward + discountFactor * maxNextQ;

            });
    });

    // Update Q-table with new values
    // Object.assign(qb, newQ);
    qb = JSON.parse(JSON.stringify(newQ));
    currentIteration++; // Increment iteration counter
}

// Display the Q-table in the UI
function displayQTable() {
    const qTableDisplay = document.getElementById("qTableDisplay");
    qTableDisplay.textContent = `Iteration: ${currentIteration}\n` + JSON.stringify(qb, null, 2);
}

// Add event listener for the Next button
const nextBButton = document.getElementById('nextB');
nextBButton.addEventListener('click', () => {
    if (currentIteration < iterations) {
        bellmanUpdate(); // Perform one iteration
        displayQTable(); // Update display
    } else {
        alert('All iterations completed!');
    }
});

const solveBButton = document.getElementById('solveB');
solveBButton.addEventListener('click', () => {
    // Create a text input and set button for discountFactor
    const container = document.getElementById('controls'); // Assuming a div with id 'controls' exists
    const discountInput = document.createElement('input');
    discountInput.type = 'number';
    discountInput.step = '0.01';
    discountInput.min = '0';
    discountInput.max = '1';
    discountInput.placeholder = 'Enter discount factor (0-1)';
    discountInput.id = 'discountInput';
    discountInput.style.width = '200px'; // Adjust width as needed

    const setButton = document.createElement('button');
    setButton.textContent = 'Set';
    setButton.id = 'setButton';

    // Append input and button to the container
    container.appendChild(discountInput);
    container.appendChild(setButton);

    // Handle Set button click
    setButton.addEventListener('click', () => {
        const inputVal = parseFloat(discountInput.value);

        if (isNaN(inputVal) || inputVal < 0 || inputVal > 1) {
            alert('Please enter a valid discount factor between 0 and 1.');
            container.removeChild(discountInput);
            container.removeChild(setButton);
            return;
        }

        discountFactor = inputVal; // Update the global discountFactor
        // alert(`Discount factor set to ${discountFactor}`);

        // Remove the input and button from the UI
        container.removeChild(discountInput);
        container.removeChild(setButton);

        // Initialize the Q-table and display it
        currentIteration = 0;
        initializeQTable();
        displayQTable();
    });
});

