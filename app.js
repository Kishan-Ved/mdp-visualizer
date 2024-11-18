const canvas = document.getElementById('mdpCanvas');
const ctx = canvas.getContext('2d');
const addStateButton = document.getElementById('addStateButton');
const addTransitionButton = document.getElementById('addTransitionButton');
const transitionList = document.getElementById('transitionList');

let states = [];
let transitions = {};
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
function drawRPBox(x, y, reward, action, probability) {
    const text = `R: ${reward}, A: ${action}, P: ${probability}`;
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
    // Iterate over all fromStates in the transitions object
    for (const [state, actions] of Object.entries(transitions)) {
        // Check if the state matches the target toState
        if (state === toState) {
            // Iterate over each action
            for (const actionTransitions of Object.values(actions)) {
                // Check all transitions for this action
                for (const [nextState] of actionTransitions) {
                    // If any nextState matches the original fromState, return true
                    if (nextState === fromState) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
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
    constructor(fromState, toState, reward, action, probability) {
        this.fromState = fromState;
        this.toState = toState;
        this.reward = reward;
        this.action = action;
        this.probability = probability;
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
        drawRPBox(midX, midY, this.reward, this.action, this.probability);
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
                    const action = prompt('Enter transition action:');
                    const probability = prompt('Enter probability:');
                    
                    if (transitions[fromState]) {
                        if (transitions[fromState][action]) {transitions[fromState][action].push([toState, reward, probability])}
                        else {transitions[fromState][action] = [[toState, reward, probability]];}
                    }
                    else {
                        transitions[fromState] = {action : [[toState, reward, probability]]}
                    }
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


const solveButton = document.getElementById('solveButton');
solveButton.addEventListener('click', () => {
    updateQValues(); // Run Q-learning algorithm
    displayQValues(); // Optionally display the Q-values
});

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

const solveBButton = document.getElementById('solveB');

solveBButton.addEventListener('click', () => {
    // Initialize Q-table
    const q = {};
    states.forEach(state => {
        q[state.id] = {}; // Create an entry for each state
        transitions
            .filter(transition => transition.fromState.id === state.id)
            .forEach(transition => {
                q[state.id][transition.action] = 0; // Initialize Q-values to 0
            });
    });

    // Define parameters
    const discountFactor = 0.9; // Gamma
    const iterations = 1000;

    // Run Bellman iterations
    for (let iter = 0; iter < iterations; iter++) {
        const newQ = JSON.parse(JSON.stringify(q)); // Clone Q-table for this iteration

        // Loop through all states to update Q-values
        states.forEach(state => {
            transitions
                .filter(transition => transition.fromState.id === state.id)
                .forEach(transition => {
                    const fromState = transition.fromState.id;
                    const toState = transition.toState.id;
                    const reward = transition.reward;
                    const action = transition.action;
                    const prob = transition.probability;

                    // Find max Q-value for the next state
                    const maxNextQ = Math.max(
                        0, ...Object.values(q[toState]) // Find the max Q-value for next state
                    );

                    // Bellman equation: Update Q-value for (fromState, action)
                    newQ[fromState][action] = reward + discountFactor * maxNextQ;
                });
        });

        // After all states are processed, update Q-table with new values
        Object.assign(q, newQ);
    }

    // Display final Q-table
    console.log('Final Q-Table after 1000 iterations:', q);
    displayQTable(q);
});

// Function to display Q-table
function displayQTable(q) {
    const container = document.getElementById('qTableContainer') || document.createElement('div');
    container.id = 'qTableContainer';
    container.innerHTML = '<h3>Q-Table</h3>';
    const table = document.createElement('table');
    table.border = 1;

    // Create table header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th>State</th><th>Action</th><th>Q-Value</th>`;
    table.appendChild(headerRow);

    // Populate table rows with state-action pairs and their Q-values
    Object.keys(q).forEach(state => {
        Object.keys(q[state]).forEach(action => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${state}</td><td>${action}</td><td>${q[state][action].toFixed(2)}</td>`;
            table.appendChild(row);
        });
    });

    container.appendChild(table);
    document.body.appendChild(container);
}
