const canvas = document.getElementById("mdpCanvas");
const ctx = canvas.getContext("2d");
const addStateButton = document.getElementById("addStateButton");
const addTransitionButton = document.getElementById("addTransitionButton");
const transitionList = document.getElementById("transitionList");

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
    // Draw the circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff"; // White fill for the circle
    ctx.fill();
    ctx.strokeStyle = "#000"; // Black border for the circle
    ctx.stroke();

    // Draw the ID inside the circle
    ctx.fillStyle = "#000"; // Black text color
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

  // Draw white background box
  ctx.fillStyle = "white";
  ctx.fillRect(
    x - textWidth / 2 - padding,
    y - textHeight / 2 - padding,
    textWidth + 2 * padding,
    textHeight + 2 * padding
  );

  // Draw blue border
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    x - textWidth / 2 - padding,
    y - textHeight / 2 - padding,
    textWidth + 2 * padding,
    textHeight + 2 * padding
  );

  // Set black text color and draw the text
  ctx.fillStyle = "black";
  ctx.fillText(text, x - textWidth / 2, y + textHeight / 4);
  ctx.strokeStyle = "black";
}

function isOppositeArrow(fromState, toState) {
  return transitions.some(
    (transition) =>
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
    const controlX = midX - 2 * offset * (dy / Math.hypot(dx, dy));
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

    if (this.fromState === this.toState) {
      // Self-loop
      const loopRadius = 40;
      const startAngle = (7 * Math.PI) / 4;
      const endAngle = (5 * Math.PI) / 4;

      ctx.beginPath();
      ctx.arc(
        fromX,
        fromY - radius - loopRadius,
        loopRadius,
        startAngle,
        endAngle
      );
      ctx.stroke();

      // Arrowhead
      const arrowX = fromX + loopRadius * Math.cos(endAngle);
      const arrowY =
        fromY - radius - loopRadius + loopRadius * Math.sin(endAngle);
      const angle = endAngle - Math.PI / 2;
      ctx.lineTo(
        arrowX - 10 * Math.cos(angle - Math.PI / 6),
        arrowY - 10 * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(
        arrowX - 10 * Math.cos(angle + Math.PI / 6),
        arrowY - 10 * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();

      // Draw the rectangle at the top of the loop
      drawRPBox(
        fromX,
        fromY - radius - 2 * loopRadius,
        this.reward,
        this.action,
        this.probability
      );
    } else {
      const startPoint = calculateCircumferencePoint(
        fromX,
        fromY,
        toX,
        toY,
        radius
      );
      const endPoint = calculateCircumferencePoint(
        toX,
        toY,
        fromX,
        fromY,
        radius
      );

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
}

// Add State button logic
addStateButton.addEventListener("click", () => {
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
addTransitionButton.addEventListener("click", () => {
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
canvas.addEventListener("click", (e) => {
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
    const clickedState = states.find(
      (state) => Math.hypot(state.x - x, state.y - y) < state.radius
    );

    // while(selectedStates.length < 2) {
    if (clickedState) {
      selectedStates.push(clickedState);

      if (selectedStates.length === 2) {
        const [fromState, toState] = selectedStates;

        // Ask for reward and action
        const reward = prompt("Enter reward:");
        const action = prompt(`Enter transition action:`);
        const probability = prompt("Enter transition probability (0-1):");
        const transition = new Transition(
          fromState,
          toState,
          parseFloat(reward),
          String(action),
          parseFloat(probability)
        );
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
  transitionList.innerHTML = "";
  transitions.forEach((transition, index) => {
    const listItem = document.createElement("li");
    listItem.textContent = `From ${transition.fromState.id} to ${transition.toState.id} - Reward: ${transition.reward}, Action: ${transition.action}, Probability: ${transition.probability}`;
    transitionList.appendChild(listItem);

    // Add a horizontal line if this is not the last item
    if (index < transitions.length - 1) {
      const hr = document.createElement("hr");
      transitionList.appendChild(hr);
    }
  });
}

// Draw all elements
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  states.forEach((state) => state.draw());
  transitions.forEach((transition) => transition.draw());
}

let qb = {}; // Q-table
let currentIteration = 0; // Track the current iteration
const iterations = 1000; // Total number of iterations
var discountFactor = 0.9; // Gamma

// Initialize Q-table
function initializeQTable() {
  qb = {};
  states.forEach((state) => {
    qb[state.id] = {}; // Create an entry for each state
    transitions
      .filter((transition) => transition.fromState.id === state.id)
      .forEach((transition) => {
        qb[state.id][String(transition.action)] = 0; // Initialize Q-values to 0 with action as string
      });
  });
}

function highlightTransition(transition) {
  const { fromState, toState } = transition;
  ctx.save();
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  transition.draw();
  ctx.restore();
}

function highlightState(state) {
  ctx.save();
  ctx.strokeStyle = "green";
  ctx.lineWidth = 3;
  state.draw();
  ctx.restore();
}

function displayComputation(
  fromState,
  action,
  toState,
  reward,
  probability,
  maxNextQ
) {
  // Create or retrieve the computation display div
  const computationDiv =
    document.getElementById("computation") || document.createElement("div");

  // Set up the computation div
  computationDiv.id = "computation";
  computationDiv.style.position = "fixed";
  computationDiv.style.bottom = "20px";
  computationDiv.style.right = "20px";
  computationDiv.style.background = "rgba(255, 255, 255, 0.9)";
  computationDiv.style.border = "1px solid #ccc";
  computationDiv.style.borderRadius = "10px";
  computationDiv.style.padding = "15px";
  computationDiv.style.width = "500px";
  computationDiv.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
  computationDiv.style.zIndex = "1000";

  // Populate content with computation details
  computationDiv.innerHTML = `
  <h3>$$Q(s, a) = \\sum_{s'} P(s'|s, a) \\big[R(s, a, s') + \\gamma \\max_{a'} Q(s', a')\\big]$$</h3>
  <h3>Computation of \\( Q(${fromState}, ${action}) \\)</h3>
  <p><strong>Transition:</strong> \\( ${fromState} \\to ${toState} \\)</p>
  <p><strong>Reward:</strong> \\( ${reward} \\)</p>
  <p><strong>Probability:</strong> \\( ${probability} \\)</p>
  <p><strong>\\( V_k(${toState}): \\)</strong> \\( ${maxNextQ.toFixed(
    6
  )} \\)</p>
  <p><strong>Contribution to \\( Q(${fromState}, ${action}) \\):</strong></p>
  <p>
    \\[
    ${probability} \\times (${reward} + ${discountFactor} \\times ${maxNextQ.toFixed(
    6
  )}) 
    = ${(probability * (reward + discountFactor * maxNextQ)).toFixed(6)} 
    \\]
  </p>
`;

  // Append to the body if not already added
  if (!document.body.contains(computationDiv)) {
    document.body.appendChild(computationDiv);
  }

  // Trigger MathJax rendering
  MathJax.typeset();
}

async function bellmanUpdate() {
  const newQ = JSON.parse(JSON.stringify(qb));

  for (const state of states) {
    const fromState = state.id;
    highlightState(state);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const stateTransitions = transitions.filter(
      (transition) => transition.fromState.id === fromState
    );
    const actions = [...new Set(stateTransitions.map((t) => t.action))];

    for (const action of actions) {
      const saTransitions = stateTransitions.filter(
        (transition) => transition.action === action
      );

      let qValue = 0;
      for (const transition of saTransitions) {
        highlightTransition(transition);
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const toState = transition.toState.id;
        const reward = transition.reward;
        const probability = transition.probability;

        if (!qb[toState]) {
          qb[toState] = {};
          transitions
            .filter((t) => t.fromState.id === toState)
            .forEach((t) => {
              qb[toState][t.action] = 0;
            });
        }

        const maxNextQ = Math.max(0, ...Object.values(qb[toState]));

        displayComputation(
          fromState,
          action,
          toState,
          reward,
          probability,
          maxNextQ
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));

        qValue += probability * (reward + discountFactor * maxNextQ);
      }

      newQ[fromState][action] = qValue;
    }

    draw(); // Redraw to remove highlights
  }

  qb = JSON.parse(JSON.stringify(newQ));
  currentIteration++;
}

function displayQTable(q, id) {
  const container =
    document.getElementById(id) || document.createElement("div");
  container.id = id;

  container.innerHTML =
    '<h3 style="text-align: left; padding-left: 25%;">Bellman-Table</h3>';

  const table = document.createElement("table");
  table.border = 1;
  table.style.margin = "0 0 0 50px";
  table.style.textAlign = "center"; // Center-align the content in cells
  table.style.borderCollapse = "collapse"; // Collapse borders for a cleaner look
  table.style.width = "60%"; // Set table width
  table.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)"; // Add shadow for depth

  // Determine all unique actions across all states
  const allActions = new Set();
  Object.values(q).forEach((actions) => {
    Object.keys(actions).forEach((action) => allActions.add(action));
  });
  const actionsArray = Array.from(allActions).sort((a, b) => a - b); // Sort actions numerically or alphabetically

  // Create table header with action columns and "Max Value" column
  const headerRow = document.createElement("tr");
  headerRow.innerHTML =
    `<th style="padding: 10px; background-color: #f2f2f2;">State</th>` +
    actionsArray
      .map(
        (action) =>
          `<th style="padding: 10px; background-color: #f2f2f2;">Action ${action}</th>`
      )
      .join("") +
    `<th style="padding: 10px; background-color: #f2f2f2;"><strong>Max Value</strong></th>`; // Make the header bold
  table.appendChild(headerRow);

  // Populate table rows with states, their corresponding action Q-values, and the max value
  Object.keys(q).forEach((state) => {
    const row = document.createElement("tr");
    let maxValue = Number.NEGATIVE_INFINITY; // Initialize max value

    // Generate cells for each action's Q-value
    const actionCells = actionsArray
      .map((action) => {
        const qValue = q[state][action];
        if (qValue !== undefined) {
          maxValue = Math.max(maxValue, qValue); // Update max value
        }
        return `<td style="padding: 10px;">${
          qValue !== undefined ? qValue.toFixed(6) : "-"
        }</td>`;
      })
      .join("");

    // Add row with state, action Q-values, and max value
    row.innerHTML =
      `<td style="padding: 10px; background-color: #f9f9f9;">${state}</td>` +
      actionCells +
      `<td style="padding: 10px; background-color: #f9f9f9;"><strong>${
        maxValue !== Number.NEGATIVE_INFINITY ? maxValue.toFixed(6) : "-"
      }</strong></td>`; // Make max value bold
    table.appendChild(row);
  });

  container.appendChild(table);
  document.body.appendChild(container);
}

// Add event listener for the Next button
const nextBButton = document.getElementById("nextB");
nextBButton.addEventListener("click", () => {
  if (currentIteration < iterations) {
    bellmanUpdate(); // Perform one iteration
    displayQTable(qb, "bLearningTable");
  } else {
    alert("All iterations completed!");
  }
});

const solveBButton = document.getElementById("solveB");
solveBButton.addEventListener("click", () => {
  // Create a text input and set button for discountFactor
  const container = document.getElementById("controls"); // Assuming a div with id 'controls' exists
  const discountInput = document.createElement("input");
  discountInput.type = "number";
  discountInput.step = "0.01";
  discountInput.min = "0";
  discountInput.max = "1";
  discountInput.placeholder = "Enter discount factor (0-1)";
  discountInput.id = "discountInput";
  discountInput.style.width = "200px"; // Adjust width as needed
  discountInput.style.padding = "10px";
  discountInput.style.marginRight = "10px";
  discountInput.style.border = "1px solid #ccc";
  discountInput.style.borderRadius = "5px";
  discountInput.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";

  const setButton = document.createElement("button");
  setButton.textContent = "Set";
  setButton.id = "setButton";
  setButton.style.padding = "10px 20px";
  setButton.style.border = "none";
  setButton.style.borderRadius = "5px";
  setButton.style.backgroundColor = "#007bff";
  setButton.style.color = "#fff";
  setButton.style.cursor = "pointer";
  setButton.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";

  // Append input and button to the container
  container.appendChild(discountInput);
  container.appendChild(setButton);

  // Handle Set button click
  setButton.addEventListener("click", () => {
    const inputVal = parseFloat(discountInput.value);

    if (isNaN(inputVal) || inputVal < 0 || inputVal > 1) {
      alert("Please enter a valid discount factor between 0 and 1.");
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
    displayQTable(qb, "bLearningTable");
  });
});
