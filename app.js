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

// Function to draw an arrow between two points
function drawArrow(fromX, fromY, toX, toY) {
    const headlen = 10; // Length of arrowhead
    const angle = Math.atan2(toY - fromY, toX - fromX); // Calculate angle

    // Draw the line part of the arrow
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);

    // Draw the arrowhead
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

// Function to draw the reward and probability in a box
function drawRPBox(x, y, reward, probability) {
    const text = `R: ${reward}, P: ${probability}`;
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

// Transition representation (with arrows adjusted for circumference and RP box)
class Transition {
    constructor(fromState, toState, reward, probability) {
        this.fromState = fromState;
        this.toState = toState;
        this.reward = reward;
        this.probability = probability;
    }

    draw() {
        const { x: x1, y: y1 } = this.fromState;
        const { x: x2, y: y2 } = this.toState;
        const radius = this.fromState.radius; // Assume both states have the same radius

        // Calculate start and end points at the edge of the circles
        const startPoint = calculateCircumferencePoint(x1, y1, x2, y2, radius);
        const endPoint = calculateCircumferencePoint(x2, y2, x1, y1, radius);

        // Draw the arrow between the circumference points
        ctx.beginPath();
        drawArrow(startPoint.x, startPoint.y, endPoint.x, endPoint.y);

        // Draw reward and probability in a blue box at the midpoint
        const midX = (startPoint.x + endPoint.x) / 2;
        const midY = (startPoint.y + endPoint.y) / 2;
        drawRPBox(midX, midY, this.reward, this.probability);
    }
}


// Add State button logic
addStateButton.addEventListener('click', () => {
    isAddingState = true;
    isAddingTransition = false;
});

// Add Transition button logic
addTransitionButton.addEventListener('click', () => {
    isAddingTransition = true;
    isAddingState = false;
    selectedStates = [];
});

// Canvas click event to add state or transition
canvas.addEventListener('click', (e) => {
    const x = e.offsetX;
    const y = e.offsetY;

    if (isAddingState) {
        const id = `S${states.length + 1}`;
        const state = new State(x, y, id);
        states.push(state);
        isAddingState = false;
        draw();
    }

    if (isAddingTransition) {
        const clickedState = states.find(state => Math.hypot(state.x - x, state.y - y) < state.radius);

        // while(selectedStates.length < 2) {
            if (clickedState) {
                selectedStates.push(clickedState);
    
                if (selectedStates.length === 2) {
                    const [fromState, toState] = selectedStates;
    
                    // Ask for reward and probability
                    const reward = prompt('Enter reward:');
                    const probability = prompt('Enter transition probability (0 to 1):');
                    
                    const transition = new Transition(fromState, toState, parseFloat(reward), parseFloat(probability));
                    transitions.push(transition);
                    updateTransitionList();
                    selectedStates = [];
                    draw();
                    isAddingTransition = false;
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
        listItem.textContent = `From ${transition.fromState.id} to ${transition.toState.id} - Reward: ${transition.reward}, Probability: ${transition.probability}`;
        transitionList.appendChild(listItem);
    });
}

// Draw all elements
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    states.forEach(state => state.draw());
    transitions.forEach(transition => transition.draw());
}
