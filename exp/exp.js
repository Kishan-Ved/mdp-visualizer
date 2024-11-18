const b = document.getElementById('b')

b.addEventListener('click', () => {
	a = {};
	
	a['s1'] = {1 : [['s1',1,1]]};
	a['s1'][2] = [['s2',2,2]];
	a['s1'][2].push(['s3',3,3]);
	
	console.log(a);
	console.log('hi');
});

function isOppositeArrow(fromState, toState) {
	a = {};
	
	a['s1'] = {1 : [['s1',1,1]]};
	a['s1'][2] = [['s2',2,2]];
	a['s1'][2].push(['s3',3,3]);

	// Iterate over all fromStates in the a object
    for (const [state, actions] of Object.entries(a)) {
		// Check if the state matches the target toState
        if (state === toState) {
			// Iterate over each action
            for (const actiona of Object.values(actions)) {
				// Check all a for this action
				console.log("actiona", actiona);
                for (const [nextState] of actiona) {
					console.log("nextState", nextState);
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

const c = document.getElementById('c');

c.addEventListener('click', () => {
	console.log(isOppositeArrow('s3', 's1'));
	console.log('hi')
});