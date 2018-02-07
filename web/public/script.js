pilotFilter = [];
clubFilter = [];

var prev_focus = 0;
var changeFocus = function(type){
  //Changes focus between the different meny tabs
  document.getElementsByClassName("navelement")[0].removeAttribute("id");
  document.getElementsByClassName("navelement")[1].removeAttribute("id");
  document.getElementsByClassName("navelement")[2].removeAttribute("id");

  //If we click on the currnt tab we want to return to map-view
  if (prev_focus == type){
    if (type == 0){return}
    document.getElementsByClassName("navelement")[0].setAttribute("id", "active");
    document.getElementsByClassName("view")[type].classList.add("hide");
    prev_focus = 0;
    return;
  }else{
      document.getElementsByClassName("navelement")[type].setAttribute("id", "active");
  }

  if (prev_focus != 0) {
      document.getElementsByClassName("view")[prev_focus].classList.add("hide");
  }
  document.getElementsByClassName("view")[type].classList.remove("hide");
  prev_focus = type;
}

var checkUserInput = function(inp){
  if ((/^[a-z0-9åäöÅÄÖ\ ]+$/i.test(inp)) && (inp !== "") && (inp.length < 65)) { return true; }
  console.log("WRONG");
  return false;
}

var quicksuggest = function(suggest){
  $("#club-input").val(suggest);

}

var addFilter = function(e, userInput, type){
  //Add Pilot or clubfilter on thermals

  if (e.code != "Enter"){
    //Filter Original clublist down to this sugestion list. Loop through and print the suggstions out
    userInput = userInput.toUpperCase();
    suggestions = [];

    for (let i = 0; i < originalClublist.length; i++) {
      var add = true;
      if (!userInput) {
        add = false;
      }
      for(let chari = 0; chari < userInput.length; chari++){

        if(originalClublist[i].length <= userInput.length){
          add = false;
          break;
        }
        if (userInput[chari]!=originalClublist[i][chari].toUpperCase()) {
          add = false;
          break;
        }
      }
      if (userInput === originalClublist[i] ) {
        suggestions = [];
      }

      if (add) {
        suggestions.push(originalClublist[i])
      }
    }
    $(".suggestions").html("");
    for(let j = 0; j < suggestions.length && j < 5; j++){
        $(".suggestions").append('<div class="search-suggestion" onclick="quicksuggest(\'' + suggestions[j] + '\')">'+ suggestions[j] +'</div>\
');
    }

    return;
  }

  $(".suggestions").html("");
  if(!checkUserInput(userInput)){ return; }
  if (type === "pilot") {
    if (pilotFilter.indexOf(userInput) != -1) { return; }
    pilotFilter.push(userInput);
  }else if (type === "club"){
    if (clubFilter.indexOf(userInput) != -1) { return; }
    clubFilter.push(userInput);
  }else{ return; }
  getLocalThermals();
  displayFilters();
  event.currentTarget.value = "";
}
var originalClublist = [];
$(document).ready(function(){
  $.get("club.txt", function(data, status){
    originalClublist = data.split(/\r?\n/)
    if(originalClublist[originalClublist.length-1] === ""){
      originalClublist.splice(-1,1)
    }
    console.log(data.split(/\r?\n/));
    });
});

var searchAssist = function(){
    filterOn = $("#club-input").val();
}

var removeFilter = function(filter, type){
  if (type === "pilot") {
    let index = pilotFilter.indexOf(filter);
    if (index > -1) {
        pilotFilter.splice(index, 1);
    }
  }else if(type === "club") {
    let index = clubFilter.indexOf(filter);
    if (index > -1) {
        clubFilter.splice(index, 1);
    }
  }
  getLocalThermals();
  displayFilters();
}

var displayFilters = function () {
    var filters = document.getElementById('filter-results');
    filters.innerHTML = "";
    pilotFilter.forEach(function(filter){
        filters.innerHTML = filters.innerHTML + "\n"+
        "<div class=\"filter-tag\">\
          <p>" + filter+ "</p><i class=\"fa fa-times\" aria-hidden=\"true\" type=\"pilot\" onclick=\"removeFilter('" + filter + "', 'pilot')\"></i>\
        </div>"

    });

    clubFilter.forEach(function(filter){
        filters.innerHTML = filters.innerHTML + "\n"+
        "<div class=\"filter-tag\">\
          <p>" + filter + "</p><i class=\"fa fa-times\" aria-hidden=\"true\" onclick=\"removeFilter('" + filter + "', 'club')\"></i>\
        </div>"

    })
}
displayFilters()
