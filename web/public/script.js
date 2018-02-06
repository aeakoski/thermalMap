pilotFilter = [];
clubFilter = [];

var prev_focus = 0;
var changeFocus = function(type){
  //Changes focus between the different meny tabs

  document.getElementsByClassName("navelement")[0].removeAttribute("id");
  document.getElementsByClassName("navelement")[1].removeAttribute("id");
  document.getElementsByClassName("navelement")[2].removeAttribute("id");


  if (prev_focus == type){
    if (type == 0){return}
    document.getElementsByClassName("navelement")[0].setAttribute("id", "active");
    document.getElementsByClassName("view")[type].classList.add("hide");
    prev_focus = 0;
    return

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

var addFilter = function(e, userInput, type){
  if (e.charCode != 13){ return; }
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
