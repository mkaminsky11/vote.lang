//http://vote-mkaminsky.rhcloud.com/

io  = io.connect();
var has_loaded = false;

$(document).ready(function(){
  refresh();
});

io.on('refresh', function() {
  refresh();
});
io.on('get', function(data) {
  $(".block[data-lang='"+data+"'] i").removeClass("fa-star-o").addClass("fa-star");
  $(".block[data-lang='"+data+"'] i").css("color","#F1C40F");
});
io.on('data', function(data) {
  if(has_loaded === false){
    //not done before, redo
    get();

    $("#flex").html("");
    for(var i = 0; i < data.length; i++){
      var raw_name = data[i].name;
      var base_name = data[i].name.replace(" ","");
      var name = base_name;
      name = name.charAt(0).toUpperCase() + name.slice(1);
      var src_img = "img/" + base_name.replace("#","sharp") + ".png";
      var base = "<div class='block' data-lang='"+raw_name+"'><div><h6>" + name + "</h6><img src='" + src_img + "'><h5>" + data[i].votes + "</h5><button onclick=\"vote('"+raw_name+"')\"><i class='fa fa-star-o'></i>VOTE</button></div></div>";
      $("#flex").html( $("#flex").html() + base);
    }

    has_loaded = true;
    $("#overlay").fadeOut();
  }
  else{
    //just edit
    for(var i = 0; i < data.length; i++){
      var raw_name = data[i].name;
      var votes = data[i].votes;

      $(".block[data-lang='"+raw_name+"'] h5").html(votes);
    }
  }
});

function refresh(){
  io.emit('data');
}

function get(){
  io.emit('get');
}

function vote(lang){
  io.emit('vote', lang);

  if($(".block[data-lang='"+lang+"'] i").hasClass("fa-star-o")){ //not yet selected, clear all, then add this
    //clear all
    $(".block i").removeClass("fa-star").addClass("fa-star-o");
    $(".block i").css("color","white");

    //change this
    $(".block[data-lang='"+lang+"'] i").removeClass("fa-star-o").addClass("fa-star");
    $(".block[data-lang='"+lang+"'] i").css("color","#F1C40F");
  }
  else{ //already selected, just clear all

    $(".block i").removeClass("fa-star").addClass("fa-star-o");
    $(".block i").css("color","white");
  }
}

function resize(){
}

$( window ).resize(function() {
  resize();
});

$('#search input').keyup(function () {
  var term = $("#search input").val().toLowerCase();

  $(".block").each(function(index){
    var raw_name = $(this).attr("data-lang").toLowerCase();

    if(raw_name.indexOf(term) !== -1 || term.indexOf(raw_name) !== -1){
      //ok
      $(this).animate({
        opacity: 1
      },500);
    }
    else{
      //not ok
      $(this).animate({
        opacity: 0.3
      },500);
    }
  });
});
