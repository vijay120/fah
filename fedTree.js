

var request = require('request');
var uu = require('underscore');
var async = require('async');
var fs = require('fs');
var url = 'https://www.federalregister.gov/api/v1/agencies';
var output = 'output.txt'

//Step 1: Download json object
function download_tree(url, cb) {
	console.log("inside download_tree");
	var check_data_and_forward = function(error, resp, body) {
		if(!error && resp.statusCode == 200) {
			//valid request
			var parseBody = JSON.parse(body);
			//debugger;
			cb(null, parseBody);
		}
	}
	request(url, check_data_and_forward);
};

//Node datastructure
var Node = function(name, id, parentId) {
	return {
		name: name,
		id: id,
		parentId: parentId,
		childNodes: [],
		addChild: function(childNode) {
			this.childNodes.push(childNode);
		}
	};
};

//Step 2: Create the node objects and store them in a hashtable
function structureTree(jsonBody, cb) {
	console.log("inside structure tree");
	var tableOfNodes = {};
	var makeNode = function(parseBody) {
		tableOfNodes[parseBody.id] = Node(parseBody.name, parseBody.id, parseBody.parent_id);
	};
	uu.each(jsonBody, makeNode);
	cb(null, tableOfNodes);
};

//Step 3: Link the Nodes together
function linkNodes(hashtable, cb) {
	function link(node) {
		if(node.parentId != null) {
			hashtable[node.parentId].addChild(node);
		}
	};
	uu.each(hashtable, link);
	cb(null, hashtable);
};

//Step 4: Print stuff properly
function prettyPrint(hashtable, cb) {
	//Step 4.1: Filter the roots
	var roots = 
		uu.filter(hashtable, function(Node) {
			return Node.parentId == null;
		});

	var printTree = function(root, indentLevel) {
		var constructedString = function(il) {
			var returnVal = "";
			for(var i=0; i<il; i++) {
				returnVal += "	";
			}
			return returnVal;
		}
		fs.appendFileSync(output, constructedString(indentLevel) + 
								root.name + "\n");

		if(root.childNodes != []) {
			uu.each(root.childNodes, 
				function(rootName) {
					return printTree(rootName, indentLevel+1);
				});
		}
	}

	uu.each(roots, 
			function(rootName) {
				return printTree(rootName, 0);
			});

	cb(null, "Done writing to file");
}

//Step 5: Compose the functions
var pipeLine = async.compose(	prettyPrint,
							linkNodes, 
							structureTree, 
							download_tree);

pipeLine(url, 	function(error, data) {
					console.log(data);
				}
		);



