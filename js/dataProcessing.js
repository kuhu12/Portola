/////////////// JSON-Creation Utility Functions /////////////

	//////////////////Get the Arc Angles///// /////////////

function create_groups(data,sAngle,gWidth,innerRadius,type,hierarchy){

	let n = data.length,
		groups = [],
		startAngle = sAngle;
	for(let i=0; i < n; i++){
		let temp = {}
		temp["name"] = data[i].name;
		temp["type"] = type;
		temp["startAngle"] = startAngle;
		temp["endAngle"] = startAngle + (data[i].values*gWidth);
		temp["innerRadius"] = innerRadius;
		temp["outerRadius"] = innerRadius * 1.04;
		if(hierarchy === 'Workload'){
			temp['loc'] = data[i].loc
			temp['env'] = data[i].env
			temp['app'] = data[i].app
			temp['role'] = data[i].role
		}
		groups.push(temp);
		startAngle += (data[i].values*gWidth);
	}
	return groups;
}

	//////////////////Get occurence count of links ///////////////////

function find_occurence_count(arr){
	let result = {};
	arr.forEach(function(item){
  		let objStr = JSON.stringify(item);
  		result[objStr] = result[objStr]? ++result[objStr]: 1;
	});
	let occurence = Object.values(result);
	let uniq = [...new Map(arr.map(obj => [JSON.stringify(obj), obj])).values()];
	uniq.forEach(function(obj,index){
		obj["occurence"] = occurence[index];
	})
	return uniq;
}

	//////////////////Get nodes and links data ///////////////////

function get_nodeslinks_data(data){
	let a = [], a_pro = [], a_con = [];
	let link_hash = {};
	data.forEach(function(obj){
		let temp_con_node = {}, temp_pro_node = {}, temp_con_link = {}, temp_pro_link = {};

		//////// Consumer Node ///////

		temp_con_node["name"] = `${obj['Consumer IP']}XX${'Consumer'}`;
		temp_con_node["type"] = "Consumer"
		let loc_con = obj['Consumer Loc'] ? obj['Consumer Loc'].replace(/\s+/g, '') : 'Unknown';
		let env_con = obj['Consumer Env'] ? obj['Consumer Env'].replace(/\s+/g, '') : 'Unknown';
		let app_con = obj['Consumer App'] ? obj['Consumer App'].replace(/\s+/g, '') : 'Unknown';
		let role_con =  obj['Consumer Role'] ? obj['Consumer Role'].replace(/\s+/g, '') : 'Unknown';
		temp_con_node['loc'] = `${loc_con}XX${'Consumer'}`
		temp_con_node['env'] = `${env_con}XX${loc_con}XX${'Consumer'}`;
		temp_con_node['app'] = `${app_con}XX${env_con}XX${loc_con}XX${'Consumer'}`;
		temp_con_node['role'] = `${role_con}XX${app_con}XX${env_con}XX${loc_con}XX${'Consumer'}`;

		//////// Consumer Links ///////

		temp_con_link["source"] = `${obj['Consumer IP']}XX${'Consumer'}`;
		temp_con_link["target"] = obj['Port'];

		//////// Provider Node ///////

		temp_pro_node["name"] = `${obj['Provider IP']}XX${'Provider'}`;
		temp_pro_node["type"] = "Provider";
		let loc_pro = obj['Provider Loc'] ? obj['Provider Loc'].replace(/\s+/g, ''): 'Unknown';
		let env_pro = obj['Provider Env'] ? obj['Provider Env'].replace(/\s+/g, '') : 'Unknown';
		let app_pro = obj['Provider App'] ? obj['Provider App'].replace(/\s+/g, '') : 'Unknown';
		let role_pro =  obj['Provider Role'] ? obj['Provider Role'].replace(/\s+/g, '') : 'Unknown';
		temp_pro_node['loc'] = `${loc_pro}XX${'Provider'}`
		temp_pro_node['env'] =  `${env_pro}XX${loc_pro}XX${'Provider'}`;
		temp_pro_node['app'] =  `${app_pro}XX${env_pro}XX${loc_pro}XX${'Provider'}`;
		temp_pro_node['role'] = `${role_pro}XX${app_pro}XX${env_pro}XX${loc_pro}XX${'Provider'}`;



		//////// Provider Node ///////

		temp_pro_link["source"] = `${obj['Provider IP']}XX${'Provider'}`;
		temp_pro_link["target"] = obj['Port'];

		//////// Link HashMap ///////

		link_hash[`${temp_con_link["source"]}x${temp_con_link["target"]}x${temp_pro_link["source"]}`] = obj;

		//////// Combine ///////

		a.push(temp_con_node,temp_pro_node)
		a_pro.push(temp_pro_link);
		a_con.push(temp_con_link);
	});

	let nodes = [...new Map(a.map(obj => [JSON.stringify(obj), obj])).values()];
	let links_pro = find_occurence_count(a_pro);
	let links_con = find_occurence_count(a_con);
	let links = [...links_con, ...links_pro];

	return {nodes,links,link_hash};
}

	//////////////////Get nested data of workloads at ipaddress level ///////////////////

function create_nested_data(data){

	let grouped = d3.group(data, d => d.loc, d => d.env, d => d.app, d => d.role);
	let nested_data = Array.from(grouped, function([locKey, locMap]) {
		return {
			loc: locKey,
			values: Array.from(locMap, function([envKey, envMap]) {
				return {
					env: envKey,
					values: Array.from(envMap, function([appKey, appMap]) {
						return {
							app: appKey,
							values: Array.from(appMap, function([roleKey, roleValues]) {
								return {
									role: roleKey,
									values: roleValues.map(function(item) {
										return {
											name: item.name,
											type: item.type,
											location: locKey,
											environment: envKey,
											application: appKey,
											role: roleKey
										}
									})
								}
							})
						}
					})
				}
			})
		}
	})
	return nested_data;
}

//////////////////Get ordered data of each label with workload count ///////////////////

function get_ordered_data(data){

	let locations_n_count = [];
	let environments_n_count = [];
	let applications_n_count = [];
	let roles_n_count = [];
	let workloads = [];

	data.map(x => {
	    let envCount = 0;
	    x.values.map(y => {
	        let appCount = 0;
	      y.values.map(z => {
			let rolesCount = 0;
			z.values.map(a => {
				rolesCount = rolesCount+a.values.length;
				roles_n_count.push({name:a.role,values:a.values.length});
				a.values.map(b => {
					workloads.push({
						name:b.name,
						type:b.type,
						loc: b.location,
						env: b.environment,
						app: b.application,
						role: b.role,
						values:1
					});
				});
			});
	      	applications_n_count.push({name:z.app,values:rolesCount});
	      	appCount = appCount+rolesCount;
	    });
	      environments_n_count.push({name:y.env,values:appCount});
	      envCount = envCount+appCount;
	  });
	    locations_n_count.push({name:x.loc,values:envCount});
	});

	let all_data = [locations_n_count,environments_n_count,applications_n_count,roles_n_count,workloads];
	return all_data;
}

//////////////////Get Ports Data with connections count ///////////////////

function get_ports(data){
	let rolled = d3.rollup(data, function(v) { return v.length; }, function(d) { return d.Port; }, function(d) { return d.DraftPolicy; });
	let po_data = Array.from(rolled, function([portKey, policyMap]) {
		return {
			key: portKey,
			values: Array.from(policyMap, function([policyKey, count]) {
				return { key: policyKey, value: count };
			})
		};
	});

	let port_connections = []

	po_data.map(x=> {
		let connection_count = 0,
	        pb_count = 0,
	        b_count = 0,
	        a_count = 0;
		x.values.map(y =>{
			if(y.key === 'Allowed')
				a_count+=y.value;
			else if(y.key === 'Blocked')
				b_count+=y.value;
			else
				pb_count+=y.value;
			connection_count = pb_count + b_count + a_count;
		})
		port_connections.push({name:x.key, type: 'Port', total: connection_count, pb:pb_count, b:b_count, a:a_count});
	})
	return port_connections;
}

//////////////////Find children (Workloads) based on labels ///////////////////

function find_children(data, label){
	return labelToWorkloads.get(label) || [];
}
