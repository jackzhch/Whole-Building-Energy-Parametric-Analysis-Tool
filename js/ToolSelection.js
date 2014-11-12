$( document ).ready(function(){
	//initializing variables
	var categoryArray = new Array();
	var categoryMap = {};
	var selected = {};
	var toolArray = new Array();
	var tool_selected = {};
	var available_tools = {};
	var saveStates = {};
	var saveType = {};
	var saveStatesNum = 0;
	var selSaveStatesNum = 0;
	var comSaveStatesNum = 0;
	
	var isZoom = false;
	var tabSwitch = 0;
	
	var isSelect = false;
	//hide show navbar and sidebar
	$("#hideshow").on('click', function(){
		$('.navbar-fixed-top').toggle();
		$('.sidebar').toggle();
		$('.main').toggleClass('col-xs-offset-3');
		$('body').toggleClass('padTop');
		$("#toggle").toggleClass("glyphicon-zoom-in glyphicon-zoom-out");
		isZoom = !isZoom;
	});
	//demo
	$('body').on('click', '.EAS_detail', function(){
		var link = window.prompt("Please copy the link from the Energy Asset Score Website and paste it here","");
		if(link){
			var nameRaw = link.split('/');
			nameRaw.pop();
			var name = nameRaw.pop();
			if(link.indexOf("https://buildingenergyscore.energy.gov/buildings/") === 0){
				var win = window.open(link, name);
				win.close();
				win = window.open(link, name);
			}
		}		
	});
	//initialization step one
	$.ajax({
		url:"./ToolLoader",
		success:function(result){
			$.each(result, function(index, value){
				toolArray.push(value["id"]);
			});
		}, 
		dataType:"json",
		async:false
	});
	//initialization step two
	$.ajax({
		url:"./FilterCategoriesLoader?want=count",
		success:function(result){
			var count = parseInt(result);
			var i=1;
			var ul = $("#tree");
			while(i<=count){
				var li = $('<li/>');
				
				$('<span/>',{
					'id':'span_'+i
				}).appendTo(li);
				$('<ul/>',{
					'id':'ul_'+i,
					'class':'treeview'
				}).appendTo(li);
				li.appendTo(ul);
				
				i++;
			}
		}, 
		dataType:"text",
		async:false
	});
	//initialization step three
	$.ajax({
		url:"./FilterCategoriesLoader?want=content",
		success:function(result){
			var id = 1;
			$.each(result, function(index, value){
				if(unfoldCategory(value, id, true)){
					id++;
				}
				processCategory(value['Categories']);
			});
		}, 
		dataType:"json",
		async:false
	});
	//building up the treeview
	$("#tree").treeview({
		animated: "fast",
		collapsed: true,
		control: "#treecontrol"
	});
	
	//build matrix
	//title row
	var row = $("<div/>",{
		'style':'clear:both;'
	});
	//spacer
	var cell = $("<div/>",{
		'id':'tool_spacer',
		'class':'show_hide_box gridDefault'
	});
	$("<img/>",{
		'src':'img/SubCategories/title.jpg'
	}).appendTo(cell);
	cell.appendTo(row);
	//category bar
	$.each(toolArray, function(index_t, value_t){
		cell = $("<div/>",{
			'id':value_t+'_title',
			'class':'show_hide_box gridDefault'
		});
		$("<img/>",{
			'src':'img/'+value_t+'/'+value_t+'_title.jpg',
			'style':'width:441px;height:64px;'
		}).appendTo(cell);
		cell.appendTo(row);
	});
	//details in each tool
	row.appendTo($("#tool_bar"));
	$.each(categoryArray, function(index_c, value_c){
		var row = $("<div/>",{
			'class':'sub'
		});
		//category icon
		var cell = $("<div/>",{
			'id':value_c+"_icon",
			'class':'show_hide_box subCat gridDefault borderScheme'
		});
		var img = $("<img/>",{
			'src':'img/SubCategories/'+value_c+'.jpg',
			//'style':'width:165px;height:165px;'
			'class':'width165'
		}).appendTo(cell);
		if(value_c === "HVACControl" || value_c === "ZoneTerminalUnits" || value_c === "ZoneLocalHeatingUnits" || value_c === "HVACCoolingPlantSideEquipment" || value_c === "EnergyEvaluation"){
			$(img).addClass("height209");
		}
		else{
			$(img).addClass("height165");
		}
		cell.appendTo(row);
		//actual detail
		$.each(toolArray, function(index_t, value_t){
			cell = $("<div/>",{
				'id':value_t+'_'+value_c,
				'class':'show_hide_box detail gridDefault borderScheme tool_feature_clickbox '+value_t+'_detail'
			});
			img = $("<img/>",{
				'src':'img/'+value_t+'/'+value_t+'_'+value_c+'.jpg',
				//'style':'width:441px;height:165px;'
				'class':'width441'
			}).appendTo(cell);
			cell.appendTo(row);
			if(value_c === "HVACControl" || value_c === "ZoneTerminalUnits" || value_c === "ZoneLocalHeatingUnits" || value_c === "HVACCoolingPlantSideEquipment" || value_c === "EnergyEvaluation"){
				$(img).addClass("height209");
			}
			else{
				$(img).addClass("height165");
			}
		});
		row.appendTo($("#display"));
	});
	$("#title_icon").show();
	// on click left panel features
	$("input[class=categorySelection]").on("click", function(event){
		updateToolPanel($(this).attr("id"), event);
	});
	//clear all selection
	$(".clearSelections").bind("click", function(){
		var selections = $(".tool_checkbox");
		$.each(selections, function(index, value){
			if($(value).is(":checked")){
				$(value).click();
			}
		});
		
		var selections = $(".categorySelection");
		$.each(selections, function(index, value){
			if($(value).is(":checked")){
				$(value).click();
			}
		});
	});
	function updateToolPanel(id, event){
		if(id){
			if(event.target.checked){
				selected[id] = "true";
			}else if(selected[id]){
				delete selected[id];
			}
		}
		$(".show_hide_box").hide();
		$(".borderSpacer").hide();
		$(".categoryLabel").hide();
		$("#tool_select").html("");
		$('#legend').hide();
		if(!isSelect || !$.isEmptyObject(selected)){
			$.ajax({
				type: 'POST',
				url: './FilterCategoriesLoader?want=filter&isSelect='+isSelect,
				data: 'data='+JSON.stringify(selected),
				success: function(retData){
					buildToolSelection(JSON.parse(retData));
				},
				dataType: 'text',
				async: false
			});
		}
		$.each(tool_selected, function(index, value){
			if(available_tools[index]){
				$('#'+index).click();
				$('#'+index).prop('checked', true);
			}
		});
	}
	function updateToolPanel2(id){
		if(id){
			if(event.target.checked){
				selected[id] = "true";
			}else if(selected[id]){
				delete selected[id];
			}
		}
		$(".show_hide_box").hide();
		$(".borderSpacer").hide();
		$(".categoryLabel").hide();
		$("#tool_select").html("");
		$('#legend').hide();
		if(!isSelect || !$.isEmptyObject(selected)){
			$.ajax({
				type: 'POST',
				url: './FilterCategoriesLoader?want=filter&isSelect='+isSelect,
				data: 'data='+JSON.stringify(selected),
				success: function(retData){
					buildToolSelection(JSON.parse(retData));
				},
				dataType: 'text',
				async: false
			});
		}
	}
	//refresh right panel
	function refresh(){
		if($.isEmptyObject(tool_selected)){
			$('#legend').hide();
			$('.show_hide_box ').hide();
			$(".borderSpacer").hide();
			$(".categoryLabel").hide();
		}
		else{
			$('#legend').show();
		}
	}
	//save current state
	$("#savedBtn").bind("click", function(){
		var savedName = "";
		if(isSelect){
			savedName = "Tool Selection Case "+(selSaveStatesNum+1);
		}else {
			savedName = "Tool Comparison Case "+(comSaveStatesNum+1);
		}
		
		savedName = prompt("Saved Case Name:", savedName);
		if(savedName!==null){
			saveStates[saveStatesNum] = JSON.stringify(selected);
			var tools = new Array();
			$.each($(".tool_checkbox"), function(index, value){
				if($(value).is(":checked")){
					tools.push($(value).attr('id'));
				}
			});
			saveStates[saveStatesNum+"_tool"] = JSON.stringify(tools);
			saveStates[saveStatesNum+"_type"] = isSelect;
			$('#saveList').append("<li><a href='#' class='saveStateItem' saveSeq='"+saveStatesNum+"' style='text-align:justify'>"+savedName+"</a></li>");
			if(isSelect){
				selSaveStatesNum++;
			}
			else{
				comSaveStatesNum++;
			}
			
			saveStatesNum++;
		}
	});
	$("#homeBtn").bind("click", function(){
		window.location = "./ToolSelection.html";
	});
	//switch select and compare
	$("#selection").bind("click", function(){
		isSelect = true;
		$('.navbar-brand').prop('src', 'img/Sel_Title.png');
		updateToolPanel2();
	});
	$("#comparison").bind("click", function(){
		isSelect = false;
		$('.navbar-brand').prop('src', 'img/Com_Title.png');
		updateToolPanel2();
	});
	//if no cases have been save, show default no saved cases label
	$("#savedTab").on("click", function(){
		if(saveStatesNum==0){
			$('.default').show();
		}
		else{
			$('.default').hide();
		}
	});
	//on click saved case, retrieve and rebuild panel
	$('body').on("click",".saveStateItem", function(){
		var seq = $(this).attr("saveSeq");
		var selected = JSON.parse(saveStates[seq]);
		
		isSelect = JSON.parse(saveStates[seq+"_type"]);
		if(isSelect){
			$('.navbar-brand').prop('src', 'img/Sel_Title.png');
			
		}else {
			$('.navbar-brand').prop('src', 'img/Com_Title.png');
		}
		
		$(".clearSelections").click();
		$("#collapseSelections").click();
		var menu = {};
		$.each(selected, function(index, value){
			$("#"+index).click();
			var parent = $("#"+index).attr("parentspan");
			var grandpa = $("#"+index).attr("grandpaspan");
			if(!menu[grandpa]){
				$("#span_"+grandpa).click();
				menu[grandpa] = true;
			}
			if(!menu[grandpa+"_"+parent]){
				$("#span_"+grandpa+"_"+parent).click();
				menu[grandpa+"_"+parent] = true;
			}
		});
					
		var tools = JSON.parse(saveStates[seq+"_tool"]);
		$.each(tools, function(index, value){
			$("#"+value).click();
		});
	});
	//on selection tools build panel
	function buildToolSelection(json){
		var hasData = false;
		available_tools = {};
		$.each(json, function(index, value){
			hasData = true;
			var label = $("<label></label>");
			$("<input/>",{
				'type':'checkbox',
				'class':'tool_checkbox',
				'id':value,
				'value':index
			}).appendTo(label);
			$("<label/>",{
				'text':index,
				'for':value
			}).appendTo(label);
			$("<div/>",{
				'class':'spacer'
			}).appendTo(label);
			$(label).appendTo("#tool_select");
			available_tools[value]=true;
		});
		
		if(!hasData){
			$("#tool_select").html("<div>No tools are found that meet all requirements</div>");
		}else {
			//tool_selected = {};
			$(".tool_checkbox").bind("change", function(event){
				var id = $(this).attr("id");
				
				if(event.target.checked){
					tool_selected[id] = "true";
				}else if(tool_selected[id]){
					delete tool_selected[id];
				}
				
				//TODO
				var toolsNum = 0;
				$.each($(".tool_checkbox"), function(index, value){
					if($(value).is(":checked")){
						toolsNum++;
					}
				});
				$("#tool_bar").css({'width':(216+toolsNum*441+5)+'px'});
				
				tool_clicked();
				
				refresh();
			});
		}
	}
	function tool_clicked(){
		$("#tool_spacer").show();
		
		var subCategories = {};
		$.each(selected, function(index_s, value_s){
			subCategories[categoryMap[index_s]] = "";
		});
		$.each(toolArray, function(index_t, value_t){
			if(tool_selected[value_t] && available_tools[value_t]){
				$("#"+value_t+"_title").show();
			}else {
				$("#"+value_t+"_title").hide();
			}
		});
		$.each(subCategories, function(index_c, value_c){
			$("#"+index_c+"_icon").show();
			$.each(toolArray, function(index_t, value_t){
				if(tool_selected[value_t] && available_tools[value_t]){
					$("#"+value_t+"_"+index_c).show();
				}else {
					$("#"+value_t+"_"+index_c).hide();
				}
			});
		});
		var subString = '';
		$.each($('.sub').has($('.detail:visible')), function(){
			var raw = $(this).find('.subCat').attr('id');
			raw = raw.replace('_icon', '');
			subString = subString + "==" + raw;
		});
		subString = subString.substring(2);
		if(subString !== ''){
			$.ajax({
				url:"./AddLabel",
				success:function(result){
					var raw = result.split("==");
					raw.pop();
					$(".borderSpacer").hide();
					$(".categoryLabel").hide();
					$.each(raw, function(){
						var meta = this.split("&&");
						var count = meta.pop();
						var category = meta.pop();
						
						$('#'+category).closest('.categoryLabel').show().css("height", count);
						$('#'+category).closest('.borderSpacer').show();
					});
				}, 
				data:{data:subString},
				async: false
			});
		}
	}
	function processCategory(json){
		$.each(json, function(index, value){
			var subCategoryId = value["Id"];
			categoryArray.push(subCategoryId);
			
			var subsub = value["Categories"];
			$.each(subsub, function(index, value){
				var id = value["Id"];
				categoryMap[id] = subCategoryId;
			});
		});
	}
	function unfoldCategory(json, id, firstLevel){
		var name = json["Name"];
		
		var span = $("#span_"+id);
		span.text(name);
		if(firstLevel){
			span.attr('class', 'major');
		}
		
		var parentUL = $("#ul_"+id);
		var subCategories = json["Categories"];
		var len = subCategories.length;
		if(len>0){
			var subId = 1;
			$.each(subCategories, function(index, value){
				var li = $('<li/>');
				if(subId===len){
					li.attr('class', 'tree-branch last');
				}else {
					li.attr('class', 'tree-branch');
				}
				
				var nextId = id+'_'+subId;
				$('<span/>',{
					'id':'span_'+nextId
				}).appendTo(li);
				$('<ul/>',{
					'id':'ul_'+nextId
				}).appendTo(li);
				li.appendTo(parentUL);
				
				unfoldCategory(value, id+'_'+subId);
				
				subId++;
			});
		}else {
			parentUL.remove();
			
			var ids = id.split('_');
			$('<input/>',{
				'type':'checkbox',
				'id':json["Id"],
				'class':'categorySelection',
				'parentSpan':ids[1],
				'grandpaSpan':ids[0]
			}).insertBefore(span);
			$('<label/>',{
				text:span.text(),
				'for':json["Id"]
			}).insertBefore(span);
			
			span.remove();
		}
		
		return true;
	}
	$("#comparison").click();
	$(window).scroll(function(){
		var top = $(window).scrollTop();
		if(top>215){
			$("#tool_bar").css({'position':'fixed', 'top':(isZoom?'0px':'100px')});
			$("#tool_bar_spacer").css({'height':'64px'});
		}else {
			$("#tool_bar").css({'position':'inherit'});
			$("#tool_bar_spacer").css({'height':'0px'});
		}
	});
});