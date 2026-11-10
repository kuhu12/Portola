///////////////////////////////////////////////////////////
////////////////////// Declare Variables //////////////////
///////////////////////////////////////////////////////////

let flowStatusColors = {
	'Allowed':  '#4CAF50',
	'Denied':   '#FF5252',
	'Unknown':  '#B0BEC5'
};


let margin = {left:120, top:50, right:120, bottom:50},
				width = 1500,
				height = 1500,
				innerRadius = 500,
				radiusPadding = 50,
				padAngle = 0.002,
				hoverTimeout = null,
				emptyPerc = 0.3,
				totalemptyPerc = 4 * emptyPerc,
				tau = Math.PI * 2,
				availableCircle = tau - totalemptyPerc;
